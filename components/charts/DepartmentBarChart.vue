<!-- /components/charts/DepartmentBarChart.vue -->
<template>
  <div class="w-full h-full flex items-center justify-center relative">
    <!-- Loading -->
    <template v-if="loading">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </template>

    <!-- Chart -->
    <template v-else-if="hasData">
      <div ref="chartRef" class="w-full h-full"></div>
    </template>

    <!-- No Data -->
    <template v-else>
      <p class="text-gray-400 text-sm">No department data available</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed, nextTick } from 'vue';
import { getColorsForLabels } from '@/utils/chartColors'

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
    default: () => ({
      departments: [],
      userCounts: [],
      artifactCounts: []
    })
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const chartRef = ref<HTMLElement | null>(null);
let chart: any = null;

const hasData = computed(() => {
  return (
    props.chartData?.departments?.length > 0 &&
    (
      props.chartData.userCounts.some((v: number) => v > 0) ||
      props.chartData.artifactCounts.some((v: number) => v > 0)
    )
  )
})

const initChart = async () => {
  if (!chartRef.value) return;

  if (!hasData.value) {
    if (chart) {
      chart.destroy();
      chart = null;
    }
    return;
  }
  
  const ApexCharts = (await import('apexcharts')).default;
  
  const seriesNames = ['Users', 'Artifacts']

  // Function to remove native tooltips from chart elements
  const removeNativeTooltips = (ctx: { el: HTMLElement }) => {
    if (!ctx?.el) return;

    const titles = ctx.el.querySelectorAll<HTMLElement>('[title]');
    titles.forEach((el) => el.removeAttribute('title'));
  };

  const options = {
    chart: {
      type: 'bar',
      height: '100%',
      stacked: false,
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#E5E7EB',
      parentHeightOffset: false,
      events: {
        legendClick: function (chartContext: any, seriesIndex: number, config: any) {
          const collapsed = chartContext.w.globals.collapsedSeriesIndices
          const totalSeries = chartContext.w.globals.series.length

          // If this click would hide the last visible series → prevent it
          if (collapsed.length === totalSeries - 1 && 
              !collapsed.includes(seriesIndex)) {
            return false
          }
          return true
        },
        // Add mounted event to remove native tooltips
        mounted: function (ctx: { el: HTMLElement }) {
          removeNativeTooltips(ctx);
        },

        updated: function (ctx: { el: HTMLElement }) {
          removeNativeTooltips(ctx);
        }
      }
    },

    series: [
      {
        name: 'Users',
        data: props.chartData.userCounts,
      },
      {
        name: 'Artifacts',
        data: props.chartData.artifactCounts,
      }
    ],

    colors: getColorsForLabels(seriesNames),

    grid: {
      borderColor: '#374151',
      strokeDashArray: 4,
      padding: {
        top: 10,
        right: 20,
        left: 10,
        bottom: 10
      },
      yaxis: { lines: { show: true } },
    },

    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '55%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },

    dataLabels: {
      enabled: false,
    },

    xaxis: {
      categories: props.chartData.departments,
      labels: {
        style: {
          fontSize: '12px',
          colors: '#9CA3AF'
        },
      },
      axisBorder: { show: true, color: '#374151' },
      axisTicks: { show: true, color: '#374151' },
    },

    yaxis: {
      minWidth: 120,
      maxWidth: 120,
      // Fix for native tooltip on y-axis labels
      tooltip: {
        enabled: false
      },
      labels: {
        minWidth: 120,
        maxWidth: 120,
        style: {
          colors: '#9CA3AF',
          fontSize: '12px'
        },
        formatter: (val: number) => {
          return val >= 1000 ? (val / 1000).toFixed(1) + 'K' : val.toString();
        }
      },
    },

    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      offsetY: 5,
      fontSize: '13px',
      labels: {
        colors: '#E5E7EB'
      },
      markers: {
        width: 10,
        height: 10,
        radius: 4
      },
      itemMargin: {
        horizontal: 15,
        vertical: 5
      },
      containerMargin: {
        top: 10,
      }
    },

    tooltip: {
      theme: 'dark',
      shared: false,
      intersect: true,
      y: {
        formatter: (val: number) => val.toLocaleString(),
      },
    },

    responsive: [
      {
        breakpoint: 1000,
        options: {
          plotOptions: { bar: { barHeight: '65%' } },
          dataLabels: { enabled: false },
          legend: {
            position: 'bottom',
            offsetY: 5
          }
        },
      },
      {
        breakpoint: 480,
        options: {
          xaxis: {
            labels: {
              rotate: -90,
              style: { fontSize: '10px' }
            }
          }
        }
      }
    ],
  }

  if (chart) {
    chart.destroy();
  }

  chart = new ApexCharts(chartRef.value, options);
  await chart.render();
};

// Initialize chart when mounted
onMounted(async () => {
  await nextTick();
  initChart();
});

// Watch for data changes
watch(
  () => [props.chartData, props.loading],
  async () => {
    if (props.loading) return
    if (!hasData.value) return

    await nextTick()
    initChart()
  },
  { deep: true, immediate: true }
)

// Watch for container resize
watch(
  () => chartRef.value?.clientHeight,
  () => {
    if (chart) {
      chart.updateOptions({
        chart: { height: '100%' }
      });
    }
  }
)

// Cleanup
onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<style>
/* Fix for any native tooltips */
.apexcharts-yaxistooltip {
  display: none !important;
}
</style>