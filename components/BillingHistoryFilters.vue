<template>
  <div class="bg-dark-800 rounded-lg p-4 sm:p-6 border border-dark-700 mb-6">
    <!-- Filters Header -->
    <!-- <h3 class="text-base sm:text-lg font-semibold text-white mb-4">Filters</h3> -->
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Search Input -->
      <div class="lg:col-span-2">
        <UInput
          :model-value="searchQuery"
          @update:model-value="$emit('update:searchQuery', $event)"
          placeholder="Search invoices..."
          size="md"
          icon="i-heroicons-magnifying-glass"
          :ui="{
            base: 'w-full',
            icon: { 
              trailing: { pointer: '' }
            }
          }"
        />
      </div>

      <!-- Date Range Filter -->
      <div>
        <USelect
          :model-value="dateRange"
          @update:model-value="$emit('update:dateRange', $event)"
          :options="[
            { label: 'All Time', value: 'All Time' },
            { label: 'Last 30 Days', value: 'Last 30 Days' },
            { label: 'Last 90 Days', value: 'Last 90 Days' },
            { label: 'This Year', value: 'This Year' },
            { label: 'Last Year', value: 'Last Year' },
          ]"
          size="md"
          :ui="{ 
            wrapper: 'w-full',
            base: 'w-full',
            container: 'w-full'
          }"
        />
      </div>

      <!-- Plan Name Filter -->
      <div>
        <USelect
          :model-value="selectedPlan"
          @update:model-value="$emit('update:selectedPlan', $event)"
          :options="availablePlans.map(plan => ({ label: plan, value: plan }))"
          size="md"
          :ui="{ 
            wrapper: 'w-full',
            base: 'w-full',
            container: 'w-full'
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  dateRange: string
  selectedPlan: string
  availablePlans: string[]
  searchQuery: string
}

const props = withDefaults(defineProps<Props>(), {
  dateRange: 'All Time',
  selectedPlan: 'All Plans',
  availablePlans: () => ['All Plans'],
  searchQuery: ''
})

defineEmits<{
  'update:dateRange': [value: string]
  'update:selectedPlan': [value: string]
  'update:searchQuery': [value: string]
}>()
</script>

<style scoped>
/* Ensure the dropdowns take full width */
:deep(select) {
  width: 100% !important;
}

:deep(.ui-select) {
  width: 100% !important;
}

:deep(.ui-select > .ui-select-input) {
  width: 100% !important;
}

/* Style for search input */
:deep(.ui-input) {
  width: 100% !important;
}

:deep(.ui-input > input) {
  width: 100% !important;
}
</style>