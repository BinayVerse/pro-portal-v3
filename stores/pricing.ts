import { defineStore } from 'pinia'

export interface PricingPlan {
  id: string
  name: string
  description: string
  price: number | string
  currency: string
  interval: 'month' | 'year'
  plan_type: 'subscription' | 'addon'
  users: number
  limit_requests: number
  storage_limit_gb: number | null
  artefacts: number
  support_level: string | null
  contact_sales: boolean
  display_order: number
  features: string[]
  popular: boolean
  createdAt: string
  product_family?: string | null
  is_free?: boolean
  metadata?: any
}


import { handleError } from '../utils/apiHandler'

export const usePricingStore = defineStore('pricing', () => {
  const plans = ref<PricingPlan[]>([])
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  const fetchPlans = async (family?: string) => {
    isLoading.value = true
    error.value = null

    try {
      const url = family ? `/api/plans?family=${encodeURIComponent(family)}` : '/api/plans'
      const response = await fetch(url)

      let data: { success: boolean; data?: any[]; error?: string }

      try {
        const responseText = await response.text()

        if (!responseText) {
          data = { success: false, error: 'Empty response from server' }
        } else {
          try {
            data = JSON.parse(responseText)
          } catch (parseError) {
            data = { success: false, error: responseText }
          }
        }
      } catch (textError) {
        data = { success: false, error: 'Failed to read response from server' }
      }

      if (response.ok && data.success && Array.isArray(data.data)) {
        // Normalize data to match front-end expectations
        plans.value = data.data.map((p: any) => {
          const id = p.id ? String(p.id) : ''
          const price = p.price === 'Custom' ? 'Custom' : Number(p.price) || 0
          const interval = p.interval === 'year' ? 'year' : 'month'
          const period = interval
          const cta = (typeof price === 'number' && price > 0 && !p.contact_sales) ? 'Get Started' : 'Contact Sales'
          return {
            id,
            name: p.name || p.title || '',
            description: p.description || '',
            price,
            currency: p.currency || 'USD',
            interval,
            plan_type: p.plan_type,
            users: p.users ?? 0,
            limit_requests: p.limit_requests ?? 0,
            storage_limit_gb: p.storage_limit_gb ?? null,
            artefacts: p.artefacts ?? 0,
            support_level: p.support_level ?? null,
            contact_sales: !!p.contact_sales,
            display_order: p.display_order ?? 0,

            features: Array.isArray(p.features) ? p.features : [],
            popular: !!p.popular || !!p.recommended,
            createdAt: p.createdAt || new Date().toISOString(),
            product_family: p.product_family || null,
            is_free: p.is_free,
            metadata: p.metadata || {},
          }
        })
        return { success: true }
      } else {
        const msg = data.error || 'Failed to fetch pricing plans'
        handleError({ response: { _data: { message: msg } } }, msg)
        throw new Error(msg)
      }
    } catch (err: any) {
      const msg = handleError(err, 'Failed to fetch pricing plans')
      error.value = msg
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const getPlanById = (id: string) => {
    return plans.value.find((plan) => plan.id === id)
  }

  const getPopularPlan = () => {
    return plans.value.find((plan) => plan.popular)
  }

  return {
    plans: readonly(plans),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchPlans,
    getPlanById,
    getPopularPlan,
  }
})
