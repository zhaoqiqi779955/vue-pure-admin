<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";
import type { MoneySupplyItem } from "@/api/dashboard";

type ChartMode = "yoy" | "balance";
type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  value?: unknown;
};

const props = defineProps({
  items: {
    type: Array as PropType<MoneySupplyItem[]>,
    default: () => []
  },
  mode: {
    type: String as PropType<ChartMode>,
    required: true
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

const dates = computed(() => props.items.map(item => item.month));
const unit = computed(() => (props.mode === "balance" ? "亿元" : "%"));
const series = computed(() => {
  if (props.mode === "balance") {
    return [
      {
        name: "M1 余额",
        data: props.items.map(item => numberOf(item.m1_balance))
      },
      {
        name: "M2 余额",
        data: props.items.map(item => numberOf(item.m2_balance))
      }
    ];
  }
  return [
    { name: "M1 同比", data: props.items.map(item => item.m1_yoy) },
    { name: "M2 同比", data: props.items.map(item => item.m2_yoy) },
    {
      name: "M1-M2 增速差",
      data: props.items.map(item => item.m1_m2_yoy_gap),
      lineStyle: { type: "dashed" as const }
    }
  ];
});

function numberOf(value: string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return "-";
  return number.toLocaleString("zh-CN", {
    maximumFractionDigits: props.mode === "balance" ? 0 : 2
  });
}

function formatUnit(seriesName = "") {
  return seriesName === "M1-M2 增速差" ? "个百分点" : unit.value;
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function formatTooltip(params: unknown) {
  const points = (Array.isArray(params) ? params : [params]).filter(
    isTooltipItem
  );
  if (!points.length) return "";
  const month = points[0].axisValueLabel ?? "";
  const values = points
    .map(point => {
      const name = point.seriesName ?? "";
      return `${point.marker ?? ""}${name}：${formatNumber(point.value)} ${formatUnit(name)}`;
    })
    .join("<br/>");
  return `${month}<br/>${values}`;
}

watch(
  () => [props.items, props.mode],
  async () => {
    await nextTick();
    setOptions({
      color: ["#409eff", "#67c23a", "#e6a23c"],
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: formatTooltip
      },
      legend: { top: 0, data: series.value.map(item => item.name) },
      grid: {
        top: 52,
        right: 16,
        bottom: 52,
        left: 16,
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: dates.value,
        axisLabel: {
          interval: "auto",
          hideOverlap: true,
          formatter: (value: string) => value.slice(2)
        }
      },
      yAxis: {
        type: "value",
        name: props.mode === "balance" ? "余额（亿元）" : "同比（% / pp）",
        axisLabel: {
          formatter: (value: number) => value.toLocaleString("zh-CN")
        },
        splitLine: { lineStyle: { type: "dashed" } }
      },
      series: series.value.map(item => ({
        ...item,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: false
      }))
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div ref="chartRef" class="h-100 w-full" />
</template>
