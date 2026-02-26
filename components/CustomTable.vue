<template>
  <div class="table-container">
    <!-- Controls Section -->
    <div
      v-if="searchable"
      class="controls flex flex-col sm:flex-row justify-between items-stretch sm:items-center pb-3.5 border-b border-gray-200 dark:border-gray-700 gap-3 sm:gap-0"
    >
      <UInput
        v-model="searchQuery"
        name="searchQuery"
        size="sm"
        autocomplete="off"
        :ui="{ icon: { color: 'violet', trailing: { pointer: '' } } }"
        inputClass="focus:ring-custom1-400"
        color="white"
        placeholder="Search..."
        @input="handleSearch"
        @focus="focused = true"
        @blur="focused = false"
      >
        <template #leading>
          <UIcon
            name="i-heroicons-magnifying-glass-20-solid"
            :class="focused ? 'text-custom1-400' : 'text-gray-400'"
          />
        </template>
        <template #trailing>
          <UButton
            v-show="searchQuery !== ''"
            color="red"
            variant="link"
            icon="i-heroicons-x-mark-16-solid"
            :padded="false"
            @click="searchQuery = ''"
          />
        </template>
      </UInput>

      <div class="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
        <UButton
          v-if="showActionButton"
          @click="actionButtonCallback"
          icon="i-heroicons:plus-16-solid"
          class="rounded-md text-white bg-custom1-400 hover:bg-custom1-500 w-full sm:w-auto"
          :disabled="disabled"
        >
          {{ actionButtonLabel }}
        </UButton>
        <UButton
          v-if="showActionButton2"
          @click="actionButtonCallback2"
          icon="i-heroicons:globe-alt-16-solid"
          class="rounded-md text-white bg-custom1-400 hover:bg-custom1-500 w-full sm:w-auto"
          :loading="loadingActionButton2"
          :loading-state="{
            icon: 'i-heroicons-arrow-path-20-solid',
            label: 'Loading...',
          }"
          :disabled="disabled"
        >
          {{ actionButtonLabel2 }}
        </UButton>
        <UButton
          v-if="showBulkUploadButton"
          @click="bulkUploadButtonCallback"
          icon="i-heroicons:cloud-arrow-up-16-solid"
          class="rounded-md text-white bg-custom1-400 hover:bg-custom1-500 w-full sm:w-auto"
          :disabled="disabled"
        >
          {{ bulkUploadButtonLabel }}
        </UButton>
      </div>
    </div>

    <div
      :class="headerText ? 'border mt-2 rounded-b-none' : 'mb-2'"
      :style="{ borderBottom: '0' }"
    >
      <h1 v-if="headerText" class="text-lg sm:text-2xl font-semibold text-center py-2 sm:py-3.5">
        Proxima Systems
      </h1>
    </div>
    <!-- Table Section - responsive wrapper -->
    <div class="w-full overflow-x-auto -mx-4 sm:mx-0">
      <UTable
        :columns="columns"
        :rows="paginatedRows"
        class="custom-table w-full"
      :loading="loading"
      :loading-state="{
        icon: 'i-heroicons-arrow-path-20-solid',
        label: 'Loading...',
      }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      @expand-row="handleExpandRow"
      :multiple-expand="false"
      :empty-state="{
        icon: 'i-heroicons-circle-stack-20-solid',
        label: 'No data to display',
      }"
    >
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
      </UTable>
    </div>

    <!-- Pagination -->
    <div
      v-if="paginatedRows.length"
      class="flex flex-col sm:flex-row items-center justify-between px-3 py-3.5 border-t border-gray-200 dark:border-gray-700 gap-3 sm:gap-0"
    >
      <div class="flex items-center space-x-3">
        <div class="text-sm text-gray-400 hidden sm:block">Rows per page</div>
        <div class="w-24">
          <USelect
            v-model="perPage"
            :options="perPageOptions"
            size="sm"
          />
        </div>
      </div>
      <UPagination
        size="sm"
        v-model="currentPage"
        :page-count="computedPageCount"
        :total="filteredRows.length"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  actionButtonLabel: { type: String, default: "Action" },
  actionButtonCallback: { type: Function, required: false },
  showActionButton: { type: Boolean, default: false },
  actionButtonLabel2: { type: String, default: "Action" },
  actionButtonCallback2: { type: Function, required: false },
  showActionButton2: { type: Boolean, default: false },
  loadingActionButton2: { type: Boolean, default: false },
  showBulkUploadButton: { type: Boolean, default: false },
  bulkUploadButtonCallback: { type: Function, required: false },
  bulkUploadButtonLabel: { type: String, default: "Bulk Add" },
  headerText: { type: String, default: null },
  searchable: { type: Boolean, default: true },
  pageSize: { type: Number, default: 10 },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['expand-row']);

const searchQuery = ref("");
const focused = ref(false);
const currentPage = ref(1);

const filteredRows = computed(() => {
  if (!searchQuery.value) {
    return props.rows;
  }
  return props.rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

// Per-page control
const perPageOptions = [
  { label: '5', value: 5 },
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: 'All', value: 'all' },
]
const perPage = ref(props.pageSize)
const computedPageCount = computed(() => (perPage.value === 'all' ? Math.max(filteredRows.value.length, 1) : Number(perPage.value)))

watch(perPage, () => {
  currentPage.value = 1
})

const paginatedRows = computed(() => {
  if (perPage.value === 'all') {
    return filteredRows.value.map((row, index) => ({ ...row, sl_no: index + 1 }))
  }
  const start = (currentPage.value - 1) * Number(perPage.value);
  const end = start + Number(perPage.value);
  return filteredRows?.value?.slice(start, end).map((row, index) => ({
    ...row,
    sl_no: start + index + 1,
  }));
});

const handleSearch = () => {
  currentPage.value = 1;
};

// Emit row data for expanding a row
const handleExpandRow = (rowData) => {
  emit("expand-row", rowData);
};
</script>

<style scoped>
.custom-table {
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
