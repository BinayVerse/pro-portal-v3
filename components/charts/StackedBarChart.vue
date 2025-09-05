<template>
  <div v-if="isMounted">
    <apexchart type="bar" height="400" :options="chartOptions" :series="series" :key="chartKey" />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue"

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const props = defineProps({
  chartData: {
    type: Array,
    required: true,
    default: () => []
  },
})

// Force re-render key when data changes
const chartKey = ref(0)

// Extract categories (user names)
const categories = computed(() => props.chartData.map((item) => item.name))

// Extract dynamic app keys (all except "name")
const appKeys = computed(() => {
  if (!props.chartData.length) return []
  return Object.keys(props.chartData[0]).filter((k) => k !== "name")
})

// Build Apex series dynamically
const series = computed(() =>
  appKeys.value.map((app) => ({
    name: app,
    data: props.chartData.map((item) => Number(item[app]) || 0),
  }))
)

// Generate colors automatically based on number of series
const generateColors = (count) => {
  const palette = [
    "#42A5F5", "#4CAF50", "#FFB74D", "#FF7676", "#81C784",
    "#FFD54F", "#29B6F6", "#66BB6A", "#FF7043", "#F06292",
    "#BA68C8", "#26C6DA", "#D4E157", "#5C6BC0", "#26A69A",
    "#EC407A", "#7E57C2", "#FFCA28", "#009688", "#64B5F6"
  ]
  return Array.from({ length: count }, (_, i) => palette[i % palette.length])
}

// Chart options
const chartOptions = computed(() => ({
  chart: {
    type: "bar",
    stacked: true,
    toolbar: {
      show: false
    },
    foreColor: "#ccc",
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: "60%",
      borderRadius: 0,
      borderRadiusApplication: 'end',
      dataLabels: {
        position: 'top',
      },
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: "12px",
      colors: ["#fff"]
    },
    offsetY: -20,
    formatter: function (val) {
      return val > 0 ? val.toLocaleString() : ''
    }
  },
  xaxis: {
    categories: categories.value,
    labels: {
      rotate: -45,
      style: {
        fontSize: "12px"
      }
    },
    axisBorder: {
      show: true,
      color: '#78909C',
      height: 1,
      width: '100%',
      offsetX: 0,
      offsetY: 0
    },
    axisTicks: {
      show: true,
      borderType: 'solid',
      color: '#78909C',
      height: 6,
      offsetX: 0,
      offsetY: 0
    },
  },
  yaxis: {
    title: {
      text: "Total Tokens"
    },
    labels: {
      formatter: function (val) {
        return val.toLocaleString()
      }
    }
  },
  legend: {
    position: "top",
    horizontalAlign: "center",
    fontSize: "14px",
    markers: {
      width: 12,
      height: 12,
      radius: 6,
    },
    itemMargin: {
      horizontal: 10,
      vertical: 5
    },
    formatter: function (seriesName) {
      return seriesName.charAt(0).toUpperCase() + seriesName.slice(1)
    }
  },
  fill: {
    opacity: 1
  },
  colors: generateColors(appKeys.value.length),
  tooltip: {
    theme: "dark",
    shared: true,
    intersect: false,
    custom: function ({ series, dataPointIndex, w }) {
      const category = w.globals.labels[dataPointIndex];

      let rows = w.globals.seriesNames.map((name, i) => {
        const val = series[i][dataPointIndex];
        const color = w.globals.colors[i];
        if (val === 0) return '';
        return `
        <div style="display:flex;align-items:center;justify-content:space-between;
                    padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="background:${color};
                         width:10px;height:10px;border-radius:50%;display:inline-block;"></span>
            <span>${name}:</span>
          </div>
          <div style="font-weight:600;">${val}</div>
        </div>`;
      }).join("");

      // optional total row
      const total = series.reduce((sum, s) => sum + (s[dataPointIndex] || 0), 0);
      const totalRow = `
      <div style="margin-top:6px;padding-top:4px;
                  display:flex;justify-content:space-between;
                  border-top:1px solid rgba(255,255,255,0.2);">
        <span><strong>Total</strong></span>
        <span><strong>${total}</strong></span>
      </div>`;

      return `
      <div style="padding:8px 12px;min-width:160px;">
        <div style="font-weight:bold;margin-bottom:6px;
                    border-bottom:1px solid rgba(255,255,255,0.2);
                    padding-bottom:4px;">
          ${category}
        </div>
        ${rows}
        ${totalRow}
      </div>
    `;
    }
  },
  grid: {
    borderColor: '#424242',
    strokeDashArray: 4,
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  responsive: [{
    breakpoint: 1000,
    options: {
      plotOptions: {
        bar: {
          columnWidth: '70%'
        }
      },
      dataLabels: {
        enabled: false
      }
    }
  }]
}))

// Watch for data changes and force re-render
watch(() => props.chartData, () => {
  chartKey.value++  // trigger chart rerender
}, { deep: true })

// Also watch for appKeys changes
watch(appKeys, () => {
  chartKey.value++
})
</script>