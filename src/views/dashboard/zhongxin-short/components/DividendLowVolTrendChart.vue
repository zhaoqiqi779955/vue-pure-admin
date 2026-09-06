<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type DividendLowVolTrendSeriesItem = {
  name: string;
  data: Array<number | null>;
  unit: string;
  yAxisIndex: 0 | 1;
};

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  name?: string;
  seriesName?: string;
  value?: unknown;
};

type AxisExtent = {
  min: number;
  max: number;
};

const AXIS_PADDING_RATIO = 0.08;

const props = defineProps({
  dates: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  series: {
    type: Array as PropType<DividendLowVolTrendSeriesItem[]>,
    default: () => []
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function getSeriesUnit(seriesName: string | undefined) {
  return props.series.find(item => item.name === seriesName)?.unit ?? "";
}

function formatChartValue(value: unknown, unit = "") {
  if (value === null || value === undefined || value === "") return "-";

  const text =
    typeof value === "number" ? value.toLocaleString() : String(value);
  return unit ? `${text} ${unit}` : text;
}

function getAxisPadding({ min, max }: AxisExtent) {
  const range = max - min;
  return range > 0
    ? range * AXIS_PADDING_RATIO
    : Math.max(Math.abs(min) * AXIS_PADDING_RATIO, 1);
}

function getAxisMin(extent: AxisExtent) {
  return Math.max(0, extent.min - getAxisPadding(extent));
}

function getAxisMax(extent: AxisExtent) {
  return extent.max + getAxisPadding(extent);
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
      const unit = getSeriesUnit(item.seriesName);
      return [
        `${item.marker ?? ""}${item.seriesName ?? ""}`,
        `当前值：${formatChartValue(item.value, unit)}`
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
        right: 72,
        bottom: 48,
        left: 72
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.dates
      },
      yAxis: [
        {
          type: "value",
          name: "点位",
          scale: true,
          min: getAxisMin,
          max: getAxisMax,
          axisLabel: {
            formatter: (value: number) => value.toLocaleString()
          },
          splitLine: {
            lineStyle: {
              type: "dashed"
            }
          }
        },
        {
          type: "value",
          name: "股息率",
          scale: true,
          min: getAxisMin,
          max: getAxisMax,
          axisLabel: {
            formatter: (value: number) => `${value}%`
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: props.series.map(item => ({
        name: item.name,
        type: "line",
        yAxisIndex: item.yAxisIndex,
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
  <div ref="chartRef" class="h-115 w-full" />
</template>
