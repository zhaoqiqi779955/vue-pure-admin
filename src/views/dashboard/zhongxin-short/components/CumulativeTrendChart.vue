<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type TrendSeriesItem = {
  name: string;
  data: number[];
  diffData: number[];
};

type TooltipItem = {
  axisValueLabel?: string;
  dataIndex?: number;
  marker?: string;
  name?: string;
  seriesIndex?: number;
  seriesName?: string;
  value?: unknown;
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

function formatSignedChartValue(value: unknown) {
  if (typeof value !== "number") return String(value);
  return `${value > 0 ? "+" : ""}${value.toLocaleString()}`;
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function getTooltipItems(params: unknown) {
  if (Array.isArray(params)) return params.filter(isTooltipItem);
  return isTooltipItem(params) ? [params] : [];
}

function formatTooltip(params: unknown) {
  const items = getTooltipItems(params);
  if (!items.length) return "";

  const title = items[0].axisValueLabel ?? items[0].name ?? "";
  const content = items
    .map(item => {
      const series =
        typeof item.seriesIndex === "number"
          ? props.series[item.seriesIndex]
          : undefined;
      const dataIndex = typeof item.dataIndex === "number" ? item.dataIndex : 0;
      const name = item.seriesName ?? series?.name ?? "";
      const value = series?.data[dataIndex] ?? item.value;
      const diffValue = series?.diffData[dataIndex];

      return [
        `${item.marker ?? ""}${name}`,
        `当前值：${formatChartValue(value)}`,
        `变化量：${formatSignedChartValue(diffValue)}`
      ].join("<br/>");
    })
    .join("<br/>");

  return `${title}<br/>${content}`;
}

watch(
  () => [props.dates, props.series],
  async () => {
    await nextTick();

    setOptions({
      tooltip: {
        trigger: "axis",
        formatter: formatTooltip
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
