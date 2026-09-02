import { http } from "@/utils/http";

export type DataUpdateType =
  | "core_etf"
  | "market_core"
  | "market_indices"
  | "zhongxin_future"
  | "dividend_low_vol"
  | "money_market"
  | "china_bond_curve"
  | "treasury_futures"
  | "rmb_fx"
  | "us_treasury"
  | "us_fed_funds";

export type DataUpdateTriggerSource = "api" | "scheduler" | "repair_scheduler";

export type DataUpdateStatus =
  | "queued"
  | "running"
  | "success"
  | "partial_success"
  | "failed";

export type DataUpdateRunItem = {
  id: number;
  job_name: string;
  trigger_source: DataUpdateTriggerSource;
  data_type: DataUpdateType;
  target_start_date: string;
  target_end_date: string;
  status: DataUpdateStatus;
  total_targets: number;
  completed_targets: number;
  success_targets: number;
  failed_targets: number;
  error_summary: string | null;
  lease_owner: string | null;
  lease_until: string | null;
  submitted_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type ListDataUpdateRunsParams = {
  data_type?: DataUpdateType;
  status?: DataUpdateStatus;
  trigger_source?: DataUpdateTriggerSource;
  target_start_date?: string;
  target_end_date?: string;
  limit?: number;
  offset?: number;
};

export type ListDataUpdateRunsResult = {
  total: number;
  limit: number;
  offset: number;
  runs: DataUpdateRunItem[];
};

export type SubmitDataUpdateRunRequest = {
  data_type: DataUpdateType;
  start_date: string;
  end_date: string;
};

export type SchedulerScheduleItem = {
  job_name: string;
  cron_expr: string;
  next_run_at: string;
  last_run_at: string | null;
  last_status: string | null;
  lease_owner: string | null;
  lease_until: string | null;
  updated_at: string;
};

export type ListSchedulerSchedulesResult = {
  schedules: SchedulerScheduleItem[];
};

export type MissingDateScanSummary = {
  data_types: number;
  candidates: number;
  missing: number;
  submitted: number;
  skipped_existing: number;
  skipped_unfinished: number;
  failed: number;
};

/** 获取数据更新运行记录 */
export const getDataUpdateRuns = (params?: ListDataUpdateRunsParams) => {
  return http.request<ListDataUpdateRunsResult>(
    "get",
    "/api/dashboard/daily/updates",
    params ? { params } : undefined
  );
};

/** 获取已初始化的定时调度作业状态 */
export const getSchedulerSchedules = () => {
  return http.request<ListSchedulerSchedulesResult>(
    "get",
    "/api/dashboard/daily/schedules"
  );
};

/** 异步提交数据更新任务 */
export const submitDataUpdateRun = (data: SubmitDataUpdateRunRequest) => {
  return http.request<DataUpdateRunItem>(
    "post",
    "/api/dashboard/daily/updates",
    { data }
  );
};

/** 手动触发缺失日期扫描并提交补采任务 */
export const submitMissingDateScan = () => {
  return http.request<MissingDateScanSummary>(
    "post",
    "/api/dashboard/daily/missing-date-scans"
  );
};
