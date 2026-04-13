<template>
  <UModal v-model="isOpen" prevent-close @keydown.escape="closeModal">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-6 h-6 mr-3 text-red-400"
            />
            <h3 class="text-lg font-semibold text-white">Error</h3>
          </div>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-white transition-colors"
            aria-label="Close error modal"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>
      </template>

      <p class="text-gray-300 mb-6 whitespace-pre-wrap break-words">
        {{ message }}
      </p>

      <div class="flex justify-end gap-2">
        <UButton
          @click="closeModal"
          label="Close"
          color="gray"
          variant="outline"
          class="px-4 py-2"
        />
      </div>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useErrorStore } from '~/stores/error'

const errorStore = useErrorStore()

const isOpen = computed({
  get: () => errorStore.isErrorModalOpen,
  set: (value) => {
    if (!value) {
      errorStore.closeErrorModal()
    }
  },
})

const message = computed(() => errorStore.errorMessage)

const closeModal = () => {
  errorStore.closeErrorModal()
}
</script>
