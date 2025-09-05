<!-- /components/charts/StackedAreaChart.vue -->
<template>
  <div class="h-80">
    <apexchart type="area" height="100%" :options="chartOptions" :series="series" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']
  },
  timeRange: {
    type: String,
    default: '7'
  }
})

// Convert to numeric timestamps for datetime mode
const series = computed(() => {
  return props.data.map((userData: any, index: number) => ({
    name: userData.name,
    data: userData.data.map((point: any) => ({
      x: new Date(point.x).getTime(), // Convert to timestamp
      y: point.y
    })),
    color: props.colors[index % props.colors.length]
  }))
})

const getLabelRotation = () => {
  const range = parseInt(props.timeRange) || 7
  if (range <= 30) return 0
  if (range <= 90) return -45
  return -60
}

const getLabelDensity = () => {
  const range = parseInt(props.timeRange) || 7
  if (range <= 7) return 1 // Show every day
  if (range <= 30) return 2 // Show every 2nd day
  if (range <= 90) return 7 // Show weekly
  return 15 // Show bi-weekly for longer ranges
}

const chartOptions = ref({
  chart: {
    type: 'area',
    height: '100%',
    stacked: false,
    toolbar: {
      show: false
    },
    background: 'transparent',
    foreColor: '#9CA3AF',
    zoom: {
      enabled: false
    }
  },
  colors: props.colors,
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  fill: {
    type: 'gradient',
    gradient: {
      opacityFrom: 0.4,
      opacityTo: 0.8,
      stops: [0, 90, 100]
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    labels: {
      colors: '#9CA3AF'
    }
  },
  xaxis: {
    type: 'datetime',
    labels: {
      datetimeFormatter: {
        year: 'yyyy',
        month: 'MMM \'yy',
        day: 'dd MMM',
        hour: 'HH:mm'
      },
      format: 'dd MMM',
      rotate: getLabelRotation(),
      hideOverlappingLabels: false,
      showDuplicates: false,
      style: {
        fontSize: '10px',
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
      }
    },
    axisBorder: {
      color: '#374151',
      show: true
    },
    axisTicks: {
      color: '#374151',
      show: true
    },
    tooltip: {
      enabled: true
    }
  },
  yaxis: {
    labels: {
      formatter: function (val: number) {
        return val >= 1000 ? (val / 1000).toFixed(0) + 'K' : val.toString()
      }
    }
  },
  tooltip: {
    theme: 'dark',
    shared: true,
    intersect: false,
    x: {
      format: 'dd MMM yyyy'
    },
    y: {
      formatter: function (val: number) {
        return val.toLocaleString() + ' tokens'
      }
    }
  },
  grid: {
    borderColor: '#374151',
    strokeDashArray: 4,
    padding: {
      top: 10,
      right: 10,
      bottom: 20,
      left: 10
    }
  }
})

// Watch for changes to update chart options
watch(() => props.timeRange, () => {
  const rotation = getLabelRotation()
  
  chartOptions.value = {
    ...chartOptions.value,
    xaxis: {
      ...chartOptions.value.xaxis,
      labels: {
        ...chartOptions.value.xaxis.labels,
        rotate: rotation
      }
    }
  }
}, { immediate: true })

</script>