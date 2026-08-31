<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type MarketIndicesTrendSeries = {
  name: string;
  data: Array<number | null>;
};

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

const props = defineProps({
  title: {
    type: String,
    default: ""
  },
  dates: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  series: {
    type: Array as PropType<MarketIndicesTrendSeries[]>,
    default: () => []
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function formatTooltipValue(value: unknown) {
  const pointValue = Array.isArray(value) ? value.at(-1) : value;
  return typeof pointValue === "number" && Number.isFinite(pointValue)
    ? pointValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    : "-";
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function formatTooltip(params: unknown) {
  const item = Array.isArray(params)
    ? params.find(isTooltipItem)
    : isTooltipItem(params)
      ? params
      : undefined;
  if (!item) return "";

  return [
    item.axisValueLabel ?? "",
    `${item.marker ?? ""}${item.seriesName ?? ""}`,
    `收盘点位：${formatTooltipValue(item.value)}`
  ].join("<br/>");
}

watch(
  () => [props.dates, props.series, props.title],
  async () => {
    await nextTick();
    const showLegend = props.series.length > 1;

    setOptions({
      tooltip: {
        trigger: "axis",
        formatter: formatTooltip
      },
      legend: {
        show: showLegend,
        top: 0,
        data: props.series.map(item => item.name)
      },
      grid: {
        top: showLegend ? 48 : 24,
        right: 24,
        bottom: 48,
        left: 64
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.dates,
        axisLabel: { hideOverlap: true }
      },
      yAxis: {
        type: "value",
        name: "点位",
        scale: true,
        axisLabel: { formatter: (value: number) => value.toLocaleString() },
        splitLine: { lineStyle: { type: "dashed" } }
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
  { deep: true, immediate: true }
);
</script>

<template>
  <section class="rounded border border-(--el-border-color-light) p-4">
    <h2 v-if="title" class="mb-2 text-base font-medium">{{ title }}</h2>
    <div ref="chartRef" class="h-80 w-full" />
  </section>
</template>
