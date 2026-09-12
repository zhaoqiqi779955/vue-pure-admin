<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  getCoreETFData,
  getDividendLowVolData,
  getDividendYieldSpread,
  getFearGreedData,
  getMarketCoreData,
  getMarketIndicesData,
  getZhongxinFutureShortPosition,
  type CoreETFDataItem,
  type DividendLowVolDataItem,
  type FearGreedDataItem,
  type MacroMarketObservation,
  type MarketCoreDataItem,
  type MarketIndicesDataItem,
  type ZhongxinFutureShortPositionItem
} from "@/api/dashboard";
import CumulativeTrendChart, {
  type TrendSeriesItem
} from "./components/CumulativeTrendChart.vue";
import CoreETFLineChart, {
  type CoreETFLineSeriesItem
} from "./components/CoreETFLineChart.vue";
import DividendLowVolTrendChart, {
  type DividendLowVolTrendSeriesItem
} from "./components/DividendLowVolTrendChart.vue";
import FearGreedGauge from "./components/FearGreedGauge.vue";
import FearGreedTrendChart from "./components/FearGreedTrendChart.vue";
import MarketCoreTrendChart from "./components/MarketCoreTrendChart.vue";
import ShortBarChart, {
  type ShortBarChartItem
} from "./components/ShortBarChart.vue";
import {
  alignFearGreedTrend,
  getFearGreedBand,
  getLatestFearGreedItem,
  isFearGreedStale
} from "./fearGreed";

defineOptions({
  name: "DashboardZhongxinShort"
});
const { t } = useI18n();

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
type DividendLowVolMetricConfig = {
  field: "index_level" | "dividend_yield_percent";
  label: string;
  unit: string;
  color: string;
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
const fearGreedLoading = ref(false);
const fearGreedErrorMessage = ref("");
const benchmarkErrorMessage = ref("");
const fearGreedItems = ref<FearGreedDataItem[]>([]);
const marketIndicesItems = ref<MarketIndicesDataItem[]>([]);
const fearGreedRangeMode = ref<"year" | "all" | "custom">("year");
const dividendLowVolLoading = ref(false);
const dividendLowVolErrorMessage = ref("");
const latestDividendLowVolItem = ref<DividendLowVolDataItem>();
const dividendLowVolTrendDialogVisible = ref(false);
const dividendLowVolTrendLoading = ref(false);
const dividendLowVolTrendErrorMessage = ref("");
const dividendLowVolTrendItems = ref<DividendLowVolDataItem[]>([]);
const dividendYieldSpreadLoading = ref(false);
const dividendYieldSpreadErrorMessage = ref("");
const dividendYieldSpreadObservations = ref<MacroMarketObservation[]>([]);
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
const fearGreedDateRange = ref<[string, string]>([
  dayjs().subtract(365, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);
const dividendLowVolTrendDateRange = ref<[string, string]>([
  dayjs().subtract(365, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);
const coreETFTrendDateRange = ref<[string, string]>([
  dayjs().subtract(365, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);
const dividendYieldSpreadDateRange = ref<[string, string]>([
  dayjs().subtract(365, "day").format("YYYY-MM-DD"),
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

const dividendLowVolMetrics = [
  {
    field: "index_level",
    label: "指数点位",
    unit: "点",
    color: "#c45656"
  },
  {
    field: "dividend_yield_percent",
    label: "D/P1 股息率",
    unit: "%",
    color: "#e6a23c"
  }
] as const satisfies ReadonlyArray<DividendLowVolMetricConfig>;

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

function getLatestDividendLowVolItem(items: DividendLowVolDataItem[]) {
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

function formatMetricValue(value: unknown, fractionDigits = 2) {
  const numericValue = getFiniteValue(value);
  if (numericValue === null) return "-";

  return numericValue.toLocaleString(undefined, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  });
}

function getCoreETFName(code: string) {
  const items = [
    latestCoreETFItem.value,
    ...sortedCoreETFTrendItems.value
  ].filter(Boolean) as CoreETFDataItem[];

  for (const item of items) {
    const name = item.value?.[code]?.name;
    if (name) return name;
  }

  return code;
}

function getOrderedCoreETFCodes(items: CoreETFDataItem[]) {
  const codeSet = new Set<string>();

  items.forEach(item => {
    Object.keys(item.value ?? {}).forEach(code => codeSet.add(code));
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
      getFiniteValue(item.value?.[code]?.[field])
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
const latestFearGreedItem = computed(() =>
  getLatestFearGreedItem(fearGreedItems.value)
);
const fearGreedTrendPoints = computed(() =>
  alignFearGreedTrend(fearGreedItems.value, marketIndicesItems.value)
);
const hasFearGreedData = computed(() => Boolean(latestFearGreedItem.value));
const hasFearGreedTrendData = computed(() =>
  fearGreedTrendPoints.value.some(item => item.fearValue !== null)
);
const hasCSI500Data = computed(() =>
  fearGreedTrendPoints.value.some(item => item.csi500Close !== null)
);
const fearGreedBand = computed(() =>
  getFearGreedBand(latestFearGreedItem.value?.index_value)
);
const fearGreedBandLabel = computed(() =>
  fearGreedBand.value
    ? t(`fearGreed.bands.${fearGreedBand.value}`)
    : t("fearGreed.states.unavailable")
);
const fearGreedIsStale = computed(() =>
  isFearGreedStale(latestFearGreedItem.value?.date, fearGreedTrendPoints.value)
);
const fearGreedChartTexts = computed(() => ({
  fearGreed: t("fearGreed.chart.index"),
  csi500: t("fearGreed.chart.csi500"),
  indexSource: t("fearGreed.chart.indexSource"),
  benchmarkSource: t("fearGreed.chart.benchmarkSource"),
  unavailable: t("fearGreed.states.unavailable")
}));
const hasDividendLowVolData = computed(() =>
  Boolean(latestDividendLowVolItem.value)
);
const hasCoreETFData = computed(
  () => Object.keys(latestCoreETFItem.value?.value ?? {}).length > 0
);

const marketCoreMetricCards = computed(() =>
  marketCoreMetrics.map(metric => ({
    ...metric,
    value: formatMarketCoreValue(latestMarketCoreItem.value, metric.field)
  }))
);

function getFearGreedBandTagType() {
  switch (fearGreedBand.value) {
    case "extremeFear":
    case "fear":
      return "danger";
    case "slightFear":
      return "warning";
    case "slightGreed":
    case "greed":
      return "success";
    default:
      return "info";
  }
}

function getFearGreedSource(item: FearGreedDataItem | undefined) {
  if (!item) return t("fearGreed.states.unavailable");
  return item.source_url || item.source_file || item.source;
}

const dividendLowVolMetricCards = computed(() =>
  dividendLowVolMetrics.map(metric => ({
    ...metric,
    value: formatMetricValue(
      latestDividendLowVolItem.value?.[metric.field],
      metric.field === "index_level" ? 2 : 2
    )
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

const sortedDividendLowVolTrendItems = computed(() =>
  [...dividendLowVolTrendItems.value]
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

const dividendLowVolTrendDates = computed(() =>
  sortedDividendLowVolTrendItems.value.map(item => item.date)
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
const dividendLowVolTrendSeries = computed<DividendLowVolTrendSeriesItem[]>(
  () => [
    {
      name: "指数点位",
      unit: "点",
      yAxisIndex: 0,
      data: sortedDividendLowVolTrendItems.value.map(item =>
        getFiniteValue(item.index_level)
      )
    },
    {
      name: "D/P1 股息率",
      unit: "%",
      yAxisIndex: 1,
      data: sortedDividendLowVolTrendItems.value.map(item =>
        getFiniteValue(item.dividend_yield_percent)
      )
    }
  ]
);
const hasDividendLowVolTrendData = computed(
  () => sortedDividendLowVolTrendItems.value.length > 0
);
const sortedDividendYieldSpreadObservations = computed(() =>
  [...dividendYieldSpreadObservations.value]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(prev.date) - getTimestamp(next.date))
);
const latestDividendYieldSpreadObservation = computed(
  () =>
    sortedDividendYieldSpreadObservations.value[
      sortedDividendYieldSpreadObservations.value.length - 1
    ]
);
const hasDividendYieldSpreadData = computed(() =>
  Boolean(latestDividendYieldSpreadObservation.value)
);
const dividendYieldSpreadLatestValue = computed(() =>
  formatMetricValue(latestDividendYieldSpreadObservation.value?.value, 4)
);
const dividendYieldSpreadDates = computed(() =>
  sortedDividendYieldSpreadObservations.value.map(item => item.date)
);
const dividendYieldSpreadSeries = computed<CoreETFLineSeriesItem[]>(() => [
  {
    name: "股息率-中债10Y 利差",
    data: sortedDividendYieldSpreadObservations.value.map(item =>
      getFiniteValue(item.value)
    )
  }
]);
const coreETFCodes = computed(() =>
  getOrderedCoreETFCodes(
    [latestCoreETFItem.value, ...sortedCoreETFTrendItems.value].filter(
      Boolean
    ) as CoreETFDataItem[]
  )
);
const coreETFSummaryItems = computed<CoreETFSummaryItem[]>(() =>
  coreETFCodes.value.map(code => {
    const etf = latestCoreETFItem.value?.value?.[code];

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
    const end_date = dayjs().format("YYYY-MM-DD");
    const start_date = dayjs(end_date)
      .subtract(365, "day")
      .format("YYYY-MM-DD");
    const { items } = await getZhongxinFutureShortPosition({
      start_date,
      end_date
    });
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
    const end_date = dayjs().format("YYYY-MM-DD");
    const start_date = dayjs(end_date)
      .subtract(365, "day")
      .format("YYYY-MM-DD");
    const { items } = await getMarketCoreData({ start_date, end_date });
    latestMarketCoreItem.value = getLatestMarketCoreItem(items ?? []);
  } catch {
    latestMarketCoreItem.value = undefined;
    marketCoreErrorMessage.value = "大盘核心数据加载失败，请稍后重试";
  } finally {
    marketCoreLoading.value = false;
  }
}

async function loadFearGreedData() {
  const [start_date, end_date] = fearGreedDateRange.value;
  fearGreedLoading.value = true;
  fearGreedErrorMessage.value = "";
  benchmarkErrorMessage.value = "";

  const [fearGreedResult, marketIndicesResult] = await Promise.allSettled([
    getFearGreedData({ start_date, end_date }),
    getMarketIndicesData({ start_date, end_date })
  ]);

  if (fearGreedResult.status === "fulfilled") {
    fearGreedItems.value = fearGreedResult.value.items ?? [];
  } else {
    fearGreedItems.value = [];
    fearGreedErrorMessage.value = t("fearGreed.states.loadError");
  }

  if (marketIndicesResult.status === "fulfilled") {
    marketIndicesItems.value = marketIndicesResult.value.items ?? [];
  } else {
    marketIndicesItems.value = [];
    benchmarkErrorMessage.value = t("fearGreed.states.benchmarkError");
  }

  fearGreedLoading.value = false;
}

function setFearGreedRangeMode(mode: unknown) {
  if (mode !== "year" && mode !== "all") return;

  const endDate = dayjs().format("YYYY-MM-DD");
  fearGreedRangeMode.value = mode;
  fearGreedDateRange.value = [
    mode === "all"
      ? "2021-09-06"
      : dayjs(endDate).subtract(365, "day").format("YYYY-MM-DD"),
    endDate
  ];
  loadFearGreedData();
}

function onFearGreedDateRangeChange() {
  fearGreedRangeMode.value = "custom";
  loadFearGreedData();
}

async function loadDividendLowVolData() {
  dividendLowVolLoading.value = true;
  dividendLowVolErrorMessage.value = "";

  try {
    const end_date = dayjs().format("YYYY-MM-DD");
    const start_date = dayjs(end_date)
      .subtract(365, "day")
      .format("YYYY-MM-DD");
    const { items } = await getDividendLowVolData({ start_date, end_date });
    latestDividendLowVolItem.value = getLatestDividendLowVolItem(items ?? []);
  } catch {
    latestDividendLowVolItem.value = undefined;
    dividendLowVolErrorMessage.value = "红利低波数据加载失败，请稍后重试";
  } finally {
    dividendLowVolLoading.value = false;
  }
}

async function loadDividendYieldSpreadData() {
  dividendYieldSpreadLoading.value = true;
  dividendYieldSpreadErrorMessage.value = "";

  try {
    const [start_date, end_date] = dividendYieldSpreadDateRange.value;
    const { series } = await getDividendYieldSpread({ start_date, end_date });
    dividendYieldSpreadObservations.value = series?.observations ?? [];
  } catch {
    dividendYieldSpreadObservations.value = [];
    dividendYieldSpreadErrorMessage.value = "股债利差数据加载失败，请稍后重试";
  } finally {
    dividendYieldSpreadLoading.value = false;
  }
}

function refreshDividendLowVolSection() {
  loadDividendLowVolData();
  loadDividendYieldSpreadData();
}

async function loadCoreETFData() {
  coreETFLoading.value = true;
  coreETFErrorMessage.value = "";

  try {
    const end_date = dayjs().format("YYYY-MM-DD");
    const start_date = dayjs(end_date)
      .subtract(365, "day")
      .format("YYYY-MM-DD");
    const { items } = await getCoreETFData({ start_date, end_date });
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

async function loadDividendLowVolTrendData() {
  const [start_date, end_date] = dividendLowVolTrendDateRange.value;

  dividendLowVolTrendLoading.value = true;
  dividendLowVolTrendErrorMessage.value = "";

  try {
    const { items } = await getDividendLowVolData({
      start_date,
      end_date
    });
    dividendLowVolTrendItems.value = items ?? [];
  } catch {
    dividendLowVolTrendItems.value = [];
    dividendLowVolTrendErrorMessage.value = "红利低波趋势加载失败，请稍后重试";
  } finally {
    dividendLowVolTrendLoading.value = false;
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

function getDividendLowVolTrendEndDate() {
  const latestDate = latestDividendLowVolItem.value?.date;
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
    dayjs(endDate).subtract(365, "day").format("YYYY-MM-DD"),
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

function openDividendLowVolTrendDialog() {
  const endDate = getDividendLowVolTrendEndDate();

  dividendLowVolTrendDateRange.value = [
    dayjs(endDate).subtract(365, "day").format("YYYY-MM-DD"),
    endDate
  ];
  dividendLowVolTrendDialogVisible.value = true;
  loadDividendLowVolTrendData();
}

onMounted(() => {
  loadMarketCoreData();
  loadFearGreedData();
  loadDividendLowVolData();
  loadDividendYieldSpreadData();
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
          <h2 class="text-lg font-medium">{{ t("fearGreed.title") }}</h2>
          <p class="mt-1 text-sm text-text_color_regular">
            {{ t("fearGreed.subtitle") }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="latestFearGreedItem?.date"
            class="text-sm text-text_color_regular"
          >
            {{ t("fearGreed.date", { date: latestFearGreedItem.date }) }}
          </span>
          <el-button :loading="fearGreedLoading" @click="loadFearGreedData">
            {{ t("fearGreed.refresh") }}
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="fearGreedErrorMessage"
        class="mb-4"
        :title="fearGreedErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="fearGreedLoading" :rows="8" animated />

      <el-empty
        v-else-if="!hasFearGreedData"
        :description="t('fearGreed.states.empty')"
      />

      <template v-else>
        <el-alert
          v-if="fearGreedIsStale"
          class="mb-4"
          :title="t('fearGreed.states.stale')"
          type="warning"
          show-icon
          :closable="false"
        />
        <el-alert
          v-if="benchmarkErrorMessage || !hasCSI500Data"
          class="mb-4"
          :title="benchmarkErrorMessage || t('fearGreed.states.benchmarkEmpty')"
          type="warning"
          show-icon
          :closable="false"
        />

        <el-row :gutter="16" class="mb-4">
          <el-col :xs="24" :md="10">
            <div class="rounded-lg border border-(--el-border-color-light) p-4">
              <div class="flex-bc gap-3">
                <span class="text-sm text-text_color_regular">
                  {{ t("fearGreed.latest") }}
                </span>
                <el-tag :type="getFearGreedBandTagType()" effect="light">
                  {{ fearGreedBandLabel }}
                </el-tag>
              </div>
              <FearGreedGauge
                class="mt-2"
                :value="latestFearGreedItem?.index_value ?? 0"
                :label="fearGreedBandLabel"
                :unit="t('fearGreed.unit')"
              />
              <div class="mt-3 grid gap-1 text-xs text-text_color_regular">
                <span>
                  {{
                    t("fearGreed.source", {
                      source: getFearGreedSource(latestFearGreedItem)
                    })
                  }}
                </span>
                <span>
                  {{
                    t("fearGreed.collectedAt", {
                      time:
                        latestFearGreedItem?.collected_at ||
                        t("fearGreed.states.unavailable")
                    })
                  }}
                </span>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="rounded-lg border border-(--el-border-color-light) p-4">
          <div class="mb-3 flex-bc flex-wrap gap-3">
            <div class="font-medium">{{ t("fearGreed.chart.title") }}</div>
            <div class="flex flex-wrap items-center gap-3">
              <el-radio-group
                :model-value="fearGreedRangeMode"
                @change="setFearGreedRangeMode"
              >
                <el-radio-button value="year">
                  {{ t("fearGreed.range.year") }}
                </el-radio-button>
                <el-radio-button value="all">
                  {{ t("fearGreed.range.all") }}
                </el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="fearGreedDateRange"
                type="daterange"
                :range-separator="t('fearGreed.range.separator')"
                :start-placeholder="t('fearGreed.range.start')"
                :end-placeholder="t('fearGreed.range.end')"
                value-format="YYYY-MM-DD"
                :clearable="false"
                @change="onFearGreedDateRangeChange"
              />
            </div>
          </div>
          <el-empty
            v-if="!hasFearGreedTrendData"
            :description="t('fearGreed.states.chartEmpty')"
          />
          <FearGreedTrendChart
            v-else
            :points="fearGreedTrendPoints"
            :texts="fearGreedChartTexts"
          />
        </div>
      </template>
    </el-card>

    <el-card shadow="never" class="mb-4">
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-medium">红利低波指数</h2>
          <p class="mt-1 text-sm text-text_color_regular">
            展示中证红利低波动指数 H30269 点位、D/P1 股息率，及其与中债 10Y
            的股债利差。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            v-if="latestDividendLowVolItem?.date"
            class="text-sm text-text_color_regular"
          >
            数据日期：{{ latestDividendLowVolItem.date }}
          </span>
          <el-button
            :loading="dividendLowVolLoading || dividendYieldSpreadLoading"
            @click="refreshDividendLowVolSection"
          >
            刷新
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="dividendLowVolErrorMessage"
        class="mb-4"
        :title="dividendLowVolErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="dividendLowVolLoading" :rows="3" animated />

      <el-empty
        v-else-if="!hasDividendLowVolData"
        description="暂无红利低波数据"
      />

      <el-row v-else :gutter="16">
        <el-col
          v-for="metric in dividendLowVolMetricCards"
          :key="metric.field"
          :xs="24"
          :md="12"
          class="mb-4"
        >
          <button
            type="button"
            :aria-label="`查看红利低波趋势：${metric.label}`"
            class="market-core-card w-full cursor-pointer rounded-lg border border-(--el-border-color-light) bg-transparent p-4 text-left transition-all hover:border-(--el-color-danger)"
            @click="openDividendLowVolTrendDialog"
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
          </button>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        股债利差（红利低波股息率 - 中债 10Y）
      </el-divider>

      <el-alert
        v-if="dividendYieldSpreadErrorMessage"
        class="mb-4"
        :title="dividendYieldSpreadErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="dividendYieldSpreadLoading" :rows="6" animated />

      <el-empty
        v-else-if="!hasDividendYieldSpreadData"
        description="暂无股债利差数据"
      />

      <template v-else>
        <el-row :gutter="16">
          <el-col :xs="24" :md="12" class="mb-4">
            <div class="rounded-lg border border-(--el-border-color-light) p-4">
              <div class="flex-bc">
                <span class="text-sm text-text_color_regular">
                  股息率 - 中债 10Y
                </span>
                <span
                  class="inline-block size-2.5 rounded-full"
                  :style="{ backgroundColor: '#409eff' }"
                />
              </div>
              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-2xl font-semibold">
                  {{ dividendYieldSpreadLatestValue }}
                </span>
                <span class="text-sm text-text_color_regular">个百分点</span>
              </div>
              <div
                v-if="latestDividendYieldSpreadObservation?.date"
                class="mt-2 text-xs text-text_color_regular"
              >
                数据日期：{{ latestDividendYieldSpreadObservation.date }}
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="rounded-lg border border-(--el-border-color-light) p-4">
          <div class="mb-3 flex-bc flex-wrap gap-3">
            <div class="font-medium">股债利差趋势</div>
            <el-date-picker
              v-model="dividendYieldSpreadDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :clearable="false"
              @change="loadDividendYieldSpreadData"
            />
          </div>
          <CoreETFLineChart
            :dates="dividendYieldSpreadDates"
            :series="dividendYieldSpreadSeries"
            unit="个百分点"
          />
        </div>
      </template>
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

    <el-dialog
      v-model="dividendLowVolTrendDialogVisible"
      title="红利低波指数趋势"
      width="80%"
      top="6vh"
    >
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <span class="text-sm text-text_color_regular">
          默认展示最新数据日期往前一年，可手动输入时间范围。
        </span>
        <el-date-picker
          v-model="dividendLowVolTrendDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="loadDividendLowVolTrendData"
        />
      </div>

      <el-alert
        v-if="dividendLowVolTrendErrorMessage"
        class="mb-4"
        :title="dividendLowVolTrendErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="dividendLowVolTrendLoading" :rows="8" animated />
      <el-empty
        v-else-if="!hasDividendLowVolTrendData"
        description="暂无红利低波趋势数据"
      />
      <DividendLowVolTrendChart
        v-else
        :dates="dividendLowVolTrendDates"
        :series="dividendLowVolTrendSeries"
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
