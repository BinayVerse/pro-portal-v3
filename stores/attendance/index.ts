import { defineStore } from 'pinia'
import type { AttendanceState, AttendanceReportResponse } from './types'
import { handleError, handleSuccess } from '~/utils/apiHandler'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useAttendanceStore = defineStore('attendanceStore', {
  state: (): AttendanceState => ({
    loading: false,
    exportLoading: false,
    emailLoading: false,
    error: null,
    successMessage: null,
    reportData: null,
  }),

  getters: {
    isLoading: (state): boolean => state.loading,
    isExporting: (state): boolean => state.exportLoading,
    isSendingEmail: (state): boolean => state.emailLoading,
    getError: (state): string | null => state.error,
    getSuccessMessage: (state): string | null => state.successMessage,
    getReportData: (state): AttendanceReportResponse | null => state.reportData,
  },

  actions: {
    handleError(error: any, defaultMessage: string, silent: boolean = false): string {
      const msg = handleError(error, defaultMessage, silent)
      this.error = msg
      return msg
    },

    handleSuccess(message: string): void {
      this.error = null
      handleSuccess(message)
    },

    setSuccessMessage(message: string): void {
      this.successMessage = message
    },

    clearSuccessMessage(): void {
      this.successMessage = null
    },

    async fetchAttendanceReport(
      fromDate: string,
      toDate: string,
      employeeIds?: string[],
      source?: string,
      org?: string
    ): Promise<void> {
      try {
        this.loading = true
        this.error = null

        const params = new URLSearchParams({
          fromDate,
          toDate,
        })

        if (source && source !== '') {
          params.append('source', source)
        }

        if (employeeIds && employeeIds.length > 0) {
          params.append('employeeIds', employeeIds.join(','))
        }

        if (org) {
          params.append('org', org)
        }

        const response = await $fetch<{ data: AttendanceReportResponse }>(
          `/api/attendance/report?${params.toString()}`,
          {
            credentials: 'include',
          }
        )

        this.reportData = response.data
        this.error = null
      } catch (error) {
        if (await handleAuthErrorShared(error)) return
        this.handleError(error, 'Failed to fetch attendance report')
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendAttendanceReportEmail(
      fromDate: string,
      toDate: string,
      employeeIds?: string[],
      org?: string
    ): Promise<{ success: boolean; message: string; recipients_count: number; records_count: number }> {
      try {
        this.emailLoading = true
        this.error = null

        const body: Record<string, any> = {
          fromDate,
          toDate,
        }

        if (employeeIds && employeeIds.length > 0) {
          body.employeeIds = employeeIds
        }

        if (org) {
          body.org = org
        }

        const response = await $fetch<{
          success: boolean
          message: string
          recipients_count: number
          records_count: number
        }>('/api/attendance/send-email', {
          method: 'POST',
          credentials: 'include',
          body,
        })

        this.successMessage = response.message
        this.error = null
        return response
      } catch (error) {
        if (await handleAuthErrorShared(error)) {
          throw error
        }
        this.handleError(error, 'Failed to send attendance report')
        throw error
      } finally {
        this.emailLoading = false
      }
    },

    clearError(): void {
      this.error = null
    },
  },
})
