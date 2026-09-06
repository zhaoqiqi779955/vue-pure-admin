import dayjs from "dayjs";
import type {
  HogConditionState,
  HogCycleState,
  HogFrequency,
  HogGateRole,
  HogGateState,
  HogIngestionStatus,
  HogQuality,
  HogSeriesHealthState
} from "@/api/industry-hog";

export type TagType = "primary" | "success" | "info" | "warning" | "danger";

export const frequencyLabel: Record<HogFrequency, string> = {
  daily: "日频",
  weekly: "周频",
  monthly: "月频",
  quarterly: "季频"
};

export const qualityLabel: Record<HogQuality, string> = {
  fresh: "官方新鲜",
  degraded: "降级来源"
};

export const healthStateLabel: Record<HogSeriesHealthState, string> = {
  fresh: "新鲜",
  stale: "陈旧",
  degraded: "降级",
  missing: "缺失",
  disabled: "未启用"
};

export function healthStateTagType(
  state: HogSeriesHealthState,
  required: boolean
): TagType {
  switch (state) {
    case "fresh":
      return "success";
    case "stale":
    case "degraded":
      return "warning";
    case "missing":
      return required ? "danger" : "info";
    case "disabled":
      return "info";
  }
}

export const gateStateLabel: Record<HogGateState, string> = {
  passed: "闸门通过",
  failed: "闸门未通过",
  insufficient_data: "数据不足"
};

export function gateStateTagType(state: HogGateState): TagType {
  if (state === "passed") return "success";
  if (state === "failed") return "danger";
  return "info";
}

export const conditionStateLabel: Record<HogConditionState, string> = {
  pass: "条件通过",
  fail: "条件未通过",
  insufficient: "数据不足"
};

export function conditionStateTagType(state: HogConditionState): TagType {
  if (state === "pass") return "success";
  if (state === "fail") return "danger";
  return "info";
}

export const gateRoleLabel: Record<HogGateRole, string> = {
  gate_a_mandatory: "产能闸门 · 必填",
  gate_a_optional: "产能闸门",
  gate_b_mandatory: "确认闸门 · 必填",
  gate_b_optional: "确认闸门",
  context: "参考指标"
};

export const runStatusLabel: Record<HogIngestionStatus, string> = {
  queued: "排队中",
  running: "运行中",
  success: "成功",
  partial_success: "部分成功",
  failed: "失败"
};

export function runStatusTagType(status: HogIngestionStatus): TagType {
  switch (status) {
    case "success":
      return "success";
    case "partial_success":
      return "warning";
    case "failed":
      return "danger";
    default:
      return "info";
  }
}

export const cycleStateTagType: Record<HogCycleState, TagType> = {
  S0: "info",
  S1: "warning",
  S2: "primary",
  S3: "success",
  S4: "success",
  S5: "danger",
  insufficient_data: "info"
};

export const sourceGroupLabel: Record<string, string> = {
  hog_market_weekly: "周度集市价格（农业农村部）",
  hog_capacity_monthly: "月度产能数据（农业农村部）",
  hog_feed_monthly: "月度饲料数据（中国饲料工业协会）",
  hog_supply_quarterly: "季度供给数据（国家统计局）",
  hog_equity_daily: "日度猪股相对强弱（交易所行情派生）"
};

export function formatDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY-MM-DD") : "—";
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";
}

export function formatNumber(
  value: string | number | null | undefined,
  digits = 2
): string {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("zh-CN", { maximumFractionDigits: digits })
    : "—";
}
