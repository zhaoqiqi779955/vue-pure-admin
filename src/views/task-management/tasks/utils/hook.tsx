import editForm from "../form.vue";
import { h, onMounted, reactive, ref, toRaw } from "vue";
import { message } from "@/utils/message";
import { addDialog } from "@/components/ReDialog";
import { deviceDetection } from "@pureadmin/utils";
import { ElMessageBox } from "element-plus";
import type { PaginationProps } from "@pureadmin/table";
import type { FormItemProps } from "./types";
import { getTaskTypeLabel, taskTypeOptions } from "./taskType";
import {
  createTaskManagement,
  deleteTaskManagement,
  getTaskManagementList,
  updateTaskManagement,
  type ListTaskManagementParams,
  type TaskManagementItem
} from "@/api/taskManagement";

type CreatedTimeRange = [string, string] | [] | null;

function formatEmpty(value: string | number | undefined | null) {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
}

function getStatusTagType(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (["success", "succeeded", "finished", "done"].includes(normalizedStatus)) {
    return "success";
  }
  if (["failed", "fail", "error"].includes(normalizedStatus)) {
    return "danger";
  }
  if (["running", "processing", "pending"].includes(normalizedStatus)) {
    return "warning";
  }

  return "info";
}

export function useTaskManagementTasks() {
  const form = reactive({
    task_type: undefined as number | undefined,
    status: "",
    createdTimeRange: [] as CreatedTimeRange
  });
  const formRef = ref();
  const dataList = ref<TaskManagementItem[]>([]);
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
      label: "任务类型",
      prop: "task_type",
      minWidth: 160,
      formatter: ({ task_type }) => getTaskTypeLabel(task_type)
    },
    {
      label: "输入",
      prop: "input",
      minWidth: 220,
      formatter: ({ input }) => formatEmpty(input)
    },
    {
      label: "输出",
      prop: "output",
      minWidth: 220,
      formatter: ({ output }) => formatEmpty(output)
    },
    {
      label: "状态",
      prop: "status",
      minWidth: 100,
      cellRenderer: ({ row, props }) =>
        row.status ? (
          <el-tag
            size={props.size}
            type={getStatusTagType(row.status)}
            effect="plain"
          >
            {row.status}
          </el-tag>
        ) : (
          "-"
        )
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
      width: 210,
      slot: "operation"
    }
  ];

  function buildListParams(): ListTaskManagementParams {
    const { task_type, status, createdTimeRange } = toRaw(form);
    const params: ListTaskManagementParams = {
      limit: pagination.pageSize,
      offset: (pagination.currentPage - 1) * pagination.pageSize
    };

    if (task_type !== undefined) params.task_type = task_type;
    if (status.trim()) params.status = status.trim();
    if (createdTimeRange?.length === 2) {
      const [created_time_start, created_time_end] = createdTimeRange;
      params.created_time_start = created_time_start;
      params.created_time_end = created_time_end;
    }

    return params;
  }

  async function onSearch(resetPage = false) {
    if (resetPage) pagination.currentPage = 1;
    loading.value = true;

    try {
      const { total, tasks } = await getTaskManagementList(buildListParams());
      dataList.value = tasks ?? [];
      pagination.total = total ?? 0;
    } catch {
      dataList.value = [];
      pagination.total = 0;
      message("任务列表加载失败，请稍后重试", { type: "error" });
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

  function openDialog(title = "新增", row?: Partial<TaskManagementItem>) {
    const isEdit = title === "编辑" && Boolean(row?.id);

    addDialog({
      title: `${title}任务`,
      props: {
        formInline: {
          task_type: row?.task_type,
          input: row?.input ?? "",
          output: row?.output ?? "",
          status: row?.status ?? "",
          isEdit
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
          if (curData.task_type === undefined) return;

          try {
            if (isEdit && row?.id) {
              await updateTaskManagement(row.id, {
                task_type: curData.task_type,
                input: curData.input,
                output: curData.output ?? "",
                status: curData.status ?? ""
              });
            } else {
              await createTaskManagement({
                task_type: curData.task_type,
                input: curData.input
              });
            }

            message(`任务${title}成功`, { type: "success" });
            done();
            onSearch();
          } catch {
            message(`任务${title}失败，请稍后重试`, { type: "error" });
          }
        });
      }
    });
  }

  function handleCopy(row: TaskManagementItem) {
    openDialog("新增", {
      task_type: row.task_type,
      input: row.input
    });
  }

  async function handleDelete(row: TaskManagementItem) {
    try {
      await ElMessageBox.confirm(
        `是否确认删除任务 ID 为「${row.id}」的这条数据？`,
        "系统提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
          draggable: true
        }
      );
      await deleteTaskManagement(row.id);

      const maxPage = Math.max(
        Math.ceil((pagination.total - 1) / pagination.pageSize),
        1
      );
      if (pagination.currentPage > maxPage) {
        pagination.currentPage = maxPage;
      }

      message("任务删除成功", { type: "success" });
      onSearch();
    } catch (error) {
      if (error === "cancel" || error === "close") return;
      message("任务删除失败，请稍后重试", { type: "error" });
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
    taskTypeOptions,
    onSearch,
    resetForm,
    openDialog,
    handleCopy,
    handleDelete,
    handleSizeChange,
    handleCurrentChange
  };
}
