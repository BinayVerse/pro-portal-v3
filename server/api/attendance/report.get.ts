import { defineEventHandler, getQuery } from 'h3'
import { CustomError } from '~/server/utils/custom.error'
import { query } from '~/server/utils/db'
import { getKekaAttendanceData, getKekaLeaveData, getKekaEmployeeData } from '~/server/utils/keka'
import { logWarn, logError } from '~/server/utils/logger'
import jwt from 'jsonwebtoken'

// Keka Enum Mappings

// AttendanceDayType enum
const DAY_TYPE_MAP: Record<number, string> = {
  0: 'WorkingDay',
  1: 'Holiday',
  2: 'FullDayWeeklyOff',
  3: 'FirstHalfWeeklyOff',
  4: 'SecondHalfWeeklyOff',
}

// AttendanceLogSource enum
const ATTENDANCE_LOG_SOURCE_MAP: Record<number, string> = {
  0: 'Biometric',
  1: 'MobileApp',
  2: 'Web',
  3: 'Api',
  4: 'Import',
  5: 'System',
}

// ManualClockinType enum
const MANUAL_CLOCKIN_TYPE_MAP: Record<number, string> = {
  0: 'None',
  1: 'ClockIn',
  2: 'ClockOut',
  3: 'Both',
}

// Map log source to system source (Keka or Provento)
const getSystemSource = (logSourceValue: number): string => {
  if (logSourceValue === 3) {
    return 'Provento' // API source comes from Provento
  }
  // All other sources (including Biometric/0) come from Keka
  return 'Keka'
}

interface AttendanceRecord {
  employee_id: string
  employee_name: string
  user_email: string
  datetime: string
  status: string
  source: string
  department: string
  designation: string
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
      throw new CustomError('Only superadmins can access attendance reports', 403)
    }

    // 📋 Get query parameters
    const queryParams = getQuery(event) as Record<string, any>
    const fromDate = queryParams.fromDate || new Date().toISOString().split('T')[0]
    const toDate = queryParams.toDate || new Date().toISOString().split('T')[0]
    const employeeIds = queryParams.employeeIds ? String(queryParams.employeeIds).split(',').filter(Boolean) : []
    const source = queryParams.source || null // 'Keka' or 'Provento'
    const orgId = queryParams.org || userOrgId

    // Validate dates
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new CustomError('Invalid date format. Use YYYY-MM-DD', 400)
    }

    if (new Date(fromDate) > new Date(toDate)) {
      throw new CustomError('fromDate must be less than or equal to toDate', 400)
    }

    // 📊 Fetch attendance data from Keka
    const kekaResponse = await getKekaAttendanceData({
      fromDate,
      toDate,
      employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
    })

    const attendanceRecords = kekaResponse.data || []

    // 🏥 Fetch leave data and employee data for filtering
    let leaveMap: Record<string, any[]> = {}
    let activeEmployeeIds: Set<string> = new Set()

    try {
      // Fetch leave requests (status 1 = Approved)
      const leaveResponse = await getKekaLeaveData({ fromDate, toDate })
      const leaveRecords = leaveResponse.data || []

      leaveMap = leaveRecords.reduce((acc: any, leave: any) => {
        // Only include approved leaves (status = 1)
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
      // Fetch employee data to check active status
      const employeeResponse = await getKekaEmployeeData()
      const employees = employeeResponse.data || []

      // Map active employees (employmentStatus = 0 means Working/Active)
      activeEmployeeIds = new Set(
        employees
          .filter((emp: any) => emp.employmentStatus === 0)
          .map((emp: any) => emp.id)
      )
    } catch (empError: any) {
      logWarn('Failed to fetch employee data, continuing without inactive employee filtering', empError?.message)
    }

    // Helper to check if employee is on leave for a given date
    const isEmployeeOnLeave = (employeeId: string, dateStr: string): boolean => {
      if (!leaveMap[employeeId]) return false

      const checkDate = new Date(dateStr)
      return leaveMap[employeeId].some((leave: any) => {
        const leaveStart = new Date(leave.fromDate)
        const leaveEnd = new Date(leave.toDate)
        return checkDate >= leaveStart && checkDate <= leaveEnd
      })
    }

    // 🔗 Map employee IDs to user details using employee_mapping and users tables
    const recordEmployeeIds = Array.from(new Set(attendanceRecords.map((r: any) => r.employeeIdentifier)))
    let employeeMapping: Record<string, any> = {}

    if (recordEmployeeIds.length > 0) {
      const placeholders = recordEmployeeIds.map((_, i) => `$${i + 1}`).join(',')

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
         AND em.org_id = $${recordEmployeeIds.length + 1}`,
        [...recordEmployeeIds, orgId]
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

    // Helper function to check if a timestamp falls within the date range
    const isWithinDateRange = (timestamp: Date): boolean => {
      const fromDateObj = new Date(fromDate)
      fromDateObj.setHours(0, 0, 0, 0)

      const toDateObj = new Date(toDate)
      toDateObj.setHours(23, 59, 59, 999)

      return timestamp >= fromDateObj && timestamp <= toDateObj
    }

    // 🔄 Transform and filter records
    const detailedRecords: AttendanceRecord[] = attendanceRecords
      .flatMap((record: any) => {
        const mapping = employeeMapping[record.employeeIdentifier]

        if (!mapping) return []

        // ❌ Filter 1: Exclude inactive employees
        if (activeEmployeeIds.size > 0 && !activeEmployeeIds.has(record.employeeIdentifier)) {
          return []
        }

        // ❌ Filter 2: Exclude non-working days (holidays, weekends)
        // DayType: 0=WorkingDay, 1=Holiday, 2=FullDayWeeklyOff, 3=FirstHalfWeeklyOff, 4=SecondHalfWeeklyOff
        const dayType = Number(record.dayType)
        if (dayType !== 0) {
          return []
        }

        const rows: any[] = []

        // ✅ CHECK-IN
        if (record.firstInOfTheDay?.timestamp) {
          const ts = new Date(record.firstInOfTheDay.timestamp)

          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          const logSource = record.firstInOfTheDay.attendanceLogSource
          const manualType = record.firstInOfTheDay.manualClockinType

          rows.push({
            employee_id: record.employeeIdentifier || '',
            employee_name: mapping.user_name || mapping.employee_email || '',
            user_email: mapping.user_email || '',

            datetime: ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            status: 'Check-in',

            source: getSystemSource(logSource),

            day_type: DAY_TYPE_MAP[dayType] || 'Unknown',
            day_type_value: dayType,
            attendance_log_source: ATTENDANCE_LOG_SOURCE_MAP[logSource] || 'Unknown',
            manual_clockin_type: MANUAL_CLOCKIN_TYPE_MAP[manualType] || 'None',

            department: mapping.department || '',
            designation: mapping.designation || '',
          })
        }

        // ✅ CHECK-OUT
        if (record.lastOutOfTheDay?.timestamp) {
          const ts = new Date(record.lastOutOfTheDay.timestamp)

          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          const logSource = record.lastOutOfTheDay.attendanceLogSource
          const manualType = record.lastOutOfTheDay.manualClockinType

          rows.push({
            employee_id: record.employeeIdentifier || '',
            employee_name: mapping.user_name || mapping.employee_email || '',
            user_email: mapping.user_email || '',

            datetime: ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            status: 'Check-out',
            source: getSystemSource(logSource),

            day_type: DAY_TYPE_MAP[dayType] || 'Unknown',
            day_type_value: dayType,
            attendance_log_source: ATTENDANCE_LOG_SOURCE_MAP[logSource] || 'Unknown',
            manual_clockin_type: MANUAL_CLOCKIN_TYPE_MAP[manualType] || 'None',

            department: mapping.department || '',
            designation: mapping.designation || '',
          })
        }

        if (!record.firstInOfTheDay && !record.lastOutOfTheDay) {
          const ts = new Date(record.shiftStartTime || record.attendanceDate)

          if (!isWithinDateRange(ts)) return []

          // ❌ Filter 3: Exclude employees on approved leave
          const dateStr = ts.toISOString().split('T')[0]
          if (isEmployeeOnLeave(record.employeeIdentifier, dateStr)) {
            return []
          }

          rows.push({
            employee_id: record.employeeIdentifier || '',
            employee_name: mapping.user_name || mapping.employee_email || '',
            user_email: mapping.user_email || '',

            datetime: ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),

            status: 'No Log',
            source: 'Keka',

            day_type: DAY_TYPE_MAP[dayType] || 'Unknown',
            day_type_value: dayType,
            attendance_log_source: 'Unknown',
            manual_clockin_type: 'None',

            department: mapping.department || '',
            designation: mapping.designation || '',
          })
        }

        return rows
      })

    // 📈 Calculate summary statistics
    const totalRecords = detailedRecords.length
    const recordsBySource = detailedRecords.reduce(
      (acc, r) => {
        acc[r.source] = (acc[r.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
    const recordsByLogSource = detailedRecords.reduce(
      (acc, r) => {
        acc[r.attendance_log_source] = (acc[r.attendance_log_source] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const summary = {
      total_records: totalRecords,
      records_by_source: recordsBySource,
      records_by_log_source: recordsByLogSource,
      date_range: {
        from: fromDate,
        to: toDate,
      },
    }

    // ✅ Return response
    return {
      success: true,
      data: {
        summary,
        records: detailedRecords,
        filters: {
          fromDate,
          toDate,
          org: orgId,
        },
        pagination: {
          total: totalRecords,
          limit: 1000,
          offset: 0,
        },
      },
    }
  } catch (error: any) {
    logError('Attendance report error:', error)

    if (error instanceof CustomError) {
      throw error
    }

    throw new CustomError('Failed to fetch attendance report', 500)
  }
})
