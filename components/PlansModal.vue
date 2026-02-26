<template>
  <teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative mx-auto w-full max-w-5xl px-2 sm:px-4">
        <div class="bg-dark-900 border border-dark-700 rounded-lg overflow-hidden shadow-xl">
          <div class="border-b border-dark-700 p-4">
            <!-- ================= MOBILE ( < md ) ================= -->
            <div class="md:hidden">
              <!-- Row 1 -->
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">
                  {{ selectedPlan ? 'Checkout' : 'Compare Plans' }}
                </h3>
                <button class="btn-outline" @click="close">Close</button>
              </div>

              <!-- Row 2 -->
              <div v-if="!selectedPlan" class="flex justify-center mt-3">
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
                    @click="handleAddonClick"
                    :class="
                      uiState.planCategory === 'addon'
                        ? 'px-4 py-1.5 bg-primary-600 text-white rounded'
                        : 'px-4 py-1.5 text-gray-300 rounded'
                    "
                  >
                    Add-On Plans
                  </button>
                </div>
              </div>

              <!-- Row 3 -->
              <div
                v-if="uiState.planCategory === 'base'"
                class="flex justify-center items-center gap-2 mt-3"
              >
                <span class="text-sm text-gray-400">Billing</span>
                <div class="inline-flex rounded-md border overflow-hidden">
                  <button
                    class="px-3 py-1"
                    :class="period === 'month' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                    @click="period = 'month'"
                  >
                    Monthly
                  </button>
                  <button
                    class="px-3 py-1"
                    :class="period === 'year' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                    @click="period = 'year'"
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>

            <!-- ================= TABLET ( md → < lg ) ================= -->
            <div class="hidden md:block lg:hidden">
              <!-- Row 1 -->
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-white">
                  {{ selectedPlan ? 'Checkout' : 'Compare Plans' }}
                </h3>
                <button class="btn-outline" @click="close">Close</button>
              </div>

              <!-- Row 2 -->
              <div class="flex justify-center items-center gap-6 mt-3 flex-wrap">
                <div v-if="!selectedPlan" class="inline-flex rounded-md bg-dark-800 p-0.5">
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
                    @click="handleAddonClick"
                    :class="
                      uiState.planCategory === 'addon'
                        ? 'px-4 py-1.5 bg-primary-600 text-white rounded'
                        : 'px-4 py-1.5 text-gray-300 rounded'
                    "
                  >
                    Add-On Plans
                  </button>
                </div>

                <div v-if="uiState.planCategory === 'base'" class="flex items-center gap-2">
                  <span class="text-sm text-gray-400">Billing</span>
                  <div class="inline-flex rounded-md border overflow-hidden">
                    <button
                      class="px-3 py-1"
                      :class="period === 'month' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                      @click="period = 'month'"
                    >
                      Monthly
                    </button>
                    <button
                      class="px-3 py-1"
                      :class="period === 'year' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                      @click="period = 'year'"
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- ================= DESKTOP ( ≥ lg ) ================= -->
            <div class="hidden lg:grid grid-cols-3 items-center gap-4">
              <!-- Left -->
              <div>
                <h3 class="text-lg font-semibold text-white">
                  {{ selectedPlan ? 'Checkout' : 'Compare Plans' }}
                </h3>
              </div>

              <!-- Center -->
              <div class="flex justify-center">
                <div v-if="!selectedPlan" class="inline-flex rounded-md bg-dark-800 p-0.5">
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
                    @click="handleAddonClick"
                    :class="
                      uiState.planCategory === 'addon'
                        ? 'px-4 py-1.5 bg-primary-600 text-white rounded'
                        : 'px-4 py-1.5 text-gray-300 rounded'
                    "
                  >
                    Add-On Plans
                  </button>
                </div>
              </div>

              <!-- Right -->
              <div class="flex justify-end items-center gap-3">
                <div v-if="uiState.planCategory === 'base'" class="flex items-center gap-2">
                  <span class="text-sm text-gray-400">Billing</span>
                  <div class="inline-flex rounded-md border overflow-hidden">
                    <button
                      class="px-3 py-1"
                      :class="period === 'month' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                      @click="period = 'month'"
                    >
                      Monthly
                    </button>
                    <button
                      class="px-3 py-1"
                      :class="period === 'year' ? 'bg-primary-600 text-white' : 'text-gray-300'"
                      @click="period = 'year'"
                    >
                      Yearly
                    </button>
                  </div>
                </div>

                <button class="btn-outline" @click="close">Close</button>
              </div>
            </div>
          </div>

          <div class="p-4 sm:p-6 max-h-[calc(100vh-160px)] overflow-y-auto">
            <div v-if="!selectedPlan">
              <div class="grid gap-6 w-full grid-cols-1 md:grid-cols-2">
                <div
                  v-for="plan in plansGrouped"
                  :key="plan.name"
                  class="card w-full relative flex flex-col justify-between h-full"
                  :class="plan.popular ? 'ring-2 ring-primary-500' : ''"
                >
                  <div
                    v-if="plan.popular"
                    class="absolute -top-4 left-1/2 transform -translate-x-1/2"
                  >
                    <span
                      class="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium"
                      >Most Popular</span
                    >
                  </div>

                  <div class="text-center mb-4">
                    <h3 class="text-2xl font-bold text-white mb-2">{{ plan.name }}</h3>
                    <p class="text-gray-400 mb-4">{{ plan.description || '' }}</p>

                    <div class="mb-4 whitespace-nowrap">
                      <!-- 1️⃣ ADD-ON PLANS -->
                      <template v-if="uiState.planCategory === 'addon'">
                        <span class="text-4xl font-bold text-white">
                          {{ fmtPrice(getOptionPrice(plan), getOptionCurrency(plan)) }}
                        </span>
                        <span class="text-gray-400"> /pack</span>
                      </template>

                      <!-- 2️⃣ FREE PLAN -->
                      <template v-else-if="isFreePlanGroup(plan)">
                        <div class="text-4xl font-bold text-white">Free</div>
                      </template>

                      <!-- 3️⃣ ENTERPRISE / CONTACT SALES -->
                      <template
                        v-else-if="
                          (plan.options[period] || plan.options.month || plan.options.year)
                            ?.contact_sales
                        "
                      >
                        <div class="text-4xl font-bold text-white">Custom Pricing</div>
                      </template>

                      <!-- 4️⃣ NORMAL BASE PLANS -->
                      <template v-else>
                        <span class="text-4xl font-bold text-white">
                          {{ fmtPrice(getOptionPrice(plan), getOptionCurrency(plan)) }}
                        </span>
                        <span class="text-gray-400">
                          /{{ period === 'year' ? 'Yearly' : 'Monthly' }}
                        </span>
                      </template>

                      <p
                        v-if="isFreePlanGroup(plan) && period === 'year'"
                        class="text-xs text-gray-400 mt-2 text-center"
                      >
                        Available only on Monthly billing
                      </p>

                      <div class="flex justify-center mt-4 mb-6">
                        <AppTooltip
                          v-if="!isUnlimitedPlanGroup(plan) && isFreePlanGroup(plan) && isFreePlanDisabled"
                          :text="
                            hasAvailedFreePlan
                              ? 'You have already used the Free plan. Please choose a paid plan to continue.'
                              : 'You are already on a paid plan. The Free plan is no longer available.'
                          "
                        >
                          <button
                            v-if="!isUnlimitedPlanGroup(plan)"
                            class="btn-primary px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                            :disabled="
                              (period === 'year' && isFreePlanGroup(plan)) ||
                              (isFreePlanGroup(plan) && isFreePlanDisabled)
                            "
                            @click.prevent="
                              isFreePlanGroup(plan) && isFreePlanDisabled
                                ? null
                                : period === 'year' && isFreePlanGroup(plan)
                                  ? null
                                  : isEnterpriseContactSalesPlan(plan)
                                    ? openBookMeeting()
                                    : select(plan)
                            "
                          >
                            {{
                              isFreePlanGroup(plan) && isFreePlanDisabled
                                ? 'Start Now'
                                : isFreePlanGroup(plan) && period === 'year'
                                  ? 'Start Now'
                                  : isFreePlanGroup(plan)
                                    ? 'Start Now'
                                    : isEnterpriseContactSalesPlan(plan)
                                      ? 'Contact Sales'
                                      : 'Buy Now'
                            }}
                          </button>
                        </AppTooltip>
                        <button
                          v-else-if="!isUnlimitedPlanGroup(plan)"
                          class="btn-primary px-8 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                          :disabled="
                            (period === 'year' && isFreePlanGroup(plan)) ||
                            (isFreePlanGroup(plan) && isFreePlanDisabled)
                          "
                          @click.prevent="
                            isFreePlanGroup(plan) && isFreePlanDisabled
                              ? null
                              : period === 'year' && isFreePlanGroup(plan)
                                ? null
                                : isEnterpriseContactSalesPlan(plan)
                                  ? openBookMeeting()
                                  : select(plan)
                          "
                        >
                          {{
                            isFreePlanGroup(plan) && isFreePlanDisabled
                              ? 'Start Now'
                              : isFreePlanGroup(plan) && period === 'year'
                                ? 'Start Now'
                                : isFreePlanGroup(plan)
                                  ? 'Start Now'
                                  : isEnterpriseContactSalesPlan(plan)
                                    ? 'Contact Sales'
                                    : 'Buy Now'
                          }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <ul class="space-y-3 px-6 flex-grow">
                    <li
                      v-for="feature in uiState.planCategory === 'addon'
                        ? plan.options.month?.features || []
                        : deriveFeatures(
                            plan.options[period] || plan.options.month || plan.options.year,
                          )"
                      :key="feature"
                      class="flex items-start"
                    >
                      <UIcon
                        name="i-heroicons-check"
                        class="w-5 h-5 text-primary-400 mt-0.5 mr-3 flex-shrink-0"
                      />
                      <span class="text-gray-300">{{ feature }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div v-else>
              <div v-if="!showOnlySuccess" class="mb-4">
                <h4 class="text-white font-semibold">Checkout</h4>
                <p class="text-gray-400 text-sm">
                  Proceed to complete purchase for
                  <strong class="text-white">{{ selectedPlan.name || selectedPlan.title }}</strong>
                  -
                  <span class="text-white" v-if="selectedPlan.plan_type !== 'addon'">{{
                    formatPeriod(selectedPlan.period || period)
                  }}</span>
                  <span class="text-white" v-else>Add-On Plan</span>
                </p>
              </div>

              <div v-if="showOnlySuccess" class="p-6">
                <div class="text-center">
                  <UIcon
                    name="heroicons:check-circle"
                    class="w-12 h-12 text-green-400 mx-auto mb-4"
                  />
                  <h3 class="text-xl font-semibold text-white">{{ successTitle }}</h3>
                  <p class="text-gray-300 mt-2">{{ successMessage }}</p>
                  <div class="mt-6">
                    <button class="btn-primary" @click="closeSuccess">OK</button>
                  </div>
                </div>
              </div>

              <div v-if="showOnlyError" class="p-6">
                <div class="text-center">
                  <UIcon
                    name="heroicons:exclamation-triangle"
                    class="w-12 h-12 text-red-400 mx-auto mb-4"
                  />
                  <h3 class="text-xl font-semibold text-white">{{ errorTitle }}</h3>
                  <p class="text-gray-300 mt-2">{{ errorMessage }}</p>
                  <div class="mt-6">
                    <button class="btn-primary" @click="closeError">OK</button>
                  </div>
                </div>
              </div>

              <div v-if="showAddonBlocker" class="p-6">
                <div class="text-center">
                  <UIcon
                    name="heroicons:information-circle"
                    class="w-12 h-12 text-primary-400 mx-auto mb-4"
                  />
                  <h3 class="text-xl font-semibold text-white">Add-Ons Require Base Plan</h3>
                  <p v-if="isCurrentlyOnFreePlan" class="text-gray-300 mt-2">
                    Add-Ons not available for Free plan.
                  </p>
                  <p v-else class="text-gray-300 mt-2">
                    Please subscribe to a base plan before purchasing add-ons.
                  </p>
                  <div class="mt-6">
                    <button class="btn-primary" @click="closeAddonBlocker">OK</button>
                  </div>
                </div>
              </div>

              <div v-if="!showOnlySuccess && !showOnlyError">
                <!-- <CheckoutWizard :org-id="orgId" :selectedPlan="selectedPlan" @change-plan="onChangePlan" @order-success="onOrderSuccess" /> -->
                <CheckoutWizard
                  :org-id="orgId"
                  :selectedPlan="selectedPlan"
                  @change-plan="onChangePlan"
                  @order-success="onOrderSuccess"
                  @order-error="onOrderError"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <teleport v-if="showAddonBlocker" to="body">
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50"></div>
        <div
          class="relative mx-auto bg-dark-900 border border-dark-700 rounded-lg overflow-hidden shadow-xl p-6"
          style="max-width: 35vw; width: 100%; max-height: 90vh"
        >
          <div class="text-center">
            <UIcon
              name="heroicons:information-circle"
              class="w-12 h-12 text-primary-400 mx-auto mb-4"
            />
            <h3 v-if="isCurrentlyOnFreePlan" class="text-xl font-semibold text-white">
              Add-Ons not available for Free plan.
            </h3>
            <span v-else>
              <h3 class="text-xl font-semibold text-white">Add-Ons Require an Active Base Plan</h3>
              <p class="text-gray-300 mt-2">
                Please subscribe to a base plan before purchasing add-ons.
              </p>
            </span>
            <div class="mt-6">
              <button class="btn-primary px-8 py-3" @click="closeAddonBlocker">OK</button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { usePricingStore } from '~/stores/pricing'
import CheckoutWizard from '~/components/CheckoutWizard.vue'
import { useAuthStore } from '~/stores/auth/index'
import { useProfileStore } from '~/stores/profile/index'
import { useOrganizationStore } from '~/stores/organization/index'

const props = defineProps<{
  modelValue: boolean
  orgId?: string
  hasActiveSubscription: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const uiState = reactive({
  planCategory: 'base' as 'base' | 'addon',
})

const visible = ref(!!props.modelValue)
const showOnlyError = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')
const showAddonBlocker = ref(false)
const authStore = useAuthStore()
const profileStore = useProfileStore()
const orgStore = useOrganizationStore()

watch(
  () => props.modelValue,
  (v) => (visible.value = !!v),
)
watch(visible, (v) => emit('update:modelValue', v))

const orgId = props.orgId

const pricing = usePricingStore()
const period = ref<'month' | 'year'>('month')

onMounted(async () => {
  try {
    await pricing.fetchPlans()
  } catch {}
})

function isFreePlanGroup(planGroup: any) {
  const monthlyOpt = planGroup.options?.month
  return !!monthlyOpt?.raw?.metadata?.free_plan || monthlyOpt?.is_free === true
}

const isCurrentlyOnFreePlan = computed(() => {
  const profile = profileStore.userProfile as any
  return profile.plan_details?.metadata?.free_plan === true
})

const hasAvailedFreePlan = computed(() => {
  return profileStore.userProfile?.has_availed_free_plan === true
})

const hasAvailedPaidPlan = computed(() => {
  return profileStore.userProfile?.has_availed_paid_plan === true
})

const isFreePlanDisabled = computed(() => {
  return hasActiveSubscription.value || hasAvailedFreePlan.value || hasAvailedPaidPlan.value
})

const visiblePlans = computed(() => {
  return pricing.plans.filter((p: any) => {
    if (uiState.planCategory === 'base') {
      return p.plan_type === 'subscription'
    }

    // Add-ons only if org already has a subscription
    return p.plan_type === 'addon' && props.hasActiveSubscription
  })
})

function openBookMeeting() {
  window.location.href = '/book-meeting'
}

function formatPeriod(p: any) {
  const s = ((p && String(p)) || '').toString().toLowerCase()
  if (!s) return ''
  if (s === 'year' || s === 'yearly') return 'Yearly'
  if (s === 'month' || s === 'monthly') return 'Monthly'
  // fallback: capitalize first letter
  return String(p).charAt(0).toUpperCase() + String(p).slice(1)
}

// Group plans by name and collect month/year options (normalize shape like pages/pricing.vue)
const plansGrouped = computed(() => {
  const map = new Map()
  visiblePlans.value.forEach((p: any) => {
    const key = p.name || p.title || 'Unnamed'
    if (!map.has(key)) {
      map.set(key, {
        name: key,
        description: p.description || '',
        options: {},
        // features: Array.isArray(p.features) ? p.features : p._raw?.features || [],
        popular: !!p.popular || !!p.recommended,
      })
    }
    const entry = map.get(key)
    const interval = (p.interval || p.period || 'month').toString().toLowerCase()
    const slotKey = interval === 'year' ? 'year' : 'month'
    entry.options[slotKey] = {
      id: p.id,
      price: p.price,
      currency: p.currency,
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
      plan_type: p.plan_type || p._raw?.plan_type || 'subscription',
      raw: p._raw || p,
    }
    // merge features if missing
    if ((!entry.features || entry.features.length === 0) && p._raw?.features)
      entry.features = Array.isArray(p._raw.features) ? p._raw.features : []
    if (p.popular || p.recommended) entry.popular = true
  })
  return Array.from(map.values())
})

const selectedPlan = ref<any | null>(null)
const showOnlySuccess = ref(false)
const successTitle = ref('')
const successMessage = ref('')

function select(planGroup: any) {
  // select the option matching current period if present, else fallback
  const opt = planGroup.options[period.value] || planGroup.options.month || planGroup.options.year
  selectedPlan.value = opt
    ? {
        ...opt,
        name: planGroup.name,
        features: opt.features || [],
        period: period.value,
      }
    : null
}

function close() {
  visible.value = false
}

function isEnterpriseContactSalesPlan(planGroup: any) {
  // Check if any period of this plan has contact_sales flag
  const hasContactSales = Object.values(planGroup.options).some(
    (opt: any) => opt?.contact_sales === true,
  )
  return hasContactSales && uiState.planCategory === 'base'
}

function isUnlimitedPlanGroup(planGroup: any) {
  // Check if any period of this plan is unlimited
  return Object.values(planGroup.options).some((opt: any) => isUnlimitedPlan(opt))
}

// reset selected plan when modal opens
watch(visible, (v) => {
  if (v) {
    selectedPlan.value = null
    showOnlySuccess.value = false
    showOnlyError.value = false
    showAddonBlocker.value = false
    successTitle.value = ''
    successMessage.value = ''
    errorTitle.value = ''
    errorMessage.value = ''
    period.value = 'month'
  }
})

function onChangePlan() {
  // Reset selected plan so modal returns to plan selection grid
  selectedPlan.value = null
}

function onOrderSuccess(payload: any) {
  // Display only the success dialog and hide checkout
  showOnlySuccess.value = true
  successTitle.value = payload?.title || 'Success'
  successMessage.value = payload?.message || ''
}

function onOrderError(payload: any) {
  showOnlyError.value = true
  errorTitle.value = payload?.title || 'Payment failed'
  errorMessage.value = payload?.message || 'Your payment could not be completed.'
}

async function closeSuccess() {
  // close the whole modal after user acknowledges
  showOnlySuccess.value = false
  visible.value = false
  await orgStore.fetchOrgPlan()
  await profileStore.fetchUserProfile()
}

function closeError() {
  showOnlyError.value = false
  selectedPlan.value = null // 🔥 go back to plan grid
  period.value = 'month'
}

function getOptionPrice(planGroup: any) {
  const opt = planGroup.options[period.value] || planGroup.options.month || planGroup.options.year
  return opt ? opt.price || opt.price_amount || 0 : 0
}
function getOptionCurrency(planGroup: any) {
  const opt = planGroup.options[period.value] || planGroup.options.month || planGroup.options.year
  return opt ? opt.currency || opt.price_currency || 'USD' : 'USD'
}

const hasActiveSubscription = computed(() => {
  if (!authStore.isAuthenticated) return false

  const profile = profileStore.userProfile as any
  if (!profile?.plan_id || !profile?.plan_expiry) return false

  const expiry = new Date(profile.plan_expiry)
  return expiry.getTime() > Date.now()
})

const hasPaidActiveSubscription = computed(() => {
  return hasActiveSubscription.value && !isCurrentlyOnFreePlan.value
})

function handleAddonClick() {
  if (!hasPaidActiveSubscription.value) {
    showAddonBlocker.value = true
  } else {
    uiState.planCategory = 'addon'
  }
}

function closeAddonBlocker() {
  showAddonBlocker.value = false
}

import { fmtPrice, deriveFeatures, isUnlimitedPlan } from '~/utils/pricingHelpers'
</script>

<style scoped>
.btn-primary {
  background: #2563eb;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
}
.btn-outline {
  background: transparent;
  color: #e6edf3;
  border: 1px solid #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
</style>
