import { defineEventHandler, readBody } from 'h3'
import { CustomError } from '~/server/utils/custom.error'
import { query } from '~/server/utils/db'
import { getKekaAttendanceData } from '~/server/utils/keka'
import { sendEmail } from '~/server/utils/ses'
import { generateAttendanceReportEmailHTML } from '~/server/utils/emailTemplates'
import jwt from 'jsonwebtoken'

// Enum Mappings
const DAY_TYPE_MAP: Record<number, string> = {
  0: 'WorkingDay',
  1: 'Holiday',
  2: 'FullDayWeeklyOff',
  3: 'FirstHalfWeeklyOff',
  4: 'SecondHalfWeeklyOff',
}

const ATTENDANCE_LOG_SOURCE_MAP: Record<number, string> = {
  0: 'Biometric',
  1: 'MobileApp',
  2: 'Web',
  3: 'Api',
  4: 'Import',
  5: 'System',
}

const MANUAL_CLOCKIN_TYPE_MAP: Record<number, string> = {
  0: 'None',
  1: 'ClockIn',
  2: 'ClockOut',
  3: 'Both',
}

const getSystemSource = (logSourceValue: number): string => {
  if (logSourceValue === 3) {
    return 'Provento'
  }
  return 'Keka'
}

/**
 * Convert array to CSV string
 */
function convertToCSV(data: any[], headers: string[]): string {
  const headerRow = headers.map((h) => `"${h}"`).join(',')

  const dataRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header] || ''
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
      throw new CustomError('Only superadmins can send attendance reports', 403)
    }

    // 📋 Get request body
    const body = await readBody(event)
    const { fromDate, toDate, employeeIds } = body
    const orgId = body.org || userOrgId

    // Validate required fields
    if (!fromDate || !toDate) {
      throw new CustomError('fromDate and toDate are required', 400)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      throw new CustomError('Invalid date format. Use YYYY-MM-DD', 400)
    }

    // 📊 Fetch attendance data from Keka
    const kekaResponse = await getKekaAttendanceData({
      fromDate,
      toDate,
      employeeIds: employeeIds && employeeIds.length > 0 ? employeeIds : undefined,
    })

    const attendanceRecords = kekaResponse.data || []

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

    // 🔄 Transform records - same format as report.get.ts
    const detailedRecords: any[] = attendanceRecords
      .flatMap((record: any) => {
        const mapping = employeeMapping[record.employeeIdentifier]

        if (!mapping) return []

        const rows: any[] = []

        // ✅ CHECK-IN
        if (record.firstInOfTheDay?.timestamp) {
          const ts = new Date(record.firstInOfTheDay.timestamp)

          const logSource = record.firstInOfTheDay.attendanceLogSource
          const manualType = record.firstInOfTheDay.manualClockinType

          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name': mapping.user_name || mapping.employee_email || '',
            'Email': mapping.user_email || '',
            'Date & Time': ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            'Source': getSystemSource(logSource),
            'Status': 'Check-in',
            'Department': mapping.department || '',
            'Designation': mapping.designation || '',
          })
        }

        // ✅ CHECK-OUT
        if (record.lastOutOfTheDay?.timestamp) {
          const ts = new Date(record.lastOutOfTheDay.timestamp)

          const logSource = record.lastOutOfTheDay.attendanceLogSource
          const manualType = record.lastOutOfTheDay.manualClockinType

          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name': mapping.user_name || mapping.employee_email || '',
            'Email': mapping.user_email || '',
            'Date & Time': ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            'Source': getSystemSource(logSource),
            'Status': 'Check-out',
            'Department': mapping.department || '',
            'Designation': mapping.designation || '',
          })
        }

        if (!record.firstInOfTheDay && !record.lastOutOfTheDay) {
          const ts = new Date(record.shiftStartTime || record.attendanceDate)
          rows.push({
            'Employee ID': record.employeeIdentifier || '',
            'Employee Name': mapping.user_name || mapping.employee_email || '',
            'Email': mapping.user_email || '',
            'Date & Time': ts.toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }),
            'Source': 'Keka',
            'Status': 'No Log',
            'Department': mapping.department || '',
            'Designation': mapping.designation || '',
          })
        }

        return rows
      })

    // 📈 Calculate summary statistics
    const totalRecords = detailedRecords.length
    const recordsBySource = detailedRecords.reduce(
      (acc, r) => {
        acc[r['Source']] = (acc[r['Source']] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const summary = {
      total_records: totalRecords,
      records_by_source: recordsBySource,
      date_range: {
        from: fromDate,
        to: toDate,
      },
    }

    // 🔄 Prepare CSV export - exact same as UI export
    const headers = ['Employee ID', 'Employee Name', 'Email', 'Date & Time', 'Source', 'Status', 'Department', 'Designation']
    const csvContent = convertToCSV(detailedRecords, headers)

    // Get email recipients from env
    const kekaEmailIds = config.kekaEmailIds || ''
    const recipients = kekaEmailIds
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0)

    if (recipients.length === 0) {
      throw new CustomError('No email recipients configured', 500)
    }

    // 📧 Generate email HTML using template
    const htmlContent = generateAttendanceReportEmailHTML(summary)

    // 📤 Send email with CSV attachment
    await sendEmail({
      from: config.sesFromEmailId || 'noreply@provento.ai',
      to: recipients,
      subject: `Summary: Attendance Source Report (Provento vs Keka)`,
      html: htmlContent,
      attachments: [
        {
          filename: `attendance-report-${fromDate}-to-${toDate}.csv`,
          content: csvContent,
          contentType: 'text/csv',
        },
      ],
    })

    return {
      success: true,
      message: `Attendance report sent to ${recipients.length} recipient(s)`,
      recipients_count: recipients.length,
      records_count: totalRecords,
    }
  } catch (error: any) {
    console.error('Attendance email error:', error)

    if (error instanceof CustomError) {
      throw error
    }

    throw new CustomError('Failed to send attendance report', 500)
  }
})
