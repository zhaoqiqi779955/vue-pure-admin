<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { getMoneySupply, type MoneySupplyItem } from "@/api/dashboard";

defineOptions({ name: "DashboardMacroLiquidity" });

type ChartMode = "yoy" | "balance";
type LinePoint = { x: number; y: number | null; month: string };

const loading = ref(false);
const errorMessage = ref("");
const items = ref<MoneySupplyItem[]>([]);
const chartMode = ref<ChartMode>("yoy");
const dateRange = ref<[string, string]>([
  dayjs().subtract(4, "year").format("YYYY-MM"),
  dayjs().format("YYYY-MM")
]);

const latest = computed(() => items.value.at(-1));
const hasDegraded = computed(() =>
  items.value.some(item => item.quality === "degraded")
);
const chartRows = computed(() =>
  items.value.filter(item =>
    chartMode.value === "balance"
      ? item.m1_balance !== null || item.m2_balance !== null
      : item.m1_yoy !== null || item.m2_yoy !== null
  )
);
const m1Points = computed(() => makePoints("m1"));
const m2Points = computed(() => makePoints("m2"));
const gapPoints = computed(() => makePoints("gap"));

function makePoints(kind: "m1" | "m2" | "gap"): LinePoint[] {
  const values = chartRows.value.map(item => valueOf(item, kind));
  const max = Math.max(
    ...values.filter((value): value is number => value !== null),
    1
  );
  const min = Math.min(
    ...values.filter((value): value is number => value !== null),
    0
  );
  const span = max - min || 1;
  return chartRows.value.map((item, index) => {
    const value = valueOf(item, kind);
    return {
      month: item.month,
      x:
        chartRows.value.length === 1
          ? 0
          : (index / (chartRows.value.length - 1)) * 100,
      y: value === null ? null : 100 - ((value - min) / span) * 100
    };
  });
}

function valueOf(item: MoneySupplyItem, kind: "m1" | "m2" | "gap") {
  if (chartMode.value === "balance") {
    return kind === "m1"
      ? numberOf(item.m1_balance)
      : kind === "m2"
        ? numberOf(item.m2_balance)
        : null;
  }
  return kind === "m1"
    ? item.m1_yoy
    : kind === "m2"
      ? item.m2_yoy
      : item.m1_m2_yoy_gap;
}

function path(points: LinePoint[]) {
  return points.reduce((result, point, index) => {
    if (point.y === null) return result;
    const command = index === 0 || points[index - 1].y === null ? "M" : "L";
    return `${result}${command}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
  }, "");
}

function numberOf(value: string | null) {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: number | string | null | undefined, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("zh-CN", { maximumFractionDigits: digits })
    : "-";
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined
    ? "不可比"
    : `${formatValue(value, 2)}%`;
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getMoneySupply({
      start_month: dateRange.value[0],
      end_month: dateRange.value[1]
    });
    items.value = data.items.sort((left, right) =>
      left.month.localeCompare(right.month)
    );
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "加载月度货币数据失败";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div v-loading="loading" class="macro-liquidity-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div>
          <h2>宏观流动性</h2>
          <p>
            M1、M2 月度余额与同比；M1 在 2025 年调整统计口径，跨口径同比不展示。
          </p>
        </div>
        <div class="toolbar-actions">
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            value-format="YYYY-MM"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            :clearable="false"
            @change="load"
          />
          <el-radio-group v-model="chartMode" size="small">
            <el-radio-button value="yoy">同比趋势</el-radio-button>
            <el-radio-button value="balance">余额趋势</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <el-alert
        v-if="hasDegraded"
        type="warning"
        :closable="false"
        title="部分数据为降级来源，请以人民银行最终公布数据为准。"
      />
    </el-card>

    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      show-icon
      class="state"
    >
      {{ errorMessage }}
      <el-button link type="primary" @click="load">重试</el-button>
    </el-alert>

    <template v-else-if="latest">
      <section class="summary-grid">
        <el-card shadow="never"
          ><span>M1 余额</span
          ><strong>{{ formatValue(latest.m1_balance, 0) }} 亿元</strong
          ><small>{{ latest.month }}</small></el-card
        >
        <el-card shadow="never"
          ><span>M2 余额</span
          ><strong>{{ formatValue(latest.m2_balance, 0) }} 亿元</strong
          ><small>{{ latest.month }}</small></el-card
        >
        <el-card shadow="never"
          ><span>M1 同比</span
          ><strong>{{ formatPercent(latest.m1_yoy) }}</strong
          ><small>{{ latest.m1_methodology_version }}</small></el-card
        >
        <el-card shadow="never"
          ><span>M1-M2 同比增速差</span
          ><strong>{{ formatPercent(latest.m1_m2_yoy_gap) }}</strong
          ><small>百分点</small></el-card
        >
      </section>

      <el-card shadow="never" class="chart-card">
        <template #header>{{
          chartMode === "yoy" ? "同比与增速差趋势" : "M1/M2 余额趋势"
        }}</template>
        <div v-if="chartRows.length" class="chart-wrap">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-label="M1 M2 trend chart"
          >
            <path :d="path(m1Points)" class="line m1" />
            <path :d="path(m2Points)" class="line m2" />
            <path
              v-if="chartMode === 'yoy'"
              :d="path(gapPoints)"
              class="line gap"
            />
          </svg>
          <div class="legend">
            <i class="m1" />M1 <i class="m2" />M2
            <i v-if="chartMode === 'yoy'" class="gap" />{{
              chartMode === "yoy" ? "增速差" : ""
            }}
          </div>
          <div class="axis">
            <span>{{ chartRows[0]?.month }}</span
            ><span>{{ chartRows.at(-1)?.month }}</span>
          </div>
        </div>
        <el-empty v-else description="所选月份尚无完整的 M1/M2 数据" />
      </el-card>

      <el-card shadow="never" class="source-card">
        <p>
          观察月份：{{ latest.month }}；发布时间：{{
            latest.published_at || "待确认"
          }}；来源：{{ latest.source || "-" }}；质量：{{
            latest.quality || "-"
          }}
        </p>
        <a
          v-if="latest.source_url"
          :href="latest.source_url"
          target="_blank"
          rel="noreferrer"
          >查看来源</a
        >
      </el-card>
    </template>
    <el-empty
      v-else-if="!loading"
      description="当前查询范围内暂无月度货币供应量数据"
    />
  </div>
</template>

<style scoped>
.macro-liquidity-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.toolbar,
.toolbar-actions,
.summary-grid {
  display: flex;
  gap: 16px;
}

.toolbar {
  align-items: center;
  justify-content: space-between;
}

.toolbar h2,
.toolbar p {
  margin: 0;
}

.toolbar p {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.toolbar-actions {
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.summary-grid :deep(.el-card__body) {
  display: grid;
  gap: 8px;
}

.summary-grid strong {
  font-size: 24px;
}

.summary-grid small {
  color: var(--el-text-color-secondary);
}

.chart-wrap {
  min-height: 300px;
}

.chart-wrap svg {
  width: 100%;
  height: 250px;
  overflow: visible;
}

.line {
  fill: none;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.m1 {
  stroke: #409eff;
}

.m2 {
  stroke: #67c23a;
}

.gap {
  stroke: #e6a23c;
  stroke-dasharray: 4 3;
}

.legend {
  display: flex;
  gap: 8px;
  align-items: center;
}

.legend i {
  display: inline-block;
  width: 16px;
  height: 3px;
}

.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
}

.source-card p {
  margin: 0 0 8px;
}

.state {
  margin-top: 16px;
}

@media (width <= 900px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 560px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-actions :deep(.el-date-editor) {
    width: 100%;
  }
}
</style>
