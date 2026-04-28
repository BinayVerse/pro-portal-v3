<script setup lang="ts">
import { ref } from 'vue'
import { sub, format, isSameDay } from 'date-fns'
import type { Duration } from 'date-fns'

const props = defineProps<{
  modelValue: { start: string; end: string }
}>()

const emit = defineEmits(['update:modelValue'])

// ---------- Helpers ----------
const toDate = (val: string) => {
  const d = new Date(val)
  return isNaN(d.getTime()) ? new Date() : d
}

const toISO = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ---------- State ----------
const safeDate = (val?: string) => {
  const d = new Date(val || '')
  return isNaN(d.getTime()) ? new Date() : d
}

const selected = ref({
  start: safeDate(props.modelValue?.start),
  end: safeDate(props.modelValue?.end),
})

// ---------- Presets ----------
const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } },
]

function isRangeSelected(duration: Duration) {
  return (
    isSameDay(selected.value.start, sub(new Date(), duration)) &&
    isSameDay(selected.value.end, new Date())
  )
}

// 🔥 FIX: accept close()
function selectRange(duration: Duration, close: () => void) {
  selected.value = {
    start: sub(new Date(), duration),
    end: new Date(),
  }

  emitValue()
  close() // ✅ NOW CLOSES
}

// ---------- Emit ----------
function emitValue() {
  emit('update:modelValue', {
    start: toISO(selected.value.start),
    end: toISO(selected.value.end),
  })
}

const handleRangeUpdate = (val: any) => {
  // 🚫 Ignore invalid intermediate states
  if (!val?.start || !val?.end) return

  if (!(val.start instanceof Date) || !(val.end instanceof Date)) return

  if (isNaN(val.start.getTime()) || isNaN(val.end.getTime())) return

  // ✅ Only accept VALID range
  selected.value = {
    start: val.start,
    end: val.end,
  }

  emitValue()
}

watch(
  () => props.modelValue,
  (val) => {
    if (!val?.start || !val?.end) return

    selected.value = {
      start: safeDate(val.start),
      end: safeDate(val.end),
    }
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-start' }">
    <!-- 🔥 INPUT-LIKE TRIGGER -->
    <div class="flex gap-2 w-full cursor-pointer">
      <!-- FROM -->
      <div class="flex-1 relative">
        <div
          class="w-full px-3 bg-dark-700 border border-dark-600 rounded text-gray-300 text-sm flex items-center justify-between date-section"
        >
          <span>{{ format(selected.start, 'MM/dd/yyyy') }}</span>
          <UIcon name="i-heroicons-calendar-20-solid" class="w-4 h-4 text-gray-400" />
        </div>
      </div>
      <span class="py-1">-</span>
      <!-- TO -->
      <div class="flex-1 relative">
        <div
          class="w-full px-3 bg-dark-700 border border-dark-600 rounded text-gray-300 text-sm flex items-center justify-between date-section"
        >
          <span>{{ format(selected.end, 'MM/dd/yyyy') }}</span>
          <UIcon name="i-heroicons-calendar-20-solid" class="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>

    <!-- PANEL (unchanged) -->
    <template #panel="{ close }">
      <div class="flex">
        <!-- LEFT PRESETS -->
        <div class="hidden sm:flex flex-col py-4 border-r border-gray-200 dark:border-gray-800">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="gray"
            variant="ghost"
            class="rounded-none px-6 justify-start"
            :class="[
              isRangeSelected(range.duration)
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800',
            ]"
            @click="selectRange(range.duration, close)"
          />
        </div>

        <!-- CALENDAR -->
        <div class="p-3">
          <VDatePicker
            :model-value="selected"
            is-range
            :is-dark="true"
            :max-date="new Date()"
            :masks="{ input: 'MM/DD/YYYY' }"
            @update:model-value="handleRangeUpdate"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
:deep(.date-section) {
  background-color: #111827 !important;
  color: #e2e8f0 !important;
  font-size: 0.875rem !important;
  padding: 0.45rem 0.5rem !important;
  transition: all 0.2s ease-in-out !important;
  width: 100% !important;
  border-radius: 0.3rem !important;
  margin-bottom: 3px;
  border: 1px solid #374151 !important;
}

:deep(.date-section:focus-visible) {
  border-color: #6366f1 !important;
}
</style>
