<template>
  <div class="table-container">
    <!-- Controls Section -->
    <div
      v-if="searchable"
      class="controls flex justify-between items-center pb-3.5 border-b border-gray-200 dark:border-gray-700"
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

      <div>
        <UButton
          v-if="showActionButton"
          @click="actionButtonCallback"
          icon="i-heroicons:plus-16-solid"
          class="rounded-md text-white bg-custom1-400 hover:bg-custom1-500"
          :disabled="disabled"
        >
          {{ actionButtonLabel }}
        </UButton>
        <UButton
          v-if="showActionButton2"
          @click="actionButtonCallback2"
          icon="i-heroicons:globe-alt-16-solid"
          class="ml-2 rounded-md text-white bg-custom1-400 hover:bg-custom1-500"
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
          class="ml-2 rounded-md text-white bg-custom1-400 hover:bg-custom1-500"
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
      <h1 v-if="headerText" class="text-2xl font-semibold text-center py-3.5">
        Proxima Systems
      </h1>
    </div>
    <!-- Table Section -->
    <UTable
      :columns="columns"
      :rows="paginatedRows"
      class="custom-table"
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

    <!-- Pagination -->
    <div
      v-if="paginatedRows.length"
      class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
    >
      <UPagination
        size="sm"
        v-model="currentPage"
        :page-count="pageSize"
        :total="filteredRows.length"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

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

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;
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