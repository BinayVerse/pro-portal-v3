<!-- components/analytics/AIInsightsModal.vue -->
<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width:
        'w-[900px] max-w-[60vw] !max-w-none border border-[#575757] rounded-xl bg-dark-900 overflow-hidden',
      padding: 'p-0',
      overlay: {
        background: 'bg-gray-900/70 dark:bg-gray-900/80 backdrop-blur-sm',
      },
    }"
    @close="handleClose"
    @keydown.esc="handleClose"
  >
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        header: {
          padding: 'p-6',
        },
        body: {
          padding: 'p-0',
        },
        footer: {
          padding: 'p-6',
        },
      }"
    >
      <!-- Header -->
      <template #header>
        <div class="flex items-start justify-between">
          <!-- Left: Icon + Title -->
          <div class="flex items-start gap-4">
            <!-- Icon Container -->
            <div
              class="w-11 h-11 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30"
            >
              <UIcon name="heroicons:light-bulb" class="w-6 h-6 text-purple-400" />
            </div>

            <!-- Title + Period -->
            <div>
              <h3 class="text-xl font-semibold text-white">AI Signals</h3>

              <p class="text-sm text-gray-400 mt-1">
                Period: {{ formatDateRange(period.start_date, period.end_date) }}
              </p>
            </div>
          </div>

          <!-- Close Button -->
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-mt-1 hover:bg-dark-700"
            @click="handleClose"
          />
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>

      <div v-else-if="error" class="text-center py-16">
        <UIcon name="heroicons:exclamation-circle" class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-400 font-semibold mb-2">Unable to Generate Insights</p>
        <p class="text-gray-400 text-sm mb-6">{{ error }}</p>

        <UButton color="blue" @click="$emit('retry')"> Retry </UButton>
      </div>

      <div v-else-if="!insightsData">
        <div class="text-center py-16">
          <UIcon name="heroicons:information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-300 font-semibold">No Insights Available</p>
          <p class="text-gray-500 text-sm">
            Insights could not be generated for the selected date range.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="insightsData" class="divide-y divide-gray-800">
        <!-- Scrollable Content -->
        <div class="max-h-[65vh] overflow-y-auto pr-2">
          <!-- Critical Alerts Section -->
          <div v-if="insights.critical_alerts?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-400" />
              Critical Alerts
            </h4>

            <div class="space-y-4">
              <div
                v-for="(alert, index) in insights.critical_alerts"
                :key="index"
                class="bg-red-500/10 border border-red-500/30 rounded-xl p-5"
              >
                <h5 class="text-red-400 font-semibold mb-2">
                  {{ alert.title }}
                </h5>

                <p class="text-gray-300 text-sm mb-3">
                  {{ alert.description }}
                </p>

                <p class="text-sm">
                  <span class="text-gray-400 font-medium">Action:</span>
                  <span class="text-gray-300">
                    {{ alert.recommended_action }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <!-- Content Policy Gaps Section -->
          <div v-if="insights.content_policy_gaps?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:shield-exclamation" class="w-5 h-5 text-yellow-400" />
              Content Policy Gaps
            </h4>

            <div class="space-y-4">
              <div
                v-for="(gap, index) in insights.content_policy_gaps"
                :key="index"
                class="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5"
              >
                <h5 class="text-yellow-400 font-semibold mb-2">
                  {{ gap.gap_title }}
                </h5>

                <p class="text-sm text-gray-300 mb-2">
                  <span class="text-gray-400 font-medium">Evidence:</span>
                  {{ gap.evidence }}
                </p>

                <p class="text-sm text-gray-300">
                  <span class="text-gray-400 font-medium">Recommendation:</span>
                  {{ gap.recommendation }}
                </p>
              </div>
            </div>
          </div>

          <!-- Engagement Opportunities Section -->
          <div v-if="insights.engagement_opportunities?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:light-bulb" class="w-5 h-5 text-emerald-400" />
              Engagement Opportunities
            </h4>

            <div class="space-y-4">
              <div
                v-for="(opportunity, index) in insights.engagement_opportunities"
                :key="index"
                class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5"
              >
                <h5 class="text-emerald-400 font-semibold mb-2">
                  {{ opportunity.opportunity }}
                </h5>

                <p class="text-sm text-gray-300 mb-2">
                  <span class="text-gray-400 font-medium">Target:</span>
                  {{ opportunity.target_audience }}
                </p>

                <p class="text-sm text-gray-300">
                  <span class="text-gray-400 font-medium">Impact:</span>
                  {{ opportunity.expected_impact }}
                </p>
              </div>
            </div>
          </div>

          <!-- Recommended Actions Section -->
          <div v-if="insights.recommended_actions?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:check-circle" class="w-5 h-5 text-blue-400" />
              Recommended Actions
            </h4>

            <div class="space-y-4">
              <div
                v-for="(action, index) in insights.recommended_actions"
                :key="index"
                class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span class="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-md">
                    P{{ action.priority }}
                  </span>
                  <span class="text-sm text-gray-400">{{ action.area }}</span>
                </div>

                <p class="text-gray-300 text-sm mb-2">
                  {{ action.observation }}
                </p>

                <p class="text-sm text-gray-300 mb-1">
                  <span class="text-gray-400 font-medium">Action:</span>
                  {{ action.recommended_action }}
                </p>

                <p class="text-xs text-gray-500">Owner: {{ action.owner }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with metrics and actions -->
        <div class="p-6 bg-dark-900 border-t border-dark-700">
          <div class="flex justify-end items-center gap-4 pt-4">
            <UButton
              variant="outline"
              size="lg"
              class="min-w-[120px] justify-center border-gray-600 text-gray-300 hover:bg-gray-700/40 hover:text-white focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              @click="$emit('close')"
            >
              Close
            </UButton>

            <!-- Export (Muted Solid) -->
            <UButton
              variant="outline"
              size="lg"
              class="min-w-[130px] justify-center border-gray-600 text-gray-300 hover:bg-gray-700/40 hover:text-white focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              @click="handleExport"
            >
              Export
            </UButton>

            <!-- Send Email (Primary) -->
            <UButton
              size="lg"
              :loading="props.sendingEmail"
              :disabled="props.sendingEmail"
              class="min-w-[150px] justify-center bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
              @click="handleSendEmail"
            >
              {{ props.sendingEmail ? 'Sending...' : 'Send Email' }}
            </UButton>
          </div>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  modelValue: boolean
  insightsData: any | null
  loading: boolean
  sendingEmail: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
  (e: 'export'): void
  (e: 'sendEmail'): void
  (e: 'retry'): void
}>()

const isOpen = ref(props.modelValue)

// Computed properties for easier access to nested data
const period = computed(() => props.insightsData?.period || { start_date: '', end_date: '' })
const analyticsSummary = computed(() => props.insightsData?.analytics_summary || {})
const insights = computed(() => props.insightsData?.insights || {})

watch(
  () => props.modelValue,
  (val) => {
    isOpen.value = val
  },
)

watch(isOpen, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  isOpen.value = false
  emit('close')
}

const handleExport = () => {
  emit('export')
}

const handleSendEmail = () => {
  emit('sendEmail')
}

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 'Selected period'
  return `${dayjs(startDate).format('YYYY-MM-DD')} to ${dayjs(endDate).format('YYYY-MM-DD')}`
}
</script>
