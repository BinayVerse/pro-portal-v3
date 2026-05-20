/**
 * Composable for checking feature access in components
 *
 * Usage:
 * - isEnabled('reports_ai_signals') - Check if feature is enabled
 * - getTooltip('reports_ai_signals') - Get tooltip text for disabled features
 * - isIntegrationAllowed(currentCount) - Check if can add more integrations
 */

import { useFeaturesStore } from '~/stores/features'

export function useFeatures() {
  const store = useFeaturesStore()

  /**
   * Check if a feature is enabled
   * @param key - Feature key (e.g., 'reports_ai_signals', 'reports_keo', 'new_provider_request')
   * @returns boolean - Whether the feature is enabled
   */
  const isEnabled = (key: string): boolean => {
    return store.isFeatureEnabled(key)
  }

  /**
   * Check if integration quota allows adding more integrations
   * @param currentCount - Current number of integrations
   * @returns boolean - Whether more integrations can be added
   */
  const isIntegrationAllowed = (currentCount: number): boolean => {
    return store.isIntegrationAllowed(currentCount)
  }

  /**
   * Get tooltip text for disabled features
   * @param key - Feature key
   * @returns string - Tooltip text (empty string if feature is enabled)
   */
  const getTooltip = (key: string): string => {
    if (store.isFeatureEnabled(key)) return ''
    return 'Upgrade your plan to access this feature.'
  }

  return {
    isEnabled,
    isIntegrationAllowed,
    getTooltip,
  }
}
