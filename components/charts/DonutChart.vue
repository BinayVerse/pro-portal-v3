<template>
  <div class="h-64 w-full flex flex-col">
    <template v-if="series.length > 0">
      <div class="flex-1 flex items-center justify-center">
        <apexchart type="donut" height="100%" width="100%" :options="chartOptions" :series="series" />
      </div>

      <!-- Legend at the bottom -->
      <div class="flex justify-center mt-4">
        <div class="flex flex-wrap justify-center gap-2 px-4">
          <div v-for="(label, index) in props.labels" :key="index" class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: chartColors[index] as string }"></div>
            <span class="text-xs text-gray-400">{{ label }}</span>
          </div>
        </div>
      </div>
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
  data: {
    type: Array,
    default: () => []
  },
  labels: {
    type: Array,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => []
  }
})

// helper to create random hex color
const getRandomColor = (): string =>
  `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`

// use passed colors OR auto-generate based on label count
const chartColors = computed<string[]>(() =>
  props.colors.length > 0
    ? (props.colors as string[])
    : props.labels.map(() => getRandomColor())
)

const series = computed<number[]>(() =>
  Array.isArray(props.data) && props.data.length > 0 ? (props.data as number[]) : []
)

const chartOptions = computed(() => {
  // Convert all values to numbers and calculate total
  const numericSeries = series.value.map(item => Number(item) || 0)
  const total = numericSeries.reduce((sum: number, value: number) => sum + value, 0)

  return {
    chart: {
      type: 'donut',
      height: '100%',
      width: '100%',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#9CA3AF',
      animations: {
        enabled: false // Disable animations for better performance
      }
    },
    colors: chartColors.value,
    labels: props.labels,
    legend: {
      show: false, // Hide the built-in legend since we're using custom one
      position: 'top',
      horizontalAlign: 'center',
      labels: { colors: '#9CA3AF' },
      itemMargin: { horizontal: 10, vertical: 5 },
      onItemClick: {
        toggleDataSeries: false // Disable click functionality
      },
      onItemHover: {
        highlightDataSeries: false // Disable hover functionality
      }
    },
    dataLabels: {
      enabled: true, // Enable data labels to show values on segments
      style: {
        colors: ['#FFFFFF'], // White text for better contrast
        fontSize: '12px',
        fontWeight: 'bold'
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.45
      },
      formatter: function (val: number, { seriesIndex, w }: any) {
        // Calculate percentage for this segment
        const segmentValue = w.globals.series[seriesIndex]
        const percentage = total ? ((segmentValue / total) * 100) : 0
        return `${percentage.toFixed(1)}%` // Show percentage with % symbol
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#9CA3AF',
              fontSize: '16px',
              fontWeight: 'bold',
              formatter: function (w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)
                return Math.round(total).toString()
              }
            },
            value: {
              show: false // We don't need this since we're using dataLabels
            },
            name: {
              show: false
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: 'top',
            horizontalAlign: 'center'
          },
          dataLabels: {
            style: {
              fontSize: '10px' // Smaller font on mobile
            }
          }
        }
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
    },
    states: {
      hover: {
        filter: {
          type: 'none' // Disable hover effects
        }
      },
      active: {
        filter: {
          type: 'none' // Disable active effects
        }
      }
    }
  }
})
</script>

<style scoped>
/* Custom styles for the chart container */
:deep(.apexcharts-canvas) {
  margin: 0 auto;
}

:deep(.apexcharts-datalabels-group) {
  transform: translateY(-5px);
}

/* Center the value */
:deep(.apexcharts-datalabel) {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Style for the data labels on segments */
:deep(.apexcharts-datalabel) {
  font-weight: bold;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.5));
}
</style>