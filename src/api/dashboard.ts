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
