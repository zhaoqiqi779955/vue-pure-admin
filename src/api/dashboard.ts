import { http } from "@/utils/http";

export type ZhongxinFutureShortPositionParams = {
  start_date?: string;
  end_date?: string;
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

export type MarketCoreDataParams = {
  start_date?: string;
  end_date?: string;
};

export type MarketCoreSources = {
  turnover: string;
  limit_counts: string;
};

export type MarketCoreDataItem = {
  date: string;
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

export type CoreETFDataParams = {
  start_date?: string;
  end_date?: string;
};

export type CoreETFItem = {
  name: string;
  share: number;
  share_yi: number;
  share_stat_date: string;
  unit_nav: number;
  accumulated_nav?: number | null;
  nav_date: string;
};

export type CoreETFDataItem = {
  date: string;
  etfs: Record<string, CoreETFItem>;
};

export type CoreETFDataResult = {
  items: CoreETFDataItem[];
};

/** 中信期指空单数据 */
export const getZhongxinFutureShortPosition = (
  params?: ZhongxinFutureShortPositionParams
) => {
  return http.request<ZhongxinFutureShortPositionResult>(
    "get",
    "/api/data/future/zhongxin",
    params ? { params } : undefined
  );
};

/** 大盘核心数据 */
export const getMarketCoreData = (params?: MarketCoreDataParams) => {
  return http.request<MarketCoreDataResult>(
    "get",
    "/api/data/market/core",
    params ? { params } : undefined
  );
};

/** 核心 ETF 份额与净值数据 */
export const getCoreETFData = (params?: CoreETFDataParams) => {
  return http.request<CoreETFDataResult>(
    "get",
    "/api/data/etf/core",
    params ? { params } : undefined
  );
};
