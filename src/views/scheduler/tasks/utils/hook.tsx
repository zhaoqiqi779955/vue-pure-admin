import editForm from "../form.vue";
import { h, onMounted, reactive, ref, toRaw } from "vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import type { FormItemProps } from "./types";
import {
  createScheduledTask,
  deleteScheduledTask,
  getScheduledTaskList,
  updateScheduledTask,
  type ListScheduledTasksParams,
  type ScheduledTaskItem
} from "@/api/scheduler";

function formatEmpty(value: string | number | undefined) {
  return value ? String(value) : "-";
}

export function useSchedulerTasks() {
  const form = reactive({
    task_name: "",
    handler: ""
  });
  const formRef = ref();
  const dataList = ref<ScheduledTaskItem[]>([]);
  const loading = ref(true);
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  const columns: TableColumnList = [
    {
      label: "任务 ID",
      prop: "id",
      minWidth: 90
    },
    {
      label: "任务名称",
      prop: "task_name",
      minWidth: 140,
      formatter: ({ task_name }) => formatEmpty(task_name)
    },
    {
      label: "Cron 表达式",
      prop: "cron_expr",
      minWidth: 150,
      formatter: ({ cron_expr }) => formatEmpty(cron_expr)
    },
    {
      label: "处理器",
      prop: "handler",
      minWidth: 180,
      formatter: ({ handler }) => formatEmpty(handler)
    },
    {
      label: "下次执行时间",
      prop: "next_tick",
      minWidth: 170,
      formatter: ({ next_tick }) => formatEmpty(next_tick)
    },
    {
      label: "上次执行时间",
      prop: "last_execution_time",
      minWidth: 170,
      formatter: ({ last_execution_time }) => formatEmpty(last_execution_time)
    },
    {
      label: "创建时间",
      prop: "created_time",
      minWidth: 170,
      formatter: ({ created_time }) => formatEmpty(created_time)
    },
    {
      label: "更新时间",
      prop: "updated_time",
      minWidth: 170,
      formatter: ({ updated_time }) => formatEmpty(updated_time)
    },
    {
      label: "操作",
      fixed: "right",
      width: 150,
      slot: "operation"
    }
  ];

  function buildListParams(): ListScheduledTasksParams {
    const { task_name, handler } = toRaw(form);
    const params: ListScheduledTasksParams = {
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize
    };

    if (task_name.trim()) params.task_name = task_name.trim();
    if (handler.trim()) params.handler = handler.trim();

    return params;
  }

  async function onSearch(resetPage = false) {
    if (resetPage) pagination.currentPage = 1;
    loading.value = true;

    try {
      const { total, tasks } = await getScheduledTaskList(buildListParams());
      dataList.value = tasks ?? [];
      pagination.total = total ?? 0;
    } catch {
      dataList.value = [];
      pagination.total = 0;
      message("定时任务列表加载失败，请稍后重试", { type: "error" });
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

  function openDialog(title = "新增", row?: ScheduledTaskItem) {
    addDialog({
      title: `${title}定时任务`,
      props: {
        formInline: {
          task_name: row?.task_name ?? "",
          cron_expr: row?.cron_expr ?? "",
          handler: row?.handler ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;

        FormRef.validate(async valid => {
          if (!valid) return;

          try {
            if (row?.id) {
              await updateScheduledTask(row.id, curData);
            } else {
              await createScheduledTask(curData);
            }

            message(`定时任务${title}成功`, { type: "success" });
            done();
            onSearch();
          } catch {
            message(`定时任务${title}失败，请稍后重试`, { type: "error" });
          }
        });
      }
    });
  }

  async function handleDelete(row: ScheduledTaskItem) {
    try {
      await ElMessageBox.confirm(
        `是否确认删除任务名称为「${row.task_name}」的这条数据？`,
        "系统提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          draggable: true
        }
      );
      await deleteScheduledTask(row.id);

      const maxPage = Math.max(
        Math.ceil((pagination.total - 1) / pagination.pageSize),
        1
      );
      if (pagination.currentPage > maxPage) {
        pagination.currentPage = maxPage;
      }

      message("定时任务删除成功", { type: "success" });
      onSearch();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      message("定时任务删除失败，请稍后重试", { type: "error" });
    }
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
    onSearch,
    resetForm,
    openDialog,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
