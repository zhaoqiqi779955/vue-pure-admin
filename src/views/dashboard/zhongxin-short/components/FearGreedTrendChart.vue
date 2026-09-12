<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";
import type { FearGreedTrendPoint } from "../fearGreed";

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  value?: number | null;
  dataIndex?: number;
};

type ChartTexts = {
  fearGreed: string;
  csi500: string;
  indexSource: string;
  benchmarkSource: string;
  unavailable: string;
};

const props = defineProps({
  points: {
    type: Array as PropType<FearGreedTrendPoint[]>,
    default: () => []
  },
  texts: {
    type: Object as PropType<ChartTexts>,
    required: true
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function getTooltipItem(value: unknown): TooltipItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    item => typeof item === "object" && item !== null
  ) as TooltipItem[];
}

function formatTooltip(params: unknown) {
  const items = getTooltipItem(params);
  const date = items[0]?.axisValueLabel ?? "";
  const point = props.points[items[0]?.dataIndex ?? -1];

  if (!point) return date;

  return [
    date,
    `${items[0]?.marker ?? ""}${props.texts.fearGreed}：${
      point.fearValue ?? props.texts.unavailable
    }`,
    `${props.texts.indexSource}：${point.fearSource ?? props.texts.unavailable}`,
    `${items[1]?.marker ?? ""}${props.texts.csi500}：${
      point.csi500Close?.toLocaleString() ?? props.texts.unavailable
    }`,
    `${props.texts.benchmarkSource}：${
      point.benchmarkSource ?? props.texts.unavailable
    }`
  ].join("<br/>");
}

watch(
  () => [props.points, props.texts],
  async () => {
    await nextTick();

    setOptions({
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: formatTooltip
      },
      grid: {
        top: 36,
        right: 60,
        bottom: 48,
        left: 60,
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: props.points.map(item => item.date)
      },
      yAxis: [
        {
          type: "value",
          min: 0,
          max: 100,
          name: props.texts.fearGreed,
          splitLine: { lineStyle: { type: "dashed" } }
        },
        {
          type: "value",
          name: props.texts.csi500,
          splitLine: { show: false },
          axisLabel: { formatter: (value: number) => value.toLocaleString() }
        }
      ],
      series: [
        {
          name: props.texts.fearGreed,
          type: "line",
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          data: props.points.map(item => item.fearValue),
          markLine: {
            silent: true,
            symbol: "none",
            label: { show: false },
            lineStyle: {
              color: "#67c23a",
              type: "dashed",
              width: 2
            },
            data: [{ yAxis: 5 }]
          },
          markArea: {
            silent: true,
            itemStyle: { opacity: 0.1 },
            data: [
              [{ yAxis: 0, itemStyle: { color: "#67c23a" } }, { yAxis: 5 }],
              [{ yAxis: 5, itemStyle: { color: "#f56c6c" } }, { yAxis: 10 }],
              [{ yAxis: 10, itemStyle: { color: "#e6a23c" } }, { yAxis: 30 }],
              [{ yAxis: 30, itemStyle: { color: "#f7ba2a" } }, { yAxis: 50 }],
              [{ yAxis: 50, itemStyle: { color: "#95d475" } }, { yAxis: 70 }],
              [{ yAxis: 70, itemStyle: { color: "#67c23a" } }, { yAxis: 90 }],
              [{ yAxis: 90, itemStyle: { color: "#409eff" } }, { yAxis: 100 }]
            ]
          }
        },
        {
          name: props.texts.csi500,
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { type: "dashed" },
          data: props.points.map(item => item.csi500Close)
        }
      ]
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div ref="chartRef" class="h-115 w-full" />
</template>
