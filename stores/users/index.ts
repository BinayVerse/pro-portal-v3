// store/organization/index.ts

import { defineStore } from 'pinia'
import type {
  OrganizationState,
  OrganizationUser,
  Organization,
  OrganizationResponse,
} from './types'

import { handleError, handleSuccess, extractErrors } from '../../utils/apiHandler'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useUsersStore = defineStore('usersStore', {
  state: (): OrganizationState => ({
    loading: true,
    error: null,
    users: [],
    roles: [],
    userLoading: false,
    userError: null,
    departments: [] as any[],
    departmentsLoading: false,
    departmentsError: null as string | null,
    allDepartments: [] as any[], // All departments for display purposes
    allDepartmentsLoading: false,
    allDepartmentsError: null as string | null,
    userDepartments: {} as Record<string, string[]>,
  }),

  getters: {
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
    getRoles: (state) => state.roles,
    getUsers: (state) => state.users,
    isUserLoading: (state) => state.userLoading,
    getUserError: (state): string | null => state.userError,
    getDepartments: (state) => state.departments,
    isDepartmentsLoading: (state) => state.departmentsLoading,
    getDepartmentsError: (state): string | null => state.departmentsError,
    getAllDepartments: (state) => state.allDepartments,
    isAllDepartmentsLoading: (state) => state.allDepartmentsLoading,
    getAllDepartmentsError: (state): string | null => state.allDepartmentsError,
    getUserDepartments: (state) => state.userDepartments,
  },

  actions: {

    mapOrganization(org: OrganizationResponse): Organization {
      return {
        id: org.org_id,
        name: org.org_name,
        docs_uploaded: org.docs_uploaded,
        users_count: org.users_count,
        total_tokens: org.total_tokens,
        org_plan: [
          {
            name: org.name,
            expire_at: org.expire_at,
            status: org.status,
          },
        ],
      }
    },

    // small helper for token headers
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

    async fetchRoles() {
      this.loading = true
      try {
        const data = await $fetch<{ data: any[] }>('/api/users/roles', {
          headers: this.getAuthHeaders(),
        })
        this.roles = data.data || []
      } catch (err: any) {
        console.error('Fetch roles error:', err)

        if (!(await this.handleAuthError(err))) {
          this.userError = handleError(err, 'Failed to fetch roles')
        }
      } finally {
        this.loading = false
      }
    },

    async fetchUsers(orgId?: string | null) {
      this.userLoading = true
      try {
        const url = orgId ? `/api/users/all?org=${encodeURIComponent(String(orgId))}` : '/api/users/all'
        const data = await $fetch<{ data: OrganizationUser[] }>(url, {
          headers: this.getAuthHeaders(),
        })
        this.users = data.data || []
      } catch (err: any) {
        console.error('Fetch users error:', err)
        if (!(await this.handleAuthError(err))) {
          this.userError = handleError(err, 'Failed to fetch users')
        }
      } finally {
        this.userLoading = false
      }
    },

    async createUser(user: Partial<OrganizationUser>) {
      this.loading = true
      try {
        const response = await $fetch<{ status?: boolean; message?: string; errors?: any[] }>(
          '/api/users/create',
          {
            method: 'POST',
            body: user,
            headers: this.getAuthHeaders(),
          }
        )

        // If API explicitly returns failure (like status: 'error' or status === false)
        if (response?.status === false) {
          const message = response.message || 'Error creating user'
          this.userError = message
          // Show the API message directly
          handleError({ response: { _data: { message } } }, message)
          return { success: false, message, errors: response.errors || [] }
        }

        handleSuccess('User added successfully!')
        return { success: true, message: 'User added successfully!' }
      } catch (err: any) {
        const isAuthError = await this.handleAuthError(err)
        if (isAuthError) {
          return { success: false, message: 'Unauthorized', errors: [] }
        }

        const message = handleError(err, 'Error creating user')
        this.userError = message
        return {
          success: false,
          message,
          errors:
            extractErrors(err),
        }
      } finally {
        this.loading = false
      }
    },

    async editUser(id: string, user: Partial<OrganizationUser>, silent = false, orgId?: string | null) {
      try {
        const url = orgId ? `/api/users/${id}?org=${encodeURIComponent(String(orgId))}` : `/api/users/${id}`
        const response = await $fetch<{ status?: boolean; message?: string; errors?: any[] }>(
          url,
          {
            method: 'PUT',
            body: user,
            headers: this.getAuthHeaders(),
          }
        )

        // If API explicitly returns failure (e.g., status: 'error' or status === false)
        if (response?.status === false) {
          const message = response.message || 'Error editing user'
          this.userError = message
          handleError({ response: { _data: { message } } }, message)
          return { success: false, message, errors: response.errors || [] }
        }

        if (!silent) handleSuccess('User edited successfully!')
        return { success: true, message: 'User edited successfully!' }
      } catch (err: any) {
        const isAuthError = await this.handleAuthError(err)
        if (isAuthError) {
          return { success: false, message: 'Unauthorized', errors: [] }
        }

        const message = handleError(err, 'Error editing user')
        this.userError = message
        return {
          success: false,
          message,
          errors:
            extractErrors(err),
        }
      }
    },

    async deleteUser(id: string) {
      try {
        await $fetch(`/api/users/${id}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        })

        handleSuccess('User deleted successfully!')
      } catch (err: any) {
        if (!(await this.handleAuthError(err))) {
          this.userError = handleError(err, 'Error deleting user')
        }
      }
    },

    // Activate or deactivate a user (soft toggle using is_active column)
    async setUserActive(id: string, isActive: boolean) {
      try {
        const response = await $fetch<{ status: string; message?: string; data?: any }>(
          `/api/users/${id}/status`,
          {
            method: 'POST',
            body: { is_active: isActive },
            headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
          }
        )

        // Update local state if present
        const idx = this.users.findIndex((u: any) => String(u.user_id) === String(id) || String((u as any).id) === String(id))
        if (idx !== -1) {
          // Ensure we keep object reactivity and update status string
          this.users[idx] = { ...this.users[idx], is_active: isActive, status: isActive ? 'active' : 'inactive' }
        }

        handleSuccess(response.message || `User ${isActive ? 'activated' : 'deactivated'} successfully`)
        return { success: true, message: response.message || '' }
      } catch (err: any) {
        if (await this.handleAuthError(err)) {
          return { success: false, message: 'Unauthorized' }
        }
        const message = handleError(err, 'Error updating user status')
        this.userError = message
        return { success: false, message }
      }
    },

    async toggleUserActive(id: string) {
      // Toggle based on local state if available, otherwise fetch users first
      let user = this.users.find((u: any) => String(u.user_id) === String(id) || String((u as any).id) === String(id))
      if (!user) {
        await this.fetchUsers()
        user = this.users.find((u: any) => String(u.user_id) === String(id) || String((u as any).id) === String(id))
        if (!user) return { success: false, message: 'User not found' }
      }

      return await this.setUserActive(id, !user.is_active)
    },

    async createBulkUsers(jsonData: OrganizationUser, orgId?: string | null) {
      this.userLoading = true
      try {
        const url = orgId ? `/api/users/bulk-users?org=${encodeURIComponent(String(orgId))}` : '/api/users/bulk-users'
        const body = jsonData
        const data = await $fetch<{
          status: boolean
          message: string
          errors?: any[]
        }>(url, {
          method: 'POST' as any,
          body,
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        })

        handleSuccess('Bulk users added successfully!')

        return { status: data.status, message: data.message, errors: data.errors || [] }
      } catch (err: any) {
        if (!(await this.handleAuthError(err))) {
          const message = handleError(err, 'Error uploading bulk users')
          return { status: false, message, errors: extractErrors(err) }
        }
        return { status: false, message: 'Unauthorized', errors: [] }
      } finally {
        this.userLoading = false
      }
    },

    async uploadAndValidateJson(jsonData: OrganizationUser, orgId?: string | null) {
      this.userLoading = true
      try {
        // If caller didn't provide orgId, try to read it from the current route (useful for superadmin selected org)
        let resolvedOrgId = orgId || null
        try {
          const route = useRoute()
          const q = route?.query?.org || route?.query?.org_id
          if (!resolvedOrgId && q) resolvedOrgId = String(q)
        } catch (e) {
          // ignore if useRoute isn't available in this context
        }

        const url = resolvedOrgId ? `/api/users/upload-json?org=${encodeURIComponent(String(resolvedOrgId))}` : '/api/users/upload-json'
        const data = await $fetch<{
          status: boolean
          message: string
          data?: any
          errors?: any[]
        }>(url, {
          method: 'POST',
          body: jsonData,
          headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        })

        return {
          status: data.status,
          message: data.message,
          data: data.data || null,
          errors: data.errors || [],
        }
      } catch (err: any) {
        // 🔎 If it's a validation error (422), unwrap and return cleanly
        if (err?.response?.status === 422 && err?.response?._data) {
          const data = err.response._data
          return {
            status: false,
            message: data.message || 'Validation failed',
            data: null,
            errors: data.errors || [],
          }
        }

        if (this.handleAuthError(err)) {
          return { status: false, message: 'Unauthorized', errors: [] }
        }

        const message = handleError(err, 'Error validating JSON')
        return { status: false, message, errors: [] }
      } finally {
        this.userLoading = false
      }
    },

    // Department fetching actions
    async fetchDepartments(orgId?: string | null) {
      this.departmentsLoading = true
      this.departmentsError = null
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          this.departmentsError = 'No auth token available'
          return
        }

        const url = orgId
          ? `/api/organizations/departments?org_id=${encodeURIComponent(String(orgId))}`
          : '/api/organizations/departments'

        const result = await $fetch<{ data: any[] }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        this.departments = result?.data || []
      } catch (err: any) {
        console.error('Failed to load departments:', err)
        if (!(await this.handleAuthError(err))) {
          this.departmentsError = handleError(err, 'Failed to load departments')
        }
        this.departments = []
      } finally {
        this.departmentsLoading = false
      }
    },

    // 🔑 Fetch ALL departments for display purposes (no role-based filtering)
    // Used to map department IDs to names in the UI, regardless of DA permissions
    async fetchAllDepartments(orgId?: string | null) {
      this.allDepartmentsLoading = true
      this.allDepartmentsError = null
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          this.allDepartmentsError = 'No auth token available'
          return
        }

        const url = orgId
          ? `/api/organizations/all-departments?org_id=${encodeURIComponent(String(orgId))}`
          : '/api/organizations/all-departments'

        const result = await $fetch<{ data: any[] }>(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        this.allDepartments = result?.data || []
      } catch (err: any) {
        console.error('Failed to load all departments:', err)
        if (!(await this.handleAuthError(err))) {
          this.allDepartmentsError = handleError(err, 'Failed to load all departments')
        }
        this.allDepartments = []
      } finally {
        this.allDepartmentsLoading = false
      }
    },

    async fetchUserDepartments(userId: string) {
      try {
        const token = process.client ? localStorage.getItem('authToken') : null
        if (!token) {
          console.warn('No auth token available for loading user departments')
          return []
        }

        const result = await $fetch<{ departments: string[] }>(
          `/api/users/${userId}/departments`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        // Store the raw department IDs (not names) for form binding
        const deptIds = result?.departments || []
        this.userDepartments[userId] = deptIds
        return deptIds
      } catch (err: any) {
        console.error(`Failed to load departments for user ${userId}:`, err)
        this.userDepartments[userId] = []
        return []
      }
    },

    async fetchAllUserDepartments(userIds: string[]) {
      // Fetch departments for multiple users in parallel
      await Promise.allSettled(
        userIds.map(userId => this.fetchUserDepartments(userId))
      )
    },

    // Helper to get department names from IDs for display
    getDepartmentNames(deptIds: string[]): string[] {
      return deptIds
        .map((deptId: string) => {
          const dept = this.departments.find((d: any) => d.dept_id === deptId)
          return dept?.name || ''
        })
        .filter(Boolean)
    },

    // Bulk assign users to departments
    async bulkAssignDepartments(userIds: string[], departments: string[]) {
      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: {
            userIds: string[]
            departments: string[]
            succeeded: number
            failed: number
            errors: any[]
          }
        }>('/api/users/bulk-assign-departments', {
          method: 'POST',
          body: {
            userIds,
            departments,
          },
          headers: this.getAuthHeaders(),
        })

        if (response.success) {
          handleSuccess(response.message)
          // Refresh user departments
          // await this.fetchAllUserDepartments(userIds)
          return response
        }
      } catch (err: any) {
        if (!(await this.handleAuthError(err))) {
          const errorMsg = handleError(err, 'Failed to assign departments')
          throw new Error(errorMsg)
        }
      }
    },

    // Bulk unassign users from departments
    async bulkUnassignDepartments(userIds: string[], departments: string[]) {
      try {
        const response = await $fetch<{
          success: boolean
          message: string
          data: {
            userIds: string[]
            departments: string[]
            succeeded: number
            failed: number
            errors: any[]
          }
        }>('/api/users/bulk-unassign-departments', {
          method: 'POST',
          body: {
            userIds,
            departments,
          },
          headers: this.getAuthHeaders(),
        })

        if (response.success) {
          handleSuccess(response.message)
          // Refresh user departments
          // await this.fetchAllUserDepartments(userIds)
          return response
        }
      } catch (err: any) {
        if (!(await this.handleAuthError(err))) {
          const errorMsg = handleError(err, 'Failed to unassign departments')
          throw new Error(errorMsg)
        }
      }
    },
  },
})
