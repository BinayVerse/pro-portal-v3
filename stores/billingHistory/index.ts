// stores/billingHistory/index.ts
import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useBillingHistoryStore = defineStore('billingHistory', {
  state: () => ({
    invoices: [] as any[],
    loading: false,
    error: null as string | null,
    // Add filter state
    filters: {
      dateRange: 'All Time' as string,
      selectedPlan: 'All Plans' as string,
    }
  }),

  getters: {
    getInvoices: (state) => state.invoices,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getFilters: (state) => state.filters,
  },

  actions: {
    getAuthHeaders() {
      if (process.client) {
        const token = localStorage.getItem('authToken')
        if (token) {
          return { Authorization: `Bearer ${token}` }
        }
      }
      return {}
    },

    async fetchBillingHistory(filters?: { dateRange?: string; selectedPlan?: string }) {
      this.loading = true
      this.error = null

      try {
        // Prevent SSR call
        if (!process.client) return

        // Update filters if provided
        if (filters) {
          this.filters.dateRange = filters.dateRange || this.filters.dateRange
          this.filters.selectedPlan = filters.selectedPlan || this.filters.selectedPlan
        }

        // Build query parameters correctly
        const queryParams: Record<string, string> = {}
        
        // Add date range label
        if (this.filters.dateRange !== 'All Time') {
          queryParams.dateRange = this.filters.dateRange
          
          // Calculate actual dates for the server
          const now = dayjs()
          let startDate: string = ''
          let endDate: string = now.format('YYYY-MM-DD')
          
          switch (this.filters.dateRange) {
            case 'Last 30 Days':
              startDate = now.subtract(30, 'day').format('YYYY-MM-DD')
              break
            case 'Last 90 Days':
              startDate = now.subtract(90, 'day').format('YYYY-MM-DD')
              break
            case 'This Year':
              startDate = now.startOf('year').format('YYYY-MM-DD')
              endDate = now.endOf('year').format('YYYY-MM-DD')
              break
            case 'Last Year':
              startDate = now.subtract(1, 'year').startOf('year').format('YYYY-MM-DD')
              endDate = now.subtract(1, 'year').endOf('year').format('YYYY-MM-DD')
              break
          }
          
          if (startDate) {
            queryParams.startDate = startDate
          }
          if (endDate) {
            queryParams.endDate = endDate
          }
        }
        
        // Add plan filter
        if (this.filters.selectedPlan !== 'All Plans') {
          queryParams.selectedPlan = this.filters.selectedPlan
        }

        const url = `/api/billing/invoices${Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : ''}`

        const response: any = await $fetch(url, {
          headers: this.getAuthHeaders(),
        })

        if (response?.success === true) {
          this.invoices = response.data || []
        } else {
          throw new Error(response?.error || 'Failed to fetch billing history')
        }
      } catch (error: any) {
        console.error('Store: Error in fetchBillingHistory:', error)
        this.error = error.message || 'Unable to fetch billing history'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateFilters(filters: { dateRange?: string; selectedPlan?: string }) {
      if (filters.dateRange !== undefined) {
        this.filters.dateRange = filters.dateRange
      }
      if (filters.selectedPlan !== undefined) {
        this.filters.selectedPlan = filters.selectedPlan
      }
      
      // Re-fetch with new filters
      await this.fetchBillingHistory()
    },

    async downloadInvoice(invoiceId: string, invoiceNumber?: string) {
      try {
        const response = await fetch(
          `/api/billing/invoices/${invoiceId}/download`,
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceNumber || invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()

        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (err: any) {
        console.error('Invoice download error:', err)
        throw err
      }
    },

    clearStore() {
      this.invoices = []
      this.error = null
      this.filters = {
        dateRange: 'All Time',
        selectedPlan: 'All Plans'
      }
    },
  },
})