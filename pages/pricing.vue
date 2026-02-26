<template>
  <div>
    <section class="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
            Simple, Transparent
            <span class="text-primary-400">Pricing</span>
          </h1>
          <p class="text-xl text-gray-300 max-w-3xl mx-auto">
            Find the plan that’s right for you, with round-the-clock support.
          </p>
        </div>

        <!-- Pricing Grid -->
        <template v-if="!isLoading">
          <!-- Base / Add-On Toggle -->
          <!-- <div class="flex justify-center mb-8">
            <div class="inline-flex rounded-md bg-dark-800 p-0.5">
              <button
                @click="uiState.planCategory = 'base'"
                :class="
                  uiState.planCategory === 'base'
                    ? 'px-4 py-1.5 bg-primary-600 text-white rounded'
                    : 'px-4 py-1.5 text-gray-300 rounded'
                "
              >
                Base Plans
              </button>

              <button
                @click="uiState.planCategory = 'addon'"
                :class="
                  uiState.planCategory === 'addon'
                    ? 'px-4 py-1.5 bg-primary-600 text-white rounded'
                    : 'px-4 py-1.5 text-gray-300 rounded'
                "
              >
                Add-On Plans
              </button>
            </div>
          </div> -->
          <!-- Billing Period Toggle -->
          <div v-if="uiState.planCategory === 'base'" class="flex justify-center mb-10">
            <div class="inline-flex rounded-md bg-dark-800 p-0.5">
              <button
                @click="selectedPeriod = 'month'"
                :class="
                  selectedPeriod === 'month'
                    ? 'px-3 py-1 bg-primary-600 text-white rounded'
                    : 'px-3 py-1 text-gray-300 rounded'
                "
              >
                Monthly
              </button>
              <button
                @click="selectedPeriod = 'year'"
                :class="
                  selectedPeriod === 'year'
                    ? 'px-3 py-1 bg-primary-600 text-white rounded'
                    : 'px-3 py-1 text-gray-300 rounded'
                "
              >
                Yearly
              </button>
            </div>
          </div>

          <div
            class="grid gap-6 mx-auto justify-items-center grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl"
          >
            <div
              v-for="(group, idx) in groupedPlans"
              v-show="getOption(group)"
              :key="group.name + idx"
              class="card w-full max-w-sm relative flex flex-col justify-between h-full"
              :class="group.popular ? 'ring-2 ring-primary-500' : ''"
            >
              <div v-if="group.popular" class="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span class="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium"
                  >Most Popular</span
                >
              </div>

              <div>
                <div class="text-center mb-4">
                  <h3 class="text-2xl font-bold text-white mb-2">{{ group.name }}</h3>
                  <p class="text-gray-400 mb-4">{{ group.description || '' }}</p>

                  <!-- PRICE (Base + Add-On plans) -->
                  <p
                    v-if="isFreeplan(getOption(group)) && selectedPeriod === 'year'"
                    class="text-sm text-gray-400 mt-2"
                  >
                    Available only on Monthly billing
                  </p>
                  <div v-else class="mb-4 whitespace-nowrap">
                    <span class="text-4xl font-bold text-white">
                      <template v-if="isFreeplan(getOption(group))"> Free </template>

                      <template v-else-if="getOption(group)?.contact_sales">
                        Custom Pricing
                      </template>

                      <template v-else>
                        {{ fmtPrice(getOption(group)?.price, getOption(group)?.currency) }}
                      </template>
                    </span>
                    <span
                      v-if="
                        uiState.planCategory === 'base' &&
                        getOption(group) &&
                        !(getOption(group).contact_sales || Number(getOption(group).price) === 0)
                      "
                      class="text-gray-400"
                    >
                      /{{ getSelectedKey(group) === 'year' ? 'year' : 'month' }}
                    </span>
                    <span v-if="uiState.planCategory === 'addon'" class="text-gray-400">
                      /pack
                    </span>
                  </div>

                  <div class="flex justify-center mt-4 mb-6">
                    <button
                      @click.prevent="handleGetStarted(group)"
                      :disabled="
                        checkoutLoading[getOption(group)?.id] ||
                        (selectedPeriod === 'year' && isFreeplan(getOption(group)))
                      "
                      class="btn-primary px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <template v-if="checkoutLoading[getOption(group)?.id]"
                        >Processing...</template
                      >
                      <template v-else>
                        {{
                          isFreeplan(getOption(group)) && selectedPeriod === 'year'
                            ? 'Start Now'
                            : isFreeplan(getOption(group))
                              ? 'Start Now'
                              : isEnterpriseContactSalesPlan(group)
                                ? 'Contact Sales'
                                : 'Buy Now'
                        }}
                      </template>
                    </button>
                  </div>
                </div>
              </div>

              <ul class="space-y-3 pb-6 flex-grow">
                <!-- ADD-ON PLANS: show ONLY explicit features -->
                <template v-if="uiState.planCategory === 'addon'">
                  <li
                    v-for="feature in getOption(group)?.features || []"
                    :key="feature"
                    class="flex items-start"
                  >
                    <UIcon
                      name="i-heroicons-check"
                      class="w-5 h-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <span class="text-gray-300">{{ feature }}</span>
                  </li>
                </template>

                <!-- BASE PLANS: derived features -->
                <template v-else>
                  <li
                    v-for="feature in deriveFeatures(getOption(group))"
                    :key="feature"
                    class="flex items-start"
                  >
                    <UIcon
                      name="i-heroicons-check"
                      class="w-5 h-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0"
                    />
                    <span class="text-gray-300">{{ feature }}</span>
                  </li>
                </template>
              </ul>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center justify-center py-16">
            <div
              class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            ></div>
          </div>
        </template>

        <!-- FAQ Section -->
        <div class="mt-24">
          <h2 class="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div class="max-w-3xl mx-auto space-y-6">
            <div v-for="faq in faqs" :key="faq.id" class="card">
              <h3 class="text-lg font-semibold text-white mb-2">{{ faq.question }}</h3>
              <p class="text-gray-300">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Pricing - provento.ai' })
definePageMeta({ layout: 'main' })

import { onMounted, computed, ref, reactive, watch } from 'vue'
import { usePricingStore } from '~/stores/pricing'
import { useAuth } from '~/composables/useAuth'
import { useRoute } from 'vue-router'
import { useNotification } from '~/composables/useNotification'
import { useProfileStore } from '~/stores/profile/index'
import { useAuthStore } from '~/stores/auth/index'

const pricing = usePricingStore()
const auth = useAuth()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const route = useRoute()
const { showError, showSuccess } = useNotification()

onMounted(() => {
  pricing.fetchPlans()
})

const rawPlans = computed(() => pricing.plans.filter((p: any) => p.plan_type === 'subscription'))

const addonPlans = computed(() => pricing.plans.filter((p: any) => p.plan_type === 'addon'))
const uiState = reactive({
  planCategory: 'base' as 'base' | 'addon',
})

const visibleGroupCount = computed(() => groupedPlans.value.filter((g) => getOption(g)).length)

const visiblePlans = computed(() => {
  return pricing.plans.filter((p: any) =>
    uiState.planCategory === 'base' ? p.plan_type === 'subscription' : p.plan_type === 'addon',
  )
})

const isLoading = computed(() => pricing.isLoading)
const error = computed(() => pricing.error)

// Checkout/loading state
const checkoutLoading = reactive<Record<string, boolean>>({})

async function handleGetStarted(group: any) {
  const opt = getOption(group)
  if (!opt) return

  // Contact sales flow
  if (opt.contact_sales || isEnterpriseContactSalesPlan(group)) {
    return navigateTo('/book-meeting')
  }

  // Try to determine orgId from query/profile/auth
  try {
    await auth.checkAuth()
  } catch (e) {}

  const orgFromQuery = (route.query?.org || route.query?.org_id) as string | undefined
  const orgId = orgFromQuery || auth.user?.org_id || (profileStore.userProfile as any)?.org_id || ''

  // If not authenticated, send user to login and redirect back to org plans page after login
  if (!authStore.isAuthenticated) {
    const redirectPath = `/admin/plans${orgId ? `?org=${encodeURIComponent(orgId)}` : ''}`
    return navigateTo({ path: '/signup', query: { redirect: redirectPath } })
  }

  // Authenticated -> go straight to organization plans page
  const target = `/admin/plans${orgId ? `?org=${encodeURIComponent(orgId)}` : ''}`
  return navigateTo(target)
}

// Check if a plan is Enterprise (has contact_sales on any period)
function isEnterpriseContactSalesPlan(group: any) {
  const hasContactSales = Object.values(group.options).some(
    (opt: any) => opt?.contact_sales === true,
  )
  return hasContactSales && uiState.planCategory === 'base'
}

function isFreeplan(opt: any) {
  return !!opt?.is_free
}

// Group plans by name and collect monthly/yearly options
const groupedPlans = computed(() => {
  const map = new Map<string, any>()
  visiblePlans.value.forEach((p: any) => {
    const key = p.name || p.title || 'Unnamed'
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        options: {},
        popular: !!p.popular,
        product_family: p.product_family || null,
      })
    }
    const entry = map.get(key)
    const interval = (p.interval || p.period || 'month').toString().toLowerCase()
    entry.options[interval === 'year' ? 'year' : 'month'] = {
      id: p.id,
      price: p.price,
      currency: p.currency,
      chargebee_plan_id: p.chargebee_plan_id,
      users: p.users ?? p._raw?.users ?? 0,
      limit_requests: p.limit_requests ?? p._raw?.limit_requests ?? 0,
      storage_limit_gb: p.storage_limit_gb ?? p._raw?.storage_limit_gb ?? null,
      artefacts: p.artefacts ?? p._raw?.artefacts ?? p._raw?.metadata?.artefacts ?? null,
      features: Array.isArray(p.features) ? p.features : p._raw?.features || [],
      contact_sales: !!p.contact_sales,
      support_level:
        p.support_level || p._raw?.support_level || p._raw?.metadata?.support_level || null,
      createdAt: p.createdAt || p._raw?.created_at || null,
      recommended: !!p.popular || !!p.recommended,
      is_free: p.is_free,
      metadata: p.metadata || p._raw?.metadata,
      raw: p._raw || p,
    }
    if (p.popular || p.recommended) entry.popular = true
  })
  return Array.from(map.values())
})

// Global selected period (one toggle controls all cards)
const selectedPeriod = ref<'month' | 'year'>('month')

// Initialize selectedPeriod based on available plan intervals
watch(
  rawPlans,
  (r) => {
    if (!r || r.length === 0) return
    const hasMonth = r.some(
      (p: any) => (p.interval || p.period || 'month').toString().toLowerCase() === 'month',
    )
    selectedPeriod.value = hasMonth ? 'month' : 'year'
  },
  { immediate: true },
)

watch(
  () => uiState.planCategory,
  (val) => {
    if (val === 'addon') {
      selectedPeriod.value = 'month'
    }
  },
)

function getOption(group: any) {
  const key = selectedPeriod.value

  const monthlyOpt = group.options.month
  const yearlyOpt = group.options.year

  // 1️⃣ Enterprise: always show (ignore toggle)
  if (monthlyOpt?.contact_sales) return monthlyOpt
  if (yearlyOpt?.contact_sales) return yearlyOpt

  // 2️⃣ Free plan: always return MONTHLY option (even on yearly)
  if (monthlyOpt?.is_free) {
    return monthlyOpt
  }

  // 3️⃣ Normal plans follow toggle
  return group.options[key] || null
}

function getSelectedKey(group: any) {
  const key = selectedPeriod.value
  if (group.options[key]) return key
  if (group.options.month) return 'month'
  if (group.options.year) return 'year'
  return key
}

import { fmtPrice, deriveFeatures } from '~/utils/pricingHelpers'

const faqs = [
  {
    id: 19,
    question: 'Is there a free plan?',
    answer:
      'Yes, we offer a Free Plan for first-time users with limited access. The Free Plan is available once per organization. Continued usage requires upgrading to a paid plan.',
  },
  {
    id: 20,
    question: 'Can I change my plan at any time?',
    answer:
      "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly. No long-term commitments required.",
  },
  {
    id: 21,
    question: 'Do you offer annual discounts?',
    answer:
      'Yes! Annual subscriptions receive a 20% discount compared to monthly billing. This can result in significant savings, especially for higher-tier plans.',
  },
]
</script>
