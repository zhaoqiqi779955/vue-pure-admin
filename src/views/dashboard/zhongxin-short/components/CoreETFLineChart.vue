<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type CoreETFLineSeriesItem = {
  name: string;
  data: Array<number | null>;
};

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  name?: string;
  seriesName?: string;
  value?: unknown;
};

const props = defineProps({
  dates: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  series: {
    type: Array as PropType<CoreETFLineSeriesItem[]>,
    default: () => []
  },
  unit: {
    type: String,
    default: ""
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function formatChartValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";

  const text =
    typeof value === "number" ? value.toLocaleString() : String(value);
  return props.unit ? `${text} ${props.unit}` : text;
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
    .map(item =>
      [
        `${item.marker ?? ""}${item.seriesName ?? ""}`,
        `当前值：${formatChartValue(item.value)}`
      ].join("<br/>")
    )
    .join("<br/>");

  return `${title}<br/>${content}`;
}

watch(
  () => [props.dates, props.series, props.unit],
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
          formatter: (value: number) =>
            props.unit ? `${value.toLocaleString()} ${props.unit}` : `${value}`
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
        connectNulls: false,
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
  <div ref="chartRef" class="h-100 w-full" />
</template>
