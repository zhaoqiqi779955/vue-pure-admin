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

export const submitMoneySupplyUpdate = (params: {
  start_month: string;
  end_month: string;
}) =>
  http.request<MonthlyUpdateRun>(
    "post",
    "/api/dashboard/monthly/money-supply/updates",
    { data: params }
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
