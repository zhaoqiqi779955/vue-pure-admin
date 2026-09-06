<script setup lang="ts">
import type { HogGateResult } from "@/api/industry-hog";
import {
  conditionStateLabel,
  conditionStateTagType,
  gateStateLabel,
  gateStateTagType
} from "../presentation";

defineOptions({ name: "HogCycleGatePanel" });

defineProps<{
  gate: HogGateResult;
}>();
</script>

<template>
  <el-collapse-item :name="gate.gate" :data-testid="`gate-${gate.gate}`">
    <template #title>
      <div class="gate-title">
        <span class="gate-name">{{ gate.name }}</span>
        <el-tag :type="gateStateTagType(gate.state)" size="small">
          {{ gateStateLabel[gate.state] }}
        </el-tag>
        <span class="gate-count">
          通过 {{ gate.pass_count }}/{{ gate.total_conditions }}
          <template v-if="gate.required_pass_count">
            （必填需 {{ gate.required_pass_count }}）
          </template>
        </span>
        <el-tag
          v-if="gate.mandatory_missing.length"
          type="danger"
          size="small"
          effect="plain"
        >
          必填缺失 {{ gate.mandatory_missing.length }}
        </el-tag>
      </div>
    </template>

    <div class="condition-list">
      <div
        v-for="condition in gate.conditions"
        :id="`condition-${condition.code}`"
        :key="condition.code"
        class="condition-row"
        :class="`condition-${condition.state}`"
      >
        <div class="condition-head">
          <span class="condition-code">{{ condition.code }}</span>
          <span class="condition-name">{{ condition.name }}</span>
          <el-tag
            v-if="condition.mandatory"
            type="danger"
            size="small"
            effect="plain"
          >
            必填
          </el-tag>
          <el-tag :type="conditionStateTagType(condition.state)" size="small">
            {{ conditionStateLabel[condition.state] }}
          </el-tag>
        </div>
        <dl class="condition-meta">
          <div>
            <dt>判定阈值</dt>
            <dd>{{ condition.threshold }}</dd>
          </div>
          <div>
            <dt>当前观测</dt>
            <dd>{{ condition.observed ?? "暂无观测值" }}</dd>
          </div>
          <div v-if="condition.evidence_dates.length">
            <dt>证据日期</dt>
            <dd>{{ condition.evidence_dates.join("、") }}</dd>
          </div>
        </dl>
        <p class="condition-explanation">{{ condition.explanation }}</p>
      </div>
    </div>

    <el-alert
      v-if="gate.mandatory_missing.length"
      type="warning"
      :closable="false"
      show-icon
      class="gate-missing-alert"
      :title="`缺少必填条件输入：${gate.mandatory_missing.join('、')}`"
    />
    <p class="gate-explanation">{{ gate.explanation }}</p>
  </el-collapse-item>
</template>

<style scoped>
.gate-title {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding-right: 12px;
}

.gate-name {
  font-weight: 600;
}

.gate-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.condition-list {
  display: grid;
  gap: 12px;
}

.condition-row {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-left-width: 3px;
  border-radius: 6px;
}

.condition-pass {
  border-left-color: var(--el-color-success);
}

.condition-fail {
  border-left-color: var(--el-color-danger);
}

.condition-insufficient {
  border-left-color: var(--el-color-info);
}

.condition-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.condition-code {
  font-weight: 700;
  color: var(--el-text-color-secondary);
}

.condition-name {
  font-weight: 600;
}

.condition-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 0;
}

.condition-meta div {
  display: inline-flex;
  gap: 6px;
  min-width: 0;
}

.condition-meta dt {
  color: var(--el-text-color-secondary);
}

.condition-meta dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.condition-explanation,
.gate-explanation {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.gate-missing-alert {
  margin-top: 12px;
}

.gate-explanation {
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
</style>
