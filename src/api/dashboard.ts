import { http } from "@/utils/http";

export type ZhongxinFutureShortPositionParams = {
  start_date: string;
  end_date: string;
};

export type ZhongxinFutureShortPositionItem = {
  date: string;
  IC_net_short: number;
  IF_net_short: number;
  IH_net_short: number;
  IM_net_short: number;
  total_net_short: number;
  IC_net_short_diff: number;
  IF_net_short_diff: number;
  IH_net_short_diff: number;
  IM_net_short_diff: number;
  total_net_short_diff: number;
};

export type ZhongxinFutureShortPositionResult = {
  items: ZhongxinFutureShortPositionItem[];
};

type ZhongxinFutureDailyItem = {
  date: string;
  source: string;
  quality: "fresh" | "degraded";
  collected_at: string;
  value: Omit<ZhongxinFutureShortPositionItem, "date">;
};

type ZhongxinFutureDailyResult = {
  data_type: "zhongxin_future";
  start_date: string;
  end_date: string;
  items: ZhongxinFutureDailyItem[];
};

export type MarketCoreDataParams = {
  start_date: string;
  end_date: string;
};

export type FearGreedDataParams = {
  start_date: string;
  end_date: string;
};

export type FearGreedDataItem = {
  date: string;
  source: string;
  quality: "fresh" | "degraded";
  collected_at: string;
  index_value: number;
  benchmark_code: "000905";
  ingestion_method: "scheduled_api" | "excel_import";
  source_url: string | null;
  source_file: string | null;
  source_update_time: string | null;
  upstream_client_version: string | null;
  methodology_version: string | null;
};

export type FearGreedDataResult = {
  items: FearGreedDataItem[];
};

type FearGreedDailyItem = {
  date: string;
  source: string;
  quality: "fresh" | "degraded";
  collected_at: string;
  value: Omit<
    FearGreedDataItem,
    "date" | "source" | "quality" | "collected_at"
  >;
};

type FearGreedDailyResult = {
  data_type: "fear_greed_index";
  start_date: string;
  end_date: string;
  items: FearGreedDailyItem[];
};

export type MarketCoreSources = {
  turnover: string;
  limit_counts: string;
};

export type MarketCoreDataItem = {
  date: string;
  source: string;
  quality: "fresh";
  collected_at: string;
  sources: MarketCoreSources;
  exclude_st: boolean;
  limit_up_count: number;
  sh_amount_yuan: number;
  sz_amount_yuan: number;
  total_amount_yi: string;
  limit_down_count: number;
  limit_total_count: number;
  total_amount_yuan: number;
};

export type MarketCoreDataResult = {
  items: MarketCoreDataItem[];
};

type MarketCoreDailyItem = {
  date: string;
  source: string;
  quality: "fresh";
  collected_at: string;
  value: Omit<
    MarketCoreDataItem,
    "date" | "source" | "quality" | "collected_at"
  >;
};

type MarketCoreDailyResult = {
  data_type: "market_core";
  start_date: string;
  end_date: string;
  items: MarketCoreDailyItem[];
};

export type CoreETFDataParams = {
  start_date: string;
  end_date: string;
};

export type DividendLowVolDataParams = {
  start_date: string;
  end_date: string;
};

export type CoreETFDataQuality = "fresh" | "degraded";

export type CoreETFItem = {
  name: string;
  share: number;
  share_yi: number;
  share_stat_date: string;
  unit_nav: number;
  accumulated_nav: number | null;
  nav_date: string;
};

export type CoreETFDataItem = {
  date: string;
  source: string;
  quality: CoreETFDataQuality;
  collected_at: string;
  value: Record<string, CoreETFItem>;
};

export type CoreETFDataResult = {
  data_type: "core_etf";
  start_date: string;
  end_date: string;
  items: CoreETFDataItem[];
};

export type DividendLowVolSources = {
  index_level: string;
  dividend_yield: string;
};

export type DividendLowVolDataItem = {
  date: string;
  source: string;
  quality: "fresh";
  collected_at: string;
  index_code: string;
  index_short_name: string;
  index_full_name: string;
  index_level: number;
  index_level_date: string;
  dividend_yield_percent: number;
  dividend_yield_date: string;
  dividend_yield_basis: "D/P1";
  sources: DividendLowVolSources;
};

type DividendLowVolDailyItem = {
  date: string;
  source: string;
  quality: "fresh";
  collected_at: string;
  value: Omit<
    DividendLowVolDataItem,
    "date" | "source" | "quality" | "collected_at"
  >;
};

type DividendLowVolDailyResult = {
  data_type: "dividend_low_vol";
  start_date: string;
  end_date: string;
  items: DividendLowVolDailyItem[];
};

export type DividendLowVolDataResult = {
  items: DividendLowVolDataItem[];
};

export type MarketIndexMarket = "CN" | "HK";
export type MarketIndexStatus = "open" | "closed";

export type MarketIndexQuote = {
  code: string;
  name: string;
  market: MarketIndexMarket;
  market_status: MarketIndexStatus;
  trade_date: string | null;
  close: number | null;
  change_amount: number | null;
  change_percent: number | null;
  source: string | null;
};

export type MarketIndicesDataParams = {
  start_date: string;
  end_date: string;
};

export type MarketIndicesDataItem = {
  date: string;
  source: string;
  quality: "fresh" | "degraded";
  collected_at: string;
  indices: Record<string, MarketIndexQuote>;
};

type MarketIndicesDailyItem = Omit<MarketIndicesDataItem, "indices"> & {
  value: { indices: Record<string, MarketIndexQuote> };
};

type MarketIndicesDailyResult = {
  data_type: "market_indices";
  start_date: string;
  end_date: string;
  items: MarketIndicesDailyItem[];
};

export type MarketIndicesDataResult = {
  items: MarketIndicesDataItem[];
};

export type MoneySupplyQueryParams = {
  start_month: string;
  end_month: string;
  revisions?: "latest" | "all";
};

export type MoneySupplyItem = {
  month: string;
  m1_balance: string | null;
  m2_balance: string | null;
  m1_yoy: number | null;
  m2_yoy: number | null;
  m1_m2_yoy_gap: number | null;
  m1_comparable: boolean;
  m1_yoy_source: "derived" | "official_reported" | null;
  m1_revision: number | null;
  m2_revision: number | null;
  m1_methodology_version: string | null;
  m2_methodology_version: string | null;
  published_at: string | null;
  collected_at: string | null;
  source: string | null;
  source_url: string | null;
  quality: "fresh" | "degraded" | null;
};

export type MoneySupplyResult = {
  start_month: string;
  end_month: string;
  revisions: "latest" | "all";
  items: MoneySupplyItem[];
};

export type MonthlySeriesObservation = {
  value: string;
  revision: number;
  methodology_version: string;
  published_at: string | null;
  collected_at: string;
  source: string;
  source_url: string;
  quality: "fresh" | "degraded";
  reported_yoy_percent: string | null;
};

export type MonthlySeries = {
  latest: MonthlySeriesObservation | null;
  revisions: MonthlySeriesObservation[];
};

export type MonthlyFlowSeries = {
  ytd: MonthlySeries;
  monthly_value: string | null;
  derivation_state: "derived_from_ytd" | "missing_base" | "missing";
};

export type MacroLiquidityItem = {
  month: string;
  m1: MonthlySeries;
  m2: MonthlySeries;
  m1_yoy: number | null;
  m2_yoy: number | null;
  m1_m2_yoy_gap: number | null;
  m1_comparable: boolean;
  m1_yoy_source: "derived" | "official_reported" | null;
  social_financing_stock: MonthlySeries;
  social_financing_increment: MonthlyFlowSeries;
  enterprise_medium_long_term_loan_increment: MonthlyFlowSeries;
};

export type MacroLiquidityResult = {
  start_month: string;
  end_month: string;
  revisions: "latest" | "all";
  unit: "亿元";
  items: MacroLiquidityItem[];
};

export type MacroMarketObservation = {
  date: string;
  value: string;
  source: string;
  quality: "fresh" | "degraded";
  collected_at: string;
  source_url: string | null;
  published_at: string | null;
  components: Record<string, string>;
  metadata: Record<string, string | number | null>;
};

export type MacroMarketSeries = {
  code: string;
  name: string;
  category: "funding" | "china_rates" | "rates_trading" | "credit" | "external";
  unit: "%" | "bp" | "price" | "CNY/USD";
  methodology: string;
  observations: MacroMarketObservation[];
};

export type MacroMarketResult = {
  start_date: string;
  end_date: string;
  series: MacroMarketSeries[];
};

export type DividendYieldSpreadParams = {
  start_date: string;
  end_date: string;
};

/** 派生序列：红利低波股息率(D/P1) - 中债 10Y 收益率，单位为百分点。 */
export type DividendYieldSpreadSeries = {
  code: string;
  name: string;
  category: string;
  unit: string;
  methodology: string;
  observations: MacroMarketObservation[];
};

export type DividendYieldSpreadResult = {
  start_date: string;
  end_date: string;
  series: DividendYieldSpreadSeries;
};

export type MonthlyUpdateRun = {
  id: number;
  job_name: string;
  trigger_source: "api" | "scheduler";
  target_start_month: string;
  target_end_month: string;
  status: "queued" | "running" | "success" | "partial_success" | "failed";
  total_targets: number;
  completed_targets: number;
  written_targets: number;
  revised_targets: number;
  unchanged_targets: number;
  degraded_targets: number;
  pending_targets: number;
  failed_targets: number;
  error_summary: string | null;
  lease_owner: string | null;
  lease_until: string | null;
  submitted_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type MonthlyUpdateRunList = {
  total: number;
  limit: number;
  offset: number;
  runs: MonthlyUpdateRun[];
};

export type CreditIndicatorUpdateResult = {
  runs: MonthlyUpdateRun[];
  task_urls: string[];
};

/** 月度 M1/M2 数据；同比和增速差由后端按口径可比性计算。 */
export const getMoneySupply = (params: MoneySupplyQueryParams) =>
  http.request<MoneySupplyResult>(
    "get",
    "/api/dashboard/monthly/money-supply",
    {
      params: { ...params, revisions: params.revisions ?? "latest" }
    }
  );

/** 月度宏观流动性聚合数据；流量月值由后端基于官方累计值派生。 */
export const getMacroLiquidity = (params: MoneySupplyQueryParams) =>
  http.request<MacroLiquidityResult>(
    "get",
    "/api/dashboard/monthly/macro-liquidity",
    {
      params: { ...params, revisions: params.revisions ?? "latest" }
    }
  );

/** 日频资金、利率、信用、汇率与海外利率聚合数据。 */
export const getMacroMarket = (params: {
  start_date: string;
  end_date: string;
}) =>
  http.request<MacroMarketResult>("get", "/api/dashboard/daily/macro-markets", {
    params
  });

/** 派生指标：红利低波股息率(D/P1) - 中债 10Y 收益率（单位：百分点）。 */
export const getDividendYieldSpread = (params: DividendYieldSpreadParams) =>
  http.request<DividendYieldSpreadResult>(
    "get",
    "/api/dashboard/daily/dividend-yield-spread",
    { params }
  );

export const submitMoneySupplyUpdate = (params: {
  start_month: string;
  end_month: string;
}) =>
  http.request<MonthlyUpdateRun>(
    "post",
    "/api/dashboard/monthly/money-supply/updates",
    { data: params }
  );

export const submitCreditIndicatorUpdate = (params: {
  start_month: string;
  end_month: string;
}) =>
  http.request<CreditIndicatorUpdateResult>(
    "post",
    "/api/dashboard/monthly/credit-indicators/updates",
    { data: params }
  );

export const getCreditIndicatorUpdates = (params?: {
  status?: MonthlyUpdateRun["status"];
  trigger_source?: MonthlyUpdateRun["trigger_source"];
  limit?: number;
  offset?: number;
}) =>
  http.request<MonthlyUpdateRunList>(
    "get",
    "/api/dashboard/monthly/credit-indicators/updates",
    { params }
  );

export const getCreditIndicatorUpdate = (runId: number) =>
  http.request<MonthlyUpdateRun>(
    "get",
    `/api/dashboard/monthly/credit-indicators/updates/${runId}`
  );

/** 中信期指空单数据 */
export const getZhongxinFutureShortPosition = async (
  params: ZhongxinFutureShortPositionParams
) => {
  const result = await http.request<ZhongxinFutureDailyResult>(
    "get",
    "/api/dashboard/daily",
    { params: { ...params, data_type: "zhongxin_future" } }
  );

  return {
    items: result.items.map(item => ({
      date: item.date,
      ...item.value
    }))
  } satisfies ZhongxinFutureShortPositionResult;
};

/** 大盘核心数据：适配日度数据面板的 market_core 快照响应。 */
export const getMarketCoreData = async (params: MarketCoreDataParams) => {
  const result = await http.request<MarketCoreDailyResult>(
    "get",
    "/api/dashboard/daily",
    { params: { ...params, data_type: "market_core" } }
  );

  return {
    items: result.items.map(item => ({
      date: item.date,
      source: item.source,
      quality: item.quality,
      collected_at: item.collected_at,
      ...item.value
    }))
  } satisfies MarketCoreDataResult;
};

/** A 股恐惧贪婪指数：适配日度数据面板的 fear_greed_index 快照响应。 */
export const getFearGreedData = async (params: FearGreedDataParams) => {
  const result = await http.request<FearGreedDailyResult>(
    "get",
    "/api/dashboard/daily",
    { params: { ...params, data_type: "fear_greed_index" } }
  );

  return {
    items: result.items.map(item => ({
      date: item.date,
      source: item.source,
      quality: item.quality,
      collected_at: item.collected_at,
      ...item.value
    }))
  } satisfies FearGreedDataResult;
};

/** 核心 ETF 份额与净值数据 */
export const getCoreETFData = (params: CoreETFDataParams) => {
  return http.request<CoreETFDataResult>("get", "/api/dashboard/daily", {
    params: { ...params, data_type: "core_etf" }
  });
};

/** 红利低波指数点位与 D/P1 股息率 */
export const getDividendLowVolData = async (
  params: DividendLowVolDataParams
) => {
  const result = await http.request<DividendLowVolDailyResult>(
    "get",
    "/api/dashboard/daily",
    { params: { ...params, data_type: "dividend_low_vol" } }
  );

  return {
    items: result.items.map(item => ({
      date: item.date,
      source: item.source,
      quality: item.quality,
      collected_at: item.collected_at,
      ...item.value
    }))
  } satisfies DividendLowVolDataResult;
};

/** 六项核心 A 股与香港市场指数日度行情。 */
export const getMarketIndicesData = async (params: MarketIndicesDataParams) => {
  const result = await http.request<MarketIndicesDailyResult>(
    "get",
    "/api/dashboard/daily",
    { params: { ...params, data_type: "market_indices" } }
  );

  return {
    items: result.items.map(item => ({
      date: item.date,
      source: item.source,
      quality: item.quality,
      collected_at: item.collected_at,
      indices: item.value.indices
    }))
  } satisfies MarketIndicesDataResult;
};
