<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type TrendSeriesItem = {
  name: string;
  data: number[];
};

const props = defineProps({
  dates: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  series: {
    type: Array as PropType<TrendSeriesItem[]>,
    default: () => []
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function formatChartValue(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

watch(
  () => [props.dates, props.series],
  async () => {
    await nextTick();

    setOptions({
      tooltip: {
        trigger: "axis",
        valueFormatter: formatChartValue
      },
      legend: {
        top: 0,
        data: props.series.map(item => item.name)
      },
      grid: {
        top: 48,
        right: 32,
        bottom: 48,
        left: 72
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.dates
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => value.toLocaleString()
        },
        splitLine: {
          lineStyle: {
            type: "dashed"
          }
        }
      },
      series: props.series.map(item => ({
        name: item.name,
        type: "line",
        smooth: true,
        showSymbol: false,
        data: item.data
      }))
    });
  },
  {
    deep: true,
    immediate: true
  }
);
</script>

<template>
  <div ref="chartRef" class="h-115 w-full" />
</template>
