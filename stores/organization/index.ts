import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { handleError, handleSuccess } from '../../utils/apiHandler'
import { useFeaturesStore } from '../features'

export const useOrganizationStore = defineStore('organizationStore', () => {
  const currentPlan = ref<any | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchOrgPlan(orgId?: string) {
    loading.value = true
    error.value = null
    try {
      const url = orgId ? `/api/organizations/plan?org_id=${encodeURIComponent(orgId)}` : '/api/organizations/plan'
      const res = await fetch(url, { credentials: 'same-origin' })
      const text = await res.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch { data = null }
      if (res.ok && data?.success) {
        currentPlan.value = data.data || null

        // Update feature flags in the features store
        if (currentPlan.value?.plan?.flattenedFeatureFlags) {
          const featuresStore = useFeaturesStore()
          featuresStore.setUserFeatureFlags(currentPlan.value.plan.flattenedFeatureFlags)
        }

        return { success: true, data: currentPlan.value }
      }

      // Fallback: server may return direct object
      if (res.ok && data) {
        currentPlan.value = data || null

        // Update feature flags in the features store
        if (currentPlan.value?.plan?.flattenedFeatureFlags) {
          const featuresStore = useFeaturesStore()
          featuresStore.setUserFeatureFlags(currentPlan.value.plan.flattenedFeatureFlags)
        }

        return { success: true, data: currentPlan.value }
      }

      const msg = (data && (data.error || data.message)) || 'Failed to fetch org plan'
      error.value = msg
      handleError(msg, 'Failed to fetch org plan')
      return { success: false, error: msg }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to fetch org plan')
      error.value = msg
      return { success: false, error: msg }
    } finally {
      loading.value = false
    }
  }

  return {
    currentPlan: readonly(currentPlan),
    loading: readonly(loading),
    error: readonly(error),
    fetchOrgPlan,
  }
})
