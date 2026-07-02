export enum TaskType {
  NOOP = 0,
  ZONGXIN_TUTURE_SHORT_POSITION_UPDATE = 1,
  MARKET_DATA_UPDATE = 2,
  CORE_ETF_DATA_UPDATE = 3
}

export const taskTypeOptions = [
  {
    label: "NOOP",
    value: TaskType.NOOP
  },
  {
    label: "中信空单更新",
    value: TaskType.ZONGXIN_TUTURE_SHORT_POSITION_UPDATE
  },
  {
    label: "大盘核心数据更新",
    value: TaskType.MARKET_DATA_UPDATE
  },
  {
    label: "核心ETF数据更新",
    value: TaskType.CORE_ETF_DATA_UPDATE
  }
];

export function getTaskTypeLabel(taskType: number | undefined | null) {
  if (taskType === undefined || taskType === null) return "-";

  return (
    taskTypeOptions.find(option => option.value === taskType)?.label ??
    `未知任务类型(${taskType})`
  );
}
