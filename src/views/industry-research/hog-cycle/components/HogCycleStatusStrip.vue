<script setup lang="ts">
import { computed } from "vue";
import type { HogCycleState, HogOverview } from "@/api/industry-hog";
import { cycleStateTagType, formatDateTime } from "../presentation";

defineOptions({ name: "HogCycleStatusStrip" });

const props = defineProps<{
  overview: HogOverview;
}>();

const stateTagType = cycleStateTagType;

const isInsufficient = computed(
  () => props.overview.cycle_state === "insufficient_data"
);

const completenessCounts = computed(() => {
  const completeness = props.overview.completeness;
  return [
    { label: "新鲜", value: completeness.fresh, type: "success" },
    { label: "陈旧", value: completeness.stale, type: "warning" },
    { label: "降级", value: completeness.degraded, type: "warning" },
    { label: "缺失", value: completeness.missing, type: "danger" },
    { label: "可选缺失", value: completeness.optional_missing, type: "info" }
  ] as const;
});

const stateText: Record<HogCycleState, string> = {
  S0: "S0 供给过剩",
  S1: "S1 亏损去化",
  S2: "S2 预期修复",
  S3: "S3 供给确认",
  S4: "S4 盈利扩张",
  S5: "S5 产能回补",
  insufficient_data: "数据不足"
};
</script>

<template>
  <el-card
    shadow="never"
    class="status-strip"
    role="region"
    aria-label="生猪周期状态"
  >
    <div class="strip-main">
      <div class="strip-state">
        <div class="state-line">
          <el-tag
            :type="stateTagType[overview.cycle_state]"
            size="large"
            effect="dark"
            class="state-tag"
          >
            {{ stateText[overview.cycle_state] }}
          </el-tag>
          <el-tag
            v-if="overview.veto_active"
            type="danger"
            size="large"
            effect="plain"
          >
            否决信号生效
          </el-tag>
        </div>
        <p class="cycle-label">{{ overview.cycle_label }}</p>
        <p class="transition-hint">{{ overview.transition_hint }}</p>
        <el-alert
          v-if="
            isInsufficient &&
            overview.completeness.missing_required_series.length
          "
          type="warning"
          :closable="false"
          show-icon
          class="missing-alert"
          title="必填指标缺失，暂不给出多空或周期确认结论"
        >
          <template #default>
            缺失的必填序列：{{
              overview.completeness.missing_required_series.join("、")
            }}
          </template>
        </el-alert>
      </div>
      <dl class="strip-meta">
        <div>
          <dt>规则版本</dt>
          <dd>{{ overview.rule_version }}</dd>
        </div>
        <div>
          <dt>评估时点</dt>
          <dd>{{ formatDateTime(overview.as_of) }}</dd>
        </div>
        <div>
          <dt>证据有效时间</dt>
          <dd>{{ formatDateTime(overview.effective_at) }}</dd>
        </div>
        <div>
          <dt>必填指标</dt>
          <dd>
            {{ overview.completeness.required_available }}
            /
            {{ overview.completeness.required_total }}
            可用
          </dd>
        </div>
      </dl>
    </div>
    <div class="strip-footer">
      <div class="completeness-line" aria-label="数据完整度统计">
        <span
          v-for="item in completenessCounts"
          :key="item.label"
          class="completeness-item"
        >
          <el-tag :type="item.type" size="small" effect="plain">{{
            item.label
          }}</el-tag>
          <strong>{{ item.value }}</strong>
        </span>
        <span class="completeness-item">
          <el-tag size="small" effect="plain">已启用</el-tag>
          <strong>{{ overview.completeness.enabled_total }}</strong>
        </span>
      </div>
      <p class="disclaimer">{{ overview.disclaimer }}</p>
    </div>
  </el-card>
</template>

<style scoped>
.status-strip :deep(.el-card__body) {
  display: grid;
  gap: 16px;
}

.strip-main {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr);
  gap: 20px;
}

.strip-state {
  display: grid;
  gap: 10px;
  align-content: start;
}

.state-line {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.state-tag {
  padding: 0 16px;
  font-size: 16px;
  font-weight: 600;
}

.cycle-label {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.transition-hint {
  margin: 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.missing-alert {
  margin-top: 4px;
}

.strip-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  align-content: start;
  margin: 0;
}

.strip-meta div {
  display: grid;
  gap: 2px;
  padding: 8px 12px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.strip-meta dt {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.strip-meta dd {
  margin: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.strip-footer {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.completeness-line {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.completeness-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.disclaimer {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

@media (width <= 900px) {
  .strip-main {
    grid-template-columns: 1fr;
  }
}

@media (width <= 560px) {
  .strip-meta {
    grid-template-columns: 1fr;
  }
}
</style>
