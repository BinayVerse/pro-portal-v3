<template>
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
    <div>
      <h1 class="text-lg sm:text-xl xl:text-2xl font-bold text-white mb-1 sm:mb-2">
        Artifact Management
      </h1>
      <p class="text-xs sm:text-sm lg:text-base text-gray-400">
        Upload, organize, and manage artifacts for AI processing and chat capabilities.
      </p>
    </div>

    <div class="flex-shrink-0">
      <button
        @click="$emit('upload')"
        class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center sm:justify-start space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="disabled"
        :aria-label="disabled ? 'Upload disabled. Upgrade plan to continue.' : ''"
      >
        <UIcon name="heroicons:cloud-arrow-up" class="w-4 h-4" />
        <span>Upload Artifact</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['upload'])

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>
