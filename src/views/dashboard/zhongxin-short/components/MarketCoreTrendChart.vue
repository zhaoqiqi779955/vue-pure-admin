<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

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
  values: {
    type: Array as PropType<number[]>,
    default: () => []
  },
  label: {
    type: String,
    default: ""
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
  const text =
    typeof value === "number" ? value.toLocaleString() : String(value);
  return props.unit ? `${text} ${props.unit}` : text;
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function getTooltipItem(params: unknown) {
  if (Array.isArray(params)) return params.find(isTooltipItem);
  return isTooltipItem(params) ? params : undefined;
}

function formatTooltip(params: unknown) {
  const item = getTooltipItem(params);
  if (!item) return "";

  const title = item.axisValueLabel ?? item.name ?? "";
  const name = item.seriesName ?? props.label;

  return [
    title,
    `${item.marker ?? ""}${name}`,
    `当前值：${formatChartValue(item.value)}`
  ].join("<br/>");
}

watch(
  () => [props.dates, props.values, props.label, props.unit],
  async () => {
    await nextTick();

    setOptions({
      tooltip: {
        trigger: "axis",
        formatter: formatTooltip
      },
      grid: {
        top: 32,
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
      series: [
        {
          name: props.label,
          type: "line",
          smooth: true,
          showSymbol: false,
          data: props.values,
          areaStyle: {
            opacity: 0.08
          }
        }
      ]
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
