<script setup lang="ts">
import dayjs from "dayjs";
import { nextTick, reactive, ref } from "vue";
import { useDataUpdateRecords, useSchedulerStatusRecords } from "./utils/hook";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import {
  submitMissingDateScan,
  submitDataUpdateRun,
  type DataUpdateRunItem,
  type DataUpdateType
} from "@/api/dataUpdates";
import { ElMessageBox, type FormInstance, type FormRules } from "element-plus";

import CopyDocument from "~icons/ep/copy-document";
import Refresh from "~icons/ep/refresh";
import AddFill from "~icons/ri/add-circle-line";

defineOptions({
  name: "SchedulerTasks"
});

const formRef = ref();
const tableRef = ref();
const schedulerTableRef = ref();
const submitFormRef = ref<FormInstance>();
const submitDialogVisible = ref(false);
const submitting = ref(false);
const repairingMissingDates = ref(false);
const activeTab = ref("updates");

type SubmitForm = {
  data_type: DataUpdateType;
  targetDateRange: string[];
};

const submitForm = reactive<SubmitForm>({
  data_type: "core_etf",
  targetDateRange: []
});

const submitRules: FormRules<SubmitForm> = {
  data_type: [{ required: true, message: "请选择数据类型", trigger: "change" }],
  targetDateRange: [
    {
      validator: (_rule, value: string[], callback) => {
        if (!value || value.length !== 2) {
          callback(new Error("请选择目标日期区间"));
          return;
        }

        const [startDate, endDate] = value;
        if (dayjs(endDate).isAfter(dayjs(), "day")) {
          callback(new Error("结束日期不能晚于今天"));
          return;
        }
        if (dayjs(endDate).diff(dayjs(startDate), "day") > 365) {
          callback(new Error("日期区间最多支持 366 个自然日"));
          return;
        }

        callback();
      },
      trigger: "change"
    }
  ]
};

const {
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
} = useDataUpdateRecords();
const {
  schedulerSchedules,
  schedulerLoading,
  schedulerColumns,
  loadSchedulerSchedules
} = useSchedulerStatusRecords();

function onFullscreen() {
  tableRef.value.setAdaptive();
}

function onSchedulerFullscreen() {
  schedulerTableRef.value.setAdaptive();
}

function handleTabChange(tabName: string | number) {
  if (tabName === "schedules") loadSchedulerSchedules();
}

async function openSubmitDialog(row?: DataUpdateRunItem) {
  submitForm.data_type = row?.data_type ?? "core_etf";
  submitForm.targetDateRange = row
    ? [row.target_start_date, row.target_end_date]
    : [];
  submitDialogVisible.value = true;
  await nextTick();
  submitFormRef.value?.clearValidate();
}

function disabledFutureDate(date: Date) {
  return dayjs(date).isAfter(dayjs(), "day");
}

async function handleSubmit() {
  if (!submitFormRef.value) return;

  const valid = await submitFormRef.value.validate().catch(() => false);
  if (!valid || submitForm.targetDateRange.length !== 2) return;

  const [start_date, end_date] = submitForm.targetDateRange;
  submitting.value = true;

  try {
    const run = await submitDataUpdateRun({
      data_type: submitForm.data_type,
      start_date,
      end_date
    });
    message(`任务 #${run.id} 已提交并进入队列`, { type: "success" });
    submitDialogVisible.value = false;
    await onSearch(true);
  } catch {
    message("数据更新任务提交失败，请检查日期范围后重试", {
      type: "error"
    });
  } finally {
    submitting.value = false;
  }
}

async function handleRepairMissingDates() {
  if (repairingMissingDates.value) return;

  try {
    await ElMessageBox.confirm(
      "将扫描最近 21 天至昨天的工作日缺口，并为缺失快照提交补采任务。是否继续？",
      "修复缺失数据",
      {
        confirmButtonText: "确认修复",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  repairingMissingDates.value = true;
  try {
    const summary = await submitMissingDateScan();
    const detail = `缺失 ${summary.missing} 个，已有快照跳过 ${summary.skipped_existing} 个，执行中跳过 ${summary.skipped_unfinished} 个`;
    const content =
      summary.submitted > 0
        ? `已提交 ${summary.submitted} 个缺失补采任务。${detail}`
        : `未发现需要提交的缺失补采任务。${detail}`;
    message(content, { type: "success" });
    await onSearch(true);
  } catch {
    message("缺失数据修复任务提交失败，请稍后重试", { type: "error" });
  } finally {
    repairingMissingDates.value = false;
  }
}
</script>

<template>
  <div class="main">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="数据更新记录" name="updates">
        <el-form
          ref="formRef"
          :inline="true"
          :model="form"
          class="search-form bg-bg_color w-full pl-8 pt-3 overflow-auto"
        >
          <el-form-item label="数据类型" prop="data_type">
            <el-select
              v-model="form.data_type"
              placeholder="请选择数据类型"
              clearable
              class="w-45!"
            >
              <el-option
                v-for="item in dataTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="触发来源" prop="trigger_source">
            <el-select
              v-model="form.trigger_source"
              placeholder="请选择触发来源"
              clearable
              class="w-45!"
            >
              <el-option
                v-for="item in triggerSourceOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="form.status"
              placeholder="请选择状态"
              clearable
              class="w-45!"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标日期" prop="targetDateRange">
            <el-date-picker
              v-model="form.targetDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="w-75!"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :icon="useRenderIcon('ri/search-line')"
              :loading="loading"
              @click="onSearch(true)"
            >
              搜索
            </el-button>
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="resetForm(formRef)"
            >
              重置
            </el-button>
          </el-form-item>
        </el-form>

        <PureTableBar
          title="数据更新记录"
          :columns="columns"
          :tableRef="tableRef?.getTableRef()"
          @refresh="onSearch"
          @fullscreen="onFullscreen"
        >
          <template #buttons>
            <el-button
              :icon="useRenderIcon(Refresh)"
              :loading="repairingMissingDates"
              @click="handleRepairMissingDates"
            >
              修复缺失数据
            </el-button>
            <el-button
              type="primary"
              :icon="useRenderIcon(AddFill)"
              @click="openSubmitDialog()"
            >
              提交更新任务
            </el-button>
          </template>
          <template v-slot="{ size, dynamicColumns }">
            <pure-table
              ref="tableRef"
              row-key="id"
              align-whole="center"
              table-layout="auto"
              showOverflowTooltip
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :loading="loading"
              :size="size"
              :data="dataList"
              :columns="dynamicColumns"
              :pagination="{ ...pagination, size }"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
              @page-size-change="handleSizeChange"
              @page-current-change="handleCurrentChange"
            >
              <template #operation="{ row }">
                <el-button
                  class="reset-margin"
                  link
                  type="primary"
                  :size="size"
                  :icon="useRenderIcon(CopyDocument)"
                  @click="openSubmitDialog(row)"
                >
                  复制
                </el-button>
              </template>
            </pure-table>
          </template>
        </PureTableBar>
      </el-tab-pane>

      <el-tab-pane label="调度状态" name="schedules">
        <PureTableBar
          title="调度状态"
          :columns="schedulerColumns"
          :tableRef="schedulerTableRef?.getTableRef()"
          @refresh="loadSchedulerSchedules"
          @fullscreen="onSchedulerFullscreen"
        >
          <template v-slot="{ size, dynamicColumns }">
            <el-alert
              v-if="!schedulerLoading && schedulerSchedules.length === 0"
              title="暂无已初始化的调度记录"
              type="info"
              :closable="false"
              show-icon
              class="mb-4"
            />
            <pure-table
              ref="schedulerTableRef"
              row-key="job_name"
              align-whole="center"
              table-layout="auto"
              showOverflowTooltip
              adaptive
              :adaptiveConfig="{ offsetBottom: 108 }"
              :loading="schedulerLoading"
              :size="size"
              :data="schedulerSchedules"
              :columns="dynamicColumns"
              :header-cell-style="{
                background: 'var(--el-fill-color-light)',
                color: 'var(--el-text-color-primary)'
              }"
            />
          </template>
        </PureTableBar>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="submitDialogVisible"
      title="提交数据更新任务"
      width="480px"
      draggable
      :close-on-click-modal="false"
      :close-on-press-escape="!submitting"
      :show-close="!submitting"
    >
      <el-form
        ref="submitFormRef"
        :model="submitForm"
        :rules="submitRules"
        label-width="96px"
      >
        <el-form-item label="数据类型" prop="data_type">
          <el-select
            v-model="submitForm.data_type"
            placeholder="请选择数据类型"
            class="w-full!"
          >
            <el-option
              v-for="item in dataTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标日期" prop="targetDateRange">
          <el-date-picker
            v-model="submitForm.targetDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            unlink-panels
            :disabled-date="disabledFutureDate"
            class="w-full!"
          />
        </el-form-item>
        <el-alert
          title="提交后任务将异步执行，可在记录列表中查看进度。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button :disabled="submitting" @click="submitDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交任务
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-table__inner-wrapper::before) {
  height: 0;
}

:global(.data-update-error-tooltip) {
  max-width: 480px;
  overflow-wrap: anywhere;
  white-space: normal;
}

.main-content {
  margin: 24px 24px 0 !important;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
