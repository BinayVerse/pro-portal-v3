<!-- /layouts/SidebarButton.vue -->
<template>
  <UButton
    type="button"
    variant="ghost"
    :color="active ? 'primary' : 'gray'"
    :class="buttonClasses"
    @click="handleClick"
  >
    <AppTooltip
      :text="tooltip"
      :sidebar="true"
      :collapsed="collapsed"
      :disabled="disabled"
      :clickable="!disabled"
      @click="handleClick"
    >
      <span class="inline-flex items-center w-fit" :class="{ 'opacity-50': disabled }">
        <UIcon :name="icon" class="w-5 h-5 flex-shrink-0" />

        <span
          v-if="!collapsed"
          class="ml-3 truncate"
        >
          {{ label }}
        </span>
      </span>
    </AppTooltip>
  </UButton>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import type { PropType } from 'vue'

const router = useRouter()

const props = defineProps({
  to: {
    type: [String, Object] as PropType<string | { path: string; query?: any }>,
    default: undefined,
  },
  icon: String,
  active: Boolean,
  collapsed: Boolean,
  disabled: Boolean,
  tooltip: String,
  label: String,
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
})

const handleClick = (e: Event) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  if (props.to) {
    router.push(props.to as any)
  }
}

const buttonClasses = computed(() => [
  'w-full transition-all duration-200',
  props.collapsed ? 'justify-center px-2' : 'justify-start px-3',
  props.size === 'sm' ? 'py-1 text-sm' : 'py-2',
  props.disabled
    ? 'cursor-not-allowed opacity-100'
    : 'cursor-pointer'
])
</script>