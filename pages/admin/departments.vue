<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="space-y-4 sm:space-y-0 sm:flex sm:flex-row sm:items-start sm:justify-between"
      style="margin-top: 0"
    >
      <div class="w-full sm:w-auto">
        <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
          Department Management
        </h1>
        <p class="text-xs sm:text-sm lg:text-base text-gray-400">
          Manage departments, users, and artifacts across your organization.
        </p>
      </div>
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto flex-shrink-0"
      >
        <button
          @click="openAddDepartmentModal()"
          :class="[
            baseButtonClass,
            'bg-blue-600 hover:bg-blue-700 text-white',
            'flex items-center justify-center sm:justify-start space-x-2',
            'flex-1 sm:flex-auto',
          ]"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          <span class="truncate">Add Department</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
      <!-- Total Departments -->
      <div class="bg-dark-800 rounded-lg p-3 sm:p-4 xl:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Departments</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.totalDepartments }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-building-office-2" class="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>

      <!-- Active Departments -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Active Departments</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.activeDepartments }}</p>
          </div>
          <div class="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      <!-- Total Users -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Users</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.totalUsers }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-users" class="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      <!-- Total Artifacts -->
      <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-400 text-sm font-medium">Total Artifacts</p>
            <p class="text-lg font-bold text-white mt-2">{{ stats.totalArtifacts }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-document" class="w-6 h-6 text-orange-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Search, Filters and Sort -->
    <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
        <!-- Search - 100% on mobile, 75% on tablet/desktop -->
        <div class="md:col-span-3">
          <UInput
            :model-value="searchQuery"
            @update:model-value="searchQuery = $event"
            placeholder="Search departments..."
            size="md"
            icon="i-heroicons-magnifying-glass"
          />
        </div>

        <!-- Status - 100% on mobile, 25% on tablet/desktop -->
        <div class="md:col-span-1">
          <USelect
            :model-value="selectedStatus"
            @update:model-value="selectedStatus = $event"
            :options="[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]"
            size="md"
          />
        </div>
      </div>
    </div>

    <!-- Departments Table -->
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      <!-- Table Header -->
      <div class="px-4 sm:px-6 py-4 border-b border-dark-700">
        <h2 class="text-base sm:text-lg font-semibold text-white">Departments</h2>
        <p class="text-gray-400 text-xs sm:text-sm mt-1">
          Individual departments with their assigned users and artifacts. Overall statistics shown
          in cards above.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-gray-400 mt-2">Loading departments...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="paginatedDepartments.length === 0" class="p-8 text-center">
        <UIcon name="i-heroicons-inbox" class="w-12 h-12 text-gray-500 mx-auto" />
        <p class="text-gray-400 mt-2">No departments found</p>
      </div>

      <!-- Table Content -->
      <div v-else>
        <UTable
          :columns="columns"
          :rows="paginatedDepartments"
          v-model:sort="sort"
          sort-mode="manual"
          class="text-white"
        >
          <!-- Custom cells -->
          <template #name-data="{ row }">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span class="text-blue-400 font-medium text-sm">{{ row.initials }}</span>
              </div>
              <div class="ml-3">
                <div class="text-sm font-medium text-white">{{ row.name }}</div>
              </div>
            </div>
          </template>

          <template #description-data="{ row }">
            <div class="text-sm text-gray-400">{{ row.description || '-' }}</div>
          </template>

          <template #status-data="{ row }">
            <span
              class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
              :class="{
                'bg-green-500/20 text-green-400': row.status === 'active',
                'bg-red-500/20 text-red-400': row.status === 'inactive',
              }"
            >
              <div
                class="w-1.5 h-1.5 rounded-full mr-1"
                :class="{
                  'bg-green-400': row.status === 'active',
                  'bg-red-400': row.status === 'inactive',
                }"
              ></div>
              {{ row.status }}
            </span>
          </template>

          <template #users-data="{ row }">
            <div class="text-sm text-white">{{ row.users }}</div>
          </template>

          <template #artifacts-data="{ row }">
            <div class="text-sm text-white">{{ row.artifacts }}</div>
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center space-x-2">
              <!-- Edit (disabled for ALL) -->
              <AppTooltip v-if="row.id !== 'ALL'" text="Edit department">
                <button
                  @click="editDepartment(row)"
                  class="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4" />
                </button>
              </AppTooltip>

              <!-- Disabled actions for ALL -->
              <AppTooltip v-if="row.id === 'ALL'" text="The All department cannot be modified or disabled">
                <div class="flex items-center text-gray-500 cursor-not-allowed">
                  <UIcon name="i-heroicons-lock-closed" class="w-4 h-4" />
                </div>
              </AppTooltip>

              <!-- Activate / Deactivate (normal departments only) -->
              <AppTooltip v-else :text="row.status === 'active' ? 'Deactivate department' : 'Activate department'">
                <button
                  @click="
                    row.status === 'active' ? showDeactivateConfirm(row) : showActivateConfirm(row)
                  "
                  :class="`transition-colors ${
                    row.status === 'active'
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-green-400 hover:text-green-300'
                  }`"
                >
                  <UIcon
                    :name="row.status === 'active' ? 'heroicons:no-symbol' : 'heroicons:check-circle'"
                    class="w-4 h-4"
                  />
                </button>
              </AppTooltip>
            </div>
          </template>
        </UTable>
        <div
          class="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-dark-700 gap-4 sm:gap-0"
        >
          <div class="flex items-center space-x-3 text-xs sm:text-sm">
            <div class="text-gray-400 hidden sm:block">Rows per page</div>
            <div class="w-20 sm:w-24">
              <USelect v-model="perPage" :options="perPageOptions" size="sm" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <UPagination
              v-model="page"
              :total="sortedRows.length"
              :page-count="computedPageCount"
              :show-first="false"
              :show-last="false"
              :show-edges="false"
              size="sm"
              color="blue"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Department Modal (Add/Edit) -->
    <UModal v-model="showDepartmentModal" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-white">
              {{ isEditMode ? 'Edit Department' : 'Add New Department' }}
            </h3>
            <button @click="closeDepartmentModal" class="text-gray-400 hover:text-white">
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </template>

        <!-- Error Alert -->
        <div v-if="modalError" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p class="text-red-400 text-sm">{{ modalError }}</p>
        </div>

        <UForm
          :state="departmentForm"
          :schema="departmentSchema"
          @submit="saveDepartment"
          class="space-y-4"
        >
          <!-- Department Name -->
          <UFormGroup label="Department Name" name="name" required>
            <UInput
              v-model="departmentForm.name"
              type="text"
              placeholder="Enter department name"
              inputClass="custom-input"
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                padding: { sm: 'p-3' },
              }"
              icon="i-heroicons-building-office-2"
            />
          </UFormGroup>

          <!-- Description -->
          <UFormGroup label="Description" name="description">
            <UTextarea
              v-model="departmentForm.description"
              placeholder="Enter department description"
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                padding: { sm: 'p-3' },
              }"
              rows="3"
            />
          </UFormGroup>

          <!-- Status
          <UFormGroup label="Status" name="status" required>
            <USelect
              v-model="departmentForm.status"
              :options="[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]"
              :ui="{
                base: 'w-full px-3 py-3 border border-dark-700 rounded-lg bg-dark-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
                padding: { sm: 'p-3' },
              }"
            />
          </UFormGroup> -->

          <!-- Buttons -->
          <div class="flex space-x-3 pt-4">
            <UButton
              type="button"
              @click="closeDepartmentModal"
              label="Cancel"
              color="gray"
              class="flex-1 px-3 py-3 justify-center"
            />
            <UButton
              type="submit"
              :loading="isEditMode ? updatingDepartment : addingDepartment"
              :label="
                isEditMode
                  ? updatingDepartment
                    ? 'Saving...'
                    : 'Save Changes'
                  : addingDepartment
                    ? 'Adding...'
                    : 'Add Department'
              "
              class="flex-1 px-3 py-3 justify-center"
            />
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Deactivate Department Modal -->
    <UModal v-model="showDeactivateModal" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-white">Deactivate Department</h3>
        </template>

        <p class="text-gray-300 mb-4">
          Are you sure you want to deactivate
          <span class="font-semibold">{{ selectedDepartment?.name }}</span
          >?
        </p>
        <p class="text-sm text-gray-400 mb-6">
          Deactivated departments cannot receive new users or artifacts. Existing users and
          artifacts will remain in the system.
        </p>

        <div class="flex space-x-3">
          <UButton
            @click="showDeactivateModal = false"
            label="Cancel"
            color="gray"
            class="flex-1 px-3 py-3 justify-center"
          />
          <UButton
            @click="confirmDeactivate"
            :loading="togglingDepartment"
            label="Deactivate"
            color="red"
            class="flex-1 px-3 py-3 justify-center"
          />
        </div>
      </UCard>
    </UModal>

    <!-- Activate Department Modal -->
    <UModal v-model="showActivateModal" prevent-close>
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-white">Activate Department</h3>
        </template>

        <p class="text-gray-300 mb-6">
          Are you sure you want to activate
          <span class="font-semibold">{{ selectedDepartment?.name }}</span
          >?<br />
          The department will be able to receive new users and artifacts.
        </p>

        <div class="flex space-x-3">
          <UButton
            @click="showActivateModal = false"
            label="Cancel"
            color="gray"
            class="flex-1 px-3 py-3 justify-center"
          />
          <UButton
            @click="confirmActivate"
            :loading="togglingDepartment"
            label="Activate"
            color="blue"
            class="flex-1 px-3 py-3 justify-center"
          />
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { z } from 'zod'
import { useRoute } from 'vue-router'
import { useDepartmentsStore } from '~/stores/departments'

useHead({
  title: 'Department Management - Admin Dashboard - provento.ai',
})

// Types
interface Department {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  users: number
  artifacts: number
  initials: string
}

interface DepartmentForm {
  id?: string
  name: string
  description: string
  status: 'active' | 'inactive'
}

interface DepartmentStats {
  totalDepartments: number
  activeDepartments: number
  totalUsers: number
  totalArtifacts: number
}

// Using admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Base styles
const baseButtonClass = 'px-4 py-2 rounded-lg border border-dark-700 transition-colors'

// Reactive state
const route = useRoute()
const searchQuery = ref('')
const selectedStatus = ref('')
const showDepartmentModal = ref(false)
const showDeactivateModal = ref(false)
const showActivateModal = ref(false)
const loading = computed(() => departmentsStore.isLoading)
const addingDepartment = ref(false)
const updatingDepartment = ref(false)
const togglingDepartment = ref(false)
const isEditMode = ref(false)
const modalError = ref<string | null>(null)

const selectedDepartment = ref<Department | null>(null)

// Notification hook (from users.vue pattern)
const { showSuccess, showError } = useNotification()
const departmentsStore = useDepartmentsStore()

const departmentsList = computed(() => departmentsStore.getDepartments)

const departmentForm = reactive<DepartmentForm>({
  id: '',
  name: '',
  description: '',
  status: 'active',
})

// Validation schema
const departmentSchema = z.object({
  name: z
    .string()
    .nonempty('Department name is required')
    .min(3, 'Name should be at least 3 characters long'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

// Table columns
const columns = [
  { key: 'name', label: 'Department Name', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'users', label: 'Users', sortable: true },
  { key: 'artifacts', label: 'Artifacts', sortable: true },
  { key: 'actions', label: 'Actions' },
]

// Filter logic - exclude "ALL" row from table display
const filteredDepartments = computed(() => {
  return departmentsList.value
    .filter((dept) => dept.id !== 'ALL') // Exclude the "ALL" aggregate row from table
    .filter((dept) => {
      const matchesSearch =
        !searchQuery.value ||
        dept.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchQuery.value.toLowerCase())

      const matchesStatus = !selectedStatus.value || dept.status === selectedStatus.value

      return matchesSearch && matchesStatus
    })
})

// Sorting
const sort = ref<{ column: string; direction: 'asc' | 'desc' | null }>({
  column: 'name',
  direction: 'asc',
})

const sortedRows = computed(() => {
  if (!sort.value.column || !sort.value.direction) return filteredDepartments.value

  const colKey = sort.value.column
  const dir = sort.value.direction === 'asc' ? 1 : -1

  const fieldMap: Record<string, string> = {
    name: 'name',
    description: 'description',
    status: 'status',
    users: 'users',
    artifacts: 'artifacts',
  }

  const field = fieldMap[colKey] || colKey

  return [...filteredDepartments.value].sort((a, b) => {
    const aVal = (a as any)[field]
    const bVal = (b as any)[field]

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir
    }

    const aStr = String(aVal || '').toLowerCase()
    const bStr = String(bVal || '').toLowerCase()

    if (aStr < bStr) return -1 * dir
    if (aStr > bStr) return 1 * dir
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

const computedPageCount = computed(() =>
  perPage.value === 'all' ? Math.max(sortedRows.value.length, 1) : (perPage.value as number),
)

watch(perPage, () => {
  page.value = 1
})

const paginatedDepartments = computed(() => {
  if (perPage.value === 'all') return sortedRows.value
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return sortedRows.value.slice(start, end)
})

watch([selectedStatus, searchQuery], () => {
  page.value = 1
})

// Stats computation - use "ALL" row for aggregated counts, exclude it from department count
const stats = computed<DepartmentStats>(() => {
  // Find the "ALL" row which has aggregated counts from the backend
  const allRow = departmentsList.value.find((d) => d.id === 'ALL')

  // Count only real departments (exclude the "ALL" aggregate row)
  const realDepartments = departmentsList.value.filter((d) => d.id !== 'ALL')
  const totalDepartments = realDepartments.length
  const activeDepartments = realDepartments.filter((d) => d.status === 'active').length

  // Use the "ALL" row's aggregated counts (accurate backend totals)
  const totalUsers = allRow?.users || 0
  const totalArtifacts = allRow?.artifacts || 0

  return { totalDepartments, activeDepartments, totalUsers, totalArtifacts }
})

// Modal functions
const openAddDepartmentModal = () => {
  isEditMode.value = false
  departmentForm.id = ''
  departmentForm.name = ''
  departmentForm.description = ''
  departmentForm.status = 'active'
  modalError.value = null
  showDepartmentModal.value = true
}

const closeDepartmentModal = () => {
  showDepartmentModal.value = false
  modalError.value = null
}

const editDepartment = (dept: Department) => {
  isEditMode.value = true
  departmentForm.id = dept.id
  departmentForm.name = dept.name
  departmentForm.description = dept.description
  departmentForm.status = dept.status
  showDepartmentModal.value = true
}

const saveDepartment = async () => {
  modalError.value = null

  try {
    if (isEditMode.value && departmentForm.id) {
      updatingDepartment.value = true

      await departmentsStore.updateDepartment(departmentForm.id, {
        name: departmentForm.name,
        description: departmentForm.description,
        status: departmentForm.status,
      })
    } else {
      addingDepartment.value = true

      await departmentsStore.createDepartment({
        name: departmentForm.name,
        description: departmentForm.description,
      })
    }

    showDepartmentModal.value = false
  } catch (err) {
    modalError.value = 'Failed to save department'
  } finally {
    updatingDepartment.value = false
    addingDepartment.value = false
  }
}

const showDeactivateConfirm = (dept: Department) => {
  if (dept.id === 'ALL') {
    showError("The 'All' department cannot be deactivated")
    return
  }
  selectedDepartment.value = dept
  showDeactivateModal.value = true
}

const showActivateConfirm = (dept: Department) => {
  if (dept.id === 'ALL') return
  selectedDepartment.value = dept
  showActivateModal.value = true
}

const confirmDeactivate = async () => {
  if (!selectedDepartment.value) return
  try {
    togglingDepartment.value = true
    await departmentsStore.toggleDepartmentStatus(selectedDepartment.value.id, 'inactive')
    showDeactivateModal.value = false
  } finally {
    togglingDepartment.value = false
  }
}

const confirmActivate = async () => {
  if (!selectedDepartment.value) return
  try {
    togglingDepartment.value = true
    await departmentsStore.toggleDepartmentStatus(selectedDepartment.value.id, 'active')
    showActivateModal.value = false
  } finally {
    togglingDepartment.value = false
  }
}

const getInitials = (name: string): string => {
  if (!name) return 'D'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Get all active departments for user/artifact assignment
const getActiveDepartments = (): Department[] => {
  return departmentsList.value.filter((d) => d.status === 'active')
}

onMounted(() => {
  departmentsStore.fetchDepartments()
})
</script>
