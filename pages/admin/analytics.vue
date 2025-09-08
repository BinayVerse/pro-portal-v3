<template>
  <AdminLayout>
    <div class="space-y-6">
      <!-- Header with Date Range -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p class="text-gray-400">Comprehensive usage reports</p>
        </div>
        <div class="flex items-center gap-4">
          <select v-model="selectedTimeRange" @change="fetchGraphData" class="input-field">
            <option v-for="option in timeRangeOptions" :key="option.value" :value="option.value">
              {{ option.rangeLabel }}
            </option>
          </select>
          <button @click="exportReport"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
            <UIcon name="heroicons:arrow-down-tray" class="w-4 h-4 mr-2" />
            <span>Export Report</span>
          </button>
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
                {{ loading ? '...' : totalQueriesCount.toLocaleString() }}
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <UIcon name="heroicons:chart-bar" class="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <!-- Active Users -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Active Users</p>
              <p class="text-3xl font-bold text-white mt-2 cursor-pointer" @click="showOrganizationUsers">
                 {{ loading ? '...' : ((analyticsStore.organizationDetails as any)?.total_users || 0).toLocaleString() }} </p>
            </div>
            <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <UIcon name="heroicons:users" class="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <!-- Documents Created -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Documents Created</p>
              <p class="text-3xl font-bold text-white mt-2 cursor-pointer" @click="showOrganizationDocuments">
                {{ loading ? '...' : ((analyticsStore.organizationDetails as any)?.docs_uploaded || 0).toLocaleString()
                }}
              </p>
            </div>
            <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <UIcon name="heroicons:document-text" class="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <!-- Token Usage -->
        <div class="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-400 text-sm font-medium">Token Usage</p>
              <p class="text-3xl font-bold text-white mt-2 cursor-pointer" @click="showOrganizationTokenUsage">
                {{ loading ? '...' : totalTokens.toLocaleString() }}
              </p>
            </div>
            <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
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
          <div class="flex-1 p-6"> <!-- No flex-center, full width -->
            <StackedBarChart :chartData="stackedChartData" />
          </div>
        </div>

        <!-- App-wise Token Usage -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">App-wise Token Usage</h2>
            <p class="text-gray-400 text-sm">Token distribution across different applications</p>
          </div>
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="max-w-md w-full flex justify-center">
              <PieChart :data="pieChartData" :labels="pieChartLabels"
                :colors="['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']" class="max-h-80" />
            </div>
          </div>
        </div>
      </div>

      <!-- Daily User-wise Token Usage -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Daily-wise User-wise Token Usage</h2>
          <p class="text-gray-400 text-sm">Daily token consumption patterns by application</p>
        </div>
        <div class="p-6">
          <StackedAreaChart :data="stackedAreaChartData" :categories="stackedAreaChartCategories"
            :time-range="selectedTimeRange" :colors="['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']" />
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
          <div class="flex-1 flex items-center justify-center p-6">
            <div class="max-w-md w-full flex justify-center">
              <DonutChart :data="donutChartData" :labels="donutChartLabels"
                :colors="['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']" />
            </div>
          </div>
        </div>

        <!-- Top 5 Queried Documents -->
        <div class="bg-dark-800 rounded-lg border border-dark-700 flex flex-col">
          <div class="p-6 border-b border-dark-700">
            <h2 class="text-lg font-semibold text-white">Top 5 Queried Documents</h2>
            <p class="text-gray-400 text-sm">Most frequently accessed documents</p>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div v-for="(doc, index) in topDocuments" :key="index"
                class="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
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
          </div>
        </div>
      </div>

      <!-- Frequently Asked Questions -->
      <div class="bg-dark-800 rounded-lg border border-dark-700">
        <div class="p-6 border-b border-dark-700">
          <h2 class="text-lg font-semibold text-white">Top 10 Frequently Asked Questions</h2>
          <p class="text-gray-400 text-sm">Most common questions and query patterns</p>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="(column, columnIndex) in splitFrequentQuestions" :key="columnIndex" class="space-y-4">
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
        </div>
      </div>

      <!-- User Modal -->
      <UModal key="analytics-user-table" v-model="userModalIsOpen" prevent-close :ui="{ width: 'custom-width' }">
        <UCard :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                User List
              </h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                @click="userModalIsOpen = false" />
            </div>
          </template>

          <CustomTable key="analytics-user-table" :columns="userColumns" :rows="analyticsStore.orgUserList"
            :loading="userLoading" :showActionButton="false" />
        </UCard>
      </UModal>

      <!-- Document Modal -->
      <UModal key="analytics-document-table" v-model="documentModalIsOpen" prevent-close
        :ui="{ width: 'custom-width' }">
        <UCard :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Document List
              </h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                @click="documentModalIsOpen = false" />
            </div>
          </template>

          <CustomTable key="analytics-document-table" :columns="docColumns" :rows="analyticsStore.orgDocList"
            :loading="documentLoading" :showActionButton="false" />
        </UCard>
      </UModal>

      <!-- Token Usage Modal -->
      <UModal key="analytics-token-usage-table" v-model="tokenUsageModalIsOpen" prevent-close
        :ui="{ width: 'custom-width' }">
        <UCard :ui="{
          ring: '',
          divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        }">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Token Usage Details
              </h3>
              <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
                @click="tokenUsageModalIsOpen = false" />
            </div>
          </template>

          <CustomTable key="analytics-token-usage-table" :columns="tokenUsageColumns"
            :rows="analyticsStore.tokenDetails" :showActionButton="false" />
        </UCard>
      </UModal>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})
import { ref, onMounted, computed } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useAnalyticsStore } from '@/stores/analytics'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

// Import chart components
import StackedBarChart from '@/components/charts/StackedBarChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import StackedAreaChart from '@/components/charts/StackedAreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'

const { showNotification } = useNotification()
const analyticsStore = useAnalyticsStore()
const authStore = useAuthStore()
const authUser = computed(() => authStore.getAuthUser)

const activeUsersCount = computed(() => analyticsStore.activeUsersCount);
const totalQueriesCount = computed(() => analyticsStore.totalQueriesCount);

const loading = ref(true)
const selectedTimeRange = ref('7')
const timeZone = dayjs.tz.guess()

// Add these variables
const userModalIsOpen = ref(false);
const documentModalIsOpen = ref(false);
const tokenUsageModalIsOpen = ref(false);
const userLoading = ref(false);
const documentLoading = ref(false);

// Get organization ID from auth user
const organizationId = computed(() => authUser.value?.org_id)

const totalTokens = computed(() => {
  return analyticsStore.tokenDetails.reduce((acc, user) => {
    return acc + Number(user.total_tokens_sum || 0)
  }, 0)
})

const timeRangeOptions = [
  { value: "7", rangeLabel: "Last 7 Days" },
  { value: "30", rangeLabel: "Last 1 Month" },
  { value: "90", rangeLabel: "Last 3 Months" },
  { value: "180", rangeLabel: "Last 6 Months" },
  { value: "365", rangeLabel: "Last 12 Months" },
]

// Add these computed properties
const userColumns = [
  { key: "sl_no", label: "Sl No." },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "contact_number", label: "Mobile" },
  { key: "source", label: "Source" },
];

const docColumns = [
  { key: "sl_no", label: "Sl No." },
  { key: "name", label: "File Name" },
  { key: "formattedUpdatedAt", label: "Last Updated" },
];

const tokenUsageColumns = [
  { key: "sl_no", label: "Sl No." },
  { key: "name", label: "Name" },
  { key: "total_tokens_sum", label: "Tokens Consumed" },
];

// Transformation function for StackedBarChart data
function transformUserAppWiseData(result: any) {

  if (!result) return []

  // Handle Vue Proxy objects by converting to plain JS objects
  const plainData = JSON.parse(JSON.stringify(result))

  if (!Array.isArray(plainData)) {
    return []
  }

  // Collect all unique app keys
  const allApps = new Set()
  plainData.forEach((user: any) => {
    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        allApps.add(app.request_type)
      })
    }
  })

  // Transform per-user
  const transformedData = plainData.map((user: any) => {
    const usage: Record<string, number> = {}
    allApps.forEach((app) => (usage[app as string] = 0)) // default 0

    if (Array.isArray(user.app_wise_usage)) {
      user.app_wise_usage.forEach((app: any) => {
        usage[app.request_type] = parseInt(app.total_tokens) || 0
      })
    }

    return {
      name: user.name || "Unknown User",
      ...usage
    }
  })

  return transformedData
}

// Stacked Bar Chart data
const stackedChartData = computed(() => {
  return transformUserAppWiseData(analyticsStore.userAppWiseTokenDetail)
})

// Add these methods
const showOrganizationUsers = async () => {
  try {
    userLoading.value = true;
    userModalIsOpen.value = true;
    await analyticsStore.fetchOrganizationUsers(organizationId.value);
  } catch (error) {
    console.error("Error fetching organization users:", error);
    showNotification('Failed to load users', 'error');
  } finally {
    userLoading.value = false;
  }
};

const showOrganizationDocuments = async () => {
  try {
    documentLoading.value = true;
    documentModalIsOpen.value = true;
    await analyticsStore.fetchOrganizationDocuments(organizationId.value);
  } catch (error) {
    console.error("Error fetching organization documents:", error);
    showNotification('Failed to load document', 'error');
  } finally {
    documentLoading.value = false;
  }
};

const showOrganizationTokenUsage = () => {
  tokenUsageModalIsOpen.value = true;
};

const getLocalDateString = (date: dayjs.Dayjs, timeZone: string) => {
  return date.tz(timeZone).startOf("day").format("YYYY-MM-DD")
}

const fetchGraphData = async () => {
  try {
    loading.value = true

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const endDate = getLocalDateString(dayjs(), userTimeZone)
    let startDate

    switch (selectedTimeRange.value) {
      case "7":
        startDate = getLocalDateString(dayjs().subtract(6, "days"), userTimeZone)
        break
      case "30":
        startDate = getLocalDateString(dayjs().subtract(1, "months"), userTimeZone)
        break
      case "90":
        startDate = getLocalDateString(dayjs().subtract(3, "months"), userTimeZone)
        break
      case "180":
        startDate = getLocalDateString(dayjs().subtract(6, "months"), userTimeZone)
        break
      case "365":
        startDate = getLocalDateString(dayjs().subtract(1, "year"), userTimeZone)
        break
      default:
        startDate = getLocalDateString(dayjs().subtract(6, "days"), userTimeZone)
    }

    if (!organizationId.value) {
      showNotification('Organization ID not found', 'error')
      return
    }

    await analyticsStore.fetchTokenWiseDetail(
      organizationId.value,
      startDate,
      endDate,
      userTimeZone
    )
    await analyticsStore.fetchAppWiseTokenDetail(
      organizationId.value,
      startDate,
      endDate,
      userTimeZone
    )
    await analyticsStore.fetchUserAppWiseTokenDetail(
      organizationId.value,
      startDate,
      endDate,
      userTimeZone
    )
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    showNotification('Failed to load analytics data', 'error')
  } finally {
    loading.value = false
  }
}

// Pie Chart Data - App-wise Token Usage
const pieChartData = computed(() => {
  if (!analyticsStore.appTokenDetails || analyticsStore.appTokenDetails.length === 0) {
    return []
  }

  return analyticsStore.appTokenDetails.map((app: any) =>
    parseInt(app.total_tokens) || 0
  )
})

const pieChartLabels = computed(() => {
  if (!analyticsStore.appTokenDetails || analyticsStore.appTokenDetails.length === 0) {
    return []
  }

  return analyticsStore.appTokenDetails.map((app: any) => app.name || "Unknown App")
})


// Stacked Area Chart Data - Daily-wise User-wise Token Usage Token Usage Over Time
const stackedAreaChartData = computed(() => {
  if (!analyticsStore.tokenDetails || analyticsStore.tokenDetails.length === 0) {
    return []
  }

  // Get top 4 users by token usage
  const topUsers = [...analyticsStore.tokenDetails]
    .sort((a: any, b: any) => {
      const aTotal = parseInt(a.total_tokens_sum) || 0
      const bTotal = parseInt(b.total_tokens_sum) || 0
      return bTotal - aTotal
    })
    .slice(0, 4)

  // Get all unique dates from ALL users to ensure we have complete date range
  const allDates = new Set<string>()
  topUsers.forEach((user: any) => {
    user.token_usage_details.forEach((detail: any) => {
      allDates.add(detail.date)
    })
  })

  // Add missing dates from the selected time range
  const selectedDays = parseInt(selectedTimeRange.value) || 7
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const endDate = getLocalDateString(dayjs(), userTimeZone)
  const startDate = getLocalDateString(dayjs().subtract(selectedDays - 1, "days"), userTimeZone)

  // Generate all dates in the selected range
  let currentDate = dayjs(startDate)
  const endDateObj = dayjs(endDate)

  while (currentDate.isBefore(endDateObj) || currentDate.isSame(endDateObj)) {
    const dateStr = currentDate.format('YYYY-MM-DD')
    allDates.add(dateStr)
    currentDate = currentDate.add(1, 'day')
  }

  const sortedDates = Array.from(allDates).sort()

  // Create series for each user with complete daily data
  return topUsers.map((user: any) => {
    const dateMap = new Map()
    user.token_usage_details.forEach((detail: any) => {
      dateMap.set(detail.date, parseInt(detail.total_tokens) || 0)
    })

    // Create data points for ALL dates in the range, filling in 0 for missing dates
    const data = sortedDates.map(date => ({
      x: date,
      y: dateMap.get(date) || 0
    }))

    return {
      name: user.name || "Unknown User",
      data: data
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

  // Format dates for better display based on time range
  const range = parseInt(selectedTimeRange.value) || 7
  const density = range <= 7 ? 1 : range <= 30 ? 2 : range <= 90 ? 7 : 15

  return sortedDates.map((date, index) => {
    if (range <= 7) {
      // For short ranges, show all dates
      return dayjs(date).format('MMM DD')
    } else {
      // For longer ranges, show dates based on density
      if (index % density === 0 || index === sortedDates.length - 1) {
        return dayjs(date).format('MMM DD')
      }
      return ''
    }
  })
})

// Donut Chart Data - Category-wise Document Distribution
const donutChartData = computed(() => {
  if (!analyticsStore.orgDocList || analyticsStore.orgDocList.length === 0) {
    return []
  }

  const categoryCounts: Record<string, number> = {}

  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || "Uncategorized"
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.values(categoryCounts)
})

const donutChartLabels = computed(() => {
  if (!analyticsStore.orgDocList || analyticsStore.orgDocList.length === 0) {
    return []
  }

  const categoryCounts: Record<string, number> = {}

  analyticsStore.orgDocList.forEach((doc: any) => {
    const category = doc.fileCategory?.trim() || "Uncategorized"
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  return Object.keys(categoryCounts).map((category) => {
    return category
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  })
})

// Top Documents
const topDocuments = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const docs = orgDetails?.documents_analysis || []

  if (!docs || docs.length === 0) {
    return []
  }

  return docs
    .sort((a: any, b: any) => b.reference_count - a.reference_count)
    .slice(0, 5)
    .map((doc: any) => ({
      name: doc.document_source.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
      queries: doc.reference_count,
      usage: doc.reference_count >= 1000
        ? `${(doc.reference_count / 1000).toFixed(1)}k`
        : doc.reference_count.toString()
    }))
})

// Frequently Asked Questions
const frequentQuestions = computed(() => {
  const orgDetails = analyticsStore.organizationDetails as any
  const questions = orgDetails?.questions || []

  if (!questions || questions.length === 0) {
    return []
  }

  return questions.map((q: any, index: number) => ({
    id: index + 1,
    question: q.representative,
    count: q.similar_questions?.length || 1,
    category: "General"
  }))
})


// Automatically split questions into columns
const splitFrequentQuestions = computed(() => {
  const items = frequentQuestions.value
  const mid = Math.ceil(items.length / 2)
  return [
    items.slice(0, mid),
    items.slice(mid)
  ]
})

const formatTokens = (tokens: number) => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  return tokens.toString()
}

const exportReport = () => {
  try {
    if (!analyticsStore.organizationDetails) {
      showNotification("No data available to export", "error")
      return
    }

    // Build CSV rows
    const rows: string[][] = []

    rows.push(["--- Organization Summary ---"])
    rows.push(["Active Users", String(activeUsersCount.value || 0)])
    rows.push(["Documents Created", String((analyticsStore.organizationDetails as any)?.docs_uploaded || 0)])
    rows.push(["Total Tokens", String(totalTokens.value || 0)])
    rows.push(["Total Queries", String(totalQueriesCount.value || 0)])

    rows.push([])
    rows.push(["--- App-wise Token Usage ---"])
    rows.push(["App", "Tokens"])
    analyticsStore.appTokenDetails?.forEach((app: any) => {
      rows.push([app.name, String(app.total_tokens || 0)])
    })

    rows.push([])
    rows.push(["--- User-wise Token Usage ---"])
    rows.push(["User", "Tokens"])
    analyticsStore.tokenDetails?.forEach((user: any) => {
      const total = user.token_usage_details?.reduce(
        (sum: number, detail: any) => sum + (parseInt(detail.total_tokens) || 0),
        0
      ) || 0
      rows.push([user.name || "Unknown", String(total)])
    })

    rows.push([])
    rows.push(["--- Daily-wise User-wise Token Usage ---"])
    rows.push(["Date", "User", "Tokens"])
    analyticsStore.tokenDetails?.forEach((user: any) => {
      user.token_usage_details?.forEach((detail: any) => {
        rows.push([
          detail.date,
          user.name || "Unknown",
          String(detail.total_tokens || 0)
        ])
      })
    })

    rows.push([])
    rows.push(["--- Top Documents ---"])
    rows.push(["Name", "Queries"])
    topDocuments.value.forEach((doc: any) => {
      rows.push([doc.name, String(doc.queries || 0)])
    })

    // Add Top 10 Frequently Asked Questions section
    rows.push([])
    rows.push(["--- Top 10 Frequently Asked Questions ---"])
    rows.push(["Question", "Count", "Category"])
    frequentQuestions.value.slice(0, 10).forEach((faq: any) => {
      rows.push([faq.question, String(faq.count || 0), faq.category])
    })

    // Convert to CSV
    const csvContent = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `analytics_report_${dayjs().format("YYYYMMDD")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    showNotification("Report exported successfully", "success")
  } catch (error) {
    console.error("Error exporting report:", error)
    showNotification("Failed to export report", "error")
  }
}

onMounted(async () => {
  try {
    loading.value = true

    if (!organizationId.value) {
      showNotification('Organization ID not found', 'error')
      loading.value = false
      return
    }

    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const endDate = getLocalDateString(dayjs(), userTimeZone)
    const startDate = getLocalDateString(dayjs().subtract(6, "days"), userTimeZone)

    // Fetch all organization data
    await analyticsStore.fetchOrgDatas(
      organizationId.value,
      startDate,
      endDate,
      userTimeZone
    )

    // Also fetch user app-wise token detail specifically (this sets the counts)
    await analyticsStore.fetchUserAppWiseTokenDetail(
      organizationId.value,
      startDate,
      endDate,
      userTimeZone
    )

    await analyticsStore.fetchOrganizationDetail(organizationId.value)

  } catch (error) {
    showNotification('Failed to load analytics data', 'error')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.input-field {
  @apply bg-dark-700 border border-dark-600 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none;
}
</style>