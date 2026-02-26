<template>
  <div class="space-y-6">
    <!-- Header -->
    <ArtefactsHeader @upload="showUploadModal = true" :disabled="disableUpload" />

    <!-- Plan Usage Alerts -->
    <PlanUpgradeAlert :data="usageAlertData" @upgrade="goToPlans" />

    <!-- Stats Cards -->
    <ArtefactsStats
      :total-artefacts="totalArtefacts"
      :artefacts-limit="(planDetails as any)?.artefacts"
      :processed-artefacts="processedArtefacts"
      :total-categories="totalCategories"
      :total-size="totalSizeGB"
      :storage-limit="(planDetails as any)?.storage_limit_gb"
      :loading="isLoadingStats"
    />

    <!-- Search and Filters -->
    <ArtefactsFilters
      v-model:search-query="searchQuery"
      v-model:selected-category="selectedCategory"
      v-model:selected-type="selectedType"
      v-model:selected-status="selectedStatus"
      :available-categories="availableCategories"
      v-model:selected-department="selectedDepartment"
      :department-options="departmentFilterOptions"
      :categories-loading="categoriesLoading"
    />

    <!-- Artifacts Table -->
    <ArtefactsTable
      :artefacts="filteredArtefacts"
      :summarizing-docs="artefactsStore.getSummarizingDocs"
      :loading="isLoadingArtefacts"
      :department-name-map="departmentNameMap"
      @view-artefact="viewArtefact"
      @reprocess-artefact="reprocessArtefact"
      @delete-artefact="deleteArtefact"
      @view-summary="viewSummary"
      @summarize-artefact="summarizeArtefact"
    />

    <!-- Upload Modal -->
    <client-only>
      <ArtefactUploadModal
        v-model:is-open="showUploadModal"
        :available-categories="availableCategories"
        :categories-loading="categoriesLoading"
        :available-departments="departmentsList"
        :departments-loading="departmentsLoading"
        :department-name-map="departmentNameMap"
        @close="showUploadModal = false"
        @file-uploaded="handleFileUploaded"
        @google-drive-uploaded="handleGoogleDriveUploaded"
        @category-added="addCategory"
        @category-deleted="deleteCategory"
      />
    </client-only>

    <!-- Summary Modal -->
    <ArtefactSummaryModal
      v-model:is-open="showSummaryModal"
      :artefact="selectedArtefact"
      @close="showSummaryModal = false"
      @download="downloadArtefact"
    />

    <!-- Document Viewer Modal -->
    <ArtefactViewModal
      v-model:is-open="showViewModal"
      :artefact="selectedViewArtefact"
      @close="showViewModal = false"
    />

    <!-- Confirm Delete Category Popup -->
    <ConfirmPopup
      v-model:is-open="showConfirmPopup"
      title="Delete Category"
      :message="`Are you sure you want to delete the category '${categoryToDelete}'?`"
      details="This action cannot be undone. All artefacts in this category will be moved to 'Uncategorized'."
      confirm-text="Delete Category"
      cancel-text="Cancel"
      type="danger"
      :loading="isDeletingCategory"
      @confirm="confirmDeleteCategory"
      @cancel="cancelDeleteCategory"
    />

    <!-- Confirm Delete Artifact Popup -->
    <ConfirmPopup
      v-model:is-open="showConfirmDeleteArtefact"
      title="Delete Artifact"
      :message="`Are you sure you want to delete '${artefactToDelete?.name}'?`"
      details="This action cannot be undone. The artefact will be permanently removed from your storage and vector database."
      confirm-text="Delete Artifact"
      cancel-text="Cancel"
      type="danger"
      :loading="isDeletingArtefact"
      @confirm="confirmDeleteArtefact"
      @cancel="cancelDeleteArtefact"
    />

    <!-- Confirm Reprocess Artifact Popup -->
    <ConfirmPopup
      v-model:is-open="showConfirmReprocessArtefact"
      title="Reprocess Artifact"
      :message="`Are you sure you want to reprocess '${artefactToReprocess?.name}'?`"
      details="This will regenerate the summary and analysis using the latest AI models. The current summary will be replaced."
      confirm-text="Reprocess Artifact"
      cancel-text="Cancel"
      type="info"
      :loading="isReprocessingArtefact"
      @confirm="confirmReprocessArtefact"
      @cancel="cancelReprocessArtefact"
    />

    <!-- Confirm Summarize Artifact Popup -->
    <ConfirmPopup
      v-model:is-open="showConfirmSummarizeArtefact"
      title="Summarize Document"
      :message="`Generate AI summary for '${artefactToSummarize?.name}'?`"
      details="This will analyze the document content and generate an AI-powered summary using the latest models."
      confirm-text="Generate Summary"
      cancel-text="Cancel"
      type="info"
      :loading="isSummarizingArtefact"
      @confirm="confirmSummarizeArtefact"
      @cancel="cancelSummarizeArtefact"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import { useNotification } from '~/composables/useNotification'

// Using admin layout
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

// Import components
import ArtefactsHeader from '~/components/admin/artefacts/ArtefactsHeader.vue'
import ArtefactsStats from '~/components/admin/artefacts/ArtefactsStats.vue'
import ArtefactsFilters from '~/components/admin/artefacts/ArtefactsFilters.vue'
import ArtefactsTable from '~/components/admin/artefacts/ArtefactsTable.vue'
import ArtefactUploadModal from '~/components/admin/artefacts/ArtefactUploadModal.vue'
import ArtefactSummaryModal from '~/components/admin/artefacts/ArtefactSummaryModal.vue'
import ArtefactViewModal from '~/components/admin/artefacts/ArtefactViewModal.vue'
import ConfirmPopup from '~/components/ui/ConfirmPopup.vue'
import PlanUpgradeAlert from '~/components/ui/PlanUpgradeAlert.vue'

// Import stores
import { useAuthStore } from '~/stores/auth'
import { useArtefactsStore } from '~/stores/artefacts'
import { useProfileStore } from '~/stores/profile'
const profileStore = useProfileStore()

const planDetails = computed(() => profileStore.getUserProfile?.plan_details || null)

// Compute safe limits from plan details
const safePlanLimits = computed(() => {
  if (!planDetails.value) return { artefacts: undefined, storage_limit_gb: undefined }
  return {
    artefacts: planDetails.value.artefacts,
    storage_limit_gb: planDetails.value.storage_limit_gb,
  }
})

// Reactive data
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedDepartment = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const showUploadModal = ref(false)
const showSummaryModal = ref(false)
const selectedArtefact = ref(null)
const showViewModal = ref(false)
const selectedViewArtefact = ref(null)
const departmentsList = ref<any[]>([]) // Role-based filtered departments (for selection/filtering)
const allDepartmentsList = ref<any[]>([]) // All departments (for name mapping/display)
const departmentsLoading = ref(false)

// Confirm popup state
const showConfirmPopup = ref(false)
const categoryToDelete = ref('')
const isDeletingCategory = ref(false)

const disableUpload = computed(() => {
  return usageAlertData.value.hasExceeded === true
})

// Initialize stores
const authStore = useAuthStore()
const artefactsStore = useArtefactsStore()

// Get orgId: for superadmin prefer route query/org param, otherwise use auth user's org
const currentUser = computed(() => authStore.user || null)
import { useRoute } from 'vue-router'
const route = useRoute()
const orgId = computed(() => {
  // If caller is superadmin, prefer selected org from route query
  if (currentUser.value?.role_id === 0) {
    const q = route && route.query ? route.query.org || route.query.org_id : null
    if (q && String(q).trim()) return String(q)
  }
  return currentUser.value?.org_id || null
})

// Fallback categories if API is not available
const fallbackCategories = [
  'HR Policy',
  'Financial',
  'Technical',
  'Analytics',
  'Legal & Compliance',
  'Policies & Procedures',
  'Product / Service Information',
  'Technical / Operational Documentation',
  'Training & Onboarding',
]

// Categories management - now from store with fallback
const availableCategories = computed(() => {
  const storeCategories = artefactsStore.getCategoryNames
  const categories = storeCategories.length > 0 ? storeCategories : fallbackCategories
  return categories
})
const categoriesLoading = computed(() => {
  const loading = artefactsStore.isCategoryLoadingState
  return loading
})
const categoriesError = computed(() => artefactsStore.getCategoryError)

const departmentFilterOptions = computed(() => [
  { label: 'All Departments', value: '' },
  ...departmentsList.value.map((d) => ({
    label: d.name,
    value: String(d.dept_id),
  })),
])

// 🔑 Create department name map for displaying department names in table
const departmentNameMap = computed(() => {
  const map: Record<string, string> = {}

  // 🔑 Build map from allDepartmentsList (ALL departments, no filtering)
  // This ensures Department Admins can see names of all departments, even if they don't have access
  if (allDepartmentsList.value && Array.isArray(allDepartmentsList.value)) {
    allDepartmentsList.value.forEach((dept: any) => {
      if (dept && dept.dept_id && dept.name) {
        map[String(dept.dept_id)] = dept.name
      }
    })
  }

  // Fallback to store departments if allDepartmentsList is empty
  const storeDepts = artefactsStore.getDepartments
  if (storeDepts && Array.isArray(storeDepts)) {
    storeDepts.forEach((dept: any) => {
      if (dept && dept.dept_id && dept.name) {
        map[String(dept.dept_id)] = dept.name
      }
    })
  }

  return map
})

// Computed properties for artefacts and stats from store
const artefacts = computed(() => artefactsStore.getArtefacts)
const stats = computed(() => artefactsStore.getStats)
const isLoadingArtefacts = computed(() => artefactsStore.isArtefactsLoading)
const artefactsError = computed(() => artefactsStore.getArtefactsError)

// Show loading for stats only on initial load (when no data exists yet)
const isLoadingStats = computed(() => {
  // Only show loading on true initial load when we have no artefacts data at all
  return artefactsStore.isArtefactsLoading && artefacts.value.length === 0
})

// Individual stats computed properties
const totalArtefacts = computed(() => stats.value?.totalArtefacts || 0)
const processedArtefacts = computed(() => stats.value?.processedArtefacts || 0)
const totalCategories = computed(() => stats.value?.totalCategories || 0)
const totalSizeGB = computed(
  () => formatGB(bytesToGB(parseSizeToBytes(stats.value?.totalSize))) || '0 GB',
)
const totalSize = computed(() => stats.value?.totalSize || '0 Bytes')

// ----------------------
// Size helpers
// ----------------------
const parseSizeToBytes = (sizeStr: string): number => {
  if (!sizeStr || typeof sizeStr !== 'string') return 0

  const units: Record<string, number> = {
    bytes: 1,
    b: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
    tb: 1024 ** 4,
  }

  const match = sizeStr
    .trim()
    .toLowerCase()
    .match(/^([\d.]+)\s*([a-z]+)$/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2]
  const multiplier = units[unit] || 1

  return Math.round(value * multiplier)
}

const bytesToGB = (bytes: number): number => bytes / 1024 ** 3

// const formatGB = (gb: number): string => {
//   if (gb < 1) return (gb * 1024).toFixed(1) + ' MB'
//   return gb.toFixed(2) + ' GB'
// }

const formatGB = (gb: number): string => {
  return gb < 0.1 ? parseFloat(gb.toFixed(3)) + ' GB' : gb.toFixed(2) + ' GB'
}

const filteredArtefacts = computed(() => {
  return artefacts.value.filter((artefact) => {
    const searchLower = searchQuery.value.toLowerCase()

    // Search by document name OR department name
    const matchesSearch =
      !searchQuery.value ||
      artefact.name?.toLowerCase().includes(searchLower) ||
      (artefact.rawDepartmentIds || []).some((deptId) =>
        departmentNameMap.value[deptId]?.toLowerCase().includes(searchLower),
      )

    const matchesCategory = !selectedCategory.value || artefact.category === selectedCategory.value

    const matchesType = !selectedType.value || artefact.type === selectedType.value

    const matchesStatus = !selectedStatus.value || artefact.status === selectedStatus.value

    const matchesDepartment =
      !selectedDepartment.value ||
      artefact.rawDepartmentIds?.includes(String(selectedDepartment.value))

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesDepartment
  })
})

// Methods
const viewArtefact = (artefact: any) => {
  selectedViewArtefact.value = artefact
  showViewModal.value = true
}

const reprocessArtefact = async (artefact: any) => {
  // Check if artifact can be reprocessed
  if (!artefact.id) {
    showError('Cannot reprocess artifact - invalid artifact data')
    return
  }

  // Show confirmation modal
  showConfirmReprocessArtefact.value = true
  artefactToReprocess.value = artefact
}

const deleteArtefact = async (artefact: any) => {
  // Show confirmation popup first
  showConfirmDeleteArtefact.value = true
  artefactToDelete.value = artefact
}

// Delete confirmation state
const showConfirmDeleteArtefact = ref(false)
const artefactToDelete = ref<any>(null)
const isDeletingArtefact = ref(false)

// Reprocess confirmation state
const showConfirmReprocessArtefact = ref(false)
const artefactToReprocess = ref<any>(null)
const isReprocessingArtefact = ref(false)

// Summarize confirmation state
const showConfirmSummarizeArtefact = ref(false)
const artefactToSummarize = ref<any>(null)
const isSummarizingArtefact = ref(false)
const { showError, showSuccess, showInfo, showWarning } = useNotification()

// Confirm delete handler
const confirmDeleteArtefact = async () => {
  if (!artefactToDelete.value) return

  isDeletingArtefact.value = true

  try {
    const result = await artefactsStore.deleteArtefact(
      artefactToDelete.value.id,
      artefactToDelete.value.name,
      orgId.value,
    )

    if (result.success) {
      // showSuccess(result.message)
      // Refresh the artefacts list
      await artefactsStore.fetchArtefacts(orgId.value)
      await fetchArtifactDepartments()
    } else {
      // showError(result.message)
    }
  } catch (error: any) {
    // showError(error.message || 'Failed to delete artifact')
  } finally {
    isDeletingArtefact.value = false
    showConfirmDeleteArtefact.value = false
    artefactToDelete.value = null
  }
}

// Cancel delete handler
const cancelDeleteArtefact = () => {
  showConfirmDeleteArtefact.value = false
  artefactToDelete.value = null
  isDeletingArtefact.value = false
}

// Confirm reprocess handler
const confirmReprocessArtefact = async () => {
  if (!artefactToReprocess.value) return

  isReprocessingArtefact.value = true

  try {
    const result = await artefactsStore.reprocessArtefact(artefactToReprocess.value.id, orgId.value)

    if (result.success) {
      showSuccess(result.message)
      // Refresh the artefacts list to show updated status
      await artefactsStore.fetchArtefacts(orgId.value)
      await fetchArtifactDepartments()
    } else {
      showError(result.message)
    }
  } catch (error: any) {
    showError(error.message || 'Failed to reprocess artifact')
  } finally {
    isReprocessingArtefact.value = false
    showConfirmReprocessArtefact.value = false
    artefactToReprocess.value = null
  }
}

// Cancel reprocess handler
const cancelReprocessArtefact = () => {
  showConfirmReprocessArtefact.value = false
  artefactToReprocess.value = null
  isReprocessingArtefact.value = false
}

// Summarize artifact handler
const summarizeArtefact = async (artefact: any) => {
  // Check if artifact can be summarized
  if (!artefact.id) {
    showError('Cannot summarize artifact - invalid artifact data')
    return
  }

  if (artefact.status !== 'processed') {
    showError('Document must be processed before summarization')
    return
  }

  if (artefact.summarized === 'Yes') {
    showInfo('Document is already summarized. Use "View Summary" to see the existing summary.')
    return
  }

  // Check if document is already being auto-processed
  if (artefactsStore.isDocumentBeingSummarized(artefact.id)) {
    showInfo('This document is already being processed automatically. Please wait for completion.')
    return
  }

  // Show confirmation modal
  showConfirmSummarizeArtefact.value = true
  artefactToSummarize.value = artefact
}

// Confirm summarize handler
const confirmSummarizeArtefact = async () => {
  if (!artefactToSummarize.value) return

  isSummarizingArtefact.value = true

  try {
    showInfo('Document summarization started! This may take a few moments...')

    const result = await artefactsStore.summarizeArtefact(artefactToSummarize.value.id, orgId.value)

    if (result.success) {
      showSuccess(result.message)

      // Update document status locally for immediate UI feedback
      const docIndex = artefacts.value.findIndex((a) => a.id === artefactToSummarize.value?.id)
      if (docIndex !== -1) {
        artefacts.value[docIndex].summarized = 'Yes'
        artefacts.value[docIndex].summary = 'Summary available'
      }

      // Refresh the artefacts list to show updated summarization status
      await artefactsStore.fetchArtefacts(orgId.value)
      await fetchArtifactDepartments()
    } else {
      showError(result.message)
    }
  } catch (error: any) {
    showError(error.message || 'Failed to summarize document')
  } finally {
    isSummarizingArtefact.value = false
    showConfirmSummarizeArtefact.value = false
    artefactToSummarize.value = null
  }
}

// Cancel summarize handler
const cancelSummarizeArtefact = () => {
  showConfirmSummarizeArtefact.value = false
  artefactToSummarize.value = null
  isSummarizingArtefact.value = false
}

const viewSummary = (artefact: any) => {
  selectedArtefact.value = artefact
  showSummaryModal.value = true
}

const downloadArtefact = async (artefact: any) => {
  if (!artefact || !artefact.id) {
    showError('Cannot download artifact - invalid artifact data')
    return
  }

  try {
    showInfo('Preparing download...')

    // Use the existing viewArtefact method to get the file URL
    const result = await artefactsStore.viewArtefact(artefact.id, orgId.value)

    if (result.success && result.data.fileUrl) {
      // Create a temporary link to trigger download
      const link = document.createElement('a')
      link.href = result.data.fileUrl
      link.download = result.data.fileName || artefact.name || 'document'
      link.target = '_blank' // Open in new tab as fallback
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showSuccess('Download started successfully')
    } else {
      showError(result.message || 'File URL not available for download')
    }
  } catch (error: any) {
    console.error('Download error:', error)
    showError(error?.message || 'Failed to download artefact')
  }
}

// Upload handlers
const handleFileUploaded = async (artefact: any) => {
  artefactsStore.stopAutoProcessing() // ⬅ STOP WHEN UPLOAD COMPLETES OR STARTS
  await artefactsStore.fetchArtefacts(orgId.value)
  await fetchArtifactDepartments()
  artefactsStore.startAutoProcessing() // ⬅ RESTART AFTER FINISH
}

const handleGoogleDriveUploaded = async (files: any[]) => {
  artefactsStore.stopAutoProcessing() // ⬅ STOP
  await artefactsStore.fetchArtefacts(orgId.value)
  await fetchArtifactDepartments()
  artefactsStore.startAutoProcessing() // ⬅ RESTART
}

// Category management methods
const addCategory = async (category: string) => {
  const trimmedCategory = category.trim()
  if (!trimmedCategory) return

  if (orgId.value) {
    // Use API if orgId is available
    try {
      await artefactsStore.createCategory(trimmedCategory, orgId.value)
      // Refresh artefacts list to update stats if needed
      await artefactsStore.fetchArtefacts(orgId.value)
      await fetchArtifactDepartments()
    } catch (error) {
      // Show error message to user
      showError('Failed to add category. Please try again.')
    }
  } else {
    // Fallback to local management if no orgId
    showWarning('Category added locally only. Changes will not be saved.')
  }
}

const deleteCategory = (category: string) => {
  categoryToDelete.value = category
  showConfirmPopup.value = true
}

const confirmDeleteCategory = async () => {
  const category = categoryToDelete.value
  if (!category) return

  isDeletingCategory.value = true

  try {
    if (orgId.value) {
      // Use API if orgId is available
      // Find the category ID from the store
      const categoryData = artefactsStore.categories.find((cat) => cat.name === category)
      if (categoryData) {
        await artefactsStore.deleteCategory(categoryData.id, orgId.value)

        // Refresh artefacts list to update stats and category assignments
        await artefactsStore.fetchArtefacts(orgId.value)
        await fetchArtifactDepartments()
      }
    } else {
      // Fallback to local management if no orgId
      showWarning('Category deleted locally only. Changes will not be saved.')
    }
  } catch (error) {
    showError('Failed to delete category. Please try again.')
  } finally {
    isDeletingCategory.value = false
    showConfirmPopup.value = false
    categoryToDelete.value = ''
  }
}

const cancelDeleteCategory = (event?: Event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  showConfirmPopup.value = false
  categoryToDelete.value = ''
  isDeletingCategory.value = false
}

// Initialize categories when orgId is available
const initializeCategories = async () => {
  if (!orgId.value) {
    return
  }

  const token = process.client ? localStorage.getItem('authToken') : null
  if (!token) {
    return
  }

  try {
    await artefactsStore.fetchCategories(orgId.value)
  } catch (error: any) {
    // Handle specific error types
    if (await handleAuthError(error)) {
      showError('Session expired. Please sign in again.')
      return
    } else {
      showError('Failed to load categories. Please refresh the page.')
    }
  }
}

// Load departments list for the organization
const loadDepartments = async () => {
  // Load two sets of departments:
  // 1. Role-based filtered departments for selection/filtering (Department Admins see only their departments)
  // 2. All departments for name mapping (so Department Admins can see names of all departments in documents)
  await artefactsStore.fetchDepartments(orgId.value)
  departmentsList.value = artefactsStore.getDepartments // For selection/filtering

  // 🔑 Load ALL departments for name mapping (no role-based filtering)
  const allDepts = await artefactsStore.fetchAllDepartments(orgId.value)
  allDepartmentsList.value = allDepts // For display mapping

  departmentsLoading.value = artefactsStore.isDepartmentsLoading
}

// Fetch departments for all artifacts (now part of list API response)
const fetchArtifactDepartments = async () => {
  // Departments are now already included in the artefacts list API response
  // Keep both IDs and names for proper display
  artefacts.value.forEach((artefact) => {
    const deptIds = artefact.departments || [] // Already populated from list API

    // Ensure dept IDs are strings and filter out any undefined/null values
    const cleanDeptIds = deptIds
      .map((id: any) => {
        if (typeof id === 'object' && id !== null && 'dept_id' in id) {
          // Handle case where departments might be objects with dept_id
          return String(id.dept_id)
        }
        return String(id)
      })
      .filter((id: string) => id && id.length > 0 && id !== 'null' && id !== 'undefined')

    artefact.rawDepartmentIds = cleanDeptIds // 🔑 important - keep array of dept IDs for filtering
    // Store cleaned dept IDs for the table to use with departmentNameMap
    artefact.departments = cleanDeptIds
  })
}

// Initialize page data
const initializePage = async () => {
  try {
    // Ensure auth is initialized first
    await authStore.initializeStore()

    // Wait a bit for auth to settle
    await nextTick()

    // Check if user is authenticated and has orgId
    if (authStore.isLoggedIn && orgId.value) {
      // Ensure token is available before fetching data
      const token = process.client ? localStorage.getItem('authToken') : null
      if (token) {
        // 🔑 Load departments FIRST so departmentNameMap is populated
        await loadDepartments()

        // Then fetch categories and artefacts in parallel
        await Promise.all([initializeCategories(), artefactsStore.fetchArtefacts(orgId.value)])

        // After fetching artefacts, map their departments
        await fetchArtifactDepartments()
      }
    }
  } catch (error) {
    // Error handled silently
  }
}

// Storage usage metric
const storageUsageValue = computed(() => {
  const currentGB = bytesToGB(
    stats.value?.totalSizeBytes ??
      (typeof stats.value?.totalSizeBytes === 'number' ? stats.value?.totalSizeBytes : 0),
  )
  const hasPlan = planDetails.value && Object.keys(planDetails.value).length > 0
  const limitGB = hasPlan ? ((planDetails.value as any)?.storage_limit_gb ?? 0) : null
  const percentage = limitGB && limitGB > 0 ? (currentGB / limitGB) * 100 : 0

  return {
    current: currentGB,
    limit: limitGB ?? 0,
    percentage: percentage,
    display:
      hasPlan && (limitGB === 0 || limitGB === -1)
        ? `${currentGB.toFixed(2)}GB / Unlimited`
        : `${currentGB.toFixed(2)}GB${limitGB && limitGB > 0 ? ` / ${limitGB}GB` : ''}`,
  }
})

// Aggregated usage alert data (same structure as analytics)
const usageAlertData = computed(() => {
  const metrics: any[] = []
  const hasPlan = planDetails.value && Object.keys(planDetails.value).length > 0

  // Artifacts limit (only show if plan exists and limit is > 0)
  if (hasPlan) {
    const artefactsLimit = (planDetails.value as any)?.artefacts ?? 0
    if (artefactsLimit > 0) {
      const current = totalArtefacts.value
      const limit = artefactsLimit
      const percentage = limit > 0 ? (current / limit) * 100 : 0

      metrics.push({
        name: 'Artifacts',
        current,
        limit,
        percentage: percentage,
      })
    }
  }

  // Storage limit (only show if plan exists and limit is > 0)
  if (hasPlan) {
    const storageLimit = (planDetails.value as any)?.storage_limit_gb ?? 0
    if (storageLimit > 0) {
      const current = storageUsageValue.value.current
      const limit = storageLimit
      const percentage = limit > 0 ? (current / limit) * 100 : 0

      metrics.push({
        name: 'Storage',
        current,
        limit,
        percentage,
      })
    }
  }

  const exceededMetrics = metrics.filter((m) => m.percentage >= 100)
  const highMetrics = metrics.filter((m) => m.percentage >= 80 && m.percentage < 100)

  return {
    metrics,
    exceededMetrics,
    highMetrics,
    hasExceeded: exceededMetrics.length > 0,
    hasHigh: highMetrics.length > 0,
  }
})

const goToPlans = () => {
  navigateTo('/admin/plans')
}

// Watch for orgId changes and fetch data
watch(
  orgId,
  async (newOrgId) => {
    if (newOrgId && authStore.isLoggedIn) {
      const token = process.client ? localStorage.getItem('authToken') : null
      if (token) {
        // 🔑 Load departments FIRST so departmentNameMap is populated before artifacts are displayed
        await loadDepartments()

        // Then fetch categories and artifacts in parallel
        await Promise.all([initializeCategories(), artefactsStore.fetchArtefacts(orgId.value)])

        // After fetching artifacts, map their departments
        await fetchArtifactDepartments()
      }
    }
  },
  { immediate: false },
)

// Watch for authentication changes
watch(
  () => authStore.isLoggedIn,
  (isAuth) => {
    if (isAuth && orgId.value) {
      const token = process.client ? localStorage.getItem('authToken') : null
      if (token) {
        Promise.all([initializeCategories(), artefactsStore.fetchArtefacts(orgId.value)])
      }
    }
  },
)

// Watch for auto-processing completion (both processing and summarization)
watch(
  () => artefactsStore.getProcessingStatus().allComplete,
  (allComplete) => {
    // Silent monitoring of complete processing (processed + summarized)
  },
)

// Watch for changes in artefacts data to ensure UI stays updated
watch(
  () => artefactsStore.artefacts,
  (newArtefacts, oldArtefacts) => {
    // Silent monitoring of artefacts changes for UI updates
  },
  { deep: true },
)

// 🔑 Watch for departments list changes and re-map artifact departments
watch(
  () => [departmentsList.value, allDepartmentsList.value],
  () => {
    // When departments load, ensure artifacts have proper dept IDs (not names)
    artefacts.value.forEach((artefact) => {
      const deptIds = artefact.rawDepartmentIds || artefact.departments || []
      artefact.departments = deptIds.map(String)
    })
  },
  { deep: true },
)

// Initialize everything on mount
onMounted(async () => {
  await initializePage()

  // Automatically start background processing if there are unprocessed documents
  await nextTick()
  const processingStatus = artefactsStore.getProcessingStatus()

  // Additionally: on initial landing, immediately trigger summarization for any already-processed but unsummarized documents
  if (process.client) {
    const pending = artefactsStore.pendingSummarizations
    if (pending && pending.length > 0) {
      // Show a single notification listing files being summarized
      try {
        const names = pending
          .map((d: any) => d.name)
          .slice(0, 10)
          .join(', ')
        showInfo(`Auto-summarizing ${pending.length} document(s): ${names}`, {
          title: 'Auto Summarization Started',
          duration: 6000,
        })
      } catch (e) {}

      // Mark and kick off summarizations in background (prevent automatic retries by marking attempted)
      for (const doc of pending) {
        if (!artefactsStore.isDocumentBeingSummarized(doc.id)) {
          try {
            artefactsStore.summarizingDocs.add(doc.id)
            // mark attempted so background polling won't keep retrying failed ones
            artefactsStore.attemptedSummarizations.add(doc.id)
            // Fire-and-forget background summarization
            void artefactsStore.processSingleSummarization(doc.id)
            // small stagger
            await new Promise((r) => setTimeout(r, 250))
          } catch (e) {
            // ignore per-doc errors
          }
        }
      }
    }
  }

  // If there are unprocessed documents, start background polling
  if (processingStatus.unprocessedCount > 0) {
    artefactsStore.startAutoProcessing()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  artefactsStore.stopAutoProcessing()
})

useHead({
  title: 'Artifact Management - Admin Dashboard - provento.ai',
})
</script>
