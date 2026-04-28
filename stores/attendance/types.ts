export interface AttendanceRecord {
  employee_id: string
  employee_name: string
  user_email: string
  datetime: string
  status: string
  source: string
  department: string
  designation: string
  attendance_log_source: string
  manual_clockin_type: string
}

export interface AttendanceSummary {
  total_records: number
  records_by_source: Record<string, number>
  records_by_log_source: Record<string, number>
  date_range: {
    from: string
    to: string
  }
}

export interface AttendanceReportResponse {
  summary: AttendanceSummary
  records: AttendanceRecord[]
  filters: {
    fromDate: string
    toDate: string
    employeeIds?: string[]
    source: string | null
    org: string
  }
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export interface AttendanceState {
  loading: boolean
  exportLoading: boolean
  emailLoading: boolean
  error: string | null
  successMessage: string | null
  reportData: AttendanceReportResponse | null
}
