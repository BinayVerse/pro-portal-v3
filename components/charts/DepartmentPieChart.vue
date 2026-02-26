<!-- components/charts/DepartmentPieChart.vue -->
<template>
  <div class="w-full h-80 flex items-center justify-center relative">
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
      <p class="text-gray-400 text-sm">No user distribution data available</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue';
import { getColorsForLabels } from '@/utils/chartColors'

const props = defineProps({
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const chartRef = ref<HTMLElement | null>(null);
let chart: any = null;

const hasData = computed(() => {
  return props.data?.length > 0;
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

  const series = props.data.map((item: any) => item.value ?? item.users ?? 0);
  const labels = props.data.map((item: any) => item.name);

  const total = series.reduce((sum: number, value: number) => sum + (Number(value) || 0), 0);

  const options = {
    chart: {
      type: 'pie',
      height: '100%',
      width: '100%',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#9CA3AF',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },

    series,
    labels,

    colors: props.colors?.length
        ? props.colors
        : getColorsForLabels(labels),

    legend: {
      position: 'right',
      offsetX: -10,
      labels: { colors: '#9CA3AF' },
      itemMargin: { horizontal: 10, vertical: 5 },
      onItemClick: { toggleDataSeries: false },
      onItemHover: { highlightDataSeries: false },
      formatter: (seriesName: string) => {
        return seriesName.charAt(0).toUpperCase() + seriesName.slice(1);
      }
    },
    
    plotOptions: {
      pie: {
        expandOnClick: true,
        offsetX: -10,
      }
    },

    dataLabels: {
      enabled: total > 0,
      style: { colors: ['#FFF'] },
      dropShadow: { enabled: false },
      formatter: function (val: number, { seriesIndex, w }: any) {
        const rawValue = w.config.series[seriesIndex];
        const percentage = total
          ? ((rawValue / total) * 100).toFixed(1)
          : '0.0';
        return `${percentage}%`;
      }
    },

    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: { position: 'bottom' },
          dataLabels: {
            style: { fontSize: '10px' }
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
          const percentage = total
            ? ((val / total) * 100).toFixed(1)
            : '0.0';
          return `${val} (${percentage}%)`;
        }
      }
    },

    states: {
      hover: {
        filter: {
          type: 'none'
        }
      },
      active: {
        filter: {
          type: 'none'
        }
      }
    }
  };

  if (chart) {
    chart.destroy();
  }

  chart = new ApexCharts(chartRef.value, options);
  await chart.render();
};

onMounted(async () => {
  await nextTick();
  initChart();
});

watch(
  () => [props.data, props.loading],
  async () => {
    if (props.loading) return
    await nextTick()
    initChart()
  },
  { deep: true, immediate: true }
)

onUnmounted(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>