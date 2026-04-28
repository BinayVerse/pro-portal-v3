export const formatAttendanceRecord = (r: any) => {
    return {
        employee_id: r.employee_id,
        employee_name: r.employee_name || '-',
        email: r.user_email || '-',

        datetime: r.datetime
            ? new Date(r.datetime).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
            : '-',

        source: r.attendance_log_source === 3 ? 'Provento' : 'Keka',

        status: r.status === 'Check-in' ? 'Check-in' : 'Check-out',

        department: r.department || '-',
        designation: r.designation || '-',
    }
}