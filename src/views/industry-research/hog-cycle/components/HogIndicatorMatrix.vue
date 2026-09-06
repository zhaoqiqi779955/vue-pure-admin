<script setup lang="ts">
import type { HogSeries, HogSeriesHealth } from "@/api/industry-hog";
import {
  formatDateTime,
  formatNumber,
  frequencyLabel,
  gateRoleLabel,
  healthStateLabel,
  healthStateTagType,
  qualityLabel
} from "../presentation";

defineOptions({ name: "HogIndicatorMatrix" });

const props = defineProps<{
  items: HogSeriesHealth[];
  series?: HogSeries[];
}>();

function latestSource(item: HogSeriesHealth): string {
  const match = props.series?.find(entry => entry.series.code === item.code);
  const observation = match?.observations.at(-1);
  return observation?.source ?? match?.series.primary_source ?? "—";
}

function sourceUrl(item: HogSeriesHealth): string | null {
  const observation = props.series
    ?.find(entry => entry.series.code === item.code)
    ?.observations.at(-1);
  return observation?.source_url || null;
}
</script>

<template>
  <div class="indicator-matrix">
    <el-card
      v-for="item in items"
      :key="item.code"
      shadow="never"
      class="indicator-card"
      :class="`state-${item.state}`"
    >
      <div class="card-head">
        <span class="indicator-name">{{ item.display_name }}</span>
        <el-tag size="small" effect="plain">{{
          frequencyLabel[item.frequency]
        }}</el-tag>
        <el-tag v-if="item.required" type="danger" size="small" effect="plain">
          必填
        </el-tag>
      </div>

      <div class="card-value">
        <strong v-if="item.latest_value !== null">
          {{ formatNumber(item.latest_value) }}
          <em>{{ item.unit }}</em>
        </strong>
        <strong v-else class="value-empty">—</strong>
        <el-tag
          :type="healthStateTagType(item.state, item.required)"
          size="small"
        >
          {{ healthStateLabel[item.state] }}
        </el-tag>
      </div>

      <div class="card-meta">
        <span>观测日：{{ item.latest_date ?? "—" }}</span>
        <span>采集：{{ formatDateTime(item.collected_at) }}</span>
        <span>来源：{{ latestSource(item) }}</span>
        <el-tag
          v-if="item.latest_quality"
          :type="item.latest_quality === 'fresh' ? 'success' : 'warning'"
          size="small"
          effect="plain"
        >
          {{ qualityLabel[item.latest_quality] }}
        </el-tag>
        <a
          v-if="sourceUrl(item)"
          :href="sourceUrl(item) ?? '#'"
          target="_blank"
          rel="noreferrer"
          class="source-link"
        >
          查看来源
        </a>
      </div>

      <p v-if="item.reason" class="card-reason">{{ item.reason }}</p>
      <p v-else-if="item.state === 'disabled'" class="card-reason">
        该指标暂无授权数据源，未启用采集。
      </p>
      <p v-else-if="item.state === 'missing'" class="card-reason">
        尚未采集到有效观测，待对应来源组回填后展示。
      </p>

      <div class="card-footer">
        <span>{{ gateRoleLabel[item.gate_role] }}</span>
        <span v-if="item.source_group">来源组：{{ item.source_group }}</span>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.indicator-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.indicator-card :deep(.el-card__body) {
  display: grid;
  gap: 8px;
  height: 100%;
}

.indicator-card {
  border-left: 3px solid var(--el-border-color);
}

.state-fresh {
  border-left-color: var(--el-color-success);
}

.state-stale,
.state-degraded {
  border-left-color: var(--el-color-warning);
}

.state-missing {
  border-left-color: var(--el-color-info);
}

.state-disabled {
  border-left-color: var(--el-border-color-darker);
  opacity: 0.85;
}

.card-head {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.indicator-name {
  font-weight: 600;
}

.card-value {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
}

.card-value strong {
  font-size: 22px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.card-value strong em {
  font-size: 13px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.value-empty {
  color: var(--el-text-color-placeholder);
}

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.source-link {
  color: var(--el-color-primary);
}

.source-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.card-reason {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding-top: 6px;
  margin-top: auto;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  border-top: 1px dashed var(--el-border-color-lighter);
}

@media (width <= 560px) {
  .indicator-matrix {
    grid-template-columns: 1fr;
  }
}
</style>
