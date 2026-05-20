import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { useAuthStore } from '../auth'

export const useFeaturesStore = defineStore('features', () => {
  const authStore = useAuthStore()

  // Current user's feature flags (flattened from their plan)
  // Flattened keys: api_integration_limit, reports_ai_signals, reports_keo, new_provider_request
  const userFeatureFlags = ref<Record<string, any>>({})

  /**
   * Check if a specific feature is enabled for the current user
   * @param featureKey - Feature key (e.g., 'reports_ai_signals', 'new_provider_request')
   * @returns boolean - Whether the feature is enabled
   */
  function isFeatureEnabled(featureKey: string): boolean {
    const value = userFeatureFlags.value[featureKey]
    // For quota-based features, any value > 0 or -1 (unlimited) means enabled
    if (typeof value === 'number') {
      return value !== 0
    }
    return value === true
  }

  /**
   * Check if a feature is locked (not available in user's plan)
   * @param featureKey - Feature key
   * @returns boolean - Whether the feature is locked
   */
  function isFeatureLocked(featureKey: string): boolean {
    return !isFeatureEnabled(featureKey)
  }

  /**
   * Get the integration limit for the plan
   * @returns number - The limit (-1 for unlimited, 0 if not set)
   */
  function getIntegrationLimit(): number {
    return userFeatureFlags.value.api_integration_limit ?? 0
  }

  /**
   * Check if integration quota is available
   * @param currentCount - Current number of integrations used
   * @returns boolean - Whether more integrations can be added
   */
  function isIntegrationAllowed(currentCount: number): boolean {
    const limit = getIntegrationLimit()
    return limit === -1 || currentCount < limit
  }

  /**
   * Get all enabled features for current user
   * @returns string[] - List of enabled feature keys
   */
  function getEnabledFeatures(): string[] {
    return Object.keys(userFeatureFlags.value).filter((key) => isFeatureEnabled(key))
  }

  /**
   * Set feature flags for current user (called after fetching org plan)
   * @param flattenedFlags - Flattened feature flags from API
   */
  function setUserFeatureFlags(flattenedFlags: Record<string, any>) {
    userFeatureFlags.value = flattenedFlags || {}
  }

  /**
   * Reset feature flags
   */
  function resetFeatures() {
    userFeatureFlags.value = {}
  }

  return {
    userFeatureFlags: readonly(userFeatureFlags),
    isFeatureEnabled,
    isFeatureLocked,
    getIntegrationLimit,
    isIntegrationAllowed,
    getEnabledFeatures,
    setUserFeatureFlags,
    resetFeatures,
  }
})
