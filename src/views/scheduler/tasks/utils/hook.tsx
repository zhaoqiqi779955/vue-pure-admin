import dayjs from "dayjs";
import { onMounted, reactive, ref, toRaw } from "vue";
import { message } from "@/utils/message";
import type { PaginationProps } from "@pureadmin/table";
import {
  getDataUpdateRuns,
  getSchedulerSchedules,
  type DataUpdateRunItem,
  type DataUpdateStatus,
  type DataUpdateTriggerSource,
  type DataUpdateType,
  type ListDataUpdateRunsParams,
  type SchedulerScheduleItem
} from "@/api/dataUpdates";

type TargetDateRange = [string, string] | [] | null;
type StatusTagType = "info" | "success" | "warning" | "danger";

export const dataTypeOptions: Array<{
  label: string;
  value: DataUpdateType;
}> = [
  { label: "核心 ETF", value: "core_etf" },
  { label: "大盘核心", value: "market_core" },
  { label: "核心指数", value: "market_indices" },
  { label: "中信空单", value: "zhongxin_future" },
  { label: "红利低波", value: "dividend_low_vol" }
];

export const statusOptions: Array<{
  label: string;
  value: DataUpdateStatus;
  tagType: StatusTagType;
}> = [
  { label: "排队中", value: "queued", tagType: "info" },
  { label: "运行中", value: "running", tagType: "warning" },
  { label: "成功", value: "success", tagType: "success" },
  { label: "部分成功", value: "partial_success", tagType: "warning" },
  { label: "失败", value: "failed", tagType: "danger" }
];

export const triggerSourceOptions: Array<{
  label: string;
  value: DataUpdateTriggerSource;
}> = [
  { label: "接口", value: "api" },
  { label: "定时调度", value: "scheduler" },
  { label: "缺失补采", value: "repair_scheduler" }
];

function formatEmpty(value: string | number | undefined | null) {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

function formatDateTime(value: string | undefined | null) {
  if (!value) return "-";

  const dateTime = dayjs(value);
  return dateTime.isValid() ? dateTime.format("YYYY-MM-DD HH:mm:ss") : value;
}

function getDataTypeLabel(dataType: DataUpdateType) {
  return (
    dataTypeOptions.find(option => option.value === dataType)?.label ?? dataType
  );
}

function getStatusOption(status: DataUpdateStatus) {
  return statusOptions.find(option => option.value === status);
}

function getTriggerSourceLabel(triggerSource: DataUpdateTriggerSource) {
  return (
    triggerSourceOptions.find(option => option.value === triggerSource)
      ?.label ?? triggerSource
  );
}

function formatTargetRange(startDate: string, endDate: string) {
  if (!startDate || !endDate) return "-";
  return startDate === endDate ? startDate : `${startDate} 至 ${endDate}`;
}

function formatProgress(row: DataUpdateRunItem) {
  return `${row.completed_targets} / ${row.total_targets}`;
}

function formatOutcome(row: DataUpdateRunItem) {
  return `成功 ${row.success_targets} / 失败 ${row.failed_targets}`;
}

function getSchedulerSubmissionLabel(status: string | null) {
  const labels: Record<string, string> = {
    submitted: "已提交",
    already_submitted: "任务已存在",
    skipped_unfinished: "存在执行中任务",
    no_missing: "无缺失数据",
    failed: "扫描失败"
  };
  return status ? (labels[status] ?? status) : "-";
}

function getSchedulerJobLabel(jobName: string) {
  const labels: Record<string, string> = {
    core_etf_daily: "核心 ETF 定时更新",
    market_core_daily: "大盘核心定时更新",
    market_indices_daily: "核心指数定时更新",
    zhongxin_future_daily: "中信空单定时更新",
    dividend_low_vol_daily: "红利低波定时更新",
    missing_date_scan_daily: "缺失日期扫描"
  };
  return labels[jobName] ?? jobName;
}

export function useDataUpdateRecords() {
  const form = reactive({
    data_type: undefined as DataUpdateType | undefined,
    trigger_source: undefined as DataUpdateTriggerSource | undefined,
    status: undefined as DataUpdateStatus | undefined,
    targetDateRange: [] as TargetDateRange
  });
  const dataList = ref<DataUpdateRunItem[]>([]);
  const loading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const columns: TableColumnList = [
    {
      label: "记录 ID",
      prop: "id",
      minWidth: 90
    },
    {
      label: "任务名称",
      prop: "job_name",
      minWidth: 150,
      formatter: ({ job_name }) => formatEmpty(job_name)
    },
    {
      label: "触发来源",
      prop: "trigger_source",
      minWidth: 110,
      formatter: ({ trigger_source }) => getTriggerSourceLabel(trigger_source)
    },
    {
      label: "数据类型",
      prop: "data_type",
      minWidth: 120,
      formatter: ({ data_type }) => getDataTypeLabel(data_type)
    },
    {
      label: "目标日期区间",
      prop: "target_start_date",
      minWidth: 220,
      formatter: ({ target_start_date, target_end_date }) =>
        formatTargetRange(target_start_date, target_end_date)
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: ({ row, props }) => {
        const option = getStatusOption(row.status);

        return (
          <el-tag
            size={props.size}
            type={option?.tagType ?? "info"}
            effect="plain"
          >
            {option?.label ?? row.status}
          </el-tag>
        );
      }
    },
    {
      label: "进度",
      prop: "completed_targets",
      minWidth: 100,
      formatter: row => formatProgress(row)
    },
    {
      label: "执行结果",
      prop: "success_targets",
      minWidth: 150,
      formatter: row => formatOutcome(row)
    },
    {
      label: "错误摘要",
      prop: "error_summary",
      minWidth: 260,
      cellRenderer: ({ row }) => {
        if (!row.error_summary) return <span>-</span>;

        return (
          <el-tooltip
            content={row.error_summary}
            placement="top"
            popperClass="data-update-error-tooltip"
          >
            <span class="inline-block max-w-60 truncate align-middle text-red-500">
              {row.error_summary}
            </span>
          </el-tooltip>
        );
      }
    },
    {
      label: "提交时间",
      prop: "submitted_at",
      minWidth: 170,
      formatter: ({ submitted_at }) => formatDateTime(submitted_at)
    },
    {
      label: "开始时间",
      prop: "started_at",
      minWidth: 170,
      formatter: ({ started_at }) => formatDateTime(started_at)
    },
    {
      label: "结束时间",
      prop: "finished_at",
      minWidth: 170,
      formatter: ({ finished_at }) => formatDateTime(finished_at)
    },
    {
      label: "操作",
      fixed: "right",
      width: 100,
      slot: "operation"
    }
  ];

  function buildListParams(): ListDataUpdateRunsParams {
    const { data_type, trigger_source, status, targetDateRange } = toRaw(form);
    const params: ListDataUpdateRunsParams = {
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize
    };

    if (data_type) params.data_type = data_type;
    if (trigger_source) params.trigger_source = trigger_source;
    if (status) params.status = status;
    if (targetDateRange?.length === 2) {
      const [target_start_date, target_end_date] = targetDateRange;
      params.target_start_date = target_start_date;
      params.target_end_date = target_end_date;
    }

    return params;
  }

  async function onSearch(resetPage = false) {
    if (resetPage) pagination.currentPage = 1;
    loading.value = true;

    try {
      const { total, runs } = await getDataUpdateRuns(buildListParams());
      dataList.value = runs ?? [];
      pagination.total = total ?? 0;
    } catch {
      dataList.value = [];
      pagination.total = 0;
      message("数据更新记录加载失败，请稍后重试", { type: "error" });
    } finally {
      loading.value = false;
    }
  }

  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch(true);
  };

  function handleSizeChange(val: number) {
    pagination.pageSize = val;
    onSearch(true);
  }

  function handleCurrentChange(val: number) {
    pagination.currentPage = val;
    onSearch();
  }

  onMounted(() => {
    onSearch();
  });

  return {
    form,
    loading,
    columns,
    dataList,
    pagination,
    dataTypeOptions,
    triggerSourceOptions,
    statusOptions,
    onSearch,
    resetForm,
    handleSizeChange,
    handleCurrentChange
  };
}

export function useSchedulerStatusRecords() {
  const schedulerSchedules = ref<SchedulerScheduleItem[]>([]);
  const schedulerLoading = ref(false);
  const schedulerColumns: TableColumnList = [
    {
      label: "作业名称",
      prop: "job_name",
      minWidth: 180,
      formatter: ({ job_name }) => getSchedulerJobLabel(job_name)
    },
    {
      label: "Cron 表达式",
      prop: "cron_expr",
      minWidth: 150,
      formatter: ({ cron_expr }) => formatEmpty(cron_expr)
    },
    {
      label: "下次执行时间",
      prop: "next_run_at",
      minWidth: 170,
      formatter: ({ next_run_at }) => formatDateTime(next_run_at)
    },
    {
      label: "最近提交时间",
      prop: "last_run_at",
      minWidth: 170,
      formatter: ({ last_run_at }) => formatDateTime(last_run_at)
    },
    {
      label: "最近提交结果",
      prop: "last_status",
      minWidth: 130,
      formatter: ({ last_status }) => getSchedulerSubmissionLabel(last_status)
    },
    {
      label: "租约持有者",
      prop: "lease_owner",
      minWidth: 180,
      formatter: ({ lease_owner }) => formatEmpty(lease_owner)
    },
    {
      label: "租约到期时间",
      prop: "lease_until",
      minWidth: 170,
      formatter: ({ lease_until }) => formatDateTime(lease_until)
    },
    {
      label: "更新时间",
      prop: "updated_at",
      minWidth: 170,
      formatter: ({ updated_at }) => formatDateTime(updated_at)
    }
  ];

  async function loadSchedulerSchedules() {
    schedulerLoading.value = true;

    try {
      const { schedules } = await getSchedulerSchedules();
      schedulerSchedules.value = schedules ?? [];
    } catch {
      schedulerSchedules.value = [];
      message("调度状态加载失败，请稍后重试", { type: "error" });
    } finally {
      schedulerLoading.value = false;
    }
  }

  return {
    schedulerSchedules,
    schedulerLoading,
    schedulerColumns,
    loadSchedulerSchedules
  };
}
