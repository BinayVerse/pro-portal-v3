<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              v-if="statusToShow.severity === 'critical'"
              name="i-heroicons-exclamation-triangle-20-solid"
              class="w-5 h-5 text-red-500"
            />
            <UIcon
              v-else-if="statusToShow.severity === 'warning'"
              name="i-heroicons-exclamation-circle-20-solid"
              class="w-5 h-5 text-yellow-400"
            />
            <h3
              class="text-lg font-semibold"
              :class="statusToShow.severity === 'critical' ? 'text-red-500' : 'text-yellow-400'"
            >
              {{ statusToShow.title }}
            </h3>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-sm text-gray-200">
          {{ statusToShow.message }}
        </p>

        <div v-if="statusToShow.metrics.length" class="space-y-2">
          <div
            v-for="metric in statusToShow.metrics"
            :key="metric.name"
            class="flex items-center justify-between rounded-md bg-dark-800 px-3 py-2"
          >
            <div class="text-sm text-gray-100 font-medium">
              {{ metric.name }}
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-300">
                {{ metric.current.toLocaleString() }} / {{ metric.limit.toLocaleString() }}
              </div>
              <div
                class="text-xs font-semibold"
                :class="metric.percentage >= 100 ? 'text-red-400' : 'text-yellow-400'"
              >
                {{ metric.percentage.toFixed(0) }}% used
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <UButton variant="ghost" color="gray" @click="isOpen = false"> Close </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-arrow-up-right-20-solid"
            @click="handleUpgradeClick"
          >
            View plans & Upgrade
            <!-- {{
              statusToShow.severity === 'critical' ? 'Show available add-on plans' : 'Upgrade Plan'
            }} -->
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type MetricUsage = {
  name: string
  current: number
  limit: number
  percentage: number
}

type PlanUsageData = {
  metrics: MetricUsage[]
  exceededMetrics: MetricUsage[]
  highMetrics: MetricUsage[]
  hasExceeded: boolean
  hasHigh: boolean
}

const props = defineProps<{
  data: PlanUsageData | null
}>()

const emit = defineEmits<{
  (e: 'upgrade'): void
}>()

const isOpen = ref(false)
const lastStateKey = ref('')

const statusToShow = computed(() => {
  const data = props.data
  if (!data) {
    return {
      title: '',
      message: '',
      metrics: [] as MetricUsage[],
      severity: 'info' as 'info' | 'warning' | 'critical',
    }
  }

  if (data.hasExceeded) {
    return {
      title: 'Plan Limits Exhausted',
      message:
        'The usage limit for your plan has been reached. Upgrade your plan or Purchase an Add-on to continue.',
      metrics: data.exceededMetrics,
      severity: 'critical' as const,
    }
  }

  if (data.hasHigh) {
    return {
      title: 'Approaching Plan Limits',
      message:
        'You are close to reaching the limits of your current plan on the metrics below. Consider upgrading to avoid interruptions.',
      metrics: data.highMetrics,
      severity: 'warning' as const,
    }
  }

  return {
    title: '',
    message: '',
    metrics: [] as MetricUsage[],
    severity: 'info' as const,
  }
})

watch(
  () => props.data,
  (val) => {
    if (!val) return

    const key = JSON.stringify({
      exceeded: val.exceededMetrics.map((m) => `${m.name}-${m.percentage}`),
      high: val.highMetrics.map((m) => `${m.name}-${m.percentage}`),
    })

    if (key === lastStateKey.value) return
    lastStateKey.value = key

    if (val.hasExceeded || val.hasHigh) {
      isOpen.value = true
    }
  },
  { deep: true, immediate: true },
)

const handleUpgradeClick = () => {
  emit('upgrade')
  isOpen.value = false
}
</script>
