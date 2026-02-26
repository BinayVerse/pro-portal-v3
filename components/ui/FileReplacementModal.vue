<template>
  <UModal :model-value="isOpen" @update:model-value="$emit('update:isOpen', $event)">
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Update Document
        </h3>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          class="-my-1"
          @click="cancel"
        />
      </div>

      <div class="mb-6">
        <div class="flex items-start space-x-3 mb-4">
          <UIcon
            name="i-heroicons-exclamation-triangle"
            class="w-6 h-6 text-amber-500 mt-0.5"
          />
          <div>
            <p class="text-gray-900 dark:text-gray-100 mb-2">
              <strong>"{{ fileName }}"</strong> already exists.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Review the changes below and confirm to overwrite the existing document.
            </p>
          </div>
        </div>

        <!-- Current State -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">Current State:</div>
          <div class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <span class="font-medium">Category:</span> {{ currentCategory }}
            </div>
            <div>
              <span class="font-medium">Department:</span> {{ formatDepartmentDisplay(currentDepartments) }}
            </div>
          </div>
        </div>

        <!-- New State -->
        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div class="text-sm font-medium text-green-900 dark:text-green-100 mb-3">New State:</div>
          <div class="space-y-2 text-sm text-green-800 dark:text-green-200">
            <div>
              <span class="font-medium">Category:</span> {{ newCategory }}
            </div>
            <div>
              <span class="font-medium">Department:</span> {{ formatDepartmentDisplay(newDepartments) }}
            </div>
          </div>
        </div>

        <!-- Warning -->
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div class="flex items-start space-x-2">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div class="text-sm text-amber-800 dark:text-amber-200">
              <p class="font-medium mb-1">This action will:</p>
              <ul class="space-y-1 text-xs">
                <li>• Permanently overwrite the existing file</li>
                <li>• Reset any summaries or processing data</li>
                <li>• Reprocess the document with the new content</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end space-x-3">
        <UButton
          @click="cancel"
          variant="outline"
          color="gray"
          size="md"
        >
          Cancel
        </UButton>
        <UButton
          @click="replace"
          color="primary"
          size="md"
          icon="i-heroicons-arrow-up-tray"
        >
          Overwrite Document
        </UButton>
      </div>
    </div>
  </UModal>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue'

interface Props {
  isOpen: boolean
  fileName: string
  currentCategory: string
  currentDepartments?: string[] // dept_ids
  newCategory: string
  newDepartments?: string[] // dept_ids
  departmentNameMap?: Record<string, string> // dept_id -> dept_name
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'replace'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentDepartments: () => [],
  newDepartments: () => [],
  departmentNameMap: () => ({}),
})

const emit = defineEmits<Emits>()

// Helper to format department display
const formatDepartmentDisplay = (deptIds?: string[]): string => {
  if (!deptIds || deptIds.length === 0) {
    return 'Common (All Users)'
  }
  const map = props.departmentNameMap || {}
  return deptIds
    .map((id: string) => map[id] || 'Unknown')
    .join(', ')
}

const replace = () => {
  emit('replace')
  emit('update:isOpen', false)
}

const cancel = () => {
  emit('cancel')
  emit('update:isOpen', false)
}
</script>
