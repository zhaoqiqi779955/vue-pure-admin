<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  getMarketIndicesData,
  type MarketIndexQuote,
  type MarketIndicesDataItem
} from "@/api/dashboard";
import MarketIndicesTrendChart, {
  type MarketIndicesTrendSeries
} from "./components/MarketIndicesTrendChart.vue";

defineOptions({ name: "DashboardMarketIndices" });

const indexCodes = ["000001", "399001", "000300", "000905", "000852", "HSTECH"];
const loading = ref(false);
const errorMessage = ref("");
const items = ref<MarketIndicesDataItem[]>([]);
const dateRange = ref<[string, string]>([
  dayjs().subtract(180, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);

const orderedItems = computed(() =>
  [...items.value].sort((left, right) => left.date.localeCompare(right.date))
);

function latestOpenQuote(code: string): MarketIndexQuote | undefined {
  for (const item of [...orderedItems.value].reverse()) {
    const quote = item.indices[code];
    if (quote?.market_status === "open") return quote;
  }
  return undefined;
}

const latestCards = computed(() =>
  indexCodes.map(code => {
    const latest = latestOpenQuote(code);
    const latestItem = orderedItems.value[orderedItems.value.length - 1];
    const lastState = latestItem?.indices[code];
    return {
      code,
      name: latest?.name ?? lastState?.name ?? code,
      quote: latest,
      isClosed: lastState?.market_status === "closed",
      snapshotDate: latestItem?.date
    };
  })
);

type MarketIndexTrendChart = {
  code: string;
  name: string;
  dates: string[];
  series: MarketIndicesTrendSeries[];
  hasData: boolean;
};

const trendCharts = computed<MarketIndexTrendChart[]>(() =>
  indexCodes.map(code => {
    const points = orderedItems.value
      .flatMap(item => {
        const quote = item.indices[code];
        if (
          quote?.market_status !== "open" ||
          !quote.trade_date ||
          quote.close === null
        ) {
          return [];
        }
        return [
          {
            date: quote.trade_date,
            value: quote.close,
            name: quote.name
          }
        ];
      })
      .sort((left, right) => left.date.localeCompare(right.date));
    const name = points.at(-1)?.name ?? latestOpenQuote(code)?.name ?? code;

    return {
      code,
      name,
      dates: points.map(point => point.date),
      series: [{ name, data: points.map(point => point.value) }],
      hasData: points.length > 0
    };
  })
);

function formatNumber(value: number | null | undefined) {
  return value === null || value === undefined
    ? "-"
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined
    ? "-"
    : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await getMarketIndicesData({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    });
    items.value = result.items ?? [];
  } catch {
    items.value = [];
    errorMessage.value = "核心指数行情加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="p-4">
    <el-card shadow="never">
      <template #header>
        <div class="flex-bc flex-wrap gap-3">
          <span class="font-medium">核心指数行情</span>
          <div
            class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap"
          >
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :clearable="false"
              style="width: min(350px, 100%)"
            />
            <el-button
              class="w-full sm:w-auto"
              type="primary"
              :loading="loading"
              @click="loadData"
            >
              查询
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
      />
      <el-empty
        v-else-if="!loading && !items.length"
        description="暂无指数行情数据"
      />
      <el-skeleton v-else-if="loading && !items.length" :rows="12" animated />
      <div v-else v-loading="loading">
        <el-row :gutter="16" class="mb-4">
          <el-col
            v-for="card in latestCards"
            :key="card.code"
            :xs="24"
            :sm="12"
            :lg="8"
          >
            <el-card shadow="hover" class="mb-4">
              <div class="text-sm text-gray-500">
                {{ card.name }}（{{ card.code }}）
              </div>
              <div class="mt-2 text-2xl font-semibold">
                {{ formatNumber(card.quote?.close) }}
              </div>
              <div class="mt-2 flex justify-between text-sm">
                <span
                  :class="
                    (card.quote?.change_percent ?? 0) >= 0
                      ? 'text-red-500'
                      : 'text-green-500'
                  "
                >
                  {{ formatPercent(card.quote?.change_percent) }}
                </span>
                <span v-if="card.isClosed"
                  >市场休市（{{ card.snapshotDate }}）</span
                >
                <span v-else>{{ card.quote?.trade_date ?? "暂无数据" }}</span>
              </div>
              <div class="mt-2 text-xs text-gray-400">
                {{ card.quote?.source ?? "该市场当日休市" }}
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col
            v-for="chart in trendCharts"
            :key="chart.code"
            :xs="24"
            :lg="12"
            class="mb-4"
          >
            <MarketIndicesTrendChart
              v-if="chart.hasData"
              :title="`${chart.name}（${chart.code}）`"
              :dates="chart.dates"
              :series="chart.series"
            />
            <div
              v-else
              class="rounded border border-(--el-border-color-light) p-4"
            >
              <div class="font-medium">
                {{ chart.name }}（{{ chart.code }}）
              </div>
              <el-empty :image-size="72" description="暂无趋势数据" />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>
