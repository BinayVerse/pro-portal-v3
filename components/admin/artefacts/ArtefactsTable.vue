<template>
  <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
    <!-- Table Header -->
    <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-dark-700">
      <h2 class="text-base sm:text-lg font-semibold text-white">All Artifacts</h2>
      <p class="text-gray-400 text-xs sm:text-sm mt-1">
        Manage your uploaded artifacts and view their processing status and AI-generated summaries.
      </p>
    </div>

    <!-- UTable -->
    <UTable
      :rows="paginatedRows"
      :columns="columns"
      :loading="loading"
      v-model:sort="tableSort"
      sort-mode="manual"
      class="divide-y divide-dark-700"
      :ui="{
        wrapper: 'relative overflow-x-auto -mx-4 sm:mx-0',
        base: 'min-w-full table-fixed',
        thead: 'bg-dark-900',
        tbody: 'bg-dark-800 divide-y divide-dark-700 [&>tr:hover]:bg-dark-700/50',
        tr: {
          base: '',
          selected: 'bg-dark-700/50',
          active: '',
        },
        th: {
          base: 'text-left rtl:text-right',
          padding: 'px-3 sm:px-6 py-2 sm:py-3',
          color: 'text-gray-400',
          font: 'font-medium text-xs',
          size: 'text-xs',
        },
        td: {
          base: 'whitespace-nowrap',
          padding: 'px-3 sm:px-6 py-2 sm:py-4',
          color: 'text-gray-300',
          font: '',
          size: 'text-xs sm:text-sm',
        },
      }"
    >
      <!-- Artifact column with icon and description -->
      <template #artefact-data="{ row }">
        <div class="flex items-center">
          <div class="min-w-[8rem] sm:min-w-[20rem] max-w-[16rem] sm:max-w-[32rem]">
            <AppTooltip :text="row.name">
              <div class="text-xs sm:text-sm font-medium text-white truncate">
                {{ row.name }}
              </div>
            </AppTooltip>
            <div class="text-xs sm:text-sm text-gray-400 truncate hidden sm:block">
              {{ row.description }}
            </div>
          </div>
        </div>
      </template>

      <!-- Category column with badge -->
      <template #category-data="{ row }">
        <span
          class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
          :class="getCategoryColor(row.category)"
        >
          {{ row.category }}
        </span>
      </template>

      <!-- Department column -->
      <template #departments-data="{ row }">
        <!-- Common badge -->
        <AppTooltip
          v-if="!row.departments || row.departments.length === 0"
          :text="getDepartmentTooltip(row.departments)"
        >
          <UBadge
            v-if="!row.departments || row.departments.length === 0"
            size="xs"
            color="gray"
            class="font-medium"
            :ui="{ rounded: 'rounded-full' }"
          >
            Common
          </UBadge>
        </AppTooltip>

        <!-- Department badges -->
        <AppTooltip v-else :text="getDepartmentTooltip(row.departments)">
          <div class="flex flex-wrap gap-1">
            <UBadge
              v-for="deptId in row.departments"
              :key="deptId"
              size="xs"
              variant="solid"
              color="blue"
              class="font-medium"
              :ui="{ rounded: 'rounded-full' }"
            >
              {{ props.departmentNameMap[deptId] || 'Unknown' }}
            </UBadge>
          </div>
        </AppTooltip>
      </template>

      <!-- Status column with badge and dot -->
      <template #status-data="{ row }">
        <span
          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
          :class="getStatusColor(row.status)"
        >
          <div class="w-1.5 h-1.5 rounded-full mr-1" :class="getStatusDotColor(row.status)"></div>
          {{ capitalizeStatus(row.status) }}
        </span>
      </template>

      <!-- Summary column with conditional buttons -->
      <template #summary-data="{ row }">
        <!-- If summarized, show View Summary button -->
        <div v-if="row.summarized === 'Yes'" class="flex items-center space-x-2">
          <UButton
            @click="$emit('viewSummary', row)"
            variant="ghost"
            size="sm"
            icon="heroicons:document-magnifying-glass"
            color="blue"
            class="text-blue-400 hover:text-blue-300"
          >
            View Summary
          </UButton>
        </div>
        <!-- If not processed, show disabled button -->
        <div v-else-if="row.status !== 'processed'">
          <UButton
            variant="ghost"
            size="sm"
            icon="heroicons:document-plus"
            color="gray"
            disabled
            class="text-gray-500 cursor-not-allowed"
          >
            Summarize
          </UButton>
        </div>
        <!-- If processed but not summarized, show Summarize button -->
        <div v-else class="flex items-center space-x-2">
          <UButton
            @click="$emit('summarizeArtefact', row)"
            variant="ghost"
            size="sm"
            icon="heroicons:document-plus"
            :color="isAutoProcessing(row.id) ? 'gray' : 'green'"
            :class="
              isAutoProcessing(row.id)
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-green-400 hover:text-green-300'
            "
            :loading="row.isSummarizing || isAutoProcessing(row.id)"
            :disabled="isAutoProcessing(row.id)"
          >
            {{ isAutoProcessing(row.id) ? 'Auto-Summarizing...' : 'Summarize' }}
          </UButton>
        </div>
      </template>

      <!-- Actions column with action buttons -->
      <template #uploadedOn-data="{ row }">
        <div class="flex flex-col">
          <AppTooltip :text="`Uploaded by ${row.uploadedBy}`">
            <div class="text-sm font-medium text-white truncate">
              {{ row.uploadedBy }}
            </div>
          </AppTooltip>
          <div class="text-xs text-gray-400 mt-1">{{ row.lastUpdated }}</div>
        </div>
      </template>

      <template #actions-data="{ row }">
        <div class="flex items-center space-x-2">
          <AppTooltip text="View Artifact">
            <button
              @click="$emit('viewArtefact', row)"
              class="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <UIcon name="heroicons:eye" class="w-4 h-4" />
            </button>
          </AppTooltip>
          <AppTooltip
            :text="
              row.status === 'processing'
                ? 'Document is processing'
                : row.status === 'processed'
                  ? 'Document is already processed'
                  : 'Reprocess Artifact'
            "
          >
            <button
              @click="
                row.status === 'processed' || row.status === 'processing'
                  ? null
                  : $emit('reprocessArtefact', row)
              "
              :class="[
                'transition-colors',
                row.status === 'processed' || row.status === 'processing'
                  ? 'text-gray-500 cursor-not-allowed opacity-50'
                  : 'text-green-400 hover:text-green-300',
              ]"
              :disabled="row.status === 'processed' || row.status === 'processing'"
            >
              <UIcon name="heroicons:arrow-path-rounded-square" class="w-4 h-4" />
            </button>
          </AppTooltip>
          <AppTooltip text="Delete Artifact">
            <button
              @click="$emit('deleteArtefact', row)"
              class="text-red-400 hover:text-red-300 transition-colors"
            >
              <UIcon name="heroicons:trash" class="w-4 h-4" />
            </button>
          </AppTooltip>
        </div>
      </template>
    </UTable>

    <!-- Pagination Footer -->
    <div
      class="p-4 flex items-center justify-between border-t border-dark-700"
      v-if="sortedRows.length > 0"
    >
      <div class="flex items-center space-x-3">
        <div class="text-sm text-gray-400 hidden sm:block">Rows per page</div>
        <div class="w-24">
          <USelect v-model="perPage" :options="perPageOptions" size="sm" />
        </div>
      </div>

      <UPagination
        v-model="page"
        :total="sortedRows.length"
        :page-count="computedPageCount"
        :show-first="true"
        :show-last="true"
        :show-edges="true"
        size="sm"
        color="blue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, computed, ref, watch } from 'vue'
interface Artefact {
  id: number
  name: string
  description: string
  category: string
  type: string
  size: string
  status: string
  uploadedBy: string
  lastUpdated: string
  artefact: string
  summarized: string
  summary?: string
  isSummarizing?: boolean
  departments?: string[] // department IDs assigned to this artifact (will be looked up in departmentNameMap)
}

interface Props {
  artefacts: Artefact[]
  summarizingDocs?: Set<number>
  loading?: boolean
  departmentNameMap?: Record<string, string> // dept_id -> dept_name
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  departmentNameMap: () => ({}),
})

// Pagination state
const page = ref(1)
const perPage = ref(5)
const perPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'All', value: 'all' },
]
const computedPageCount = computed(() =>
  perPage.value === 'all' ? Math.max(sortedRows.value.length, 1) : (perPage.value as number),
)
watch(perPage, () => {
  page.value = 1
})

defineEmits<{
  viewArtefact: [artefact: Artefact]
  reprocessArtefact: [artefact: Artefact]
  deleteArtefact: [artefact: Artefact]
  viewSummary: [artefact: Artefact]
  summarizeArtefact: [artefact: Artefact]
}>()

// Table columns configuration
const columns = [
  {
    key: 'artefact',
    label: 'Artifact',
    sortable: true,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
  },
  {
    key: 'size',
    label: 'Size',
    sortable: true,
  },
  {
    key: 'departments',
    label: 'Department',
    sortable: false,
    class: 'w-40 max-w-40',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
  },
  {
    key: 'uploadedOn',
    label: 'Uploaded On',
    sortable: true,
  },
  {
    key: 'summary',
    label: 'Summary',
    sortable: false,
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
  },
]

// Helper methods
const isAutoProcessing = (docId: number): boolean => {
  return props.summarizingDocs?.has(docId) || false
}

// Table sort state (persist across row updates)
const tableSort = ref({ column: 'uploadedOn', direction: 'asc' })

// Reset page when sort changes
watch(
  tableSort,
  () => {
    page.value = 1
  },
  { deep: true },
)

// Derived rows with sortable date field
const tableRows = computed(() => {
  return (props.artefacts || []).map((r: any) => ({
    ...r,
    uploadedOn: r.lastUpdated ? new Date(r.lastUpdated).getTime() : 0,
  }))
})

// Sorting across full dataset before pagination
const sortedRows = computed(() => {
  const rows = [...tableRows.value]
  // Handle cases where the table's sort state is 'normal' or undefined.
  // Default to uploadedOn desc when no explicit sort is provided.
  const rawSort = (tableSort.value as any) || {}
  // Consider sort explicit only when direction is exactly 'asc' or 'desc'.
  const hasExplicitSort =
    rawSort &&
    rawSort.column &&
    (rawSort.direction === 'asc' || rawSort.direction === 'desc') &&
    String(rawSort.column).toLowerCase() !== 'normal'
  const col = hasExplicitSort ? rawSort.column : 'uploadedOn'
  const direction = hasExplicitSort ? rawSort.direction : 'desc'
  const dir = String(direction) === 'desc' ? 1 : -1

  const fieldMap: Record<string, string> = {
    artefact: 'name',
    uploadedOn: 'uploadedOn',
    category: 'category',
    type: 'type',
    size: 'size',
    status: 'status',
    summary: 'summary',
  }
  const field = fieldMap[col] || col

  return rows.sort((a: any, b: any) => {
    // Special handling for uploadedOn which may be a human-readable string (DD/MM/YYYY)
    if (field === 'uploadedOn') {
      const parseDate = (dateStr: any) => {
        if (!dateStr) return new Date(0).getTime()
        // If already a number (timestamp), return as-is
        if (typeof dateStr === 'number' && !Number.isNaN(dateStr)) return dateStr
        // Accept 'MM/DD/YYYY' or 'MM-DD-YYYY' or ISO strings
        if (typeof dateStr === 'string') {
          // Try MM/DD/YYYY or MM-DD-YYYY
          const parts = dateStr.includes('/')
            ? dateStr.split('/')
            : dateStr.includes('-')
              ? dateStr.split('-')
              : null
          if (parts && parts.length === 3) {
            const [month, day, year] = parts.map((p: string) => Number(p))
            if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
              return new Date(year, month - 1, day).getTime()
            }
          }
          // Fallback to Date.parse for other formats
          const parsed = Date.parse(dateStr)
          if (!Number.isNaN(parsed)) return parsed
        }

        return new Date(0).getTime()
      }

      const aDate = parseDate(a?.lastUpdated ?? a?.uploadedOn)
      const bDate = parseDate(b?.lastUpdated ?? b?.uploadedOn)

      if (aDate < bDate) return -1 * dir
      if (aDate > bDate) return 1 * dir
      return 0
    }

    const aVal = a?.[field]
    const bVal = b?.[field]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir
    }

    const aStr = aVal ? String(aVal).toLowerCase() : ''
    const bStr = bVal ? String(bVal).toLowerCase() : ''

    if (aStr < bStr) return -1 * dir
    if (aStr > bStr) return 1 * dir
    return 0
  })
})

// Paginated slice
const paginatedRows = computed(() => {
  if (perPage.value === 'all') {
    return sortedRows.value.map((r: any, idx: number) => ({ ...r, sl_no: idx + 1 }))
  }
  const start = (page.value - 1) * (perPage.value as number)
  const end = start + (perPage.value as number)
  return sortedRows.value.slice(start, end)
})

// Reset to first page when data changes
watch(
  () => props.artefacts,
  () => {
    page.value = 1
  },
  { deep: true },
)

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'HR Policy': 'bg-blue-500/20 text-blue-400',
    Financial: 'bg-green-500/20 text-green-400',
    Technical: 'bg-purple-500/20 text-purple-400',
    Analytics: 'bg-orange-500/20 text-orange-400',
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-500/20 text-green-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-400'
}

const getStatusDotColor = (status: string) => {
  const colors: Record<string, string> = {
    processed: 'bg-green-400',
    processing: 'bg-yellow-400',
    failed: 'bg-red-400',
  }
  return colors[status] || 'bg-gray-400'
}

const capitalizeStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Helper function to get tooltip text for departments
const getDepartmentTooltip = (deptIds?: string[]): string => {
  if (!deptIds || deptIds.length === 0) {
    return 'Common - Accessible to all users in the organization'
  }
  const deptNames = deptIds.map((id: string) => props.departmentNameMap[id] || 'Unknown').join(', ')
  return `Department-specific - Accessible only to: ${deptNames}`
}
</script>
