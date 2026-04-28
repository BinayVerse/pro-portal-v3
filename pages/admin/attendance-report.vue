<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-1 sm:space-y-2">
      <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white">Keka Attendance</h1>
      <p class="text-xs sm:text-sm lg:text-base text-gray-400">
        View and manage attendance records from Keka integration
      </p>
    </div>

    <!-- Filter Section -->
    <div class="bg-dark-800 border border-dark-700 rounded-lg p-4 sm:p-6 mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">Filters</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <!-- Date Range Picker -->
        <!-- <div class="md:col-span-2 lg:col-span-1.5 flex gap-2 items-center"> -->
        <!-- From Date -->
        <!-- <div class="flex-1 relative">
            <input
              v-model="filters.fromDate"
              type="date"
              class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm cursor-pointer appearance-none date-input"
              placeholder="mm/dd/yyyy"
            />
            <UIcon
              name="i-heroicons-calendar-20-solid"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            />
          </div> -->

        <!-- Separator -->
        <!-- <span class="text-gray-500 text-xs">to</span> -->

        <!-- To Date -->
        <!-- <div class="flex-1 relative">
            <input
              v-model="filters.toDate"
              type="date"
              class="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm cursor-pointer appearance-none date-input"
              placeholder="mm/dd/yyyy"
            />
            <UIcon
              name="i-heroicons-calendar-20-solid"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
            />
          </div> -->
        <!-- </div> -->

        <div class="md:col-span-2 lg:col-span-1.5">
          <AppDateRangePicker v-model="dateRange" />
        </div>

        <!-- Employee Filter (Multi-select) -->
        <USelectMenu
          v-model="filters.employeeIds"
          :options="employeeOptions"
          option-attribute="label"
          value-attribute="value"
          multiple
          searchable
          placeholder="Select employees..."
          size="md"
        >
          <template #label>
            <span v-if="!filters.employeeIds.length" class="text-gray-400">
              Select employees...
            </span>
            <span v-else class="text-gray-300">
              {{ filters.employeeIds.length }} employee(s) selected
            </span>
          </template>
        </USelectMenu>

        <!-- Source Filter -->
        <USelect v-model="filters.source" :options="sourceOptions" size="md" searchable />

        <!-- Action Button -->
        <button
          @click="loadReport"
          :disabled="loading"
          class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded transition-colors h-10"
        >
          <span v-if="loading" class="flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin mr-2 w-4 h-4" />
            Loading...
          </span>
          <span v-else>Load Report</span>
        </button>
      </div>
    </div>

    <!-- Summary Section -->
    <div
      v-if="filteredSummary && !loading"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
    >
      <!-- Total Records -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Filtered Records</p>
            <p class="text-3xl font-bold text-white mt-2">{{ filteredSummary.total_records }}</p>
            <p class="text-xs text-gray-500 mt-1">
              of {{ reportData.summary.total_records }} total
            </p>
          </div>
          <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-primary-400" />
        </div>
      </div>

      <!-- Date Range -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm">Date Range</p>
            <p class="text-white mt-2 font-semibold text-sm">
              {{ formatDate(filteredSummary.date_range.from) }}
            </p>
            <p class="text-white font-semibold text-sm">
              to {{ formatDate(filteredSummary.date_range.to) }}
            </p>
          </div>
          <UIcon name="i-heroicons-calendar" class="w-8 h-8 text-yellow-400" />
        </div>
      </div>

      <!-- Records by Source (from all records) -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div>
          <p class="text-gray-400 text-sm mb-3">Records by Source</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Keka:</span>
              <span class="font-semibold">{{
                reportData.summary.records_by_source['Keka'] || 0
              }}</span>
            </div>
            <div class="flex justify-between text-gray-300">
              <span>Provento:</span>
              <span class="font-semibold">{{
                reportData.summary.records_by_source['Provento'] || 0
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Records by Source % -->
      <div class="bg-dark-800 border border-dark-700 rounded-lg p-4">
        <div>
          <p class="text-gray-400 text-sm mb-3">Records by Source %</p>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between text-gray-300">
              <span>Keka:</span>
              <span class="font-semibold">{{ sourcePercentages.keka }}%</span>
            </div>
            <div class="flex justify-between text-gray-300">
              <span>Provento:</span>
              <span class="font-semibold">{{ sourcePercentages.provento }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div v-if="reportData && !loading" class="flex flex-wrap gap-3 mb-6">
      <button
        @click="exportReport"
        :disabled="exportLoading"
        class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center gap-2"
      >
        <UIcon v-if="!exportLoading" name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
        <UIcon v-else name="i-heroicons-arrow-path" class="animate-spin w-4 h-4" />
        {{ exportLoading ? 'Exporting...' : 'Export as CSV' }}
      </button>

      <button
        @click="sendEmail"
        :disabled="emailLoading"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center gap-2"
      >
        <UIcon v-if="!emailLoading" name="i-heroicons-envelope" class="w-4 h-4" />
        <UIcon v-else name="i-heroicons-arrow-path" class="animate-spin w-4 h-4" />
        {{ emailLoading ? 'Sending...' : 'Send via Email' }}
      </button>
    </div>

    <!-- Detailed Report Table -->
    <div
      v-if="reportData && !loading"
      class="bg-dark-800 border border-dark-700 rounded-lg overflow-hidden"
    >
      <UTable
        :columns="columns"
        :rows="paginatedRecords"
        v-model:sort="sort"
        sort-mode="manual"
        class="text-white"
      >
        <!-- Employee Name -->
        <template #employee_name-data="{ row }">
          <div class="text-sm text-gray-300">{{ row.employee_name }}</div>
        </template>

        <!-- Employee ID -->
        <template #employee_id-data="{ row }">
          <div class="text-sm text-gray-300">{{ row.employee_id }}</div>
        </template>

        <!-- Email -->
        <template #user_email-data="{ row }">
          <div class="text-sm text-gray-300">{{ row.user_email || '-' }}</div>
        </template>

        <!-- Date -->
        <template #datetime-data="{ row }">
          <div class="text-sm text-gray-300">{{ formatDateTime(row.datetime) }}</div>
        </template>

        <!-- Source -->
        <template #source-data="{ row }">
          <span
            :class="
              row.source === 'Keka'
                ? 'px-2 py-1 rounded text-xs font-medium bg-purple-500/20 text-purple-400'
                : 'px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400'
            "
          >
            {{ row.source }}
          </span>
        </template>

        <!-- Department -->
        <template #department-data="{ row }">
          <div class="text-sm text-gray-300">{{ row.department || '-' }}</div>
        </template>

        <!-- Designation -->
        <template #designation-data="{ row }">
          <div class="text-sm text-gray-300">{{ row.designation || '-' }}</div>
        </template>

        <template #status-data="{ row }">
          <span
            :class="
              row.status === 'Check-in'
                ? 'px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400'
                : 'px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400'
            "
          >
            {{ row.status }}
          </span>
        </template>
      </UTable>

      <!-- Empty State -->
      <div
        v-if="filteredRecords.length === 0"
        class="flex flex-col items-center justify-center py-12 text-gray-400"
      >
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 mb-4 text-gray-600" />
        <p class="text-lg font-medium">No records found</p>
        <p class="text-sm">Try adjusting your filters</p>
      </div>

      <!-- Pagination Controls -->
      <div
        v-if="filteredRecords.length > 0"
        class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-dark-700 gap-4 sm:gap-0"
      >
        <div class="flex items-center space-x-3 text-xs sm:text-sm">
          <div class="text-gray-400 hidden sm:block">Rows per page</div>
          <div class="w-20 sm:w-24">
            <USelect v-model="perPage" :options="perPageOptions" size="sm" />
          </div>
        </div>

        <div class="flex items-center space-x-2 text-sm text-gray-400">
          <span>
            Showing
            {{
              filteredRecords.length === 0
                ? 0
                : (page - 1) * (perPage === 'all' ? filteredRecords.length : perPage) + 1
            }}
            to
            {{
              Math.min(
                page * (perPage === 'all' ? filteredRecords.length : perPage),
                filteredRecords.length,
              )
            }}
            of {{ filteredRecords.length }} records
          </span>
        </div>

        <!-- v-if="perPage !== 'all'" -->
        <UPagination v-model="page" :total="filteredRecords.length" :page-count="perPage" />
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error && !loading"
      class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400"
    >
      <div class="flex items-start">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <p class="font-medium">Error loading report</p>
          <p class="text-sm mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary-400 mb-4" />
      <p class="text-gray-400">Loading attendance data...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth/index'
import { useAttendanceStore } from '~/stores/attendance/index'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useHead({ title: 'Keka Attendance - provento.ai' })

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const { showNotification } = useNotification()

const formatDate = (date: string | Date) => {
  if (!date) return '-'

  const d = new Date(date)

  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const formatDateTime = (date: string | Date) => {
  if (!date) return '-'

  const d = new Date(date)

  return d.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Check if user is superadmin
const isSuperAdmin = computed(() => authStore.user?.role_id === 0)

// Store state getters
const loading = computed(() => attendanceStore.isLoading)
const exportLoading = computed(() => attendanceStore.isExporting)
const emailLoading = computed(() => attendanceStore.isSendingEmail)
const error = computed(() => attendanceStore.getError)
const reportData = computed(() => attendanceStore.getReportData)

const today = new Date().toISOString().split('T')[0]

const filters = ref({
  fromDate: today,
  toDate: today,
  employeeIds: [],
  source: '',
})

const dateRange = ref({
  start: filters.value.fromDate,
  end: filters.value.toDate,
})

// Applied filters are only set when "Load Report" is clicked
const appliedFilters = ref({
  fromDate: today,
  toDate: today,
  employeeIds: [],
  source: '',
})

const employeeOptions = ref<{ label: string; value: string }[]>([])

const sourceOptions = [
  { label: 'All Sources', value: '' },
  { label: 'Keka', value: 'Keka' },
  { label: 'Provento', value: 'Provento' },
]

// Table columns
const columns = [
  { key: 'employee_id', label: 'Employee ID', sortable: true },
  { key: 'employee_name', label: 'Employee Name', sortable: true },
  { key: 'datetime', label: 'Date & Time', sortable: true },
  { key: 'user_email', label: 'Email', sortable: true },
  { key: 'source', label: 'Source', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'designation', label: 'Designation', sortable: true },
]

// Sorting
const sort = ref<{ column: string; direction: 'asc' | 'desc' | null }>({
  column: 'datetime',
  direction: 'desc',
})

const sortedRecords = computed(() => {
  if (!sort.value.column || !sort.value.direction) return filteredRecords.value

  const colKey = sort.value.column
  const dir = sort.value.direction === 'asc' ? 1 : -1

  return [...filteredRecords.value].sort((a, b) => {
    let aVal = (a as any)[colKey]
    let bVal = (b as any)[colKey]

    // Handle date fields
    if (colKey === 'date') {
      const aDate = aVal ? new Date(aVal) : new Date(0)
      const bDate = bVal ? new Date(bVal) : new Date(0)

      if (aDate < bDate) return -1 * dir
      if (aDate > bDate) return 1 * dir
      return 0
    }

    // Handle time fields
    if (colKey === 'time') {
      aVal = aVal ? String(aVal).toLowerCase() : ''
      bVal = bVal ? String(bVal).toLowerCase() : ''
    }

    // String comparison
    aVal = aVal ? String(aVal).toLowerCase() : ''
    bVal = bVal ? String(bVal).toLowerCase() : ''

    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })
})

// Pagination
const page = ref(1)
const perPage = ref(10)
const perPageOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'All', value: 'all' },
]

const paginatedRecords = computed(() => {
  if (perPage.value === 'all') return sortedRecords.value
  const start = (page.value - 1) * (perPage.value as number)
  const end = start + (perPage.value as number)
  return sortedRecords.value.slice(start, end)
})

// Compute filtered records based on applied source and employee filters
const filteredRecords = computed(() => {
  if (!reportData.value?.records) return []

  return reportData.value.records.filter((record: any) => {
    // Apply source filter
    if (appliedFilters.value.source && record.source !== appliedFilters.value.source) {
      return false
    }

    // Apply employee filter
    if (
      appliedFilters.value.employeeIds.length > 0 &&
      !appliedFilters.value.employeeIds.includes(record.employee_id)
    ) {
      return false
    }

    return true
  })
})

// Compute summary for filtered records
const filteredSummary = computed(() => {
  if (!reportData.value?.summary) return null

  const total = filteredRecords.value.length
  const bySource = filteredRecords.value.reduce(
    (acc, r: any) => {
      acc[r.source] = (acc[r.source] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return {
    total_records: total,
    records_by_source: bySource,
    date_range: reportData.value.summary.date_range,
  }
})

// Compute source percentages from ALL records (not filtered)
const sourcePercentages = computed(() => {
  if (!reportData.value?.summary) return { keka: '0', provento: '0' }

  const total = reportData.value.summary.total_records
  const kekaCount = reportData.value.summary.records_by_source['Keka'] || 0
  const proventoCount = reportData.value.summary.records_by_source['Provento'] || 0

  const kekaPct = total > 0 ? ((kekaCount / total) * 100).toFixed(2) : '0'
  const proventoPct = total > 0 ? ((proventoCount / total) * 100).toFixed(2) : '0'

  return {
    keka: kekaPct,
    provento: proventoPct,
  }
})

// Load report data
const loadReport = async () => {
  try {
    const orgId = (route.query.org || route.query.org_id) as string | undefined

    // Call API if date range has changed OR if this is the initial load (no data yet)
    if (hasDateChanged.value || !reportData.value?.records) {
      await attendanceStore.fetchAttendanceReport(
        filters.value.fromDate,
        filters.value.toDate,
        undefined, // Don't pass employeeIds to API
        undefined, // Don't pass source to API
        orgId,
      )

      // Populate employee options from the fetched records (only those with proper names)
      if (reportData.value?.records && reportData.value.records.length > 0) {
        const employeeMap = new Map()

        reportData.value.records.forEach((r: any) => {
          // Only add to dropdown if employee has a proper name (not just the ID)
          if (
            r.employee_name &&
            r.employee_name !== r.employee_id &&
            r.employee_name.trim() !== ''
          ) {
            if (!employeeMap.has(r.employee_id)) {
              employeeMap.set(r.employee_id, {
                label: `${r.employee_name} (${r.employee_id})`,
                value: r.employee_id,
              })
            }
          }
        })

        employeeOptions.value = Array.from(employeeMap.values())
      }
    }

    // Apply filters - this works for both date changes and source/employee filter changes
    appliedFilters.value = {
      fromDate: filters.value.fromDate,
      toDate: filters.value.toDate,
      employeeIds: [...filters.value.employeeIds],
      source: filters.value.source,
    }
  } catch (err: any) {
    console.error('Error loading report:', err)
  }
}

// Export report as CSV
const exportReport = () => {
  exportLoading.value = true

  try {
    const data = sortedRecords.value

    if (!data.length) {
      showNotification('No data to export', 'warning')
      return
    }

    // ✅ Reusable formatter (same as UI)
    const formatDateTime = (date: Date | string) => {
      return new Date(date).toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    }

    // 🔢 Summary calculations
    const total = data.length
    const provento = data.filter((r: any) => r.source === 'Provento').length
    const keka = data.filter((r: any) => r.source === 'Keka').length

    const proventoPct = total ? ((provento / total) * 100).toFixed(2) : '0'
    const kekaPct = total ? ((keka / total) * 100).toFixed(2) : '0'

    // 📊 Summary rows (top section)
    const summaryRows = [
      ['Report Generated', formatDateTime(new Date())],
      [
        'Date Range',
        `${formatDate(filters.value.fromDate)} to ${formatDate(filters.value.toDate)}`,
      ],
      ['Total Records', total],
      ['Provento Records', provento],
      ['Keka Records', keka],
      ['Provento %', proventoPct],
      ['Keka %', kekaPct],
      [], // spacing row
    ]

    // 📋 Table headers (same as UI)
    const headers = [
      'Employee ID',
      'Employee Name',
      'Date & Time',
      'Email',
      'Source',
      'Status',
      'Department',
      'Designation',
    ]

    // 📄 Table rows (same as UI)
    const rows = data.map((r: any) => [
      r.employee_id || '',
      r.employee_name || '',
      r.datetime || '', // already formatted from API/UI
      r.user_email || '-',
      r.source || '',
      r.status || '',
      r.department || '-',
      r.designation || '-',
    ])

    // 🧾 Convert everything to CSV
    const csvContent = [
      // Summary section
      ...summaryRows.map((row) =>
        row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','),
      ),

      // Header row
      headers.map((h) => `"${h}"`).join(','),

      // Data rows
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    // ⬇️ Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-report-${filters.value.fromDate}-to-${filters.value.toDate}.csv`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)

    showNotification('Report exported successfully', 'success')
  } catch (err: any) {
    console.error(err)
    showNotification('Failed to export report', 'error')
  } finally {
    exportLoading.value = false
  }
}

// Send report via email
const sendEmail = async () => {
  try {
    const orgId = (route.query.org || route.query.org_id) as string | undefined

    const response = await attendanceStore.sendAttendanceReportEmail(
      filters.value.fromDate,
      filters.value.toDate,
      filters.value.employeeIds.length > 0 ? filters.value.employeeIds : undefined,
      orgId,
    )

    showNotification('Report sent successfully', 'success')
  } catch (err: any) {
    showNotification(err.message || 'Failed to send report', 'error')
    console.error('Error sending report:', err)
  }
}

// Load report on component mount
onMounted(() => {
  if (!isSuperAdmin.value) {
    attendanceStore.handleError(
      new Error('Only superadmins can access attendance reports'),
      'Only superadmins can access attendance reports',
    )
    return
  }

  loadReport()
})

// Reset page to 1 when filters change
watch(
  appliedFilters,
  () => {
    page.value = 1
  },
  { deep: true },
)

watch(perPage, () => {
  page.value = 1
})

watch(
  dateRange,
  (val) => {
    if (!val?.start || !val?.end) return

    filters.value.fromDate = val.start
    filters.value.toDate = val.end
  },
  { deep: true },
)

// Detect if dates have changed to enable/disable Load Report button
const hasDateChanged = computed(() => {
  return (
    filters.value.fromDate !== appliedFilters.value.fromDate ||
    filters.value.toDate !== appliedFilters.value.toDate
  )
})

// Validate and sync dates - ensure fromDate is never after toDate
watch(
  () => filters.value.fromDate,
  (newFromDate) => {
    if (newFromDate && filters.value.toDate && newFromDate > filters.value.toDate) {
      filters.value.toDate = newFromDate
    }
  },
)

watch(
  () => filters.value.toDate,
  (newToDate) => {
    if (newToDate && filters.value.fromDate && newToDate < filters.value.fromDate) {
      filters.value.fromDate = newToDate
    }
  },
)
</script>

<style scoped>
/* Custom scrollbar for table */
:deep(.overflow-x-auto) {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
}

:deep(.overflow-x-auto::-webkit-scrollbar) {
  height: 6px;
}

:deep(.overflow-x-auto::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(.overflow-x-auto::-webkit-scrollbar-thumb) {
  background-color: rgba(100, 116, 139, 0.5);
  border-radius: 3px;
}

:deep(.overflow-x-auto::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(100, 116, 139, 0.7);
}
</style>
