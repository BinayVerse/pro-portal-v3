import { defineStore } from 'pinia'
import type { IntegrationsOverview, IntegrationActivity, ApiResponse, BusinessWhatsAppDetails, WhatsAppNumber, WhatsAppAccountData } from './types'
import { useNotification } from '~/composables/useNotification'

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
      // Check multiple possible 401 error patterns
      const is401 = err?.statusCode === 401 ||
                   err?.response?.status === 401 ||
                   err?.status === 401 ||
                   err?.data?.statusCode === 401 ||
                   (err?.message && err.message.includes('401')) ||
                   (err?.message && err.message.toLowerCase().includes('unauthorized'))

      if (is401) {
        console.log('401 Unauthorized detected, redirecting to login...')
        if (process.client) {
          localStorage.removeItem('authUser')
          localStorage.removeItem('authToken')
          // Clear any other auth-related storage
          localStorage.removeItem('user')
          setTimeout(() => {
            navigateTo('/login')
          }, 500)
        }
        const authCookie = useCookie('authToken')
        authCookie.value = null
        return true
      }
      return false
    },

    handleError(error: any, fallbackMessage: string): string {
      if (error?.data?.message) {
        return error.data.message
      }

      if (error?.message) {
        return error.message
      }

      return fallbackMessage
    },

    // Main fetch method
    async fetchOverview(forceRefresh: boolean = false) {
      if (!forceRefresh && !this.needsRefresh && this.overview) {
        return { success: true, data: this.overview }
      }

      this.setLoading(true)
      this.setError(null)

      try {
        const response = await $fetch<ApiResponse<IntegrationsOverview>>('/api/integrations/overview', {
          headers: this.getAuthHeaders(),
        })

        if (response.status === 'success') {
          this.overview = response.data
          this.lastFetched = new Date()
          
          // Generate recent activity based on integration status
          this.generateRecentActivity()
          
          return { success: true, data: response.data, message: response.message }
        } else {
          throw new Error(response.message)
        }
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          const errorMessage = this.handleError(error, 'Failed to fetch integrations overview')
          this.setError(errorMessage)
          return { success: false, message: errorMessage }
        }
        return { success: false, message: 'Authentication required' }
      } finally {
        this.setLoading(false)
      }
    },

    // Generate activity based on current state
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
          time: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000)
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

    // Refresh data
    async refreshOverview() {
      return await this.fetchOverview(true)
    },

    // Clear data
    clearOverview() {
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
      if (process.client) {
        setInterval(() => {
          if (!this.loading) {
            this.fetchOverview()
          }
        }, intervalMs)
      }
    },

    // Slack integration methods
    async fetchSlackAppDetails() {
      try {
        this.loading = true;
        this.slackAppStatus = true;

        const response = await $fetch<{ statusCode: number; message: string; data: any }>('/api/integrations/slack/details', {
          headers: this.getAuthHeaders(),
        });

        this.slackAppDetails = response.data;
        this.slackAppStatus = response.data?.status === 'active' ? false : true;
        return response.data;
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Failed to fetch Slack app details');
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
          // Try to extract detailed message from various possible shapes of the thrown error
          let detailedMessage: string | undefined = undefined

          if (error?.data && typeof error.data.message === 'string') {
            detailedMessage = error.data.message
          } else if (error?.response?.data && typeof error.response.data.message === 'string') {
            detailedMessage = error.response.data.message
          } else if (typeof error?.message === 'string') {
            detailedMessage = error.message
          }

          // Fallback for common 403 conflict case if backend didn't provide message
          const isForbidden = error?.statusCode === 403 || error?.response?.status === 403 || error?.status === 403
          if (!detailedMessage && isForbidden) {
            detailedMessage = 'This Slack workspace is already connected to another organization.'
          }

          this.error = detailedMessage || 'Failed to connect Slack'

          // Show error notification
          if (process.client) {
            const { showError } = useNotification();
            // Use pre-line class for multi-line errors
            showError(this.error, { className: 'toast-pre-line' } as any)
          }
        }
      } finally {
        this.loading = false;
      }
    },

    async disconnectSlackApp() {
      try {
        this.loading = true;

        await $fetch('/api/integrations/slack/disconnect', {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        await this.fetchSlackAppDetails();

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Slack disconnected successfully!');
        }
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Failed to disconnect Slack');

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
    async fetchTeamsAppDetails() {
      try {
        this.loading = true;
        this.teamsAppStatus = true;

        const response = await $fetch<{ statusCode: number; message: string; data: any }>('/api/integrations/teams/details', {
          headers: this.getAuthHeaders(),
        });

        this.teamsAppDetails = response.data;
        this.teamsAppStatus = response.data?.status === 'active' ? false : true;
        return response.data;
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Failed to fetch Teams app details');
        }
        // Reset details on error
        this.teamsAppDetails = null;
        this.teamsAppStatus = true;
      } finally {
        this.loading = false;
      }
    },

    async disconnectTeamsApp() {
      try {
        this.loading = true;

        await $fetch('/api/integrations/teams/disconnect', {
          method: 'POST',
          headers: this.getAuthHeaders(),
        });

        await this.fetchTeamsAppDetails();

        // Show success notification
        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess('Teams disconnected successfully!');
        }
      } catch (error) {
        // Handle authentication errors first
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Failed to disconnect Teams');

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
          this.error = this.handleError(error, 'Failed to download Teams app package');

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
    async createWhatsAppAccount(input: BusinessWhatsAppDetails) {
      try {
        this.loading = true;
        this.error = null;

        const data = await $fetch<WhatsAppNumber>(
          '/api/integrations/whatsapp/connect',
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: input,
          }
        );

        this.businessWhatsAppNumber = data?.data?.business_whatsapp_number ?? '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'Business WhatsApp Account added successfully');
        }

        // Refresh details after successful creation
        await this.fetchWhatsAppDetails();

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Error adding Business WhatsApp Number');

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

    async updateWhatsAppAccount(input: BusinessWhatsAppDetails) {
      try {
        this.loading = true;
        this.error = null;

        const data = await $fetch<WhatsAppNumber>(
          '/api/integrations/whatsapp/update',
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: input,
          }
        );

        this.businessWhatsAppNumber = data?.data?.business_whatsapp_number ?? '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'Business WhatsApp Account updated successfully');
        }

        // Refresh details after successful update
        await this.fetchWhatsAppDetails();

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Error updating Business WhatsApp Number');

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

    async fetchWhatsAppDetails() {
      try {
        this.loading = true;
        this.error = null;
        this.whatsappStatus = true;

        const data = await $fetch<ApiResponse<WhatsAppAccountData>>(
          '/api/integrations/whatsapp/details',
          {
            headers: this.getAuthHeaders(),
          }
        );

        if (data?.status === 'success' && data.data) {
          this.whatsappDetails = data.data;
          this.businessWhatsAppNumber = data.data.business_whatsapp_number || '';
          this.whatsappStatus = !data.data.whatsapp_status;
        } else {
          // Partial or no data
          this.whatsappDetails = null;
          this.businessWhatsAppNumber = '';
          this.whatsappStatus = true;
        }

        return data?.data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Error fetching Business WhatsApp Details');
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

    async disconnectWhatsApp() {
      try {
        this.loading = true;
        this.error = null;

        const data = await $fetch<ApiResponse<any>>(
          '/api/integrations/whatsapp/disconnect',
          {
            method: 'POST',
            headers: this.getAuthHeaders(),
          }
        );

        // Clear WhatsApp details
        this.whatsappDetails = null;
        this.businessWhatsAppNumber = '';
        this.whatsappStatus = true;
        this.qrCode = '';

        if (process.client) {
          const { showSuccess } = useNotification();
          showSuccess(data?.message || 'WhatsApp integration disconnected successfully');
        }

        return data;
      } catch (error: any) {
        if (!await this.handleAuthError(error)) {
          this.error = this.handleError(error, 'Error disconnecting WhatsApp integration');

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

    async fetchQrCode() {
      try {
        this.loading = true;
        this.error = null;

        const data = await $fetch<{ statusCode: number; status: string; data: string | null; message: string }>(
          '/api/integrations/whatsapp/qr-code',
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
          this.error = this.handleError(error, 'Failed to fetch QR Code');
        }
        this.qrCode = '';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async downloadQrCode() {
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

        // Proxy fallback
        try {
          const proxyResp = await $fetch('/api/integrations/whatsapp/qr-code-download', {
            headers: this.getAuthHeaders(),
          });

          if (!proxyResp || !proxyResp.data) throw new Error('Invalid proxy response');

          const { base64, contentType } = proxyResp.data as { base64: string; contentType: string };
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

          const blob = new Blob(byteArrays, { type: contentType });
          const biz = this.whatsappDetails?.business_whatsapp_number || 'whatsapp';
          const safeBiz = biz.replace(/[^a-z0-9_-]/gi, '_');
          const filename = `${safeBiz}_wp_qr_code.png`;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);

          if (process.client) {
            const { showSuccess } = useNotification();
            showSuccess('QR code downloaded successfully (via proxy).');
          }
        } catch (proxyErr: any) {
          if (!await this.handleAuthError(proxyErr)) {
            this.error = this.handleError(proxyErr, 'Error downloading QR code');

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
