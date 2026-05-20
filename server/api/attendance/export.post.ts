import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { CustomError } from '~/server/utils/custom.error'
import { query } from '~/server/utils/db'
import { getKekaAttendanceData, getKekaLeaveData, getKekaEmployeeData } from '~/server/utils/keka'
import { logWarn, logError } from '~/server/utils/logger'
import jwt from 'jsonwebtoken'

const SOURCE_MAP: Record<number, string> = {
  1: 'Keka',
  3: 'Provento',
}

/**
 * Convert array to CSV string
 */
function convertToCSV(data: any[], headers: string[]): string {
  // Header row
  const headerRow = headers.map((h) => `"${h}"`).join(',')

  // Data rows
  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header] || ''
        // Escape quotes and wrap in quotes
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      })
      .join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  try {
    // 🔐 Token validation
    let token = event.node.req.headers['authorization']?.split(' ')[1]

    if (!token) {
      const cookies = String(event.node.req.headers['cookie'] || '')
      token = cookies
        .split(';')
        .map((c) => c.trim().split('='))
        .filter(([key]) => key === 'auth-token' || key === 'authToken')
        .map(([, value]) => decodeURIComponent(value))
        .shift()
    }

    if (!token) throw new CustomError('Unauthorized: No token provided', 401)

    let userId: string
    try {
      const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: string }
      userId = decoded.user_id
    } catch {
      throw new CustomError('Unauthorized: Invalid token', 401)
    }

    // 🔍 Check user role (only superadmin allowed)
    const userRes = await query('SELECT role_id, org_id FROM users WHERE user_id = $1', [userId])
    if (!userRes.rows.length) throw new CustomError('User not found', 404)

    const userRole = userRes.rows[0].role_id
    const userOrgId = userRes.rows[0].org_id

    if (userRole !== 0) {
      throw new CustomError('Only superadmins can export attendance reports', 403)
    }

    // 📋 Get request body
    const body = await readBody(event)
    const { fromDate, toDate, employeeId, source, format } = body
    const orgId = body.org || userOrgId

    // Validate required fields
    if (!fromDate || !toDate) {
      throw new CustomError('fromDate and toDate are required', 400)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new CustomError('Invalid date format. Use YYYY-MM-DD', 400)
    }

    const exportFormat = (format || 'csv').toLowerCase()
    if (!['csv', 'excel'].includes(exportFormat)) {
      throw new CustomError('Format must be csv or excel', 400)
    }

    // 📊 Fetch attendance data from Keka
    const kekaResponse = await getKekaAttendanceData({
      fromDate,
      toDate,
      employeeId: employeeId || undefined,
    })

    const attendanceRecords = kekaResponse.data || []

    // 🏥 Fetch leave data and employee data for filtering
    let leaveMap: Record<string, any[]> = {}
    let activeEmployeeIds: Set<string> = new Set()

    try {
      const leaveResponse = await getKekaLeaveData({ fromDate, toDate })
      const leaveRecords = leaveResponse.data || []

      leaveMap = leaveRecords.reduce((acc: any, leave: any) => {
        if (leave.status === 1) {
          const empId = leave.employeeIdentifier
          if (!acc[empId]) acc[empId] = []
          acc[empId].push({
            fromDate: leave.fromDate,
            toDate: leave.toDate,
            leaveType: leave.leaveType,
          })
        }
        return acc
      }, {})
    } catch (leaveError: any) {
      logWarn('Failed to fetch leave data, continuing without leave filtering', leaveError?.message)
    }

    try {
      const employeeResponse = await getKekaEmployeeData()
      const employees = employeeResponse.data || []

      activeEmployeeIds = new Set(
        employees
          .filter((emp: any) => emp.employmentStatus === 0)
          .map((emp: any) => emp.id)
      )
    } catch (empError: any) {
      logWarn('Failed to fetch employee data, continuing without inactive employee filtering', empError?.message)
    }

    const isEmployeeOnLeave = (employeeId: string, dateStr: string): boolean => {
      if (!leaveMap[employeeId]) return false

      const checkDate = new Date(dateStr)
      return leaveMap[employeeId].some((leave: any) => {
        const leaveStart = new Date(leave.fromDate)
        const leaveEnd = new Date(leave.toDate)
        return checkDate >= leaveStart && checkDate <= leaveEnd
      })
    }

    // Helper function to check if a timestamp falls within the date range
    const isWithinDateRange = (timestamp: Date): boolean => {
      const fromDateObj = new Date(fromDate)
      fromDateObj.setHours(0, 0, 0, 0)

      const toDateObj = new Date(toDate)
      toDateObj.setHours(23, 59, 59, 999)

      return timestamp >= fromDateObj && timestamp <= toDateObj
    }

    // 🔗 Map employee IDs to user details using employee_mapping and users tables
    const employeeIdSet = new Set(attendanceRecords.map((r: any) => r.employeeIdentifier))
    let employeeMapping: Record<string, any> = {}

    if (employeeIdSet.size > 0) {
      const employeeIds = Array.from(employeeIdSet)
      const placeholders = employeeIds.map((_, i) => `$${i + 1}`).join(',')

      const mappingRes = await query(
        `SELECT
           em.employee_id,
           em.employee_email,
           em.employee_number,
           em.department,
           em.designation,
           u.user_id,
           u.name,
           u.email as user_email,
           u.contact_number
         FROM employee_mapping em
         LEFT JOIN users u ON em.user_id = u.user_id
         WHERE em.employee_id IN (${placeholders})
         AND em.org_id = $${employeeIds.length + 1}`,
        [...employeeIds, orgId]
      )

      mappingRes.rows.forEach((row: any) => {
        employeeMapping[row.employee_id] = {
          employee_email: row.employee_email,
          employee_number: row.employee_number,
          department: row.department,
          designation: row.designation,
          user_id: row.user_id,
          user_name: row.name,
          user_email: row.user_email,
          contact_number: row.contact_number,
        }
      })
    }

    // 🔄 Transform and filter records
    const detailedRecords = attendanceRecords
      .flatMap((record: any) => {
        const mapping = employeeMapping[record.employeeIdentifier]

        if (!mapping) return []

        // ❌ Filter 1: Exclude inactive employees
        if (activeEmployeeIds.size > 0 && !activeEmployeeIds.has(record.employeeIdentifier)) {
          return []
        }

        // ❌ Filter 2: Exclude non-working days
        const dayType = Number(record.dayType)
        if (dayType !== 0) {
          return []
        }

        const rows: any[] = []

        // ✅ CHECK-IN
        if (record.firstInOfTheDay?.timestamp) {
          const ts = new Date(record.firstInOfTheDay.timestamp)

          // ❌ Date range check
          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          const logSource = record.firstInOfTheDay.attendanceLogSource

          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name':
              mapping?.user_name ||
              mapping?.employee_email ||
              '',

            'Date & Time': ts.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            'Email': mapping?.user_email || '-',
            'Source': logSource === 3 ? 'Provento' : 'Keka',
            'Day Type': DAY_TYPE_MAP[dayType] || 'Unknown',
            'Status': 'Check-in',
            'Department': mapping?.department || '-',
            'Designation': mapping?.designation || '-',
          })
        }

        // ✅ CHECK-OUT
        if (record.lastOutOfTheDay?.timestamp) {
          const ts = new Date(record.lastOutOfTheDay.timestamp)

          // ❌ Date range check
          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          const logSource = record.lastOutOfTheDay.attendanceLogSource

          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name':
              mapping?.user_name ||
              mapping?.employee_email ||
              '',

            'Date & Time': ts.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            'Email': mapping?.user_email || '-',
            'Source': logSource === 3 ? 'Provento' : 'Keka',
            'Day Type': DAY_TYPE_MAP[dayType] || 'Unknown',
            'Status': 'Check-out',
            'Department': mapping?.department || '-',
            'Designation': mapping?.designation || '-',
          })
        }

        // ✅ NO LOG
        if (!record.firstInOfTheDay && !record.lastOutOfTheDay) {
          const ts = new Date(record.shiftStartTime || record.attendanceDate)

          // ❌ Date range check
          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name':
              mapping?.user_name ||
              mapping?.employee_email ||
              '',

            'Date & Time': ts.toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            'Email': mapping?.user_email || '-',
            'Source': 'Keka',
            'Day Type': DAY_TYPE_MAP[dayType] || 'Unknown',
            'Status': 'No Log',
            'Department': mapping?.department || '-',
            'Designation': mapping?.designation || '-',
          })
        }

        return rows
      })

    // 📈 Add summary at the beginning
    const totalRecords = detailedRecords.length
    const proventoRecords = detailedRecords.filter((r) => r['Source'] === 'Provento').length
    const kekaRecords = detailedRecords.filter((r) => r['Source'] === 'Keka').length

    const summaryData = [
      { field: 'Report Generated', value: new Date().toISOString() },
      { field: 'Date Range', value: `${fromDate} to ${toDate}` },
      { field: 'Total Records', value: totalRecords },
      { field: 'Provento Records', value: proventoRecords },
      { field: 'Keka Records', value: kekaRecords },
      { field: 'Provento %', value: totalRecords > 0 ? ((proventoRecords / totalRecords) * 100).toFixed(2) : '0' },
      { field: 'Keka %', value: totalRecords > 0 ? ((kekaRecords / totalRecords) * 100).toFixed(2) : '0' },
      { field: '', value: '' }, // Empty row for spacing
    ]

    // Generate CSV content
    const summaryCSV = convertToCSV(summaryData, ['field', 'value'])
    const detailedHeaders = [
      'Employee ID',
      'Employee Name',
      'Date & Time',
      'Email',
      'Source',
      'Status',
      'Department',
      'Designation',
    ]
    const detailedCSV = convertToCSV(detailedRecords, detailedHeaders)
    const csvContent = [summaryCSV, '', detailedCSV].join('\n')

    // Set response headers
    const filename = `attendance-report-${fromDate}-to-${toDate}.csv`
    setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

    return csvContent
  } catch (error: any) {
    logError('Attendance export error:', error)

    if (error instanceof CustomError) {
      throw error
    }

    throw new CustomError('Failed to export attendance report', 500)
  }
})
