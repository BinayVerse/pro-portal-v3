<template>
  <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
    <!-- Table Header -->
    <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-dark-700">
      <h2 class="text-base sm:text-lg font-semibold text-white">Invoice History</h2>
      <p class="text-gray-400 text-xs sm:text-sm mt-1">
        Showing all paid invoices. View and download your invoices by clicking the invoice numbers.
      </p>
    </div>

    <!-- Table -->
    <UTable
      :rows="loading ? [] : paginatedRows"
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
      <!-- ✅ Loading slot -->
      <template #empty>
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-12"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-6 h-6 text-primary-400 animate-spin"
          />
          <p class="text-gray-400 text-sm mt-2">
            Loading billing history...
          </p>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-gray-400 text-sm"
        >
          No invoices found.
        </div>
      </template>
      <!-- Invoice Number column -->
      <template #invoiceNumber-data="{ row }">
        <div v-if="row.isFree" class="text-gray-500">NA</div>
        <AppTooltip v-else :text="`Download ${row.invoiceNumber}`">
          <button
            @click="$emit('downloadInvoice', row)"
            class="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
          >
            #{{ row.invoiceNumber }}
          </button>
        </AppTooltip>
      </template>

      <!-- Plan Name column with icon -->
      <template #planName-data="{ row }">
  <div class="flex items-center space-x-2">
    <AppTooltip
      v-if="!row.isFree"
      :text="['small add-on'].includes(row.frequency?.toLowerCase())
        ? row.frequency
        : `Billed ${row.frequency}`"
      placement="top"
    >
      <div class="flex items-center">
        <img
          v-if="row.frequency === 'Monthly'"
          :src="StarterPlanIcon"
          alt="Monthly Plan"
          class="w-5 h-5"
        />

        <img
          v-if="row.frequency === 'Yearly'"
          :src="ProfessionalPlanIcon"
          alt="Yearly Plan"
          class="w-5 h-5"
        />

        <span class="font-medium ml-2">{{ row.planName }}</span>
      </div>
    </AppTooltip>
    <div v-else class="flex items-center">
      <span class="font-medium ml-2">{{ row.planName }}</span>
    </div>
  </div>
</template>

      <!-- Amount column -->
      <template #amount-data="{ row }">
        <div class="font-medium" :class="row.isFree ? 'text-gray-400' : 'text-white'">
          {{ formatAmount(row.amount, row.currency) }}
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
import { computed, ref, watch } from 'vue'
import StarterPlanIcon from '@/assets/media/StarterPlanIcon.svg'
import ProfessionalPlanIcon from '@/assets/media/ProfessionalPlanIcon.svg'

interface Invoice {
  id: string
  invoiceNumber: string
  planName: string
  invoiceDate: string
  billing_period: string | null
  amount: number
  currency: string
  frequency: string
  pdfUrl: string | null
  isFree: boolean
}

interface Props {
  invoices: Invoice[]
  loading?: boolean
}

type PerPage = number | 'all'

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  downloadInvoice: [invoice: Invoice]
}>()

// Pagination state
const page = ref(1)
const perPage = ref<PerPage>(10)
const perPageOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: 'All', value: 'all' },
]
const computedPageCount = computed(() =>
  perPage.value === 'all'
    ? Math.max(sortedRows.value.length, 1)
    : perPage.value
)

watch(perPage, () => {
  page.value = 1
})

// Table columns configuration
const columns = [
  {
    key: 'invoiceNumber',
    label: 'Invoice Number',
    sortable: true,
  },
  {
    key: 'planName',
    label: 'Plan Name',
    sortable: true,
  },
  {
    key: 'invoiceDate',
    label: 'Invoice Date',
    sortable: true,
  },
  {
    key: 'billing_period',
    label: 'Billing Period',
    sortable: true,
  },
  {
    key: 'amount',
    label: 'Amount',
    sortable: true,
  },
]

type TableSort = {
  column: string
  direction: 'asc' | 'desc'
}

const tableSort = ref<TableSort>({
  column: 'invoiceDate',
  direction: 'desc',
})

// Reset page when sort changes
watch(
  tableSort,
  () => {
    page.value = 1
  },
  { deep: true },
)

// Derived rows with sortable date fields
const tableRows = computed(() => {
  return (props.invoices || []).map((invoice: Invoice) => ({
    ...invoice,
    invoiceDateSort: new Date(invoice.invoiceDate).getTime(),
    billing_period: invoice.billing_period || 'N/A',
    amountSort: invoice.amount,
  }))
})

// Sorting across full dataset before pagination
const sortedRows = computed(() => {
  const rows = [...tableRows.value]
  const rawSort = (tableSort.value as any) || {}
  
  // Default to invoiceDate desc if no sort specified
  const hasExplicitSort =
    rawSort &&
    rawSort.column &&
    (rawSort.direction === 'asc' || rawSort.direction === 'desc') &&
    String(rawSort.column).toLowerCase() !== 'normal'
  
  const col = hasExplicitSort ? rawSort.column : 'invoiceDate'
  const direction = hasExplicitSort ? rawSort.direction : 'desc'
  const dir = String(direction) === 'desc' ? -1 : 1

  const fieldMap: Record<string, string> = {
    invoiceNumber: 'invoiceNumber',
    planName: 'planName',
    invoiceDate: 'invoiceDateSort',
    billing_period: 'billing_period',
    amount: 'amountSort'
  }
  
  const field = fieldMap[col] || col

  return rows.sort((a: any, b: any) => {
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
    return sortedRows.value
  }
  const start = (page.value - 1) * (perPage.value as number)
  const end = start + (perPage.value as number)
  return sortedRows.value.slice(start, end)
})

// Reset to first page when data changes
watch(
  () => props.invoices,
  () => {
    page.value = 1
  },
  { deep: true },
)

// Add this helper function for amount formatting
const formatAmount = (amount: number, currency: string = 'USD'): string => {
  if (amount === 0 || amount === null || amount === undefined) return '$0.00'
  
  try {
    // Format with 2 decimal places
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    
    return formatter.format(amount)
  } catch (error) {
    // Fallback formatting
    return `$${amount.toFixed(2)}`
  }
}

</script>
