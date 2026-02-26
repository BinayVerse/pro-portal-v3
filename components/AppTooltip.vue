<!-- /components/AppTooltip.vue -->
<template>
  <UPopover
    v-if="shouldShow"
    mode="hover"
    :popper="computedPopper"
    :ui="{
      container: 'z-[9999]',
      content: 'bg-dark-800 text-gray-100 border border-dark-700 shadow-lg rounded-md opacity-100'
    }"
    :open-delay="50"
    :close-delay="100"
  >
    <template #panel>
      <div class="px-3 py-2 text-xs whitespace-nowrap">
        {{ text }}
      </div>
    </template>

    <!-- Make the wrapper clickable when needed -->
    <span 
      :class="[
        sidebar ? 'inline-flex w-fit' : 'inline-flex',
        disabled ? 'cursor-not-allowed' : (clickable ? 'cursor-pointer' : 'cursor-default')
      ]"
      :style="{ position: 'relative' }"
      @click="handleWrapperClick"
    >
      <slot />
    </span>
  </UPopover>

  <div v-else class="contents" :class="{ 'cursor-pointer': clickable }" @click="handleWrapperClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text?: string
  sidebar?: boolean
  collapsed?: boolean
  disabled?: boolean
  placement?: 'top' | 'right' | 'bottom' | 'left'
  clickable?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const shouldShow = computed(() => {
  if (!props.text) return false

  if (props.sidebar) {
    if (props.collapsed) return true
    return !!props.disabled
  }

  return true
})

const handleWrapperClick = (event: MouseEvent) => {
  if (props.clickable && !props.disabled) {
    emit('click', event)
  }
}

const computedPopper = computed(() => {
  const placement: 'top' | 'right' | 'bottom' | 'left' =
    props.sidebar
      ? 'right'
      : props.placement ?? 'bottom'

  const strategy: 'fixed' | 'absolute' = 'fixed'

  return {
    placement,
    strategy,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: props.sidebar ? [0, 12] : [0, 8] // Increased offset for sidebar
        }
      },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['bottom', 'top'] // Allow fallback
        }
      },
      {
        name: 'preventOverflow',
        options: {
          boundary: 'viewport'
        }
      }
    ]
  }
})
</script>

<style scoped>
:deep(.u-popover) {
  z-index: 99999 !important;
}

:deep(.u-popover-panel) {
  z-index: 99999 !important;
}
</style>