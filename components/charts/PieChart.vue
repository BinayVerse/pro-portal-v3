<template>
  <div class="h-64 w-full">
    <template v-if="series.length > 0">
      <apexchart type="pie" height="100%" width="100%" :options="chartOptions" :series="series" />
    </template>
    <template v-else>
      <div class="h-full flex items-center justify-center">
        <p class="text-gray-400 text-sm">No data available</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
  colors: { type: Array, default: () => [] } // if empty, auto-generate
})

// random hex color
const getRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`

// series array for pie
const series = computed<number[]>(() =>
  Array.isArray(props.data) && props.data.length > 0 ? (props.data as number[]) : []
)

// colors: use provided or auto-generate per label
const chartColors = computed(() =>
  props.colors.length > 0 ? props.colors : props.labels.map(() => getRandomColor())
)

const chartOptions = computed(() => {
  const total = series.value.reduce((sum, value) => sum + (Number(value) || 0), 0)

  return {
    chart: {
      type: 'pie',
      height: '100%',
      width: '100%',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#9CA3AF'
    },
    colors: chartColors.value,
    labels: props.labels,
    legend: {
      position: 'right',
      labels: { colors: '#9CA3AF' },
      itemMargin: { horizontal: 10, vertical: 5 },
      onItemClick: {
        toggleDataSeries: false
      },
      onItemHover: {
        highlightDataSeries: false
      }
    },
    dataLabels: {
      enabled: true,
      style: { colors: ['#FFF'] },
      dropShadow: { enabled: false },
      formatter: function (val: number, { seriesIndex, w }: any) {
        const rawValue = w.config.series[seriesIndex]
        const percentage = total ? ((rawValue / total) * 100).toFixed(1) : '0.0'
        return `${percentage}%`
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: { legend: { position: 'bottom' } }
      }
    ],
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
      style: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#FFFFFF'
      },
      y: {
        formatter: (val: number) => {
          const percentage = total ? ((val / total) * 100).toFixed(1) : '0.0'
          return `${val} (${percentage}%)`
        }
      }
    }
  }
})
</script>