<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import dayjs from "dayjs";
import { computed, nextTick, ref, watch } from "vue";
import type { HogSeries } from "@/api/industry-hog";
import { formatNumber, qualityLabel } from "../presentation";

defineOptions({ name: "HogIndicatorTrendChart" });

const props = defineProps<{
  series: HogSeries[];
}>();

type ChartPoint = {
  value: [string, number];
  unit: string;
  source: string;
  sourceUrl: string;
  quality: "fresh" | "degraded";
  methodologyVersion: string;
  publishedAt: string | null;
};

type TooltipItem = {
  marker?: string;
  seriesName?: string;
  value?: unknown;
  data?: unknown;
};

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

const hasData = computed(() =>
  props.series.some(entry => entry.observations.length > 0)
);

const units = computed(() => {
  const seen: string[] = [];
  for (const entry of props.series) {
    if (entry.observations.length && !seen.includes(entry.series.unit)) {
      seen.push(entry.series.unit);
    }
  }
  return seen.slice(0, 2);
});

function axisIndex(unit: string): number {
  const index = units.value.indexOf(unit);
  return index === 1 ? 1 : 0;
}

function buildPoints(entry: HogSeries): ChartPoint[] {
  return [...entry.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(observation => ({
      value: [observation.date, Number(observation.value)],
      unit: entry.series.unit,
      source: observation.source,
      sourceUrl: observation.source_url,
      quality: observation.quality,
      methodologyVersion: observation.methodology_version,
      publishedAt: observation.published_at
    }));
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function getTooltipItems(params: unknown): TooltipItem[] {
  if (Array.isArray(params)) return params.filter(isTooltipItem);
  return isTooltipItem(params) ? [params] : [];
}

function formatTooltip(params: unknown): string {
  const items = getTooltipItems(params);
  if (!items.length) return "";
  const firstValue = items[0].value;
  const title = Array.isArray(firstValue)
    ? dayjs(String(firstValue[0])).format("YYYY-MM-DD")
    : "";
  const lines = items
    .map(item => {
      const point = item.data as ChartPoint | undefined;
      const numeric = Array.isArray(item.value) ? item.value[1] : null;
      const valueText =
        numeric === null || numeric === undefined || numeric === ""
          ? "—"
          : `${formatNumber(Number(numeric))} ${point?.unit ?? ""}`;
      const provenance = point
        ? [
            `来源：${point.source}（${qualityLabel[point.quality]}）`,
            `方法版本：${point.methodologyVersion}`,
            point.publishedAt
              ? `发布：${dayjs(point.publishedAt).format("YYYY-MM-DD")}`
              : ""
          ]
            .filter(Boolean)
            .join("<br/>")
        : "";
      return `${item.marker ?? ""}${item.seriesName ?? ""}：<strong>${valueText}</strong>${
        provenance
          ? `<br/><span class="tooltip-provenance">${provenance}</span>`
          : ""
      }`;
    })
    .join("<br/>");
  return `${title}<br/>${lines}`;
}

watch(
  () => props.series,
  async () => {
    await nextTick();
    if (!hasData.value) return;

    const axisUnits = units.value;
    setOptions({
      tooltip: {
        trigger: "axis",
        appendTo: "body",
        formatter: formatTooltip
      },
      legend: {
        top: 0,
        type: "scroll"
      },
      grid: {
        top: 48,
        right: axisUnits.length > 1 ? 72 : 24,
        bottom: 40,
        left: 64
      },
      xAxis: {
        type: "time",
        splitNumber: 4,
        axisLabel: { hideOverlap: true }
      },
      yAxis: [
        {
          type: "value",
          name: axisUnits[0] ?? "",
          scale: true,
          axisLabel: {
            formatter: (value: number) => formatNumber(value, 0)
          },
          splitLine: { lineStyle: { type: "dashed" } }
        },
        {
          type: "value",
          name: axisUnits[1] ?? "",
          scale: true,
          show: axisUnits.length > 1,
          axisLabel: {
            formatter: (value: number) => formatNumber(value, 0)
          },
          splitLine: { show: false }
        }
      ],
      series: props.series
        .filter(entry => entry.observations.length > 0)
        .map(entry => ({
          name: entry.series.display_name,
          type: "line",
          yAxisIndex: axisIndex(entry.series.unit),
          smooth: entry.series.frequency === "daily",
          showSymbol: entry.series.frequency !== "daily",
          symbolSize: entry.series.frequency === "weekly" ? 5 : 7,
          connectNulls: false,
          data: buildPoints(entry)
        }))
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div v-if="hasData" ref="chartRef" class="hog-trend-chart" />
  <el-empty v-else description="所选时间范围内暂无可用观测数据" />
</template>

<style scoped>
.hog-trend-chart {
  width: 100%;
  height: 360px;
}

@media (width <= 560px) {
  .hog-trend-chart {
    height: 300px;
  }
}
</style>
