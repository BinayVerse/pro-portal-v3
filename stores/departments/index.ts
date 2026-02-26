import { defineStore } from 'pinia'
import type { DepartmentsState, Department, DepartmentPayload } from './types'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useDepartmentsStore = defineStore('departmentsStore', {
    state: (): DepartmentsState => ({
        loading: false,
        error: null,

        departments: [],

        departmentLoading: false,
        departmentError: null,
    }),

    getters: {
        getDepartments: (state): Department[] => state.departments,

        getActiveDepartments: (state): Department[] =>
            state.departments.filter((d) => d.status === 'active'),

        isLoading: (state): boolean => state.loading,
        isDepartmentLoading: (state): boolean => state.departmentLoading,
    },

    actions: {
        /* -----------------------------------------
         * Auth headers (same pattern as users store)
         * ---------------------------------------*/
        getAuthHeaders(extra: Record<string, string> = {}) {
            let token: string | null = null

            if (process.client) {
                token = localStorage.getItem('authToken')
            }

            if (!token) {
                const authCookie = useCookie('authToken')
                token = authCookie.value || null
            }

            return {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...extra,
            }
        },

        async handleAuthError(err: any): Promise<boolean> {
            return await handleAuthErrorShared(err)
        },

        /* -----------------------------------------
         * Fetch departments
         * ---------------------------------------*/
        async fetchDepartments() {
            this.loading = true
            this.error = null

            try {
                const res = await $fetch<{ data: Department[] }>(
                    '/api/departments/all',
                    { headers: this.getAuthHeaders() },
                )

                this.departments = (res.data || []).map((d) => ({
                    ...d,
                    users: Number(d.users) || 0,
                    artifacts: Number(d.artifacts) || 0,
                    initials: this.getInitials(d.name),
                }))
            } catch (err: any) {
                if (await this.handleAuthError(err)) return
                this.error = handleError(err, 'Failed to fetch departments')
            } finally {
                this.loading = false
            }
        },

        /* -----------------------------------------
         * Create department
         * ---------------------------------------*/
        async createDepartment(payload: DepartmentPayload) {
            this.departmentLoading = true
            this.departmentError = null

            try {
                const res = await $fetch<{ data: Department }>(
                    '/api/departments/create',
                    {
                        method: 'POST',
                        headers: this.getAuthHeaders({
                            'Content-Type': 'application/json',
                        }),
                        body: payload,
                    },
                )

                // this.departments.unshift({
                //     ...res.data,
                //     initials: this.getInitials(res.data.name),
                // })
                await this.fetchDepartments()

                handleSuccess('Department created successfully')
            } catch (err: any) {
                if (await this.handleAuthError(err)) return
                this.departmentError = handleError(err, 'Failed to create department')
            } finally {
                this.departmentLoading = false
            }
        },

        /* -----------------------------------------
         * Update department
         * ---------------------------------------*/
        async updateDepartment(deptId: string, payload: DepartmentPayload) {
            this.departmentLoading = true
            this.departmentError = null

            try {
                await $fetch(`/api/departments/${deptId}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders({
                        'Content-Type': 'application/json',
                    }),
                    body: payload,
                })

                handleSuccess('Department updated successfully')

                // ✅ REFRESH LIST
                await this.fetchDepartments()
            } catch (err: any) {
                if (await this.handleAuthError(err)) return
                this.departmentError = handleError(err, 'Failed to update department')
            } finally {
                this.departmentLoading = false
            }
        },

        /* -----------------------------------------
         * Activate / Deactivate department
         * ---------------------------------------*/
        async toggleDepartmentStatus(deptId: string, status: 'active' | 'inactive') {
            this.departmentLoading = true
            this.departmentError = null

            try {
                await $fetch(`/api/departments/${deptId}/status`, {
                    method: 'PATCH',
                    headers: this.getAuthHeaders({
                        'Content-Type': 'application/json',
                    }),
                    body: { status },
                })

                handleSuccess(
                    status === 'active'
                        ? 'Department activated successfully'
                        : 'Department deactivated successfully',
                )

                // ✅ REFRESH LIST
                await this.fetchDepartments()
            } catch (err: any) {
                if (await this.handleAuthError(err)) return
                this.departmentError = handleError(err, 'Failed to update department status')
            } finally {
                this.departmentLoading = false
            }
        },

        /* -----------------------------------------
         * Helpers
         * ---------------------------------------*/
        getInitials(name: string): string {
            if (!name) return 'D'
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        },
    },
})
