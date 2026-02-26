<template>
  <div class="space-y-6">
    <!-- Page Heading -->
    <div>
      <h1 class="text-2xl font-bold text-white mb-2">Organizations Overview</h1>
      <p class="text-gray-400">
        Manage organizations, users, documents, and usage across the platform.
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-lg bg-dark-900 border border-dark-700">
        <p class="text-gray-400 text-sm">Total Organizations</p>
        <p class="text-3xl font-bold text-white mt-2">
          {{ (store.summary?.total_orgs || 0).toLocaleString() }}
        </p>
      </div>
      <div class="p-4 rounded-lg bg-dark-900 border border-dark-700">
        <p class="text-gray-400 text-sm">Total Users</p>
        <p class="text-3xl font-bold text-white mt-2">
          {{ (store.summary?.total_users || 0).toLocaleString() }}
        </p>
      </div>
      <div class="p-4 rounded-lg bg-dark-900 border border-dark-700">
        <p class="text-gray-400 text-sm">Total Documents</p>
        <p class="text-3xl font-bold text-white mt-2">
          {{ (store.summary?.total_docs || 0).toLocaleString() }}
        </p>
      </div>
      <div class="p-4 rounded-lg bg-dark-900 border border-dark-700">
        <p class="text-gray-400 text-sm">Total Tokens</p>
        <p class="text-3xl font-bold text-white mt-2">
          {{ (store.summary?.total_tokens || 0).toLocaleString() }}
        </p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="bg-dark-900 border border-dark-700 rounded-lg p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UIcon name="i-heroicons-magnifying-glass" class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search organizations..."
              class="block w-full pl-10 pr-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Organizations Table -->
    <div class="bg-dark-900 border border-dark-700 rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-dark-700">
        <h2 class="text-lg font-semibold text-white">Organizations</h2>
        <p class="text-gray-400 text-sm">
          List of all organizations with their users, documents, and token usage.
        </p>
      </div>

      <div v-if="store.loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-gray-400 mt-2">Loading organizations...</p>
      </div>

      <div v-else>
        <UTable
          :columns="columns"
          :rows="paginatedRows"
          v-model:sort="sort"
          sort-mode="manual"
          class="text-white"
          :loading="store.loading"
          :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
          :progress="{ color: 'primary', animation: 'carousel' }"
          :empty-state="{ icon: 'i-heroicons-circle-stack-20-solid', label: 'No data to display' }"
        >
          <template #org_name-data="{ row }">
            <AppTooltip :text="`Open dashboard for ${row.org_name}`">
              <NuxtLink
                :to="{ path: '/admin/dashboard', query: { org: String(row.org_id) } }"
                class="text-white font-bold hover:underline text-left block"
              >
                {{ row.org_name }}
              </NuxtLink>
            </AppTooltip>
          </template>
        </UTable>
        <div class="p-4 flex items-center justify-between border-t border-dark-700">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSuperAdminStore } from '~/stores/superadmin/index'

useHead({ title: 'Organizations Overview - Super Admin Dashboard - provento.ai' })

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'superadmin'],
})

const store = useSuperAdminStore()
await store.fetchOrganizations()

// Search
const searchQuery = ref('')

// Columns with sorting
const columns = [
  { key: 'sl_no', label: 'Sl. No.' },
  { key: 'org_name', label: 'Organization', sortable: true },
  { key: 'total_users', label: 'Users', sortable: true },
  { key: 'docs_uploaded', label: 'Documents', sortable: true },
  { key: 'total_tokens', label: 'Tokens', sortable: true },
  { key: 'last_used_at', label: 'Last Used', sortable: true },
  { key: 'created_at', label: 'Created At', sortable: true },
]

// Sorting state (manual)
const sort = ref<{ column: string | null; direction: 'asc' | 'desc' | null }>({
  column: 'org_name',
  direction: 'asc',
})

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store.organizations
  return store.organizations.filter((org: any) =>
    [
      org.org_name,
      org.total_users,
      org.docs_uploaded,
      org.total_tokens,
      org.created_at,
      org.createdAt,
      org.last_used_at,
    ]
      .map((v) => String(v).toLowerCase())
      .some((v) => v.includes(q)),
  )
})

const sortedRows = computed(() => {
  const s = sort.value
  if (!s.column || !s.direction) return filteredRows.value

  const dir = s.direction === 'asc' ? 1 : -1

  return [...filteredRows.value].sort((a: any, b: any) => {
    let aVal = a[s.column as keyof typeof a]
    let bVal = b[s.column as keyof typeof b]

    // Try parsing as dates first
    const parseDate = (v: any) => {
      if (!v) return null
      const d = new Date(v)
      return isNaN(d.getTime()) ? null : d
    }

    const aDate = parseDate(aVal)
    const bDate = parseDate(bVal)

    if (aDate && bDate) {
      if (aDate < bDate) return -1 * dir
      if (aDate > bDate) return 1 * dir
      return 0
    }

    const isNumber = (val: any) => typeof val === 'number' || /^-?\d+(?:\.\d+)?$/.test(String(val))

    if (isNumber(aVal) && isNumber(bVal)) {
      const na = Number(aVal)
      const nb = Number(bVal)
      if (na < nb) return -1 * dir
      if (na > nb) return 1 * dir
      return 0
    }

    aVal = aVal ? String(aVal).toLowerCase() : ''
    bVal = bVal ? String(bVal).toLowerCase() : ''

    if (aVal < bVal) return -1 * dir
    if (aVal > bVal) return 1 * dir
    return 0
  })
})

// Pagination
const page = ref(1)
const perPage = ref(5)
const perPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'All', value: 'all' },
]
const computedPageCount = computed(() => (perPage.value === 'all' ? Math.max(sortedRows.value.length, 1) : (perPage.value as number)))
watch(perPage, () => { page.value = 1 })

// Helper to format dates as MM/DD/YYYY for display
const formatDate = (val: any) => {
  if (!val) return '-'
  // If server returned a plain date string (YYYY-MM-DD), format directly to avoid timezone shifts
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) {
    const [y, m, d] = String(val).split('-')
    return `${m}/${d}/${y}`
  }
  const d = new Date(val)
  if (isNaN(d.getTime())) return String(val)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

const paginatedRows = computed(() => {
  if (perPage.value === 'all') {
    return sortedRows.value.map((row: any, idx: number) => ({
      ...row,
      sl_no: idx + 1,
      created_at: formatDate(row.created_at || row.createdAt),
      last_used_at: row.last_used_date ? formatDate(row.last_used_date) : formatDate(row.last_used_at),
    }))
  }

  const size = Number(perPage.value)
  const start = (page.value - 1) * size
  const end = start + size
  return sortedRows.value.slice(start, end).map((row: any, idx: number) => ({
    ...row,
    sl_no: start + idx + 1,
    created_at: formatDate(row.created_at || row.createdAt),
    last_used_at: row.last_used_date ? formatDate(row.last_used_date) : formatDate(row.last_used_at),
  }))
})

watch(searchQuery, () => {
  page.value = 1
})

watch(sort, () => {
  page.value = 1
})
</script>
