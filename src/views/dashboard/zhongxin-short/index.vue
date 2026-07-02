<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  getCoreETFData,
  getMarketCoreData,
  getZhongxinFutureShortPosition,
  type CoreETFDataItem,
  type MarketCoreDataItem,
  type ZhongxinFutureShortPositionItem
} from "@/api/dashboard";
import CumulativeTrendChart, {
  type TrendSeriesItem
} from "./components/CumulativeTrendChart.vue";
import CoreETFLineChart, {
  type CoreETFLineSeriesItem
} from "./components/CoreETFLineChart.vue";
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
type CoreETFMetricField = "share_yi" | "unit_nav";
type CoreETFSummaryItem = {
  code: string;
  name: string;
  shareYi: string;
  unitNav: string;
};

const loading = ref(false);
const errorMessage = ref("");
const latestItem = ref<ZhongxinFutureShortPositionItem>();
const coreETFLoading = ref(false);
const coreETFErrorMessage = ref("");
const latestCoreETFItem = ref<CoreETFDataItem>();
const coreETFTrendLoading = ref(false);
const coreETFTrendErrorMessage = ref("");
const coreETFTrendItems = ref<CoreETFDataItem[]>([]);
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
const coreETFTrendDateRange = ref<[string, string]>([
  dayjs().subtract(1, "year").format("YYYY-MM-DD"),
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
const coreETFOrder = ["510300", "510500", "512100"] as const;

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

function getLatestCoreETFItem(items: CoreETFDataItem[]) {
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

function getFiniteValue(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function formatNullableValue(value: unknown) {
  const numericValue = getFiniteValue(value);
  return numericValue === null ? "-" : numericValue.toLocaleString();
}

function getCoreETFName(code: string) {
  const items = [
    latestCoreETFItem.value,
    ...sortedCoreETFTrendItems.value
  ].filter(Boolean) as CoreETFDataItem[];

  for (const item of items) {
    const name = item.etfs?.[code]?.name;
    if (name) return name;
  }

  return code;
}

function getOrderedCoreETFCodes(items: CoreETFDataItem[]) {
  const codeSet = new Set<string>();

  items.forEach(item => {
    Object.keys(item.etfs ?? {}).forEach(code => codeSet.add(code));
  });

  return [
    ...coreETFOrder.filter(code => codeSet.has(code)),
    ...[...codeSet]
      .filter(
        code => !coreETFOrder.includes(code as (typeof coreETFOrder)[number])
      )
      .sort()
  ];
}

function toCoreETFSeries(field: CoreETFMetricField): CoreETFLineSeriesItem[] {
  return coreETFCodes.value.map(code => ({
    name: getCoreETFName(code),
    data: sortedCoreETFTrendItems.value.map(item =>
      getFiniteValue(item.etfs?.[code]?.[field])
    )
  }));
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
const hasCoreETFData = computed(
  () => Object.keys(latestCoreETFItem.value?.etfs ?? {}).length > 0
);

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

const sortedCoreETFTrendItems = computed(() =>
  [...coreETFTrendItems.value]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(prev.date) - getTimestamp(next.date))
);

const trendDates = computed(() =>
  sortedTrendItems.value.map(item => item.date)
);

const marketCoreTrendDates = computed(() =>
  sortedMarketCoreTrendItems.value.map(item => item.date)
);

const coreETFTrendDates = computed(() =>
  sortedCoreETFTrendItems.value.map(item => item.date)
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
const coreETFCodes = computed(() =>
  getOrderedCoreETFCodes(
    [latestCoreETFItem.value, ...sortedCoreETFTrendItems.value].filter(
      Boolean
    ) as CoreETFDataItem[]
  )
);
const coreETFSummaryItems = computed<CoreETFSummaryItem[]>(() =>
  coreETFCodes.value.map(code => {
    const etf = latestCoreETFItem.value?.etfs?.[code];

    return {
      code,
      name: etf?.name || getCoreETFName(code),
      shareYi: formatNullableValue(etf?.share_yi),
      unitNav: formatNullableValue(etf?.unit_nav)
    };
  })
);
const coreETFShareSeries = computed(() => toCoreETFSeries("share_yi"));
const coreETFUnitNavSeries = computed(() => toCoreETFSeries("unit_nav"));
const hasCoreETFTrendData = computed(
  () =>
    sortedCoreETFTrendItems.value.length > 0 && coreETFCodes.value.length > 0
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

async function loadCoreETFData() {
  coreETFLoading.value = true;
  coreETFErrorMessage.value = "";

  try {
    const { items } = await getCoreETFData();
    latestCoreETFItem.value = getLatestCoreETFItem(items ?? []);
    resetCoreETFTrendDateRange();
    await loadCoreETFTrendData();
  } catch {
    latestCoreETFItem.value = undefined;
    coreETFTrendItems.value = [];
    coreETFErrorMessage.value = "核心 ETF 数据加载失败，请稍后重试";
  } finally {
    coreETFLoading.value = false;
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

async function loadCoreETFTrendData() {
  const [start_date, end_date] = coreETFTrendDateRange.value;

  coreETFTrendLoading.value = true;
  coreETFTrendErrorMessage.value = "";

  try {
    const { items } = await getCoreETFData({
      start_date,
      end_date
    });
    coreETFTrendItems.value = items ?? [];
  } catch {
    coreETFTrendItems.value = [];
    coreETFTrendErrorMessage.value = "核心 ETF 趋势加载失败，请稍后重试";
  } finally {
    coreETFTrendLoading.value = false;
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

function getCoreETFTrendEndDate() {
  const latestDate = latestCoreETFItem.value?.date;
  return latestDate && getTimestamp(latestDate)
    ? latestDate
    : dayjs().format("YYYY-MM-DD");
}

function resetCoreETFTrendDateRange() {
  const endDate = getCoreETFTrendEndDate();

  coreETFTrendDateRange.value = [
    dayjs(endDate).subtract(1, "year").format("YYYY-MM-DD"),
    endDate
  ];
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
  loadCoreETFData();
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
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-medium">核心 ETF 数据</h2>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="latestCoreETFItem?.date"
            class="text-sm text-text_color_regular"
          >
            数据日期：{{ latestCoreETFItem.date }}
          </span>
          <el-button :loading="coreETFLoading" @click="loadCoreETFData">
            刷新
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="coreETFErrorMessage"
        class="mb-4"
        :title="coreETFErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="coreETFLoading" :rows="4" animated />

      <el-empty v-else-if="!hasCoreETFData" description="暂无核心 ETF 数据" />

      <template v-else>
        <el-row :gutter="16">
          <el-col
            v-for="item in coreETFSummaryItems"
            :key="item.code"
            :xs="24"
            :md="8"
            class="mb-4"
          >
            <div class="rounded-lg border border-(--el-border-color-light) p-4">
              <div class="flex-bc gap-3">
                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="mt-1 text-xs text-text_color_regular">
                    {{ item.code }}
                  </div>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div class="text-xs text-text_color_regular">基金份额</div>
                  <div class="mt-1 flex items-baseline gap-1">
                    <span class="text-xl font-semibold">
                      {{ item.shareYi }}
                    </span>
                    <span class="text-xs text-text_color_regular">亿份</span>
                  </div>
                </div>
                <div>
                  <div class="text-xs text-text_color_regular">单位净值</div>
                  <div class="mt-1 text-xl font-semibold">
                    {{ item.unitNav }}
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="mb-4 flex-bc flex-wrap gap-3">
          <span class="text-sm text-text_color_regular">趋势日期</span>
          <el-date-picker
            v-model="coreETFTrendDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
            @change="loadCoreETFTrendData"
          />
        </div>

        <el-alert
          v-if="coreETFTrendErrorMessage"
          class="mb-4"
          :title="coreETFTrendErrorMessage"
          type="error"
          show-icon
          :closable="false"
        />

        <el-skeleton v-if="coreETFTrendLoading" :rows="8" animated />
        <el-empty
          v-else-if="!hasCoreETFTrendData"
          description="暂无核心 ETF 趋势数据"
        />
        <el-row v-else :gutter="16">
          <el-col :xs="24" :lg="12" class="mb-4">
            <div class="rounded-lg border border-(--el-border-color-light) p-4">
              <div class="mb-3 font-medium">基金份额趋势</div>
              <CoreETFLineChart
                :dates="coreETFTrendDates"
                :series="coreETFShareSeries"
                unit="亿份"
              />
            </div>
          </el-col>
          <el-col :xs="24" :lg="12" class="mb-4">
            <div class="rounded-lg border border-(--el-border-color-light) p-4">
              <div class="mb-3 font-medium">单位净值趋势</div>
              <CoreETFLineChart
                :dates="coreETFTrendDates"
                :series="coreETFUnitNavSeries"
              />
            </div>
          </el-col>
        </el-row>
      </template>
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
