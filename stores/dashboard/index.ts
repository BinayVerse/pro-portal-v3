import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    loading: false,
    recentUsers: [] as any[],
    recentArtefacts: [] as any[],
    overview: null as any | null,
    error: null as string | null,
  }),
  getters: {
    getRecentUsers: (state) => state.recentUsers,
    getRecentArtefacts: (state) => state.recentArtefacts,
    getOverview: (state) => state.overview,
    isLoading: (state) => state.loading,
  },
  actions: {
    getAuthHeaders(extra: Record<string,string> = {}) {
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

    async fetchDashboard(orgId?: string | null) {
      this.loading = true
      this.error = null
      try {
        const url = orgId ? `/api/dashboard?org=${encodeURIComponent(String(orgId))}` : '/api/dashboard'
        const resp = await $fetch(url, { method: 'GET', headers: this.getAuthHeaders() })
        if (resp && (resp as any).status === 'success') {
          const data = (resp as any).data
          this.recentUsers = data.recentUsers || []
          this.recentArtefacts = data.recentArtefacts || []
          this.overview = data.overview || null
        } else {
          this.error = (resp as any)?.message || 'Failed to fetch dashboard data'
        }
      } catch (err: any) {
        console.error('Dashboard store fetch error:', err)
        this.error = err?.message || 'Failed to fetch dashboard data'
      } finally {
        this.loading = false
      }
    },
  },
})
