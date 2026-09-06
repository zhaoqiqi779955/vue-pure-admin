import { stringify } from "qs";
import { http } from "@/utils/http";

export type HogCycleState =
  | "S0"
  | "S1"
  | "S2"
  | "S3"
  | "S4"
  | "S5"
  | "insufficient_data";

export type HogGateState = "passed" | "failed" | "insufficient_data";

export type HogConditionState = "pass" | "fail" | "insufficient";

export type HogFrequency = "daily" | "weekly" | "monthly" | "quarterly";

export type HogPeriodType = "day" | "week" | "month" | "quarter";

export type HogDimension =
  | "price"
  | "capacity"
  | "feed"
  | "supply"
  | "equity"
  | "cost"
  | "commercial";

export type HogValueSemantics = "level" | "index" | "percent";

export type HogDirection = "down_is_tight" | "up_is_tight" | "neutral";

export type HogGateRole =
  | "gate_a_mandatory"
  | "gate_a_optional"
  | "gate_b_mandatory"
  | "gate_b_optional"
  | "context";

export type HogQuality = "fresh" | "degraded";

export type HogSeriesHealthState =
  | "fresh"
  | "stale"
  | "degraded"
  | "missing"
  | "disabled";

export type HogIngestionStatus =
  | "queued"
  | "running"
  | "success"
  | "partial_success"
  | "failed";

export type HogTriggerSource = "api" | "scheduler";

export type HogGateCondition = {
  code: string;
  name: string;
  gate: string;
  mandatory: boolean;
  state: HogConditionState;
  threshold: string;
  observed: string | null;
  series_codes: string[];
  evidence_dates: string[];
  explanation: string;
};

export type HogGateResult = {
  gate: string;
  name: string;
  state: HogGateState;
  pass_count: number;
  required_pass_count: number;
  total_conditions: number;
  mandatory_missing: string[];
  conditions: HogGateCondition[];
  explanation: string;
};

export type HogCompleteness = {
  enabled_total: number;
  required_total: number;
  required_available: number;
  fresh: number;
  stale: number;
  degraded: number;
  missing: number;
  optional_missing: number;
  missing_required_series: string[];
};

export type HogOverview = {
  rule_version: string;
  industry_code: string;
  as_of: string;
  effective_at: string | null;
  cycle_state: HogCycleState;
  cycle_label: string;
  transition_hint: string;
  veto_active: boolean;
  capacity_gate: HogGateResult;
  confirmation_gate: HogGateResult;
  completeness: HogCompleteness;
  evidence: HogGateCondition[];
  disclaimer: string;
};

export type HogSeriesMeta = {
  code: string;
  industry_code: string;
  source_group: string | null;
  display_name: string;
  dimension: HogDimension;
  frequency: HogFrequency;
  unit: string;
  value_semantics: HogValueSemantics;
  primary_source: string;
  source_url: string | null;
  direction: HogDirection;
  freshness_days: number;
  gate_role: HogGateRole;
  required: boolean;
  enabled: boolean;
};

export type HogObservation = {
  date: string;
  period_type: HogPeriodType;
  value: string;
  source: string;
  source_url: string;
  quality: HogQuality;
  methodology_version: string;
  published_at: string | null;
  collected_at: string;
  revision: number;
};

export type HogSeries = {
  series: HogSeriesMeta;
  observations: HogObservation[];
};

export type HogSeriesResult = {
  start_date: string;
  end_date: string;
  revisions: "latest" | "all";
  as_of: string | null;
  series: HogSeries[];
};

export type HogSeriesHealth = {
  code: string;
  display_name: string;
  source_group: string | null;
  dimension: HogDimension;
  frequency: HogFrequency;
  unit: string;
  gate_role: HogGateRole;
  required: boolean;
  enabled: boolean;
  state: HogSeriesHealthState;
  reason: string | null;
  latest_date: string | null;
  latest_value: string | null;
  latest_quality: HogQuality | null;
  collected_at: string | null;
};

export type HogGroupHealth = {
  group: string;
  frequency: HogFrequency;
  latest_status: HogIngestionStatus | null;
  last_run_at: string | null;
  last_error: string | null;
};

export type HogHealthResult = {
  generated_at: string;
  series: HogSeriesHealth[];
  groups: HogGroupHealth[];
};

export type HogUpdateRun = {
  id: number;
  job_name: string;
  trigger_source: HogTriggerSource;
  target_start_date: string;
  target_end_date: string;
  status: HogIngestionStatus;
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

export type HogUpdateAccepted = {
  runs: HogUpdateRun[];
};

export type HogUpdateRunList = {
  total: number;
  limit: number;
  offset: number;
  runs: HogUpdateRun[];
};

const HOG_BASE = "/api/dashboard/industries/hog";

/** 生猪周期总览：周期阶段、双闸门与完整度均由后端版本化规则计算，前端只展示。 */
export const getHogOverview = (params?: { as_of?: string }) =>
  http.request<HogOverview>("get", `${HOG_BASE}/overview`, { params });

/** 生猪指标序列；codes 以重复键形式序列化（codes=a&codes=b），混合频率禁止前向填充。 */
export const getHogSeries = (params?: {
  codes?: string[];
  start_date?: string;
  end_date?: string;
  revisions?: "latest" | "all";
  as_of?: string;
}) =>
  http.request<HogSeriesResult>("get", `${HOG_BASE}/series`, {
    params,
    paramsSerializer: {
      serialize: (query: Record<string, unknown>) =>
        stringify(query, { arrayFormat: "repeat" })
    }
  });

/** 生猪指标与来源组的数据健康（新鲜/陈旧/降级/缺失/禁用）。 */
export const getHogHealth = () =>
  http.request<HogHealthResult>("get", `${HOG_BASE}/health`);

/** 提交生猪来源组回填/刷新任务，返回 202 与任务清单。 */
export const submitHogUpdate = (data: {
  groups: string[];
  start_date?: string;
  end_date?: string;
}) => http.request<HogUpdateAccepted>("post", `${HOG_BASE}/updates`, { data });

/** 查询生猪回填任务列表，可按状态与触发来源过滤。 */
export const listHogUpdates = (params?: {
  status?: HogIngestionStatus;
  trigger_source?: HogTriggerSource;
  limit?: number;
  offset?: number;
}) => http.request<HogUpdateRunList>("get", `${HOG_BASE}/updates`, { params });

/** 按 ID 查询单个生猪回填任务。 */
export const getHogUpdate = (runId: number) =>
  http.request<HogUpdateRun>("get", `${HOG_BASE}/updates/${runId}`);
