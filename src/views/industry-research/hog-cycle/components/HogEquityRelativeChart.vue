<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import dayjs from "dayjs";
import { computed, nextTick, ref, watch } from "vue";
import type { HogGateCondition, HogSeries } from "@/api/industry-hog";
import {
  conditionStateLabel,
  conditionStateTagType,
  formatNumber,
  qualityLabel
} from "../presentation";

defineOptions({ name: "HogEquityRelativeChart" });

const props = defineProps<{
  series: HogSeries[];
  b5Condition?: HogGateCondition | null;
}>();

type EquityPoint = {
  value: [string, number];
  source: string;
  quality: "fresh" | "degraded";
  methodologyVersion: string;
};

type TooltipItem = {
  marker?: string;
  seriesName?: string;
  value?: unknown;
  data?: unknown;
};

const BASKET_CODE = "hog_equity_basket";
const BENCHMARK_CODE = "csi300_index";
const RELATIVE_CODE = "hog_equity_relative";

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

const basket = computed(
  () => props.series.find(entry => entry.series.code === BASKET_CODE) ?? null
);
const benchmark = computed(
  () => props.series.find(entry => entry.series.code === BENCHMARK_CODE) ?? null
);
const relative = computed(
  () => props.series.find(entry => entry.series.code === RELATIVE_CODE) ?? null
);

const hasData = computed(() => (basket.value?.observations.length ?? 0) > 0);
const coverageInsufficient = computed(
  () => !hasData.value && (benchmark.value?.observations.length ?? 0) === 0
);

function buildPoints(entry: HogSeries | null): EquityPoint[] {
  if (!entry) return [];
  return [...entry.observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(observation => ({
      value: [observation.date, Number(observation.value)],
      source: observation.source,
      quality: observation.quality,
      methodologyVersion: observation.methodology_version
    }));
}

function isTooltipItem(value: unknown): value is TooltipItem {
  return typeof value === "object" && value !== null;
}

function formatTooltip(params: unknown): string {
  const items = Array.isArray(params)
    ? params.filter(isTooltipItem)
    : isTooltipItem(params)
      ? [params]
      : [];
  if (!items.length) return "";
  const firstValue = items[0].value;
  const title = Array.isArray(firstValue)
    ? dayjs(String(firstValue[0])).format("YYYY-MM-DD")
    : "";
  const lines = items
    .map(item => {
      const point = item.data as EquityPoint | undefined;
      const numeric = Array.isArray(item.value) ? item.value[1] : null;
      const valueText = `${formatNumber(Number(numeric), 1)} 点`;
      const provenance = point
        ? `来源：${point.source}（${qualityLabel[point.quality]}）<br/>方法版本：${point.methodologyVersion}`
        : "";
      return `${item.marker ?? ""}${item.seriesName ?? ""}：<strong>${valueText}</strong><br/><span class="tooltip-provenance">${provenance}</span>`;
    })
    .join("<br/>");
  return `${title}<br/>${lines}`;
}

watch(
  () => props.series,
  async () => {
    await nextTick();
    if (!hasData.value) return;

    setOptions({
      tooltip: { trigger: "axis", formatter: formatTooltip },
      legend: { top: 0, type: "scroll" },
      grid: { top: 48, right: 72, bottom: 40, left: 64 },
      xAxis: {
        type: "time",
        splitNumber: 4,
        axisLabel: { hideOverlap: true }
      },
      yAxis: [
        {
          type: "value",
          name: "指数点位（基期=1000）",
          scale: true,
          axisLabel: { formatter: (value: number) => formatNumber(value, 0) },
          splitLine: { lineStyle: { type: "dashed" } }
        },
        {
          type: "value",
          name: "相对强度",
          scale: true,
          axisLabel: { formatter: (value: number) => formatNumber(value, 0) },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: basket.value?.series.display_name ?? "猪股篮子等权指数",
          type: "line",
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 2 },
          data: buildPoints(basket.value)
        },
        {
          name: benchmark.value?.series.display_name ?? "沪深300指数",
          type: "line",
          yAxisIndex: 0,
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { type: "dashed", width: 1.5 },
          data: buildPoints(benchmark.value)
        },
        {
          name: relative.value?.series.display_name ?? "猪股相对沪深300强度",
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          connectNulls: false,
          lineStyle: { width: 1.5, opacity: 0.85 },
          data: buildPoints(relative.value)
        }
      ]
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="equity-chart-block">
    <el-alert
      v-if="b5Condition"
      :type="
        b5Condition.state === 'pass'
          ? 'success'
          : b5Condition.state === 'fail'
            ? 'info'
            : 'warning'
      "
      :closable="false"
      show-icon
      class="b5-alert"
    >
      <template #title>
        <span class="b5-title">
          {{ b5Condition.name }}
          <el-tag
            :type="conditionStateTagType(b5Condition.state)"
            size="small"
            effect="plain"
          >
            {{ conditionStateLabel[b5Condition.state] }}
          </el-tag>
        </span>
      </template>
      {{ b5Condition.explanation }}
    </el-alert>

    <div v-show="hasData" ref="chartRef" class="equity-chart" />
    <el-empty
      v-if="!hasData"
      :description="
        coverageInsufficient
          ? '成分股有效报价少于 3 只或缺少基准，篮子指数暂不可用（覆盖不足）'
          : '所选时间范围内暂无猪股相对强弱数据'
      "
    />
  </div>
</template>

<style scoped>
.equity-chart-block {
  display: grid;
  gap: 12px;
}

.b5-title {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.equity-chart {
  width: 100%;
  height: 380px;
}

@media (width <= 560px) {
  .equity-chart {
    height: 320px;
  }
}
</style>
