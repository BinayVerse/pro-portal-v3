<template>
  <UModal v-model="internalOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="w-5 h-5 text-red-500" />
          <h3 class="text-lg font-semibold text-red-500">File Size Limit Exceeded</h3>
        </div>
      </template>

      <!-- MODAL CONTENT -->
      <div class="space-y-4">
        <p class="text-sm text-gray-200">
          The file you are trying to upload exceeds the maximum allowed size.
        </p>

        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-300">File Size:</span>
            <span class="text-sm font-semibold text-white">{{ fileSize }}</span>
          </div>
          <!-- Maximum Allowed -->
          <div class="flex items-center justify-between">
            <span
              :class="
                props.exceededType === 'file' ? 'text-sm text-red-400' : 'text-sm text-gray-300'
              "
              >Maximum Allowed (per file):</span
            >
            <span
              class="text-sm font-semibold"
              :class="props.exceededType === 'file' ? 'text-red-400' : 'text-white'"
            >
              {{ maxFileSize }}
            </span>
          </div>

          <div
            v-if="usedStorage || totalStorage"
            class="flex items-center justify-between pt-2 border-t border-red-500/20"
          >
            <span class="text-sm text-gray-300">Storage Used:</span>
            <span class="text-sm font-semibold text-white">
              {{ usedStorage }} / {{ totalStorage }}
            </span>
          </div>

          <!-- Available Storage -->
          <div v-if="availableStorage" class="flex items-center justify-between">
            <span
              :class="
                props.exceededType === 'storage' ? 'text-sm text-red-400' : 'text-sm text-gray-300'
              "
              >Available Storage:</span
            >
            <span
              class="text-sm font-semibold"
              :class="props.exceededType === 'storage' ? 'text-red-400' : 'text-white'"
            >
              {{ availableStorage }}
            </span>
          </div>
        </div>

        <p class="text-sm text-gray-400">
          Please reduce the file size or contact your administrator to increase the storage limit.
        </p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <UButton color="gray" variant="outline" @click="close"> Close </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps({
  open: { type: Boolean, required: true },
  fileSize: { type: String, required: true },
  maxFileSize: { type: String, required: true },
  availableStorage: String,
  usedStorage: String,
  totalStorage: String,
  exceededType: {
    type: String,
    default: 'file',
  },
})

const emit = defineEmits(['update:open'])

/**
 * Proper v-model binding wrapper
 */
const internalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val),
})

/**
 * Explicit close handler
 */
const close = () => {
  emit('update:open', false)
}
</script>
