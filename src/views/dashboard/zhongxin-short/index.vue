<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  getMarketCoreData,
  getZhongxinFutureShortPosition,
  type MarketCoreDataItem,
  type ZhongxinFutureShortPositionItem
} from "@/api/dashboard";
import CumulativeTrendChart, {
  type TrendSeriesItem
} from "./components/CumulativeTrendChart.vue";
import MarketCoreTrendChart from "./components/MarketCoreTrendChart.vue";
import ShortBarChart, {
  type ShortBarChartItem
} from "./components/ShortBarChart.vue";

defineOptions({
  name: "DashboardZhongxinShort"
});

type ShortField = keyof ZhongxinFutureShortPositionItem;
type MarketCoreMetricField =
  | "total_amount_yi"
  | "limit_up_count"
  | "limit_down_count";

type MarketCoreMetricConfig = {
  field: MarketCoreMetricField;
  label: string;
  unit: string;
  color: string;
};

const loading = ref(false);
const errorMessage = ref("");
const latestItem = ref<ZhongxinFutureShortPositionItem>();
const marketCoreLoading = ref(false);
const marketCoreErrorMessage = ref("");
const latestMarketCoreItem = ref<MarketCoreDataItem>();
const marketCoreTrendDialogVisible = ref(false);
const marketCoreTrendLoading = ref(false);
const marketCoreTrendErrorMessage = ref("");
const marketCoreTrendItems = ref<MarketCoreDataItem[]>([]);
const trendDialogVisible = ref(false);
const trendLoading = ref(false);
const trendErrorMessage = ref("");
const trendItems = ref<ZhongxinFutureShortPositionItem[]>([]);
const trendDateRange = ref<[string, string]>([
  dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);
const marketCoreTrendDateRange = ref<[string, string]>([
  dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);

const cumulativeFields = [
  "IH_net_short",
  "IF_net_short",
  "IC_net_short",
  "IM_net_short",
  "total_net_short"
] as const satisfies ReadonlyArray<ShortField>;

const diffFields = [
  "IH_net_short_diff",
  "IF_net_short_diff",
  "IC_net_short_diff",
  "IM_net_short_diff",
  "total_net_short_diff"
] as const satisfies ReadonlyArray<ShortField>;

const fieldLabelMap: Partial<Record<ShortField, string>> = {
  IH_net_short: "上证50",
  IF_net_short: "沪深300",
  IC_net_short: "中证500",
  IM_net_short: "中证1000",
  total_net_short: "总空单"
};

const cumulativeDiffFieldMap = {
  IH_net_short: "IH_net_short_diff",
  IF_net_short: "IF_net_short_diff",
  IC_net_short: "IC_net_short_diff",
  IM_net_short: "IM_net_short_diff",
  total_net_short: "total_net_short_diff"
} as const satisfies Record<(typeof cumulativeFields)[number], ShortField>;

const marketCoreMetrics = [
  {
    field: "total_amount_yi",
    label: "成交额",
    unit: "亿",
    color: "#409eff"
  },
  {
    field: "limit_up_count",
    label: "涨停家数",
    unit: "家",
    color: "#f56c6c"
  },
  {
    field: "limit_down_count",
    label: "跌停家数",
    unit: "家",
    color: "#67c23a"
  }
] as const satisfies ReadonlyArray<MarketCoreMetricConfig>;

const selectedMarketCoreMetric = ref<MarketCoreMetricConfig>(
  marketCoreMetrics[0]
);

function getTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLatestItem(items: ZhongxinFutureShortPositionItem[]) {
  return [...items]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(next.date) - getTimestamp(prev.date))[0];
}

function getLatestMarketCoreItem(items: MarketCoreDataItem[]) {
  return [...items]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(next.date) - getTimestamp(prev.date))[0];
}

function getFieldLabel(field: ShortField) {
  const baseField = field.replace(/_diff$/, "") as ShortField;
  return fieldLabelMap[baseField] ?? field;
}

function getMarketCoreMetricValue(
  item: MarketCoreDataItem,
  field: MarketCoreMetricField
) {
  const value = Number(item[field] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function formatMarketCoreValue(
  item: MarketCoreDataItem | undefined,
  field: MarketCoreMetricField
) {
  if (!item) return "-";

  const rawValue = item[field];
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return String(rawValue || "-");

  return value.toLocaleString();
}

function toChartData(
  item: ZhongxinFutureShortPositionItem | undefined,
  fields: ReadonlyArray<ShortField>
): ShortBarChartItem[] {
  if (!item) return [];

  return fields.map(field => ({
    label: getFieldLabel(field),
    value: Number(item[field] ?? 0)
  }));
}

const hasData = computed(() => Boolean(latestItem.value));
const hasMarketCoreData = computed(() => Boolean(latestMarketCoreItem.value));

const marketCoreMetricCards = computed(() =>
  marketCoreMetrics.map(metric => ({
    ...metric,
    value: formatMarketCoreValue(latestMarketCoreItem.value, metric.field)
  }))
);

const cumulativeChartData = computed(() =>
  toChartData(latestItem.value, cumulativeFields)
);

const diffChartData = computed(() => toChartData(latestItem.value, diffFields));

const sortedTrendItems = computed(() =>
  [...trendItems.value]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(prev.date) - getTimestamp(next.date))
);

const sortedMarketCoreTrendItems = computed(() =>
  [...marketCoreTrendItems.value]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(prev.date) - getTimestamp(next.date))
);

const trendDates = computed(() =>
  sortedTrendItems.value.map(item => item.date)
);

const marketCoreTrendDates = computed(() =>
  sortedMarketCoreTrendItems.value.map(item => item.date)
);

const trendSeries = computed<TrendSeriesItem[]>(() =>
  cumulativeFields.map(field => {
    const diffField = cumulativeDiffFieldMap[field];

    return {
      name: getFieldLabel(field),
      data: sortedTrendItems.value.map(item => Number(item[field] ?? 0)),
      diffData: sortedTrendItems.value.map(item => Number(item[diffField] ?? 0))
    };
  })
);

const hasTrendData = computed(() => sortedTrendItems.value.length > 0);
const marketCoreTrendValues = computed(() =>
  sortedMarketCoreTrendItems.value.map(item =>
    getMarketCoreMetricValue(item, selectedMarketCoreMetric.value.field)
  )
);
const hasMarketCoreTrendData = computed(
  () => sortedMarketCoreTrendItems.value.length > 0
);

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { items } = await getZhongxinFutureShortPosition();
    latestItem.value = getLatestItem(items ?? []);
  } catch {
    latestItem.value = undefined;
    errorMessage.value = "中信空单数据加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

async function loadMarketCoreData() {
  marketCoreLoading.value = true;
  marketCoreErrorMessage.value = "";

  try {
    const { items } = await getMarketCoreData();
    latestMarketCoreItem.value = getLatestMarketCoreItem(items ?? []);
  } catch {
    latestMarketCoreItem.value = undefined;
    marketCoreErrorMessage.value = "大盘核心数据加载失败，请稍后重试";
  } finally {
    marketCoreLoading.value = false;
  }
}

async function loadTrendData() {
  const [start_date, end_date] = trendDateRange.value;

  trendLoading.value = true;
  trendErrorMessage.value = "";

  try {
    const { items } = await getZhongxinFutureShortPosition({
      start_date,
      end_date
    });
    trendItems.value = items ?? [];
  } catch {
    trendItems.value = [];
    trendErrorMessage.value = "累计空单趋势加载失败，请稍后重试";
  } finally {
    trendLoading.value = false;
  }
}

async function loadMarketCoreTrendData() {
  const [start_date, end_date] = marketCoreTrendDateRange.value;

  marketCoreTrendLoading.value = true;
  marketCoreTrendErrorMessage.value = "";

  try {
    const { items } = await getMarketCoreData({
      start_date,
      end_date
    });
    marketCoreTrendItems.value = items ?? [];
  } catch {
    marketCoreTrendItems.value = [];
    marketCoreTrendErrorMessage.value = "大盘核心指标趋势加载失败，请稍后重试";
  } finally {
    marketCoreTrendLoading.value = false;
  }
}

function openTrendDialog() {
  trendDialogVisible.value = true;
  loadTrendData();
}

function getMarketCoreTrendEndDate() {
  const latestDate = latestMarketCoreItem.value?.date;
  return latestDate && getTimestamp(latestDate)
    ? latestDate
    : dayjs().format("YYYY-MM-DD");
}

function openMarketCoreTrendDialog(metric: MarketCoreMetricConfig) {
  const endDate = getMarketCoreTrendEndDate();

  selectedMarketCoreMetric.value = metric;
  marketCoreTrendDateRange.value = [
    dayjs(endDate).subtract(6, "month").format("YYYY-MM-DD"),
    endDate
  ];
  marketCoreTrendDialogVisible.value = true;
  loadMarketCoreTrendData();
}

onMounted(() => {
  loadMarketCoreData();
  loadData();
});
</script>

<template>
  <div class="zhongxin-short-page">
    <el-card shadow="never" class="mb-4">
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-medium">大盘核心数据</h2>
          <p class="mt-1 text-sm text-text_color_regular">
            默认展示接口最新值，点击指标可查看最近半年趋势。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="latestMarketCoreItem?.date"
            class="text-sm text-text_color_regular"
          >
            数据日期：{{ latestMarketCoreItem.date }}
          </span>
          <el-button :loading="marketCoreLoading" @click="loadMarketCoreData">
            刷新
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="marketCoreErrorMessage"
        class="mb-4"
        :title="marketCoreErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="marketCoreLoading" :rows="3" animated />

      <el-empty v-else-if="!hasMarketCoreData" description="暂无大盘核心数据" />

      <el-row v-else :gutter="16">
        <el-col
          v-for="metric in marketCoreMetricCards"
          :key="metric.field"
          :xs="24"
          :md="8"
          class="mb-4"
        >
          <div
            class="market-core-card cursor-pointer rounded-lg border border-(--el-border-color-light) p-4 transition-all hover:border-(--el-color-primary)"
            @click="openMarketCoreTrendDialog(metric)"
          >
            <div class="flex-bc">
              <span class="text-sm text-text_color_regular">
                {{ metric.label }}
              </span>
              <span
                class="inline-block size-2.5 rounded-full"
                :style="{ backgroundColor: metric.color }"
              />
            </div>
            <div class="mt-3 flex items-baseline gap-2">
              <span class="text-2xl font-semibold">{{ metric.value }}</span>
              <span class="text-sm text-text_color_regular">
                {{ metric.unit }}
              </span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="mb-4">
      <div class="flex-bc flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-medium">中信空单数据</h2>
          <p class="mt-1 text-sm text-text_color_regular">
            默认展示接口最新值，字段按累计空单和空单变化量拆分。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="latestItem?.date" class="text-sm text-text_color_regular">
            数据日期：{{ latestItem.date }}
          </span>
          <el-button :loading="loading" @click="loadData">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="mb-4"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-empty v-else-if="!hasData" description="暂无中信空单数据" />

    <el-row v-else :gutter="16">
      <el-col :xs="24" :lg="12" class="mb-4">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">累计空单</span>
          </template>
          <ShortBarChart
            class="cursor-pointer"
            :data="cumulativeChartData"
            color="#409eff"
            @click="openTrendDialog"
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12" class="mb-4">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">空单变化量</span>
          </template>
          <ShortBarChart :data="diffChartData" color="#e6a23c" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="trendDialogVisible"
      title="累计空单变化趋势"
      width="80%"
      top="6vh"
    >
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <span class="text-sm text-text_color_regular">
          默认展示最近半年数据，可手动输入时间范围。
        </span>
        <el-date-picker
          v-model="trendDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="loadTrendData"
        />
      </div>

      <el-alert
        v-if="trendErrorMessage"
        class="mb-4"
        :title="trendErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="trendLoading" :rows="8" animated />
      <el-empty v-else-if="!hasTrendData" description="暂无累计空单趋势数据" />
      <CumulativeTrendChart v-else :dates="trendDates" :series="trendSeries" />
    </el-dialog>

    <el-dialog
      v-model="marketCoreTrendDialogVisible"
      :title="`${selectedMarketCoreMetric.label}变化趋势`"
      width="80%"
      top="6vh"
    >
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <span class="text-sm text-text_color_regular">
          默认展示最新数据日期往前半年，可手动输入时间范围。
        </span>
        <el-date-picker
          v-model="marketCoreTrendDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="loadMarketCoreTrendData"
        />
      </div>

      <el-alert
        v-if="marketCoreTrendErrorMessage"
        class="mb-4"
        :title="marketCoreTrendErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="marketCoreTrendLoading" :rows="8" animated />
      <el-empty
        v-else-if="!hasMarketCoreTrendData"
        description="暂无大盘核心指标趋势数据"
      />
      <MarketCoreTrendChart
        v-else
        :dates="marketCoreTrendDates"
        :values="marketCoreTrendValues"
        :label="selectedMarketCoreMetric.label"
        :unit="selectedMarketCoreMetric.unit"
      />
    </el-dialog>
  </div>
</template>

<style scoped>
.zhongxin-short-page {
  padding: 16px;
}

.market-core-card:hover {
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-2px);
}
</style>
