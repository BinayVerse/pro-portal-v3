<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header with Date Range -->
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <AppTooltip text="Back to Dashboard">
            <UButton
              to="/admin/superadmin"
              variant="ghost"
              color="gray"
              icon="heroicons:arrow-left"
              class="!px-2 !py-1"
              aria-label="Back to Dashboard"
            />
          </AppTooltip>
          <div>
            <h1 class="text-2xl font-bold text-white">Analytics of {{ orgName }}</h1>
            <p class="text-gray-400">Organizations comprehensive usage report</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <select v-model="selectedTimeRange" class="input-field">
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.rangeLabel }}
            </option>
          </select>
          <!-- <button
            @click="exportReport"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <UIcon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
            <span>Export Report</span>
          </button> -->
        </div>
      </div>

      <!-- Top Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total Queries -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Total Queries</p>
              <p class="text-3xl font-bold text-white mt-2">
                {{ loadingStates.metrics ? '...' : totalQueriesCount.toLocaleString() }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center"
            >
              <UIcon name="heroicons:chart-bar" class="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <!-- Active Users -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Total Users</p>
              <p
                class="text-3xl font-bold text-white mt-2 cursor-pointer"
                @click="showOrganizationUsers"
              >
                {{
                  loadingStates.metrics
                    ? '...'
                    : (
                        (analyticsStore.organizationDetails as any)?.total_users || 0
                      ).toLocaleString()
                }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center"
            >
              <UIcon name="heroicons:users" class="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <!-- Documents Created -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Artifacts Created</p>
              <p
                class="text-3xl font-bold text-white mt-2 cursor-pointer"
                @click="showOrganizationDocuments"
              >
                {{
                  loadingStates.metrics
                    ? '...'
                    : (
                        (analyticsStore.organizationDetails as any)?.docs_uploaded || 0
                      ).toLocaleString()
                }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center"
            >
              <UIcon name="heroicons:document-text" class="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <!-- Token Usage -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Token Usage</p>
              <p
                class="text-3xl font-bold text-white mt-2 cursor-pointer"
                @click="showOrganizationTokenUsage"
              >
                {{ loadingStates.metrics ? '...' : totalTokens.toLocaleString() }}
              </p>
            </div>
            <div v-if="loadingStates.metrics" class="w-12 h-12 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
            <div
              v-else
              class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center"
            >
              <UIcon name="heroicons:bolt" class="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- User-wise Token Usage by Channel -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">User-wise Token Usage by Channel</h2>
            <p class="text-gray-400 text-sm">Token consumption across different channels</p>
          </div>
          <div class="flex-1 p-6 relative min-h-80">
            <div
              v-if="loadingStates.stackedBar"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <StackedBarChart v-else :chartData="stackedChartData" />
          </div>
        </div>

        <!-- App-wise Token Usage -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">App-wise Token Usage</h2>
            <p class="text-gray-400 text-sm">Token distribution across different applications</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6 relative min-h-80">
            <div
              v-if="loadingStates.pieChart"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <div v-else class="max-w-md w-full flex justify-center">
              <PieChart
                :data="pieChartData"
                :labels="pieChartLabelsOrdered"
                :colors="pieChartColors"
                class="max-h-80"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Daily User-wise Token Usage -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Daily Top 5 Users by Token Usage</h2>
          <p class="text-gray-400 text-sm">Daily top 5 token consumption patterns by application</p>
        </div>
        <div class="p-6 relative min-h-80">
          <div
            v-if="loadingStates.metrics"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <StackedAreaChart
            v-else
            :data="stackedAreaChartData"
            :categories="stackedAreaChartCategories"
            :time-range="selectedTimeRange"
          />
        </div>
      </div>

      <!-- Bottom Grid -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Category-wise Document Distribution -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Category-wise Document Distribution</h2>
            <p class="text-gray-400 text-sm">Document usage distribution by category</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6 relative min-h-80">
            <div
              v-if="loadingStates.donutChart"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <div v-else class="max-w-md w-full flex justify-center">
              <DonutChart
                :data="donutChartData"
                :labels="donutChartLabels"
                :colors="pieChartColors"
              />
            </div>
          </div>
        </div>

        <!-- Top 5 Queried Documents -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Top 5 Queried Documents</h2>
            <p class="text-gray-400 text-sm">Most frequently accessed documents</p>
          </div>
          <div class="p-6 relative min-h-60">
            <div
              v-if="loadingStates.topDocuments"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <template v-else>
              <div class="space-y-4">
                <div
                  v-for="(doc, index) in topDocuments"
                  :key="index"
                  class="flex items-center justify-between p-3 bg-dark-900 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div>
                      <p class="text-white font-medium text-sm">{{ doc.name }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-white font-medium">{{ doc.usage }}</p>
                    <p class="text-gray-400 text-xs">usage</p>
                  </div>
                </div>
              </div>
              <div v-if="topDocuments.length === 0" class="text-center text-gray-400 py-4">
                No document data available
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Frequently Asked Questions -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Top 10 Frequently Asked Questions</h2>
          <p class="text-gray-400 text-sm">Most common questions and query patterns</p>
        </div>
        <div class="p-6 relative min-h-60">
          <div
            v-if="loadingStates.frequentQuestions"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <template v-else>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="(column, columnIndex) in splitFrequentQuestions"
                :key="columnIndex"
                class="space-y-4"
              >
                <div v-for="(faq, index) in column" :key="index" class="p-4 bg-dark-900 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-white font-medium text-sm pr-4">{{ faq.question }}</h3>
                    <div class="text-right flex-shrink-0">
                      <div class="text-xl font-bold text-white">{{ faq.count }}</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-end">
                    <div class="text-xs text-gray-400">times</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="frequentQuestions.length === 0" class="text-center text-gray-400 py-4">
              No frequently asked questions available
            </div>
          </template>
        </div>
      </div>

      <!-- User Modal -->
      <UModal
        key="analytics-user-table"
        v-model="userModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                User List
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="userModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-user-table"
            :columns="userColumns"
            :rows="analyticsStore.orgUserList"
            :loading="userLoading"
            :showActionButton="false"
          />
        </UCard>
      </UModal>

      <!-- Document Modal -->
      <UModal
        key="analytics-document-table"
        v-model="documentModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Document List
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="documentModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-document-table"
            :columns="docColumns"
            :rows="analyticsStore.orgDocList"
            :loading="documentLoading"
            :showActionButton="false"
          />
        </UCard>
      </UModal>

      <!-- Token Usage Modal -->
      <UModal
        key="analytics-token-usage-table"
        v-model="tokenUsageModalIsOpen"
        prevent-close
        :ui="{ width: 'custom-width' }"
      >
        <UCard
          :ui="{
            ring: '',
            divide: 'divide-y divide-gray-100 dark:divide-gray-800',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Token Usage Details
              </h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark-20-solid"
                class="-my-1"
                @click="tokenUsageModalIsOpen = false"
              />
            </div>
          </template>

          <CustomTable
            key="analytics-token-usage-table"
            :columns="tokenUsageColumns"
            :rows="analyticsStore.tokenDetails"
            :showActionButton="false"
          />
        </UCard>
      </UModal>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
useHead({ title: 'Super Admin Analytics - Super Admin Dashboard - provento.ai' })

definePageMeta({ layout: 'admin', middleware: ['auth', 'superadmin'] })
import { ref, onMounted, computed, watch } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { useRoute } from 'vue-router'
import { useSuperAdminStore } from '~/stores/superadmin/index'

dayjs.extend(utc)
dayjs.extend(timezone)

// Import chart components
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import StackedAreaChart from '@/components/charts/StackedAreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import { getColorsForLabels, orderLabels } from '@/utils/chartColors'

const { showNotification } = useNotification()
const analyticsStore = useAnalyticsStore()
const authStore = useAuthStore()
const superAdminStore = useSuperAdminStore()
const authUser = computed(() => authStore.getAuthUser)
const route = useRoute()
const orgId = ref<string | null>(null)
const orgName = ref('')
const loading = ref(true)
const selectedTimeRange = ref('7')
const timeZone = ref(dayjs.tz.guess())

// Modal states
const userModalIsOpen = ref(false)
const documentModalIsOpen = ref(false)
const tokenUsageModalIsOpen = ref(false)
const userLoading = ref(false)
const documentLoading = ref(false)

// Individual loading states
const loadingStates = ref({
  metrics: true,
  stackedBar: true,
  pieChart: true,
  areaChart: true,
  donutChart: true,
  topDocuments: true,
  frequentQuestions: true,
})

// Computed organization ID
const organizationId = computed(() => orgId.value)

// Time range options
const timeRangeOptions = [
  { value: '7', rangeLabel: 'Last 7 Days' },
  { value: '30', rangeLabel: 'Last 1 Month' },
  { value: '90', rangeLabel: 'Last 3 Months' },
  { value: '180', rangeLabel: 'Last 6 Months' },
  { value: '365', rangeLabel: 'Last 12 Months' },
]

// Table columns
const userColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'contact_number', label: 'Mobile' },
  { key: 'source', label: 'Source' },
]

const docColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'File Name' },
  { key: 'formattedUpdatedAt', label: 'Last Updated' },
]

const tokenUsageColumns = [
  { key: 'sl_no', label: 'Sl No.' },
  { key: 'name', label: 'Name' },
  { key: 'total_tokens_sum', label: 'Tokens Consumed' },
]

// Helper functions
const getLocalDateString = (date: dayjs.Dayjs, timeZone: string) => {
  return date.tz(timeZone).startOf('day').format('YYYY-MM-DD')
}

const setAllLoadingStates = (value: boolean) => {
  Object.keys(loadingStates.value).forEach((key) => {
    loadingStates.value[key] = value
  })
  loading.value = value
}

// Date range computation
const dateRange = computed(() => {
  const userTimeZone = timeZone.value
  const endDate = getLocalDateString(dayjs(), userTimeZone)
  let startDate

  switch (selectedTimeRange.value) {
    case '7':
      startDate = getLocalDateString(dayjs().subtract(6, 'days'), userTimeZone)
      break
    case '30':
      startDate = getLocalDateString(dayjs().subtract(1, 'months'), userTimeZone)
      break
    case '90':
      startDate = getLocalDateString(dayjs().subtract(3, 'months'), userTimeZone)
      break
    case '180':
      startDate = getLocalDateString(dayjs().subtract(6, 'months'), userTimeZone)
      break
    case '365':
      startDate = getLocalDateString(dayjs().subtract(1, 'year'), userTimeZone)
      break
    default:
      startDate = getLocalDateString(dayjs().subtract(6, 'days'), userTimeZone)
  }

  return { startDate, endDate, timeZone: userTimeZone }
})

// Data transformation functions
function transformUserAppWiseData(result: any) {
  if (!result) return []

  const plainData = JSON.parse(JSON.stringify(result))
  if (!Array.isArray(plainData)) return []

  const allApps = new Set()
  plainData.forEach((user: any) => {
    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        allApps.add(app.request_type)
      })
    }
  })

  // Convert to ordered array based on canonical app order
  const allAppsOrdered = orderLabels(Array.from(allApps))

  return plainData.map((user: any) => {
    const usage: Record<string, number> = {}
    // Initialize keys in the desired order to ensure stable insertion order
    allAppsOrdered.forEach((app) => (usage[app as string] = 0))

    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        usage[app.request_type] = parseInt(app.total_tokens) || 0
      })
    }

    return {
      name: user.name || 'Unknown User',
      ...usage,
    }
  })
}

// Computed data properties
const totalTokens = computed(() => {
  return analyticsStore.tokenDetails.reduce((acc, user) => {
    return acc + Number(user.total_tokens_sum || 0)
  }, 0)
})

const activeUsersCount = computed(() => analyticsStore.activeUsersCount)
const totalQueriesCount = computed(() => analyticsStore.totalQueriesCount)

const stackedChartData = computed(() => {
  return transformUserAppWiseData(analyticsStore.userAppWiseTokenDetail)
})

const pieChartData = computed(() => {
  if (!analyticsStore.appTokenDetails?.length) return []
  // Build a map of app name -> total tokens
  const map: Record<string, number> = {}
  analyticsStore.appTokenDetails.forEach((app: any) => {
    map[app.name || 'Unknown App'] = parseInt(app.total_tokens) || 0
  })
  // Return values in the ordered label sequence
  return pieChartLabelsOrdered.value.map((label) => map[label] ?? 0)
})

const pieChartLabels = computed(() => {
  if (!analyticsStore.appTokenDetails?.length) return []
  return analyticsStore.appTokenDetails.map((app: any) => app.name || 'Unknown App')
})

// Ensure labels appear in canonical app order
const pieChartLabelsOrdered = computed(() => orderLabels(pieChartLabels.value))

const pieChartColors = computed(() => getColorsForLabels(pieChartLabelsOrdered.value))

const stackedAreaChartData = computed(() => {
  if (!analyticsStore.tokenDetails?.length) return []

  const topUsers = [...analyticsStore.tokenDetails]
    .sort((a: any, b: any) => {
      const aTotal = parseInt(a.total_tokens_sum) || 0
      const bTotal = parseInt(b.total_tokens_sum) || 0
      return bTotal - aTotal
    })
    .slice(0, 5)

  const allDates = new Set<string>()
  topUsers.forEach((user: any) => {
    user.token_usage_details?.forEach((detail: any) => {
      allDates.add(detail.date)
    })
  })

  // Add dates from selected range
  const { startDate, endDate } = dateRange.value
  let currentDate = dayjs(startDate)
  const endDateObj = dayjs(endDate)

  while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj)) {
    allDates.add(currentDate.format('YYYY-MM-DD'))
    currentDate = currentDate.add(1, 'day')
  }

  const sortedDates = Array.from(allDates).sort()

  return topUsers.map((user: any) => {
    const dateMap = new Map()
    user.token_usage_details?.forEach((detail: any) => {
      dateMap.set(detail.date, parseInt(detail.total_tokens) || 0)
    })

    const data = sortedDates.map((date) => ({
      x: date,
      y: dateMap.get(date) || 0,
    }))

    return {
      name: user.name || 'Unknown User',
      data: data,
    }
  })
})

const stackedAreaChartCategories = computed(() => {
  if (stackedAreaChartData.value.length === 0) return []

  const allDates = new Set<string>()
  stackedAreaChartData.value.forEach((userData: any) => {
    userData.data.forEach((point: any) => {
      allDates.add(point.x)
    })
  })

  const sortedDates = Array.from(allDates).sort()
  const range = parseInt(selectedTimeRange.value) || 7
  const density = range <= 7 ? 1 : range <= 30 ? 2 : range <= 90 ? 7 : 15

  return sortedDates.map((date, index) => {
    if (range <= 7 || index % density === 0 || index === sortedDates.length - 1) {
      return dayjs(date).format('MMM DD')
    }
    return ''
  })
})

const donutChartData = computed(() => {
  if (!analyticsStore.orgDocList?.length) return []

  const categoryCounts: Record<string, number> = {}
  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || 'Uncategorized'
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.values(categoryCounts)
})

const donutChartLabels = computed(() => {
  if (!analyticsStore.orgDocList?.length) return []

  const categoryCounts: Record<string, number> = {}
  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || 'Uncategorized'
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.keys(categoryCounts).map((category) => {
    return category
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  })
})

const topDocuments = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const docs = orgDetails?.documents_analysis || []

  return docs
    .sort((a: any, b: any) => b.reference_count - a.reference_count)
    .slice(0, 5)
    .map((doc: any) => ({
      name: doc.document_source.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      queries: doc.reference_count,
      usage:
        doc.reference_count >= 1000
          ? `${(doc.reference_count / 1000).toFixed(1)}k`
          : doc.reference_count.toString(),
    }))
})

const frequentQuestions = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const questions = orgDetails?.questions || []

  return questions
    .map((q: any, index: number) => ({
      id: index + 1,
      question: q.representative,
      // prefer total_count (actual occurrences) if available, fallback to number of distinct similar questions
      count: Number(q.total_count ?? q.similar_questions?.length ?? 1),
      category: 'General',
    }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
    .slice(0, 10)
})

const splitFrequentQuestions = computed(() => {
  const items = frequentQuestions.value

  // Split into two columns with higher counts in the first column
  const firstColumn = []
  const secondColumn = []

  for (let i = 0; i < items.length; i++) {
    if (i % 2 === 0) {
      firstColumn.push(items[i])
    } else {
      secondColumn.push(items[i])
    }
  }

  return [firstColumn, secondColumn]
})

// Actions
const showOrganizationUsers = async () => {
  try {
    userLoading.value = true
    userModalIsOpen.value = true
    await analyticsStore.fetchOrganizationUsers(organizationId.value!)
  } catch (error) {
    console.error('Error fetching organization users:', error)
    showNotification('Failed to load users', 'error')
  } finally {
    userLoading.value = false
  }
}

const showOrganizationDocuments = async () => {
  try {
    documentLoading.value = true
    documentModalIsOpen.value = true
    await analyticsStore.fetchOrganizationDocuments(organizationId.value!)
  } catch (error) {
    console.error('Error fetching organization documents:', error)
    showNotification('Failed to load document', 'error')
  } finally {
    documentLoading.value = false
  }
}

const showOrganizationTokenUsage = () => {
  tokenUsageModalIsOpen.value = true
}

const fetchData = async () => {
  if (!organizationId.value) {
    showNotification('Organization ID not found', 'error')
    setAllLoadingStates(false)
    return
  }

  setAllLoadingStates(true)

  try {
    const { startDate, endDate, timeZone: userTimeZone } = dateRange.value

    await Promise.allSettled([
      // Metrics and area chart data
      analyticsStore
        .fetchTokenWiseDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.metrics = false
        }),

      // Category-wise document data (donut chart)
      analyticsStore.fetchOrganizationDocuments(organizationId.value).finally(() => {
        loadingStates.value.donutChart = false
      }),

      // Stacked bar chart data
      analyticsStore
        .fetchUserAppWiseTokenDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.stackedBar = false
        }),

      // Pie chart data
      analyticsStore
        .fetchAppWiseTokenDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.pieChart = false
        }),

      // Organization detail (contains top documents and frequent questions)
      analyticsStore
        .fetchOrganizationDetail(organizationId.value, startDate, endDate, userTimeZone)
        .finally(() => {
          loadingStates.value.topDocuments = false
          loadingStates.value.frequentQuestions = false
        }),
    ]).finally(() => {
      loading.value = false
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    showNotification('Failed to load analytics data', 'error')
    setAllLoadingStates(false)
    loading.value = false
  }
}

const exportReport = () => {
  try {
    if (!analyticsStore.organizationDetails) {
      showNotification('No data available to export', 'error')
      return
    }

    const rows: string[][] = []
    const orgDetails = analyticsStore.organizationDetails as any

    // Organization Summary
    rows.push(['--- Organization Summary ---'])
    rows.push(['Active Users', String(orgDetails?.total_users || 0)])
    rows.push(['Artifacts Created', String(orgDetails?.docs_uploaded || 0)])
    rows.push(['Total Tokens', String(totalTokens.value || 0)])
    rows.push(['Total Queries', String(totalQueriesCount.value || 0)])

    // App-wise Token Usage
    rows.push([], ['--- App-wise Token Usage ---'], ['App', 'Tokens'])
    analyticsStore.appTokenDetails?.forEach((app: any) => {
      rows.push([app.name, String(app.total_tokens || 0)])
    })

    // User-wise Token Usage
    rows.push([], ['--- User-wise Token Usage ---'], ['User', 'Tokens'])
    analyticsStore.tokenDetails?.forEach((user: any) => {
      const total =
        user.token_usage_details?.reduce(
          (sum: number, detail: any) => sum + (parseInt(detail.total_tokens) || 0),
          0,
        ) || 0
      rows.push([user.name || 'Unknown', String(total)])
    })

    // Daily-wise User-wise Token Usage
    rows.push([], ['--- Daily-wise User-wise Token Usage ---'], ['Date', 'User', 'Tokens'])
    const aggregated: Record<string, number> = {}
    analyticsStore.tokenDetails?.forEach((user: any) => {
      user.token_usage_details?.forEach((detail: any) => {
        const key = `${detail.date}|${user.name || 'Unknown'}`
        aggregated[key] = (aggregated[key] || 0) + (parseInt(detail.total_tokens) || 0)
      })
    })
    Object.entries(aggregated).forEach(([key, tokens]) => {
      const [date, user] = key.split('|')
      rows.push([date, user, String(tokens)])
    })

    // Category-wise Document Distribution
    rows.push([], ['--- Category-wise Document Distribution ---'], ['Category', 'Count'])
    donutChartLabels.value.forEach((label, index) => {
      rows.push([label, String(donutChartData.value[index] || 0)])
    })

    // Top Documents
    rows.push([], ['--- Top Documents ---'], ['Name', 'Queries'])
    topDocuments.value.forEach((doc: any) => {
      rows.push([doc.name, String(doc.queries || 0)])
    })

    // Top 10 Frequently Asked Questions
    rows.push([], ['--- Top 10 Frequently Asked Questions ---'], ['Question', 'Count'])
    frequentQuestions.value.slice(0, 10).forEach((faq: any) => {
      // Use proper CSV formatting - wrap question in quotes to handle commas
      rows.push([`"${faq.question.replace(/"/g, '""')}"`, String(faq.count || 0)])
    })

    // Create and download CSV
    const csvContent = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `analytics_report_${dayjs().format('YYYYMMDD')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification('Report exported successfully', 'success')
  } catch (error) {
    console.error('Error exporting report:', error)
    showNotification('Failed to export report', 'error')
  }
}

const readOrgFromRoute = () => {
  const q = route.query.org as string | undefined
  if (q && String(q).trim()) {
    orgId.value = String(q)
    // try to read org name from superadmin store immediately for faster UX
    const found = superAdminStore.organizations.find((o: any) => o.org_id === orgId.value)
    if (found) orgName.value = found.org_name || '-'
    else orgName.value = '-'
  } else {
    orgId.value = null
    orgName.value = '-'
  }
}

// Watch for time range changes
watch(selectedTimeRange, fetchData)

watch(
  () => route.query.org,
  () => {
    readOrgFromRoute()
  },
)

// Lifecycle
onMounted(fetchData)
readOrgFromRoute()
</script>

<style scoped>
.input-field {
  @apply bg-dark-700 border border-dark-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none;

  /* Add spinner animation */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
}
</style>
