<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";
import type { MacroLiquidityItem, MonthlyFlowSeries } from "@/api/dashboard";

type FlowKind = "social_financing" | "enterprise_loan";
type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  dataIndex?: number;
};

const props = defineProps({
  items: {
    type: Array as PropType<MacroLiquidityItem[]>,
    default: () => []
  },
  kind: {
    type: String as PropType<FlowKind>,
    required: true
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });
const dates = computed(() => props.items.map(item => item.month));
const label = computed(() =>
  props.kind === "social_financing" ? "社融单月增量" : "企业中长期贷款单月增量"
);
const color = computed(() =>
  props.kind === "social_financing" ? "#0f766e" : "#d97706"
);
const flows = computed(() =>
  props.items.map(item =>
    props.kind === "social_financing"
      ? item.social_financing_increment
      : item.enterprise_medium_long_term_loan_increment
  )
);
const values = computed(() =>
  flows.value.map(flow => {
    const value = numberOf(flow.monthly_value);
    if (value === null) return null;
    return {
      value,
      itemStyle: { color: value < 0 ? "#dc2626" : color.value }
    };
  })
);

function numberOf(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: string | null | undefined) {
  const parsed = numberOf(value);
  return parsed === null
    ? "-"
    : parsed.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function stateText(flow: MonthlyFlowSeries) {
  if (flow.derivation_state === "missing_base") return "缺少上月累计基期";
  if (flow.derivation_state === "missing") return "当月累计值缺失";
  return "由官方累计值派生";
}

function formatTooltip(params: unknown) {
  const point = (Array.isArray(params) ? params[0] : params) as
    | TooltipItem
    | undefined;
  if (!point || point.dataIndex === undefined) return "";
  const flow = flows.value[point.dataIndex];
  const month = point.axisValueLabel ?? dates.value[point.dataIndex] ?? "";
  return [
    month,
    `${point.marker ?? ""}${point.seriesName ?? label.value}：${formatValue(flow?.monthly_value)} 亿元`,
    `官方累计：${formatValue(flow?.ytd.latest?.value)} 亿元`,
    `状态：${flow ? stateText(flow) : "当月累计值缺失"}`
  ].join("<br/>");
}

watch(
  () => [props.items, props.kind],
  async () => {
    await nextTick();
    setOptions({
      tooltip: {
        trigger: "axis",
        confine: true,
        axisPointer: { type: "shadow" },
        formatter: formatTooltip
      },
      grid: { top: 30, right: 16, bottom: 52, left: 16, containLabel: true },
      xAxis: {
        type: "category",
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
        axisLine: {
          show: true,
          onZero: true
        },
        axisLabel: {
          formatter: (value: number) => value.toLocaleString("zh-CN")
        },
        splitLine: { lineStyle: { type: "dashed" } }
      },
      series: [
        {
          name: label.value,
          type: "bar",
          barMaxWidth: 28,
          data: values.value,
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          markLine: {
            silent: true,
            symbol: "none",
            data: [{ yAxis: 0 }],
            lineStyle: { color: "#909399", width: 1 }
          }
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
