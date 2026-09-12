<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  getHogHealth,
  getHogOverview,
  getHogSeries,
  type HogGateCondition,
  type HogSeries,
  type HogSeriesHealth
} from "@/api/industry-hog";
import HogCycleStatusStrip from "./components/HogCycleStatusStrip.vue";
import HogCycleGatePanel from "./components/HogCycleGatePanel.vue";
import HogIndicatorMatrix from "./components/HogIndicatorMatrix.vue";
import HogIndicatorTrendChart from "./components/HogIndicatorTrendChart.vue";
import HogEquityRelativeChart from "./components/HogEquityRelativeChart.vue";
import HogDataHealthPanel from "./components/HogDataHealthPanel.vue";

defineOptions({ name: "IndustryResearchHogCycle" });

const LOOKBACK_DAYS = 3660;

const dateRange = ref<[string, string]>([
  dayjs().subtract(LOOKBACK_DAYS, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);

const overview = ref<Awaited<ReturnType<typeof getHogOverview>> | null>(null);
const overviewLoading = ref(false);
const overviewError = ref("");

const seriesResult = ref<Awaited<ReturnType<typeof getHogSeries>> | null>(null);
const seriesLoading = ref(false);
const seriesError = ref("");

const health = ref<Awaited<ReturnType<typeof getHogHealth>> | null>(null);
const healthLoading = ref(false);
const healthError = ref("");

const activeTab = ref("overview");
const expandedGates = ref<string[]>(["capacity", "confirmation"]);

const TAB_MATRIX_CODES: Record<string, string[]> = {
  capacity: [
    "breeding_sow_inventory",
    "binary_sow_price",
    "piglet_price",
    "newborn_piglets",
    "sow_feed_output",
    "piglet_feed_output",
    "fattening_feed_output"
  ],
  supply: [
    "designated_slaughter_volume",
    "hog_inventory",
    "hog_slaughter",
    "pork_output"
  ],
  price: [
    "hog_live_price",
    "pork_price",
    "corn_price",
    "soybean_meal_price",
    "fattening_feed_price",
    "slaughter_weight",
    "frozen_inventory",
    "self_breeding_profit",
    "standard_fat_spread",
    "producer_capex_plan"
  ],
  equity: ["hog_equity_basket", "csi300_index", "hog_equity_relative"]
};

const TAB_CHART_CODES: Record<string, string[]> = {
  capacity: ["breeding_sow_inventory", "binary_sow_price", "piglet_price"],
  supply: [
    "designated_slaughter_volume",
    "hog_inventory",
    "hog_slaughter",
    "pork_output"
  ],
  price: [
    "hog_live_price",
    "pork_price",
    "corn_price",
    "soybean_meal_price",
    "fattening_feed_price"
  ]
};

const healthByCode = computed(() => {
  const map = new Map<string, HogSeriesHealth>();
  for (const item of health.value?.series ?? []) {
    map.set(item.code, item);
  }
  return map;
});

function matrixItems(tab: string): HogSeriesHealth[] {
  return TAB_MATRIX_CODES[tab].flatMap(code => {
    const item = healthByCode.value.get(code);
    return item ? [item] : [];
  });
}

function chartSeries(tab: string): HogSeries[] {
  const wanted = TAB_CHART_CODES[tab] ?? [];
  const byCode = new Map(
    (seriesResult.value?.series ?? []).map(entry => [entry.series.code, entry])
  );
  return wanted.flatMap(code => {
    const entry = byCode.get(code);
    return entry ? [entry] : [];
  });
}

function tabSeries(tab: string): HogSeries[] {
  const wanted = TAB_MATRIX_CODES[tab] ?? [];
  const byCode = new Map(
    (seriesResult.value?.series ?? []).map(entry => [entry.series.code, entry])
  );
  return wanted.flatMap(code => {
    const entry = byCode.get(code);
    return entry ? [entry] : [];
  });
}

const equitySeries = computed(() => tabSeries("equity"));

const b5Condition = computed<HogGateCondition | null>(
  () =>
    overview.value?.confirmation_gate.conditions.find(
      condition => condition.code === "B5"
    ) ?? null
);

const hasStale = computed(() =>
  (health.value?.series ?? []).some(item => item.state === "stale")
);

const hasDegraded = computed(() =>
  (health.value?.series ?? []).some(
    item => item.state === "degraded" || item.latest_quality === "degraded"
  )
);

const hasMissingEnabled = computed(() =>
  (health.value?.series ?? []).some(
    item => item.enabled && item.state === "missing"
  )
);

const hasPartialGroups = computed(() =>
  (health.value?.groups ?? []).some(
    group =>
      group.latest_status === "partial_success" ||
      group.latest_status === "failed"
  )
);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "数据加载失败，请稍后重试";
}

async function loadOverview() {
  overviewLoading.value = true;
  overviewError.value = "";
  try {
    overview.value = await getHogOverview();
  } catch (error) {
    overviewError.value = errorMessage(error);
  } finally {
    overviewLoading.value = false;
  }
}

async function loadSeries() {
  seriesLoading.value = true;
  seriesError.value = "";
  try {
    seriesResult.value = await getHogSeries({
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    });
  } catch (error) {
    seriesError.value = errorMessage(error);
  } finally {
    seriesLoading.value = false;
  }
}

async function loadHealth() {
  healthLoading.value = true;
  healthError.value = "";
  try {
    health.value = await getHogHealth();
  } catch (error) {
    healthError.value = errorMessage(error);
  } finally {
    healthLoading.value = false;
  }
}

onMounted(() => {
  void loadOverview();
  void loadSeries();
  void loadHealth();
});
</script>

<template>
  <div class="hog-cycle-page">
    <el-card shadow="never" class="page-header">
      <div class="header-row">
        <div>
          <h2>生猪周期前瞻指标</h2>
          <p>
            混合频率跟踪产能去化与供给兑现；周期阶段与闸门结论由后端规则
            {{ overview?.rule_version ?? "hog-cycle" }} 计算，页面仅展示。
          </p>
        </div>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          aria-label="趋势图日期范围"
          @change="loadSeries"
        />
      </div>
    </el-card>

    <el-alert
      v-if="overviewError"
      type="error"
      :closable="false"
      show-icon
      class="state-alert"
      :title="`周期总览加载失败：${overviewError}`"
    >
      <el-button link type="primary" @click="loadOverview"
        >重试加载总览</el-button
      >
    </el-alert>

    <div v-loading="overviewLoading" class="strip-wrap">
      <HogCycleStatusStrip v-if="overview" :overview="overview" />
      <el-skeleton v-else-if="overviewLoading" :rows="4" animated />
    </div>

    <div class="state-stack">
      <el-alert
        v-if="hasStale"
        type="warning"
        :closable="false"
        show-icon
        title="部分指标已超过新鲜度阈值，卡片标注了陈旧状态与实际最新观测日，请勿视为当前值。"
      />
      <el-alert
        v-if="hasDegraded"
        type="warning"
        :closable="false"
        show-icon
        title="部分观测来自降级回退来源，请以官方来源最终公布数据为准。"
      />
      <el-alert
        v-if="hasMissingEnabled"
        type="info"
        :closable="false"
        show-icon
        title="部分已启用指标尚无观测（含暂无授权数据源的商业指标），图表保留空缺、不以零值或代理值填充。"
      />
      <el-alert
        v-if="hasPartialGroups"
        type="warning"
        :closable="false"
        show-icon
        title="存在部分成功或失败的采集任务，详情见“数据健康”标签页。"
      />
    </div>

    <el-card shadow="never" class="tab-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="周期总览" name="overview">
          <el-alert
            v-if="overviewError"
            type="error"
            :closable="false"
            show-icon
            :title="`闸门详情依赖总览数据：${overviewError}`"
          >
            <el-button link type="primary" @click="loadOverview"
              >重试</el-button
            >
          </el-alert>
          <el-collapse v-else-if="overview" v-model="expandedGates">
            <HogCycleGatePanel :gate="overview.capacity_gate" />
            <HogCycleGatePanel :gate="overview.confirmation_gate" />
          </el-collapse>
          <el-skeleton v-else :rows="6" animated />
        </el-tab-pane>

        <el-tab-pane label="产能与仔猪" name="capacity">
          <div v-loading="healthLoading">
            <HogIndicatorMatrix
              v-if="health"
              :items="matrixItems('capacity')"
              :series="tabSeries('capacity')"
            />
          </div>
          <el-card shadow="never" class="chart-card">
            <template #header>
              能繁母猪存栏、二元母猪价格与仔猪价格（月/周混合频率，缺口不连线）
            </template>
            <div v-loading="seriesLoading">
              <el-alert
                v-if="seriesError"
                type="error"
                :closable="false"
                show-icon
                :title="`趋势数据加载失败：${seriesError}`"
              >
                <el-button link type="primary" @click="loadSeries"
                  >重试</el-button
                >
              </el-alert>
              <HogIndicatorTrendChart
                v-else
                :series="chartSeries('capacity')"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="供给与屠宰" name="supply">
          <div v-loading="healthLoading">
            <HogIndicatorMatrix
              v-if="health"
              :items="matrixItems('supply')"
              :series="tabSeries('supply')"
            />
          </div>
          <el-card shadow="never" class="chart-card">
            <template #header>
              定点屠宰量（月）与生猪存栏、出栏、猪肉产量（季）混合频率趋势
            </template>
            <div v-loading="seriesLoading">
              <el-alert
                v-if="seriesError"
                type="error"
                :closable="false"
                show-icon
                :title="`趋势数据加载失败：${seriesError}`"
              >
                <el-button link type="primary" @click="loadSeries"
                  >重试</el-button
                >
              </el-alert>
              <HogIndicatorTrendChart v-else :series="chartSeries('supply')" />
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="价格与盈利" name="price">
          <div v-loading="healthLoading">
            <HogIndicatorMatrix
              v-if="health"
              :items="matrixItems('price')"
              :series="tabSeries('price')"
            />
          </div>
          <el-card shadow="never" class="chart-card">
            <template #header>
              生猪、猪肉、玉米、豆粕与育肥配合饲料周度价格
            </template>
            <div v-loading="seriesLoading">
              <el-alert
                v-if="seriesError"
                type="error"
                :closable="false"
                show-icon
                :title="`趋势数据加载失败：${seriesError}`"
              >
                <el-button link type="primary" @click="loadSeries"
                  >重试</el-button
                >
              </el-alert>
              <HogIndicatorTrendChart v-else :series="chartSeries('price')" />
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="猪股验证" name="equity">
          <div v-loading="healthLoading">
            <HogIndicatorMatrix
              v-if="health"
              :items="matrixItems('equity')"
              :series="equitySeries"
            />
          </div>
          <el-card shadow="never" class="chart-card">
            <template #header>
              猪股等权篮子 vs 沪深300（基期 1000
              点）与相对强度；股权表现不改变基本面周期结论
            </template>
            <div v-loading="seriesLoading">
              <el-alert
                v-if="seriesError"
                type="error"
                :closable="false"
                show-icon
                :title="`相对强弱数据加载失败：${seriesError}`"
              >
                <el-button link type="primary" @click="loadSeries"
                  >重试</el-button
                >
              </el-alert>
              <HogEquityRelativeChart
                v-else
                :series="equitySeries"
                :b5-condition="b5Condition"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="数据健康" name="health">
          <div v-loading="healthLoading">
            <el-alert
              v-if="healthError"
              type="error"
              :closable="false"
              show-icon
              :title="`健康数据加载失败：${healthError}`"
            >
              <el-button link type="primary" @click="loadHealth"
                >重试</el-button
              >
            </el-alert>
            <HogDataHealthPanel v-else-if="health" :health="health" />
            <el-skeleton v-else :rows="8" animated />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.hog-cycle-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.page-header :deep(.el-card__body) {
  padding: 16px 20px;
}

.header-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.header-row h2,
.header-row p {
  margin: 0;
}

.header-row p {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.state-alert {
  margin: 0;
}

.state-stack {
  display: grid;
  gap: 8px;
}

.tab-card :deep(.el-card__body) {
  padding-top: 8px;
}

.chart-card {
  margin-top: 16px;
}

@media (width <= 560px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }

  .header-row :deep(.el-date-editor) {
    width: 100%;
  }
}
</style>
