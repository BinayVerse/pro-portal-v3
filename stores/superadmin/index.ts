import { defineStore } from 'pinia'

interface SuperOrg {
  org_id: string
  org_name: string
  created_at: string | null
  total_users: number
  docs_uploaded: number
  total_tokens: number
  last_used_at: string | null
  last_used_date?: string | null
}

interface Summary {
  total_orgs: number
  total_users: number
  total_docs: number
  total_tokens: number
}

interface State {
  loading: boolean
  organizations: SuperOrg[]
  summary: Summary | null
  error: string | null
}

export const useSuperAdminStore = defineStore('superadmin', {
  state: (): State => ({
    loading: false,
    organizations: [],
    summary: null,
    error: null,
  }),
  actions: {
    async fetchOrganizations() {
      this.loading = true
      this.error = null
      try {
        const tokenCookie = useCookie<string | null>('auth-token')
        const headers = tokenCookie?.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {}
        // Try to detect client timezone; fallback to 'UTC'
        let tz = 'UTC'
        try {
          // Intl may be available both on server and client; if not available default to UTC
          const resolved = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone
          if (resolved) tz = resolved
        } catch (e) {}

        const res = await $fetch<{ status: string; data: { organizations: SuperOrg[]; summary: Summary } }>(
          `/api/superadmin/organizations?timezone=${encodeURIComponent(tz)}`,
          { headers },
        )
        this.organizations = res?.data?.organizations || []
        this.summary = res?.data?.summary || { total_orgs: 0, total_users: 0, total_docs: 0, total_tokens: 0 }
      } catch (e: any) {
        this.error = e?.message || 'Failed to fetch organizations'
      } finally {
        this.loading = false
      }
    },
  },
})
