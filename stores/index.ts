// stores/index.ts
import { useUsersStore } from './users'
import { useProfileStore } from './profile'
import { useAuthStore } from './auth'
import { useContactStore } from './contact'
import { useAnalyticsStore } from './analytics'
import { useOrganizationStore } from './organization'
import { useIntegrationsStore } from './integrations'
// import { useBillingDetailsStore, useGlobalStore } from './global'

export { useContactStore, useAuthStore, useProfileStore, useUsersStore, useAnalyticsStore, useOrganizationStore, useIntegrationsStore }
