import { defineStore } from 'pinia'
import type { IntegrationsOverview, IntegrationActivity, ApiResponse, BusinessWhatsAppDetails, WhatsAppNumber, WhatsAppAccountData } from './types'
import { useNotification } from '~/composables/useNotification'
import { handleError, handleSuccess, extractErrors } from '../../utils/apiHandler'
import { handleAuthError as handleAuthErrorShared } from '~/composables/useAuthError'

export const useIntegrationsStore = defineStore('integrations', {
  state: () => ({
    overview: null as IntegrationsOverview | null,
    recentActivity: [] as IntegrationActivity[],
    loading: false,
    error: null as string | null,
    lastFetched: null as Date | null,
    slackAppDetails: null as any | null,
    slackAppStatus: true,
    teamsAppDetails: null as any | null,
    teamsAppStatus: true,
    manifestDownloading: false,
    // WhatsApp state
    whatsappDetails: null as WhatsAppAccountData | null,
    whatsappStatus: true,
    businessWhatsAppNumber: '' as string,
    qrCode: '' as string,
    qrDownloading: false,
    // Interval ID for auto refresh polling (so it can be cleared)
    autoRefreshIntervalId: null as number | null,
    whatsappAutoRefreshIntervalId: null as number | null,

  }),

  getters: {
    // Overview getters
    getOverview: (state): IntegrationsOverview | null => state.overview,
    isLoading: (state): boolean => state.loading,
    getError: (state): string | null => state.error,
    
    // User counts
    getTotalUsers: (state): number => state.overview?.userCounts.total || 0,
    getWhatsappUsers: (state): number => state.overview?.userCounts.whatsapp || 0,
    getSlackUsers: (state): number => state.overview?.userCounts.slack || 0,
    getTeamsUsers: (state): number => state.overview?.userCounts.teams || 0,
    
    // Integration status
    getActiveIntegrationsCount: (state): number => {
      if (!state.overview) return 0
      const statuses = state.overview.integrationStatus
      return Object.values(statuses).filter(status => status === 'connected').length
    },
    
    getIntegrationStatus: (state) => (platform: 'whatsapp' | 'slack' | 'teams'): string => {
      return state.overview?.integrationStatus[platform] || 'disconnected'
    },
    
    // Token usage
    getTokenUsageToday: (state) => ({
      messages: state.overview?.tokenUsage.today.messages || 0,
      tokens: state.overview?.tokenUsage.today.tokens || 0,
      cost: state.overview?.tokenUsage.today.cost || 0,
    }),
    
    getTokenUsageAllTime: (state) => ({
      messages: state.overview?.tokenUsage.allTime.messages || 0,
      tokens: state.overview?.tokenUsage.allTime.tokens || 0,
      cost: state.overview?.tokenUsage.allTime.cost || 0,
    }),
    
    // Integration details
    getWhatsappDetails: (state) => state.overview?.integrationDetails.whatsapp || { phoneNumber: null, status: false },
    getSlackDetails: (state) => state.overview?.integrationDetails.slack || { teamName: null, status: 'inactive' },
    getTeamsDetails: (state) => state.overview?.integrationDetails.teams || { status: 'inactive', serviceUrl: null },
    
    // Recent activity
    getRecentActivity: (state): IntegrationActivity[] => state.recentActivity,
    
    // Formatted data for UI
    getIntegrationsForUI: (state) => {
      if (!state.overview) return []
      
      return [
        {
          name: 'Slack',
          users: state.overview.userCounts.slack,
          connected: state.overview.integrationStatus.slack === 'connected',
          icon: 'i-mdi:slack',
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20',
          path: '/admin/integrations/slack',
          details: state.overview.integrationDetails.slack
        },
        {
          name: 'Teams',
          users: state.overview.userCounts.teams,
          connected: state.overview.integrationStatus.teams === 'connected',
          icon: 'i-mdi:microsoft-teams',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20',
          path: '/admin/integrations/teams',
          details: state.overview.integrationDetails.teams
        },
        {
          name: 'WhatsApp',
          users: state.overview.userCounts.whatsapp,
          connected: state.overview.integrationStatus.whatsapp === 'connected',
          icon: 'i-mdi:whatsapp',
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          path: '/admin/integrations/whatsapp',
          details: state.overview.integrationDetails.whatsapp
        },
        {
          name: 'iMessage',
          users: 0,
          connected: false,
          icon: 'i-heroicons:chat-bubble-left-ellipsis',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          path: '/admin/integrations/i-message',
          details: null
        },
      ]
    },
    
    // Check if data needs refresh (older than 5 minutes)
    needsRefresh: (state): boolean => {
      if (!state.lastFetched) return true
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      return state.lastFetched < fiveMinutesAgo
    },
  },

  actions: {
    // Helper methods
    setLoading(status: boolean) {
      this.loading = status
    },

    setError(error: string | null) {
      this.error = error
    },

    getAuthHeaders() {
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
      }
    },

    async handleAuthError(err: any): Promise<boolean> {
      return await handleAuthErrorShared(err)
    },

    // Delegate to common error handler
    handleError(error: any, fallbackMessage: string, silent: boolean = false): string {
      return handleError(error, fallbackMessage, silent)
    },

    // Normalize route/query/org values to a single string or null
    normalizeOrgParam(value?: string | string[] | null): string | null {
      if (value == null) return null
      if (Array.isArray(value)) value = value[0] as string
      const s = String(value).trim()
      return s === '' ? null : s
    },

    // Main fetch method
    async fetchOverview(orgId?: string | null, forceRefresh: boolean = false, showLoading: boolean = true) {
      if (!forceRefresh && !this.needsRefresh && this.overview) {
        return { success: true, data: this.overview }
      }

      if (showLoading) this.setLoading(true)
      this.setError(null)

      try {
        const url = orgId ? `/api/integrations/overview?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/overview'
        const response = await $fetch<ApiResponse<IntegrationsOverview>>(url, {
          headers: this.getAuthHeaders(),
        })

        if (response.status === 'success') {
          this.overview = response.data
          this.lastFetched = new Date()

          // Fetch recent activity from DB (real events)
          await this.fetchRecentActivity(orgId || null)

          return { success: true, data: response.data, message: response.message }
        } else {
          throw new Error(response.message)
        }
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          const errorMessage = handleError(error, 'Failed to fetch integrations overview')
          this.setError(errorMessage)
          return { success: false, message: errorMessage }
        }
        return { success: false, message: 'Authentication required' }
      } finally {
        if (showLoading) this.setLoading(false)
      }
    },

    // Generate activity based on current state (fallback synthetic events)
    generateRecentActivity() {
      if (!this.overview) return

      const activities: IntegrationActivity[] = []
      const now = new Date()

      // Check each integration status and generate relevant activities
      if (this.overview.integrationStatus.slack === 'connected') {
        activities.push({
          id: 'slack-sync',
          type: 'success',
          message: `Slack integration active with ${this.overview.userCounts.slack} users`,
          time: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
          timestamp: new Date(now.getTime() - 2 * 60 * 1000)
        })
      }

      if (this.overview.integrationStatus.teams === 'connected') {
        activities.push({
          id: 'teams-sync',
          type: 'success',
          message: `Teams integration active with ${this.overview.userCounts.teams} users`,
          time: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          timestamp: new Date(now.getTime() - 5 * 60 * 1000)
        })
      }

      if (this.overview.integrationStatus.whatsapp === 'connected') {
        activities.push({
          id: 'whatsapp-sync',
          type: 'success',
          message: `WhatsApp integration active with ${this.overview.userCounts.whatsapp} users`,
          time: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          timestamp: new Date(now.getTime() - 10 * 60 * 1000)
        })
      } else {
        activities.push({
          id: 'whatsapp-setup',
          type: 'warning',
          message: 'WhatsApp integration setup required',
          time: now.toISOString(),
          timestamp: now
        })
      }

      // Add token usage activity if significant
      if (this.overview.tokenUsage.today.messages > 0) {
        activities.push({
          id: 'token-usage',
          type: 'info',
          message: `${this.overview.tokenUsage.today.messages.toLocaleString()} messages processed today`,
          time: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          timestamp: new Date(now.getTime() - 60 * 60 * 1000)
        })
      }

      // Sort by timestamp (newest first)
      this.recentActivity = activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    },

    // Fetch recent activity from DB (real events)
    async fetchRecentActivity(orgId?: string | null) {
      try {
        const url = orgId ? `/api/integrations/activity?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/activity'
        const response = await $fetch(url, { headers: this.getAuthHeaders() })
        if (response && (response as any).status === 'success') {
          const respData = (response as any).data || {}
          const apiActivities: any[] = respData.activities || []
          const summaries: any[] = respData.user_additions_summary || []

          // Map summaries into activity-like objects so they can be shown in the same list
          const summaryActivities = summaries.map((s: any) => ({
            id: `user-addition-summary-${s.provider}`,
            type: 'info',
            message: s.message || `${s.count} users added via ${s.providerLabel}`,
            time: s.latest_time || new Date().toISOString(),
            timestamp: s.latest_time ? new Date(s.latest_time) : new Date(),
          }))

          // Merge summaries with API activities, prefer most recent first and limit to 5
          const merged = [...summaryActivities, ...apiActivities].map((a: any) => ({
            ...a,
            // normalize timestamp field
            timestamp: a.timestamp ? new Date(a.timestamp) : a.time ? new Date(a.time) : new Date(),
          }))

          merged.sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime())

          this.recentActivity = merged.slice(0, 5)
        } else {
          // fallback to synthetic
          this.generateRecentActivity()
        }
      } catch (err) {
        // On error fallback to generated activity
        this.generateRecentActivity()
      }
    },


    // Refresh data
    async refreshOverview(orgId?: string | null) {
      // Manual refresh should show loading; pass orgId when provided
      return await this.fetchOverview(orgId ?? undefined, true, true)
    },

    // Clear data
    clearOverview() {
      // Stop background polling when clearing overview
      this.stopAutoRefresh()

      this.overview = null
      this.recentActivity = []
      this.error = null
      this.lastFetched = null
    },

    // Format methods for display
    formatTokenUsage(tokens: number): string {
      if (tokens >= 1000000) {
        return `${(tokens / 1000000).toFixed(1)}M`
      } else if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}K`
      }
      return tokens.toString()
    },

    formatCost(cost: number): string {
      if (cost >= 1000) {
        return `$${(cost / 1000).toFixed(1)}K`
      } else if (cost >= 1) {
        return `$${cost.toFixed(2)}`
      } else {
        return `$${cost.toFixed(4)}`
      }
    },

    // Auto-refresh functionality
    startAutoRefresh(intervalMs: number = 300000) { // 5 minutes default
      if (!process.client) return

      // Clear any existing interval before starting a new one
      if (this.autoRefreshIntervalId) {
        try {
          clearInterval(this.autoRefreshIntervalId)
        } catch (e) {
          // ignore
        }
        this.autoRefreshIntervalId = null
      }

      const id = window.setInterval(() => {
        if (!this.loading) {
          this.fetchOverview()
        }
      }, intervalMs)

      this.autoRefreshIntervalId = id as unknown as number
      return id
    },

    stopAutoRefresh() {
      if (!process.client) return
      if (this.autoRefreshIntervalId) {
        try {
          clearInterval(this.autoRefreshIntervalId)
        } catch (e) {
          // ignore
        }
        this.autoRefreshIntervalId = null
      }
    },

    // WhatsApp polling controls
    startWhatsAppPolling(intervalMs: number = 10000) {
      if (!process.client) return

      // Clear existing interval if present
      if (this.whatsappAutoRefreshIntervalId) {
        try {
          clearInterval(this.whatsappAutoRefreshIntervalId)
        } catch (e) {}
        this.whatsappAutoRefreshIntervalId = null
      }

      const id = window.setInterval(() => {
        if (!this.loading) {
          // Silent fetch to update whatsappDetails
          this.fetchWhatsAppDetails().catch(() => {})
        }
      }, intervalMs)

      this.whatsappAutoRefreshIntervalId = id as unknown as number
      return id
    },

    stopWhatsAppPolling() {
      if (!process.client) return
      if (this.whatsappAutoRefreshIntervalId) {
        try {
          clearInterval(this.whatsappAutoRefreshIntervalId)
        } catch (e) {
          // ignore
        }
        this.whatsappAutoRefreshIntervalId = null
      }
    },


    // Slack integration methods
    async fetchSlackAppDetails(orgId?: string | null) {
      try {
        this.loading = true;
        this.slackAppStatus = true;

        // If no orgId provided and running in client, try to read from route query for superadmin selection
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {
            // ignore
          }
        }

        const url = orgId ? `/api/integrations/slack/details?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/slack/details'
        const response = await $fetch<{ statusCode: number; message: string; data: any }>(url, {
          headers: this.getAuthHeaders(),
        });

        this.slackAppDetails = response.data;
        this.slackAppStatus = response.data?.status === 'active' ? false : true;
        return response.data;
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to fetch Slack app details');
        }
        // Reset details on error
        this.slackAppDetails = null;
        this.slackAppStatus = true;
      } finally {
        this.loading = false;
      }
    },

    async slackOauthRedirect(code: string, state: string) {
      try {
        this.loading = true;

        if (!state) throw new Error('Missing state token');

        const response = await $fetch<{ statusCode: number; message: string; data: any }>(
          '/api/integrations/slack/connect',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${state}` },
            body: { code, state },
          }
        );

        await this.fetchSlackAppDetails();

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Slack connected successfully!');
        }

        return response.data;
      } catch (error: any) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          // Use shared handler to extract message and show notification
          const msg = handleError(error, 'Failed to connect Slack')
          this.error = msg
        }
      } finally {
        this.loading = false;
      }
    },

    async disconnectSlackApp(orgId?: string | null) {
      try {
        this.loading = true;

        // Determine org param if not provided
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {}
        }

        const url = orgId ? `/api/integrations/slack/disconnect?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/slack/disconnect'
        await $fetch(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        await this.fetchSlackAppDetails(orgId ?? null);

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Slack disconnected successfully!');
        }
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to disconnect Slack');

          // Show error notification
          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
      } finally {
        this.loading = false;
      }
    },

    // Teams integration methods
    async fetchTeamsAppDetails(orgId?: string | null) {
      try {
        this.loading = true;
        this.teamsAppStatus = true;

        // If no orgId provided and running in client, try to read from route query for superadmin selection
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) {
              orgId = String(q)
            }
          } catch (e) {
            // ignore
          }
        }

        const url = orgId ? `/api/integrations/teams/details?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/teams/details'
        const response = await $fetch<{ statusCode: number; message: string; data: any }>(url, {
          headers: this.getAuthHeaders(),
        });

        this.teamsAppDetails = response.data;
        this.teamsAppStatus = response.data?.status === 'active' ? false : true;
        return response.data;
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to fetch Teams app details');
        }
        // Reset details on error
        this.teamsAppDetails = null;
        this.teamsAppStatus = true;
      } finally {
        this.loading = false;
      }
    },

    async disconnectTeamsApp(orgId?: string | null) {
      try {
        this.loading = true;

        // Determine org param if not provided
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {}
        }

        const url = orgId ? `/api/integrations/teams/disconnect?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/teams/disconnect'
        await $fetch(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        await this.fetchTeamsAppDetails(orgId ?? null);

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Teams disconnected successfully!');
        }
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to disconnect Teams');

          // Show error notification
          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
      } finally {
        this.loading = false;
      }
    },

    async downloadManifest() {
      try {
        this.manifestDownloading = true;

        const response = await $fetch<any>('/api/integrations/teams/download-manifest', {
          method: 'GET',
          headers: this.getAuthHeaders(),
        });

        if (!response?.fileUrl) throw new Error('No file URL received');

        // Trigger browser download
        const link = document.createElement('a');
        link.href = response.fileUrl;
        link.download = response.fileName || 'provento-teams-app.zip';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Teams app package download started successfully.');
        }
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to download Teams app package');

          // Show error notification
          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
      } finally {
        this.manifestDownloading = false;
      }
    },

    // WhatsApp integration methods
    async createWhatsAppAccount(input: BusinessWhatsAppDetails, orgId?: string | null) {
      try {
        this.loading = true;
        this.error = null;

        const url = orgId ? `/api/integrations/whatsapp/connect?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/connect'
        const data = await $fetch<WhatsAppNumber>(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: input,
        });

        this.businessWhatsAppNumber = data?.data?.business_whatsapp_number ?? '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'Business WhatsApp Account added successfully');
        }

        // Resolve effective org for follow-up fetches
        const routeOrg = process.client ? (useRoute()?.query?.org || useRoute()?.query?.org_id) : null
        const effectiveOrg = this.normalizeOrgParam(orgId ?? routeOrg)

        // Refresh details after successful creation
        await this.fetchWhatsAppDetails(effectiveOrg)

        // Fetch QR code for this org
        try {
          await this.fetchQrCode(effectiveOrg)
        } catch (e) {}

        // Also refresh overview so other pages (e.g. Users) react to new integration status
        try {
          await this.fetchOverview(effectiveOrg, true, false)
        } catch (e) {
          // ignore overview refresh errors
        }

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Error adding Business WhatsApp Number');

          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateWhatsAppAccount(input: BusinessWhatsAppDetails, orgId?: string | null) {
      try {
        this.loading = true;
        this.error = null;

        const url = orgId ? `/api/integrations/whatsapp/update?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/update'
        const data = await $fetch<WhatsAppNumber>(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: input,
        });

        this.businessWhatsAppNumber = data?.data?.business_whatsapp_number ?? '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'Business WhatsApp Account updated successfully');
        }

        // Resolve effective org for follow-up fetches
        const routeOrg = process.client ? (useRoute()?.query?.org || useRoute()?.query?.org_id) : null
        const effectiveOrg = this.normalizeOrgParam(orgId ?? routeOrg)

        // Refresh details after successful update
        await this.fetchWhatsAppDetails(effectiveOrg)

        // Fetch QR code for this org
        try {
          await this.fetchQrCode(effectiveOrg)
        } catch (e) {}

        // Refresh overview so other pages reflect updated status
        try {
          await this.fetchOverview(effectiveOrg, true, false)
        } catch (e) {}

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Error updating Business WhatsApp Number');

          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchWhatsAppDetails(orgId?: string | null) {
      try {
        this.loading = true;
        this.error = null;
        this.whatsappStatus = true;

        // If no orgId provided and running in client, try to read from route query for superadmin selection
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {}
        }

        const url = orgId ? `/api/integrations/whatsapp/details?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/details'

        const data = await $fetch<ApiResponse<WhatsAppAccountData>>(url, {
          headers: this.getAuthHeaders(),
        });

        if (data?.status === 'success' && data.data) {
          this.whatsappDetails = data.data;
          this.businessWhatsAppNumber = data.data.business_whatsapp_number || '';
          this.whatsappStatus = !data.data.whatsapp_status;

          // Ensure overview.integrationStatus reflects this change so UI reacts immediately
          try {
            const isConnected = !!data.data.whatsapp_status
            if (this.overview && this.overview.integrationStatus) {
              this.overview = {
                ...this.overview,
                integrationStatus: {
                  ...this.overview.integrationStatus,
                  whatsapp: isConnected ? 'connected' : 'disconnected',
                },
              }
            }
          } catch (e) {
            // ignore
          }
        } else {
          // Partial or no data
          this.whatsappDetails = null;
          this.businessWhatsAppNumber = '';
          this.whatsappStatus = true;

          // Ensure overview.integrationStatus marks whatsapp as disconnected so UI updates
          try {
            if (this.overview && this.overview.integrationStatus) {
              this.overview = {
                ...this.overview,
                integrationStatus: {
                  ...this.overview.integrationStatus,
                  whatsapp: 'disconnected',
                },
              }
            }
          } catch (e) {
            // ignore
          }
        }

        return data?.data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Error fetching Business WhatsApp Details');
        }
        // Reset details on error
        this.whatsappDetails = null;
        this.businessWhatsAppNumber = '';
        this.whatsappStatus = true;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async disconnectWhatsApp(orgId?: string | null) {
      try {
        this.loading = true;
        this.error = null;

        const url = orgId ? `/api/integrations/whatsapp/disconnect?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/disconnect'
        const data = await $fetch<ApiResponse<any>>(url, {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        // Clear WhatsApp details
        this.whatsappDetails = null;
        this.businessWhatsAppNumber = '';
        this.whatsappStatus = true;
        this.qrCode = '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'WhatsApp integration disconnected successfully');
        }

        // Stop polling since integration is disconnected
        try {
          this.stopWhatsAppPolling()
        } catch (e) {}

        const routeOrg = process.client ? (useRoute()?.query?.org || useRoute()?.query?.org_id) : null
        const effectiveOrg = this.normalizeOrgParam(orgId ?? routeOrg)

        // Refresh WhatsApp details and QR for the org
        try {
          await this.fetchWhatsAppDetails(effectiveOrg)
        } catch (e) {}
        try {
          await this.fetchQrCode(effectiveOrg)
        } catch (e) {}

        // Refresh overview so other pages reflect disconnected status
        try {
          await this.fetchOverview(effectiveOrg, true, false)
        } catch (e) {}

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Error disconnecting WhatsApp integration');

          if (process.client) {
            const { showError } = useNotification();
            showError(this.error);
          }
        }
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchQrCode(orgId?: string | null) {
      try {
        this.loading = true;
        this.error = null;

        // If orgId not provided, attempt to read from route for superadmin selection
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {}
        }

        const url = orgId ? `/api/integrations/whatsapp/qr-code?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/qr-code'
        const data = await $fetch<{ statusCode: number; status: string; data: string | null; message: string }>(
          url,
          {
            headers: this.getAuthHeaders(),
          }
        );

        if (data?.status === 'success' && data.data) {
          this.qrCode = data.data;
        } else {
          // No QR code available or partial response
          this.qrCode = '';
        }

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = handleError(error, 'Failed to fetch QR Code');
        }
        this.qrCode = '';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async downloadQrCode(orgId?: string | null) {
      // Handles downloading the QR code (signed URL or proxy) and triggers browser download
      try {
        this.qrDownloading = true;

        if (!this.qrCode) {
          throw new Error('No QR code available to download.');
        }

        const signedUrl = this.qrCode;

        try {
          // Try fetching the signed URL directly
          const blob = await $fetch(signedUrl, { responseType: 'blob' as const });

          const biz = this.whatsappDetails?.business_whatsapp_number || 'whatsapp';
          const safeBiz = biz.replace(/[^a-z0-9_-]/gi, '_');
          const filename = `${safeBiz}_wp_qr_code.png`;

          const url = window.URL.createObjectURL(blob as Blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          if (process.client) {
            const { showSuccess } = useNotification();
            showSuccess('QR code downloaded successfully.');
          }

          return;
        } catch (err) {
          // Signed URL fetch failed (likely CORS) — fall back to server proxy
          // Continue to proxy flow below
        }

        // Determine org param if not provided
        if (!orgId && process.client) {
          try {
            const route = useRoute()
            const q = route?.query?.org || route?.query?.org_id
            if (q && String(q).trim()) orgId = String(q)
          } catch (e) {}
        }

        // Proxy fallback
        try {
          const url = orgId ? `/api/integrations/whatsapp/qr-code-download?org=${encodeURIComponent(String(orgId))}` : '/api/integrations/whatsapp/qr-code-download'
          const proxyResp = await $fetch<{ data?: { base64: string; contentType: string } }>(url, {
            headers: this.getAuthHeaders(),
          });

          if (!proxyResp || !proxyResp.data) throw new Error('Invalid proxy response');

          const { base64, contentType } = proxyResp.data;
          const byteCharacters = atob(base64);
          const byteArrays: Uint8Array[] = [];

          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
          }

          const blob = new Blob(byteArrays as unknown as BlobPart[], { type: contentType });
          const biz = this.whatsappDetails?.business_whatsapp_number || 'whatsapp';
          const safeBiz = biz.replace(/[^a-z0-9_-]/gi, '_');
          const filename = `${safeBiz}_wp_qr_code.png`;

          const urlObj = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = urlObj;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(urlObj);

          if (process.client) {
            const { showSuccess } = useNotification();
            showSuccess('QR code downloaded successfully (via proxy).');
          }
        } catch (proxyErr: any) {
          if (!await this.handleAuthError(proxyErr)) {
            this.error = handleError(proxyErr, 'Error downloading QR code');

            if (process.client) {
              const { showError } = useNotification();
              showError(this.error);
            }
          }
          throw proxyErr;
        }
      } finally {
        this.qrDownloading = false;
      }
    },
  },
})
