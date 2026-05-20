<!-- components/analytics/KnowledgeGapModal.vue -->
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
    preventClose
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
              class="w-11 h-11 rounded-xl bg-amber-600/20 flex items-center justify-center border border-amber-500/30"
            >
              <UIcon name="heroicons:chart-bar" class="w-6 h-6 text-amber-400" />
            </div>

            <!-- Title + Period -->
            <div>
              <h3 class="text-xl font-semibold text-white">Knowledge Enhancement Opportunities</h3>

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
        <p class="text-red-400 font-semibold mb-2">Unable to Generate Knowledge Gap Report</p>
        <p class="text-gray-400 text-sm mb-6">{{ error }}</p>

        <UButton color="blue" @click="$emit('retry')"> Retry </UButton>
      </div>

      <div v-else-if="!knowledgeGapData">
        <div class="text-center py-16">
          <UIcon name="heroicons:information-circle" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-300 font-semibold">No Knowledge Gap Data Available</p>
          <p class="text-gray-500 text-sm">
            Data could not be generated for the selected date range.
          </p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="divide-y divide-gray-800">
        <!-- Scrollable Content -->
        <div class="max-h-[65vh] overflow-y-auto pr-2">
          <!-- Quality Summary Section -->
          <div class="p-6 pt-1.5">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:chart-pie" class="w-5 h-5 text-blue-400" />
              Coverage Summary
            </h4>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Total Queries</p>
                <p class="text-2xl font-bold text-white mt-2">{{ qualitySummary.total_queries }}</p>
              </div>
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Answered</p>
                <p class="text-2xl font-bold text-green-400 mt-2">{{ qualitySummary.answered }}</p>
              </div>
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Unanswered</p>
                <p class="text-2xl font-bold text-red-400 mt-2">{{ qualitySummary.unanswered }}</p>
              </div>
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Coverage Rate</p>
                <p class="text-2xl font-bold text-blue-400 mt-2">
                  {{ qualitySummary.coverage_rate_pct?.toFixed(1) }}%
                </p>
              </div>
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Gap Rate</p>
                <p class="text-2xl font-bold text-yellow-400 mt-2">
                  {{ qualitySummary.gap_rate_pct?.toFixed(1) }}%
                </p>
              </div>
              <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
                <p class="text-gray-400 text-sm">Trend</p>
                <p :class="`text-lg font-bold mt-2 ${getTrendColor(qualitySummary.trend_signal)}`">
                  {{ capitalize(qualitySummary.trend_signal) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Top Unanswered Questions Section -->
          <div v-if="topUnansweredQuestions.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:exclamation-circle" class="w-5 h-5 text-red-400" />
              Top Unanswered Questions
            </h4>

            <div class="space-y-3">
              <div
                v-for="(question, index) in topUnansweredQuestions"
                :key="index"
                class="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
              >
                <div class="flex items-start justify-between mb-2">
                  <h5 class="text-red-400 font-semibold flex-1">{{ question.intent }}</h5>
                  <span class="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded ml-2">
                    Queried {{ question.combined_frequency }}x
                  </span>
                </div>
                <p class="text-sm text-gray-400">
                  {{ question.unique_askers }} unique user{{
                    question.unique_askers !== 1 ? 's' : ''
                  }}
                  | Last queried: {{ formatDate(question.last_asked) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Coverage Trend Section -->
          <div v-if="coverageTrend.data?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:chart-bar-square" class="w-5 h-5 text-cyan-400" />
              Coverage Trend ({{ coverageTrend.bucket }})
            </h4>

            <div class="bg-dark-800 rounded-lg p-4 border border-dark-700">
              <apexchart
                type="bar"
                :series="coverageTrendSeries"
                :options="coverageTrendChartOptions"
                :height="300"
              ></apexchart>
            </div>
          </div>

          <!-- By Department Section -->
          <div v-if="byDepartment.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:building-office" class="w-5 h-5 text-purple-400" />
              Coverage by Department
            </h4>

            <div class="space-y-3">
              <div
                v-for="dept in byDepartment"
                :key="dept.department"
                class="bg-dark-800 rounded-lg p-4 border border-dark-700"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white font-medium">{{ dept.department }}</span>
                  <span class="text-green-400 text-sm"
                    >{{ dept.coverage_rate_pct?.toFixed(1) }}%</span
                  >
                </div>
                <div class="w-full bg-dark-700 rounded-full h-2">
                  <div
                    class="bg-green-600 h-2 rounded-full"
                    :style="{ width: `${Math.min(dept.coverage_rate_pct || 0, 100)}%` }"
                  ></div>
                </div>
                <p class="text-xs text-gray-400 mt-2">
                  {{ dept.total_queries }} total | {{ dept.unanswered }} unanswered
                </p>
              </div>
            </div>
          </div>

          <!-- Gap Analysis Section -->
          <div v-if="gapAnalysis.gap_clusters?.length" class="p-6">
            <h4 class="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UIcon name="heroicons:light-bulb" class="w-5 h-5 text-yellow-400" />
              Gap Analysis & Recommendations
            </h4>

            <div class="space-y-4">
              <div
                v-for="(cluster, index) in gapAnalysis.gap_clusters"
                :key="index"
                class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
              >
                <h5 class="text-yellow-400 font-semibold mb-3">{{ cluster.cluster_title }}</h5>

                <div class="mb-3 space-y-1">
                  <p class="text-sm text-gray-300">
                    <span class="text-gray-400">Queried {{ cluster.total_times_asked }} times</span>
                  </p>
                  <p class="text-sm text-gray-300">
                    <span class="text-gray-400"
                      >{{ cluster.unique_employees_affected }} employee{{
                        cluster.unique_employees_affected !== 1 ? 's' : ''
                      }}
                      affected</span
                    >
                  </p>
                </div>

                <div v-if="cluster.sample_questions?.length" class="mb-3 p-2 bg-dark-800 rounded">
                  <p class="text-xs text-gray-400 mb-2">Sample Questions:</p>
                  <ul class="text-xs text-gray-300 space-y-1">
                    <li
                      v-for="(q, qIdx) in cluster.sample_questions"
                      :key="qIdx"
                      class="list-disc list-inside"
                    >
                      {{ q }}
                    </li>
                  </ul>
                </div>

                <div v-if="cluster.recommended_documents?.length" class="space-y-2">
                  <p class="text-xs text-gray-400 mb-2">Recommended Documents:</p>
                  <div
                    v-for="(doc, dIdx) in cluster.recommended_documents"
                    :key="dIdx"
                    class="bg-dark-800 rounded p-2 text-xs"
                  >
                    <p class="text-gray-300 font-medium">{{ doc.document_title }}</p>
                    <p class="text-gray-500">{{ doc.reason }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Executive Summary -->
            <div
              v-if="gapAnalysis.executive_summary"
              class="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
            >
              <p class="text-sm text-blue-300">
                <span class="font-medium text-blue-400">Summary:</span>
                {{ gapAnalysis.executive_summary }}
              </p>
            </div>
          </div>
        </div>

        <!-- Footer with actions -->
        <div class="pt-4 bg-dark-900 border-t border-dark-700">
          <div class="flex justify-end items-center gap-4">
            <UButton
              variant="outline"
              size="lg"
              class="min-w-[120px] justify-center border-gray-600 text-gray-300 hover:bg-gray-700/40 hover:text-white focus:ring-2 focus:ring-gray-500 transition-all duration-200"
              @click="$emit('close')"
            >
              Close
            </UButton>

            <!-- Export -->
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
  knowledgeGapData: any | null
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
const period = computed(() => props.knowledgeGapData?.period || { start_date: '', end_date: '' })
const qualitySummary = computed(() => props.knowledgeGapData?.quality_summary || {})
const topUnansweredQuestions = computed(
  () => props.knowledgeGapData?.top_unanswered_questions || [],
)
const coverageTrend = computed(
  () => props.knowledgeGapData?.coverage_trend || { bucket: '', data: [] },
)
const byDepartment = computed(() => props.knowledgeGapData?.by_department || [])
const gapAnalysis = computed(() => props.knowledgeGapData?.gap_analysis || {})

const capitalize = (text: any) => {
  if (!text) return 'N/A'
  return text
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const coverageTrendSeries = computed(() => {
  if (!coverageTrend.value.data?.length) return []

  const answeredData = coverageTrend.value.data.map((period) => period.answered)
  const unansweredData = coverageTrend.value.data.map((period) => period.unanswered)

  return [
    {
      name: 'Answered',
      data: answeredData,
    },
    {
      name: 'Unanswered',
      data: unansweredData,
    },
  ]
})

const coverageTrendChartOptions = computed(() => {
  if (!coverageTrend.value.data?.length)
    return {
      chart: { type: 'bar', toolbar: { show: false } },
      xaxis: { categories: [] },
    }

  // Generate X-axis labels dynamically based on the bucket type
  const bucket = coverageTrend.value.bucket?.toLowerCase() || 'daily'
  const xaxisLabels = coverageTrend.value.data.map((period, index) => {
    const date = dayjs(period.period)

    switch (bucket) {
      case 'daily':
        return date.format('YYYY-MM-DD')
      case 'weekly':
        return `Week of ${date.format('YYYY-MM-DD')}`
      case 'monthly':
        return date.format('MMMM YYYY')
      case 'yearly':
        return date.format('YYYY')
      default:
        return formatDate(period.period)
    }
  })

  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '65%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 0,
      colors: ['transparent'],
    },
    colors: ['#16a34a', '#dc2626'],
    xaxis: {
      categories: xaxisLabels,
      title: {
        text: `Period (${capitalize(bucket)})`,
        style: {
          color: '#9ca3af',
          fontSize: '12px',
        },
      },
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Answered vs Unanswered Queries',
        style: {
          color: '#9ca3af',
          fontSize: '12px',
        },
      },
      labels: {
        style: {
          colors: '#9ca3af',
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val.toString()
        },
      },
      theme: 'dark',
    },
    legend: {
      position: 'top',
      labels: {
        colors: '#e5e7eb',
      },
    },
  }
})

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

const formatDate = (date?: string) => {
  if (!date) return 'N/A'
  return dayjs(date).format('YYYY-MM-DD')
}

const getTrendColor = (trend?: string) => {
  switch (trend?.toLowerCase()) {
    case 'improving':
      return 'text-green-400'
    case 'worsening':
      return 'text-red-400'
    case 'stable':
      return 'text-blue-400'
    default:
      return 'text-gray-400'
  }
}
</script>
