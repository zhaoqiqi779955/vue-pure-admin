<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";
import { useI18n } from "vue-i18n";
import type {
  MacroMarketObservation,
  MacroMarketSeries
} from "@/api/dashboard";

type TooltipItem = {
  axisValueLabel?: string;
  marker?: string;
  seriesName?: string;
  dataIndex?: number;
};

const props = defineProps({
  series: {
    type: Array as PropType<MacroMarketSeries[]>,
    default: () => []
  },
  unit: {
    type: String,
    required: true
  }
});

const { locale, t } = useI18n();
const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });
const dates = computed(() =>
  [
    ...new Set(
      props.series.flatMap(item => item.observations.map(point => point.date))
    )
  ].sort()
);
const observations = computed(() =>
  props.series.map(item => {
    const byDate = new Map(item.observations.map(point => [point.date, point]));
    return {
      name: item.name,
      points: dates.value.map(date => byDate.get(date) ?? null)
    };
  })
);

function numberOf(point: MacroMarketObservation | null) {
  if (!point) return null;
  const value = Number(point.value);
  return Number.isFinite(value) ? value : null;
}

function formatValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(locale.value, { maximumFractionDigits: 4 })
    : "-";
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function formatTooltip(params: unknown) {
  const points = (Array.isArray(params) ? params : [params]).filter(
    isTooltipItem
  );
  if (!points.length) return "";
  const rows = points.flatMap(point => {
    const series = observations.value.find(
      item => item.name === point.seriesName
    );
    const observation = series?.points[point.dataIndex ?? -1];
    if (!observation) return [];
    const contract = observation.metadata.contract_code;
    const components = Object.entries(observation.components).map(
      ([key, value]) =>
        `${componentLabel(key)}：${formatValue(value)}${props.unit === "bp" ? "%" : ""}`
    );
    return [
      `${point.marker ?? ""}${point.seriesName ?? ""}：${formatValue(observation.value)} ${props.unit}`,
      ...(contract
        ? [`${t("macroMarket.tooltip.contract")}：${contract}`]
        : []),
      ...components
    ];
  });
  return `${points[0].axisValueLabel ?? ""}<br/>${rows.join("<br/>")}`;
}

function componentLabel(key: string) {
  const labels: Record<string, string> = {
    credit_yield_percent: t("macroMarket.tooltip.creditYield"),
    government_yield_percent: t("macroMarket.tooltip.governmentYield"),
    thirty_year_yield_percent: t("macroMarket.tooltip.thirtyYearYield"),
    ten_year_yield_percent: t("macroMarket.tooltip.tenYearYield")
  };
  return labels[key] ?? key;
}

watch(
  () => [props.series, props.unit],
  async () => {
    await nextTick();
    setOptions({
      color: ["#2563eb", "#d97706", "#0f766e"],
      tooltip: {
        trigger: "axis",
        confine: true,
        formatter: formatTooltip
      },
      legend: {
        top: 0,
        data: props.series.map(item => item.name)
      },
      grid: {
        top: 48,
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
          formatter: (value: string) => value.slice(5)
        }
      },
      yAxis: {
        type: "value",
        scale: true,
        name: props.unit,
        axisLabel: {
          formatter: (value: number) => value.toLocaleString(locale.value)
        },
        splitLine: { lineStyle: { type: "dashed" } }
      },
      series: observations.value.map(item => ({
        name: item.name,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: false,
        data: item.points.map(numberOf),
        lineStyle: { width: 2 }
      }))
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div ref="chartRef" class="macro-market-chart" />
</template>

<style scoped>
.macro-market-chart {
  width: 100%;
  height: 300px;
}

@media (width <= 560px) {
  .macro-market-chart {
    height: 270px;
  }
}
</style>
