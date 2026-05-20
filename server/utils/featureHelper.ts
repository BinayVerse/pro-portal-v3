/**
 * Centralized Feature Helper
 * Manages feature flag access and feature checking across the application
 *
 * Supports two types of features:
 * - Boolean flags: feature is enabled (true) or disabled (false)
 * - Quota-based: feature has a limit (-1 for unlimited, or a number for limited)
 */

export interface FeatureFlags {
  api_integrations?: {
    limit?: number // -1 for unlimited, or a specific limit
    [key: string]: any
  }
  reports?: {
    ai_signals?: boolean
    knowledge_enhancement?: boolean
    [key: string]: any
  }
  requests?: {
    new_provider?: boolean
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Check if a specific feature is enabled
 * @param featureFlags - The feature flags object from the plan
 * @param feature - Dot-notation path to feature (e.g., 'api_integrations.hr', 'reports.ai_signals')
 * @returns boolean - Whether the feature is enabled
 */
export function isFeatureEnabled(featureFlags: FeatureFlags | null | undefined, feature: string): boolean {
  if (!featureFlags || !feature) return false

  const parts = feature.split('.')
  let current: any = featureFlags

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return false
    }
  }

  return !!current
}

/**
 * Get all enabled features for a plan
 * @param featureFlags - The feature flags object from the plan
 * @returns array - List of enabled feature paths
 */
export function getEnabledFeatures(featureFlags: FeatureFlags | null | undefined): string[] {
  if (!featureFlags) return []

  const enabled: string[] = []

  function traverse(obj: any, prefix: string = '') {
    if (typeof obj !== 'object' || obj === null) return

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'boolean') {
        if (value) enabled.push(fullKey)
      } else if (typeof value === 'object') {
        traverse(value, fullKey)
      }
    }
  }

  traverse(featureFlags)
  return enabled
}

/**
 * Flatten feature flags for easier access in frontend
 * @param featureFlags - The feature flags object
 * @returns object - Flattened feature flags with dot-notation keys
 *
 * Converts nested structure to flat keys:
 * - api_integration_limit: the limit value from api_integrations.limit
 * - reports_ai_signals: boolean from reports.ai_signals
 * - reports_keo: boolean from reports.knowledge_enhancement
 * - new_provider_request: boolean from requests.new_provider
 */
export function flattenFeatureFlags(featureFlags: FeatureFlags | null | undefined): Record<string, any> {
  if (!featureFlags) {
    return {
      api_integration_limit: 0,
      reports_ai_signals: false,
      reports_keo: false,
      new_provider_request: false,
    }
  }

  return {
    api_integration_limit: featureFlags.api_integrations?.limit ?? 0,
    reports_ai_signals: featureFlags.reports?.ai_signals ?? false,
    reports_keo: featureFlags.reports?.knowledge_enhancement ?? false,
    new_provider_request: featureFlags.requests?.new_provider ?? false,
  }
}

/**
 * Check if a feature is locked (not enabled)
 * @param featureFlags - The feature flags object
 * @param feature - Dot-notation path to feature
 * @returns boolean - Whether the feature is locked
 */
export function isFeatureLocked(featureFlags: FeatureFlags | null | undefined, feature: string): boolean {
  return !isFeatureEnabled(featureFlags, feature)
}

/**
 * Get integration limit from feature flags
 * @param featureFlags - The feature flags object
 * @returns number - The limit (-1 for unlimited, 0 if not set, or specific number)
 */
export function getIntegrationLimit(featureFlags: FeatureFlags | null | undefined): number {
  if (!featureFlags?.api_integrations?.limit && featureFlags?.api_integrations?.limit !== 0) {
    return 0
  }
  return featureFlags.api_integrations.limit ?? 0
}

/**
 * Check if integration quota is available
 * @param featureFlags - The feature flags object
 * @param currentCount - Current number of integrations used
 * @returns boolean - Whether more integrations can be added
 */
export function isIntegrationAllowed(featureFlags: FeatureFlags | null | undefined, currentCount: number): boolean {
  const limit = getIntegrationLimit(featureFlags)
  return limit === -1 || currentCount < limit
}
