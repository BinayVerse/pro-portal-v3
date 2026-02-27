import { computed } from 'vue'
import { useOrganizationIntegrationsStore } from '~/stores/organization-integrations'
import type {
  OrganizationIntegration,
  IntegrationProvider,
  IntegrationModule,
  IntegrationAgent,
  CreateIntegrationPayload,
  UpdateIntegrationPayload,
} from '~/stores/organization-integrations/types'

export const useOrganizationIntegrations = () => {
  const store = useOrganizationIntegrationsStore()

  // Initialize master data on first use
  const initializeMasterData = async () => {
    if (!store.providers.length && !store.modules.length && !store.agents.length) {
      await store.fetchMasterData()
    }
  }

  // Initialize everything on first use
  const initialize = async () => {
    await initializeMasterData()
    await store.fetchIntegrations()
  }

  return {
    // State
    providers: computed(() => store.providers),
    modules: computed(() => store.modules),
    agents: computed(() => store.agents),
    integrations: computed(() => store.integrations),
    selectedIntegration: computed(() => store.selectedIntegration),
    loading: computed(() => store.loading),
    loadingProviders: computed(() => store.loadingProviders),
    loadingModules: computed(() => store.loadingModules),
    loadingAgents: computed(() => store.loadingAgents),
    loadingIntegrations: computed(() => store.loadingIntegrations),
    error: computed(() => store.error),
    successMessage: computed(() => store.successMessage),

    // Getters
    getProviderById: (id: string) => store.getProviderById(id),
    getModuleById: (id: string) => store.getModuleById(id),
    getAgentById: (id: string) => store.getAgentById(id),
    getIntegrationById: (id: string) => store.getIntegrationById(id),
    getIntegrationsByStatus: (status: string) => store.getIntegrationsByStatus(status),

    // Actions
    fetchProviders: () => store.fetchProviders(),
    fetchModules: () => store.fetchModules(),
    fetchAgents: () => store.fetchAgents(),
    fetchMasterData: () => store.fetchMasterData(),
    fetchRelationships: () => store.fetchRelationships(),
    fetchIntegrations: (filters?: any) => store.fetchIntegrations(filters),
    fetchIntegrationById: (id: string) => store.fetchIntegrationById(id),
    createIntegration: (payload: CreateIntegrationPayload) => store.createIntegration(payload),
    updateIntegration: (id: string, payload: UpdateIntegrationPayload) =>
      store.updateIntegration(id, payload),
    updateIntegrationStatus: (id: string, status: 'active' | 'inactive' | 'expired' | 'failed') =>
      store.updateIntegrationStatus(id, status),
    deleteIntegration: (id: string) => store.deleteIntegration(id),
    clearMessages: () => store.clearMessages(),

    // Client-side filtering getters
    getModulesForAgent: (agentId: string) => store.getModulesForAgent(agentId),
    getProvidersForAgent: (agentId: string) => store.getProvidersForAgent(agentId),
    getProvidersForAgentAndModule: (agentId: string, moduleId: string) =>
      store.getProvidersForAgentAndModule(agentId, moduleId),
    getModulesForAgentAndProvider: (agentId: string, providerId: string) =>
      store.getModulesForAgentAndProvider(agentId, providerId),

    // Decryption for display
    decryptIntegrationForDisplay: (integration: OrganizationIntegration) =>
      store.decryptIntegrationForDisplay(integration),

    initializeMasterData,
    initialize,
  }
}
