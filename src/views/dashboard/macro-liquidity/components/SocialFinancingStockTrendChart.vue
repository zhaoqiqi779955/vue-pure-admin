<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";
import type { MacroLiquidityItem } from "@/api/dashboard";

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  value?: unknown;
  dataIndex?: number;
};

const props = defineProps({
  items: {
    type: Array as PropType<MacroLiquidityItem[]>,
    default: () => []
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });
const dates = computed(() => props.items.map(item => item.month));
const values = computed(() =>
  props.items.map(item => numberOf(item.social_financing_stock.latest?.value))
);

function numberOf(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatTooltip(params: unknown) {
  const point = (Array.isArray(params) ? params[0] : params) as
    | TooltipItem
    | undefined;
  if (!point || point.dataIndex === undefined) return "";
  const item = props.items[point.dataIndex];
  const observation = item?.social_financing_stock.latest;
  if (!observation) return `${point.axisValueLabel ?? ""}<br/>暂无数据`;
  const value = Number(observation.value);
  const trillion = Number.isFinite(value) ? value / 10000 : null;
  const yoy = observation.reported_yoy_percent;
  return [
    point.axisValueLabel ?? item.month,
    `${point.marker ?? ""}${point.seriesName ?? "社融存量"}：${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })} 亿元`,
    `折合：${trillion?.toLocaleString("zh-CN", { maximumFractionDigits: 2 }) ?? "-"} 万亿元`,
    `官方同比：${yoy === null ? "-" : `${yoy}%`}`
  ].join("<br/>");
}

watch(
  () => props.items,
  async () => {
    await nextTick();
    setOptions({
      color: ["#2563eb"],
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: formatTooltip
      },
      grid: { top: 30, right: 16, bottom: 52, left: 16, containLabel: true },
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
        name: "亿元",
        axisLabel: {
          formatter: (value: number) => value.toLocaleString("zh-CN")
        },
        splitLine: { lineStyle: { type: "dashed" } }
      },
      series: [
        {
          name: "社融存量",
          type: "line",
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          data: values.value,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.08 }
        }
      ]
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div ref="chartRef" class="credit-chart" />
</template>

<style scoped>
.credit-chart {
  width: 100%;
  height: 320px;
}
</style>
