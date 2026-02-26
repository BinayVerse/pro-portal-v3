<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-exclamation-triangle-20-solid"
            class="w-5 h-5 text-red-500"
          />
          <h3 class="text-lg font-semibold text-red-500">
            Subscription Required
          </h3>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-200">
          A subscription is required to access this feature. Please select a plan to continue.
        </p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <UButton
            color="primary"
            icon="i-heroicons-arrow-up-right-20-solid"
            @click="handleUpgradeClick"
          >
            View Plans
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'upgrade'): void
}>()

const isOpen = ref(props.open)

watch(
  () => props.open,
  (val) => {
    isOpen.value = val
  },
  { immediate: true },
)

const handleUpgradeClick = () => {
  emit('upgrade')
}
</script>
