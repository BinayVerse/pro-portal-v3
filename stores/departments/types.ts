export interface Department {
    id: string
    name: string
    description: string | null
    status: 'active' | 'inactive'
    users: number
    artifacts: number
    initials: string
}

export interface DepartmentPayload {
    name: string
    description?: string
    status?: 'active' | 'inactive'
}

export interface DepartmentsState {
    loading: boolean
    error: string | null

    departments: Department[]

    departmentLoading: boolean
    departmentError: string | null
}
