<script setup lang="ts">
import type { HogHealthResult } from "@/api/industry-hog";
import {
  formatDateTime,
  formatNumber,
  frequencyLabel,
  healthStateLabel,
  healthStateTagType,
  runStatusLabel,
  runStatusTagType,
  sourceGroupLabel
} from "../presentation";

defineOptions({ name: "HogDataHealthPanel" });

defineProps<{
  health: HogHealthResult;
}>();
</script>

<template>
  <div class="health-panel">
    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <span>来源组采集状态</span>
          <small>生成时间：{{ formatDateTime(health.generated_at) }}</small>
        </div>
      </template>
      <div class="group-list">
        <div
          v-for="group in health.groups"
          :key="group.group"
          class="group-row"
        >
          <div class="group-main">
            <strong>{{ sourceGroupLabel[group.group] ?? group.group }}</strong>
            <el-tag size="small" effect="plain">
              {{ frequencyLabel[group.frequency] }}
            </el-tag>
          </div>
          <div class="group-meta">
            <el-tag
              v-if="group.latest_status"
              :type="runStatusTagType(group.latest_status)"
              size="small"
            >
              {{ runStatusLabel[group.latest_status] }}
            </el-tag>
            <span v-else class="muted">尚无运行记录</span>
            <span class="muted"
              >最近运行：{{ formatDateTime(group.last_run_at) }}</span
            >
          </div>
          <p v-if="group.last_error" class="group-error">
            {{ group.last_error }}
          </p>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>指标序列健康明细</template>
      <div class="series-table" role="table" aria-label="指标序列健康明细">
        <div class="series-row series-head" role="row">
          <span role="columnheader">指标</span>
          <span role="columnheader">频率</span>
          <span role="columnheader">状态</span>
          <span role="columnheader">最新观测日</span>
          <span role="columnheader">最新值</span>
          <span role="columnheader">采集时间</span>
        </div>
        <div
          v-for="item in health.series"
          :key="item.code"
          class="series-row"
          role="row"
        >
          <span role="cell" class="series-name">
            {{ item.display_name }}
            <el-tag
              v-if="item.required"
              type="danger"
              size="small"
              effect="plain"
            >
              必填
            </el-tag>
            <el-tag v-if="!item.enabled" size="small" effect="plain">
              未启用
            </el-tag>
          </span>
          <span role="cell" class="muted">{{
            frequencyLabel[item.frequency]
          }}</span>
          <span role="cell">
            <el-tag
              :type="healthStateTagType(item.state, item.required)"
              size="small"
            >
              {{ healthStateLabel[item.state] }}
            </el-tag>
          </span>
          <span role="cell" class="muted">{{ item.latest_date ?? "—" }}</span>
          <span role="cell">
            {{
              item.latest_value !== null ? formatNumber(item.latest_value) : "—"
            }}
            <em class="muted">{{
              item.latest_value !== null ? item.unit : ""
            }}</em>
          </span>
          <span role="cell" class="muted">{{
            formatDateTime(item.collected_at)
          }}</span>
          <p v-if="item.reason" class="series-reason">{{ item.reason }}</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.health-panel {
  display: grid;
  gap: 16px;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
}

.group-list {
  display: grid;
}

.group-row {
  display: grid;
  gap: 6px;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.group-row:last-child {
  border-bottom: 0;
}

.group-main,
.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.muted {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.group-error {
  margin: 0;
  font-size: 13px;
  color: var(--el-color-danger);
}

.series-table {
  display: grid;
}

.series-row {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) 70px 90px 120px 140px 140px;
  gap: 10px;
  align-items: center;
  padding: 10px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.series-head {
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color);
}

.series-name {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.series-reason {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .series-row {
    grid-template-columns: minmax(140px, 1.6fr) 64px 84px 1fr;
  }

  .series-row span:nth-child(5),
  .series-row span:nth-child(6) {
    grid-column: span 2;
  }
}

@media (width <= 560px) {
  .series-row {
    grid-template-columns: 1fr 1fr;
  }

  .series-head {
    display: none;
  }

  .series-name {
    grid-column: 1 / -1;
  }
}
</style>
