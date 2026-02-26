<!-- /pages/admin/plans/billing-history.vue -->
<template>
  <div class="flex flex-col flex-1">
    <section class="space-y-4 sm:space-y-6 flex-1">
      <div class="max-w-full">
        <!-- Header with Back Button -->
        <div class="flex justify-between items-start mb-4 sm:mb-6">
          <div>
            <h1 class="text-lg sm:text-xl lg:text-2xl font-bold text-white">Billing History</h1>
            <p class="text-xs sm:text-sm text-gray-400">
              View your invoice history and payment details.
            </p>
          </div>
          <UButton
            to="/admin/plans"
            variant="ghost"
            size="sm"
            class="text-primary-400 hover:text-primary-300"
            icon="i-heroicons-arrow-left"
          >
            Back to Current Plan
          </UButton>
        </div>

        <!-- Filters -->
        <BillingHistoryFilters
          :date-range="dateRange"
          :selected-plan="selectedPlan"
          :available-plans="availablePlans"
          :search-query="searchQuery"
          @update:date-range="updateDateRange"
          @update:selected-plan="updateSelectedPlan"
          @update:search-query="updateSearchQuery"
        />

        <!-- Billing History Table -->
        <BillingHistoryTable
          :invoices="filteredInvoices"
          :loading="loading"
          @download-invoice="handleDownloadInvoice"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Billing History - provento.ai' })

definePageMeta({ layout: 'admin', middleware: 'auth' })

import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from '#imports'
import { useBillingHistoryStore } from '~/stores/billingHistory'
import dayjs from 'dayjs'

// Filters state
const dateRange = ref('All Time')
const selectedPlan = ref('All Plans')
const searchQuery = ref('')

// Data state
const loading = ref(false)
const invoices = ref<any[]>([])
const availablePlans = ref<string[]>(['All Plans'])

// Track if we need to update plans after filter change
const shouldUpdatePlans = ref(false)

// Initialize toast and store
const toast = useToast()
const billingHistoryStore = useBillingHistoryStore()

// Filtered invoices based on search query
const filteredInvoices = computed(() => {
  if (!searchQuery.value.trim()) return invoices.value
  
  const query = searchQuery.value.toLowerCase().trim()
  
  return invoices.value.filter((invoice: any) => {
    return (
      (invoice.invoiceNumber?.toLowerCase() || '').includes(query) ||
      (invoice.planName?.toLowerCase() || '').includes(query) ||
      (invoice.amount?.toString() || '').includes(query) ||
      (invoice.currency?.toLowerCase() || '').includes(query) ||
      (invoice.billing_period?.toLowerCase() || '').includes(query)
    )
  })
})

// Fetch billing history on mount
onMounted(async () => {
  await fetchAllPlansForFilter()
  await fetchBillingHistory()
})

// Watch for filter changes with debounce
let debounceTimer: NodeJS.Timeout
watch([dateRange, selectedPlan], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    await fetchBillingHistory()
    
    // After fetching filtered results, update available plans
    if (shouldUpdatePlans.value) {
      updateAvailablePlansFromCurrentResults()
    }
  }, 300)
})

// Watch for date range changes specifically
watch(dateRange, () => {
  // When date range changes, we need to update available plans
  // But keep the current selected plan if it still exists
  shouldUpdatePlans.value = true
})

// Update the fetchBillingHistory function
async function fetchBillingHistory() {
  loading.value = true
  
  try {
    // Clear any previous errors
    billingHistoryStore.error = null
    
    // Call the store method with filters
    await billingHistoryStore.fetchBillingHistory({
      dateRange: dateRange.value,
      selectedPlan: selectedPlan.value
    })
    
    // Set local invoices
    invoices.value = billingHistoryStore.invoices
    
  } catch (error: any) {
    
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to fetch billing history',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })

  } finally {
    loading.value = false
  }
}

// Function to fetch all plans for filter dropdown (only on mount)
async function fetchAllPlansForFilter() {
  try {
    // Use a separate API call to get all plan names
    const token = localStorage.getItem('authToken')
    if (!token) return
    
    // Calculate date range for "All Time" - use last 2 years as a reasonable default
    const now = dayjs()
    const twoYearsAgo = now.subtract(2, 'year').format('YYYY-MM-DD')
    const today = now.format('YYYY-MM-DD')
    
    const response: any = await $fetch('/api/billing/invoices', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: twoYearsAgo,
        endDate: today
      }
    })
    
    if (response?.success && response.data) {
      // Extract unique plan names from all invoices
      const plans = new Set(response.data
        .filter((inv: any) => inv && inv.planName && inv.planName.trim() !== '')
        .map((inv: any) => inv.planName))
      
      availablePlans.value = ['All Plans', ...Array.from(plans as Set<string>).sort()]
    }
    
  } catch (error) {
    console.error('Failed to fetch all plans for filter:', error)
    // If failed, fetch at least one invoice to get plans
    await fetchInitialPlans()
  }
}

// Update available plans from current filtered results
function updateAvailablePlansFromCurrentResults() {
  try {
    // Extract unique plan names from current filtered invoices
    const plans = new Set(invoices.value
      .filter(inv => inv && inv.planName && inv.planName.trim() !== '')
      .map(inv => inv.planName))
    
    // Update available plans
    const newAvailablePlans = ['All Plans', ...Array.from(plans).sort()]
    availablePlans.value = newAvailablePlans
    
    // Check if currently selected plan still exists in the filtered results
    if (selectedPlan.value !== 'All Plans' && !plans.has(selectedPlan.value)) {
      // If the selected plan doesn't exist in filtered results, reset to "All Plans"
      selectedPlan.value = 'All Plans'
      
      // Refetch with the updated plan selection
      setTimeout(() => fetchBillingHistory(), 100)
    }
    
    shouldUpdatePlans.value = false
    
  } catch (error) {
    console.error('Failed to update available plans:', error)
  }
}

// Fallback function to fetch initial plans
async function fetchInitialPlans() {
  try {
    await billingHistoryStore.fetchBillingHistory({
      dateRange: 'All Time',
      selectedPlan: 'All Plans'
    })
    
    const plans = new Set(billingHistoryStore.invoices
      .filter(inv => inv && inv.planName && inv.planName.trim() !== '')
      .map(inv => inv.planName))
    
    availablePlans.value = ['All Plans', ...Array.from(plans).sort()]
    
  } catch (error) {
    console.error('Failed to fetch initial plans:', error)
    availablePlans.value = ['All Plans']
  }
}

async function handleDownloadInvoice(invoice: any) {
  if (invoice.isFree || !invoice.id) {
    toast.add({
      title: 'Info',
      description: 'No downloadable invoice available for free plans',
      icon: 'i-heroicons-information-circle',
      color: 'blue'
    });
    return;
  }

  try {
    // Show loading state
    const toastId = toast.add({
      title: 'Downloading',
      description: 'Preparing your invoice...',
      icon: 'i-heroicons-arrow-down-tray',
      color: 'primary',
    });

    await billingHistoryStore.downloadInvoice(invoice.id, invoice.invoiceNumber);

    // Update toast to success
    toast.remove(toastId.id);
    toast.add({
      title: 'Success',
      description: 'Invoice downloaded successfully',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    });
  } catch (error: any) {
    // Handle error
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to download invoice',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    });
  }
}

// Event handlers
function updateDateRange(range: string) {
  dateRange.value = range
}

function updateSelectedPlan(plan: string) {
  selectedPlan.value = plan
  shouldUpdatePlans.value = false // Don't update plans when changing plan filter
}

function updateSearchQuery(query: string) {
  searchQuery.value = query
}
</script>

<style scoped>
/* Ensure full width for the page content */
.max-w-7xl {
  max-width: 100%;
}
</style>