import { defineStore } from 'pinia'
import type {
  IntegrationProvider,
  IntegrationModule,
  IntegrationAgent,
  OrganizationIntegration,
  CreateIntegrationPayload,
  UpdateIntegrationPayload,
  IntegrationRelationships,
  ApiResponse,
  GroupedIntegration,
  BatchCreateIntegrationsPayload,
  BatchSyncIntegrationsPayload,
  ProviderRequestPayload,
} from './types'
import { useNotification } from '~/composables/useNotification'
import { encryptSensitiveFields, decryptSensitiveFields } from '~/composables/useEncryption'
import { handleAuthError } from '~/composables/useAuthError'
import { useErrorStore } from '~/stores/error'

export const useOrganizationIntegrationsStore = defineStore('organizationIntegrations', {
  state: () => ({
    // Master data
    providers: [] as IntegrationProvider[],
    modules: [] as IntegrationModule[],
    agents: [] as IntegrationAgent[],

    // Relationships
    relationships: {
      agentModules: [],
      agentProviders: [],
      providerModules: [],
    } as IntegrationRelationships,

    // Organization integrations
    integrations: [] as OrganizationIntegration[],
    selectedIntegration: null as OrganizationIntegration | null,

    // UI state
    loading: true,
    loadingProviderRequest: false,
    loadingProviders: true,
    loadingModules: true,
    loadingAgents: true,
    loadingIntegrations: true,
    loadingRelationships: true,
    error: null as string | null,
    successMessage: null as string | null,
  }),

  getters: {
    getProviders: (state) => state.providers,
    getModules: (state) => state.modules,
    getAgents: (state) => state.agents,
    getIntegrations: (state) => state.integrations,
    getSelectedIntegration: (state) => state.selectedIntegration,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getSuccessMessage: (state) => state.successMessage,

    // Filter integrations by status
    getIntegrationsByStatus: (state) => (status: string) =>
      state.integrations.filter((i) => i.status === status),

    // Get integration by id
    getIntegrationById: (state) => (id: string) =>
      state.integrations.find((i) => i.id === id),

    // Get provider by id
    getProviderById: (state) => (id: string) =>
      state.providers.find((p) => p.id === id),

    // Get module by id
    getModuleById: (state) => (id: string) =>
      state.modules.find((m) => m.id === id),

    // Get agent by id
    getAgentById: (state) => (id: string) =>
      state.agents.find((a) => a.id === id),

    // Get modules available for an agent
    getModulesForAgent: (state) => (agentId: string) => {
      const moduleIds = state.relationships.agentModules
        .filter((rel) => rel.agent_id === agentId)
        .map((rel) => rel.module_id)
      return state.modules.filter((m) => moduleIds.includes(m.id))
    },

    // Get providers available for an agent
    getProvidersForAgent: (state) => (agentId: string) => {
      const providerIds = state.relationships.agentProviders
        .filter((rel) => rel.agent_id === agentId)
        .map((rel) => rel.provider_id)
      return state.providers.filter((p) => providerIds.includes(p.id))
    },

    // Get providers available for an agent and module combination
    getProvidersForAgentAndModule: (state) => (agentId: string, moduleId: string) => {
      const providersForAgent = state.relationships.agentProviders
        .filter((rel) => rel.agent_id === agentId)
        .map((rel) => rel.provider_id)

      const providersForModule = state.relationships.providerModules
        .filter((rel) => rel.module_id === moduleId)
        .map((rel) => rel.provider_id)

      // Get intersection - providers available for both agent and module
      const intersection = providersForAgent.filter((p) => providersForModule.includes(p))
      return state.providers.filter((p) => intersection.includes(p.id))
    },

    // Get modules available for an agent and provider combination
    getModulesForAgentAndProvider: (state) => (agentId: string, providerId: string) => {
      const modulesForAgent = state.relationships.agentModules
        .filter((rel) => rel.agent_id === agentId)
        .map((rel) => rel.module_id)

      const modulesForProvider = state.relationships.providerModules
        .filter((rel) => rel.provider_id === providerId)
        .map((rel) => rel.module_id)

      // Get intersection - modules available for both agent and provider
      const intersection = modulesForAgent.filter((m) => modulesForProvider.includes(m))
      return state.modules.filter((m) => intersection.includes(m.id))
    },

    // Get grouped integrations (by provider/agent, with multiple modules)
    getGroupedIntegrations: (state): GroupedIntegration[] => {
      const grouped = new Map<string, GroupedIntegration>()

      state.integrations.forEach((integration) => {
        const key = `${integration.provider_id}|${integration.agent_id}`

        if (!grouped.has(key)) {
          grouped.set(key, {
            provider_id: integration.provider_id,
            agent_id: integration.agent_id,
            provider_name: integration.provider_name || '',
            provider_code: integration.provider_code || '',
            agent_name: integration.agent_name || '',
            agent_code: integration.agent_code || '',
            modules: [],
            connections: [],
          })
        }

        const group = grouped.get(key)!
        group.connections.push(integration)

        // Add module info if not already present
        if (
          !group.modules!.some((m) => m.id === integration.module_id)
        ) {
          group.modules!.push({
            id: integration.module_id,
            name: integration.module_name || '',
            code: integration.module_code || '',
          })
        }
      })

      return Array.from(grouped.values()).sort((a, b) => {
        // Sort by provider name, then agent name
        const providerSort = a.provider_name.localeCompare(b.provider_name)
        if (providerSort !== 0) return providerSort
        return a.agent_name.localeCompare(b.agent_name)
      })
    },
  },

  actions: {
    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
      if (error) {
        const errorStore = useErrorStore()
        errorStore.showError(error)
      }
    },

    setSuccessMessage(message: string | null) {
      this.successMessage = message
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

    // Fetch all providers
    async fetchProviders() {
      this.loadingProviders = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<IntegrationProvider[]>>(
          '/api/integration-providers',
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success' && response.data) {
          this.providers = response.data
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to fetch providers')
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to fetch providers'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingProviders = false
      }
    },

    // Fetch all modules
    async fetchModules() {
      this.loadingModules = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<IntegrationModule[]>>(
          '/api/integration-modules',
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success' && response.data) {
          this.modules = response.data
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to fetch modules')
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to fetch modules'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingModules = false
      }
    },

    // Fetch all agents
    async fetchAgents() {
      this.loadingAgents = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<IntegrationAgent[]>>(
          '/api/integration-agents',
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success' && response.data) {
          // Sort agents with HRMS first, then alphabetically
          const sortedAgents = response.data.sort((a, b) => {
            if (a.name === 'HRMS') return -1
            if (b.name === 'HRMS') return 1
            return a.name.localeCompare(b.name)
          })
          this.agents = sortedAgents
          return { success: true, data: sortedAgents }
        } else {
          throw new Error(response.message || 'Failed to fetch agents')
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to fetch agents'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingAgents = false
      }
    },

    // Fetch integration relationships (agent-module, agent-provider, provider-module)
    async fetchRelationships() {
      this.loadingRelationships = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<IntegrationRelationships>>(
          '/api/integration-relationships',
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success' && response.data) {
          this.relationships = response.data
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to fetch relationships')
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to fetch relationships'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingRelationships = false
      }
    },

    // Fetch all master data at once (including relationships)
    async fetchMasterData() {
      return Promise.all([
        this.fetchProviders(),
        this.fetchModules(),
        this.fetchAgents(),
        this.fetchRelationships(),
      ])
    },

    // Fetch organization integrations
    async fetchIntegrations(filters?: {
      status?: string
      provider_id?: string
      agent_id?: string
      module_id?: string
    }) {
      this.loadingIntegrations = true
      this.error = null
      try {
        const params = new URLSearchParams()
        if (filters?.status) params.append('status', filters.status)
        if (filters?.provider_id) params.append('provider_id', filters.provider_id)
        if (filters?.agent_id) params.append('agent_id', filters.agent_id)
        if (filters?.module_id) params.append('module_id', filters.module_id)

        const url = `/api/organization-integrations${params.toString() ? `?${params.toString()}` : ''}`

        const response = await $fetch<ApiResponse<OrganizationIntegration[]>>(url, {
          headers: this.getAuthHeaders(),
        })

        if (response.status === 'success' && response.data) {
          // Note: Data is returned encrypted from API, kept encrypted in store
          // Will be decrypted only when displayed to user (client-side)
          this.integrations = response.data
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to fetch integrations')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to fetch integrations'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingIntegrations = false
      }
    },

    // Fetch single integration by id
    async fetchIntegrationById(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<OrganizationIntegration>>(
          `/api/organization-integrations/${id}`,
          {
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success' && response.data) {
          this.selectedIntegration = response.data
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to fetch integration')
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to fetch integration'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // Create integration
    async createIntegration(payload: CreateIntegrationPayload) {
      this.loading = true
      this.error = null
      try {
        // Encrypt sensitive fields before sending to server
        const encryptedPayload = await encryptSensitiveFields(payload, [
          'client_secret',
          'api_key',
          'access_token',
          'refresh_token',
        ])

        const response = await $fetch<ApiResponse<{ id: string }>>('/api/organization-integrations', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: encryptedPayload,
        })

        if (response.status === 'success') {
          this.setSuccessMessage(response.message || 'Integration created successfully')
          // Refresh the list
          await this.fetchIntegrations()
          return { success: true, data: response.data }
        } else {
          throw new Error(response.message || 'Failed to create integration')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to create integration'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // Create multiple integrations in one API call (batch)
    async createIntegrationsBatch(payload: BatchCreateIntegrationsPayload) {
      this.loading = true
      this.error = null
      try {
        // Encrypt sensitive fields before sending to server
        const encryptedPayload = await encryptSensitiveFields(payload, [
          'client_secret',
          'api_key',
          'access_token',
          'refresh_token',
        ])

        const response = await $fetch<ApiResponse<{ ids: string[] }>>('/api/organization-integrations/batch', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: encryptedPayload,
        })

        if (response.status === 'success' || response.status === 'partial_success') {
          this.setSuccessMessage(response.message || 'Integrations created successfully')
          // Refresh the list
          await this.fetchIntegrations()
          return { success: response.status === 'success', data: response.data, partial: response.status === 'partial_success', errors: response.errors }
        } else {
          throw new Error(response.message || 'Failed to create integrations')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to create integrations'
        this.setError(message)
        return { success: false, message, errors: error?.data?.errors }
      } finally {
        this.loading = false
      }
    },

    // Sync integration modules (add/update/delete all in one call)
    async syncIntegrationModules(payload: BatchSyncIntegrationsPayload) {
      this.loading = true
      this.error = null
      try {
        // Encrypt sensitive fields before sending to server
        const encryptedPayload = await encryptSensitiveFields(payload, [
          'client_secret',
          'api_key',
          'access_token',
          'refresh_token',
        ])

        const response = await $fetch<ApiResponse<{ created: string[]; updated: string[]; deleted: string[] }>>('/api/organization-integrations/batch-sync', {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: encryptedPayload,
        })

        if (response.status === 'success' || response.status === 'partial_success') {
          this.setSuccessMessage(response.message || 'Integrations synced successfully')
          // Refresh the list
          await this.fetchIntegrations()
          return { success: response.status === 'success', data: response.data, partial: response.status === 'partial_success', errors: response.errors }
        } else {
          throw new Error(response.message || 'Failed to sync integrations')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to sync integrations'
        this.setError(message)
        return { success: false, message, errors: error?.data?.errors }
      } finally {
        this.loading = false
      }
    },

    // Update integration
    async updateIntegration(id: string, payload: UpdateIntegrationPayload) {
      this.loading = true
      this.error = null
      try {
        // Encrypt sensitive fields before sending to server
        const encryptedPayload = await encryptSensitiveFields(payload, [
          'client_secret',
          'api_key',
          'access_token',
          'refresh_token',
        ])

        const response = await $fetch<ApiResponse<void>>(
          `/api/organization-integrations/${id}`,
          {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: encryptedPayload,
          }
        )

        if (response.status === 'success') {
          this.setSuccessMessage(response.message || 'Integration updated successfully')
          // Refresh the list
          await this.fetchIntegrations()
          return { success: true }
        } else {
          throw new Error(response.message || 'Failed to update integration')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to update integration'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // Update integration status only
    async updateIntegrationStatus(id: string, status: 'active' | 'inactive' | 'expired' | 'failed') {
      return this.updateIntegration(id, { status })
    },

    // Batch update status for multiple integrations
    async batchUpdateIntegrationStatus(integration_ids: string[], status: 'active' | 'inactive' | 'expired' | 'failed') {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<{ updated: string[]; errors: any[] }>>('/api/organization-integrations/batch-status', {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: { integration_ids, status },
        })

        if (response.status === 'success' || response.status === 'partial_success') {
          this.setSuccessMessage(response.message || 'Integrations status updated successfully')
          // Refresh the list
          await this.fetchIntegrations()
          return { success: response.status === 'success', data: response.data, partial: response.status === 'partial_success', errors: response.errors }
        } else {
          throw new Error(response.message || 'Failed to update integrations status')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to update integrations status'
        this.setError(message)
        return { success: false, message, errors: error?.data?.errors }
      } finally {
        this.loading = false
      }
    },

    // Delete integration
    async deleteIntegration(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<void>>(
          `/api/organization-integrations/${id}`,
          {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
          }
        )

        if (response.status === 'success') {
          this.setSuccessMessage(response.message || 'Integration deleted successfully')
          // Remove from local state
          this.integrations = this.integrations.filter((i) => i.id !== id)
          return { success: true }
        } else {
          throw new Error(response.message || 'Failed to delete integration')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to delete integration'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    // Batch delete multiple integrations
    async batchDeleteIntegrations(integration_ids: string[]) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<ApiResponse<{ deleted: string[]; errors: any[] }>>('/api/organization-integrations/batch', {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          body: { integration_ids },
        })

        if (response.status === 'success' || response.status === 'partial_success') {
          this.setSuccessMessage(response.message || 'Integrations deleted successfully')
          // Remove from local state
          if (response.data?.deleted) {
            this.integrations = this.integrations.filter(
              (i) => !response.data?.deleted.includes(i.id)
            )
          }
          return { success: response.status === 'success', data: response.data, partial: response.status === 'partial_success', errors: response.errors }
        } else {
          throw new Error(response.message || 'Failed to delete integrations')
        }
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to delete integrations'
        this.setError(message)
        return { success: false, message, errors: error?.data?.errors }
      } finally {
        this.loading = false
      }
    },

    // Decrypt integration data for display (e.g., in edit form)
    // This decrypts only when needed, not on API fetch
    async decryptIntegrationForDisplay(
      integration: OrganizationIntegration,
    ): Promise<OrganizationIntegration> {
      try {
        return await decryptSensitiveFields(integration, [
          'client_secret',
          'api_key',
          'access_token',
          'refresh_token',
        ])
      } catch (error) {
        console.error('Failed to decrypt integration:', error)
        return integration
      }
    },

    // Clear errors and messages
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    async submitProviderRequest(payload: ProviderRequestPayload) {
      this.loadingProviderRequest = true
      this.error = null

      try {
        const response = await $fetch<ApiResponse<void>>('/api/organization-integrations/provider-requests', {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: payload,
        })

        if (response.status === 'success') {
          this.setSuccessMessage(
            response.message ||
            'Your integration request has been submitted. Our team will contact you soon.',
          )

          return { success: true }
        } else {
          throw new Error(response.message || 'Failed to submit provider request')
        }
      } catch (error: any) {
        const message =
          error?.data?.message || error?.message || 'Failed to submit provider request'
        this.setError(message)
        return { success: false, message }
      } finally {
        this.loadingProviderRequest = false
      }
    },
  },
})
