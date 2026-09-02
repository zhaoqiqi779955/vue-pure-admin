<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  getMacroMarket,
  getMacroLiquidity,
  type MacroMarketSeries,
  type MacroLiquidityItem,
  type MoneySupplyItem,
  type MonthlySeriesObservation
} from "@/api/dashboard";
import CreditFlowBarChart from "./components/CreditFlowBarChart.vue";
import MacroMarketTrendChart from "./components/MacroMarketTrendChart.vue";
import MoneySupplyTrendChart from "./components/MoneySupplyTrendChart.vue";
import SocialFinancingStockTrendChart from "./components/SocialFinancingStockTrendChart.vue";

defineOptions({ name: "DashboardMacroLiquidity" });
const { locale, t } = useI18n();

type ChartMode = "yoy" | "balance";
type SeriesMeta = {
  label: string;
  month: string;
  observation: MonthlySeriesObservation;
};

const loading = ref(false);
const errorMessage = ref("");
const items = ref<MacroLiquidityItem[]>([]);
const unit = ref("亿元");
const chartMode = ref<ChartMode>("yoy");
const marketLoading = ref(false);
const marketErrorMessage = ref("");
const marketSeries = ref<MacroMarketSeries[]>([]);
const futuresSeriesCode = ref<"cgb_futures_t" | "cgb_futures_tl">(
  "cgb_futures_t"
);
const dateRange = ref<[string, string]>([
  dayjs().subtract(4, "year").format("YYYY-MM"),
  dayjs().format("YYYY-MM")
]);
const marketDateRange = ref<[string, string]>([
  dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);

const moneySupplyItems = computed<MoneySupplyItem[]>(() =>
  items.value.map(item => {
    const provenance = item.m1.latest ?? item.m2.latest;
    return {
      month: item.month,
      m1_balance: item.m1.latest?.value ?? null,
      m2_balance: item.m2.latest?.value ?? null,
      m1_yoy: item.m1_yoy,
      m2_yoy: item.m2_yoy,
      m1_m2_yoy_gap: item.m1_m2_yoy_gap,
      m1_comparable: item.m1_comparable,
      m1_yoy_source: item.m1_yoy_source,
      m1_revision: item.m1.latest?.revision ?? null,
      m2_revision: item.m2.latest?.revision ?? null,
      m1_methodology_version: item.m1.latest?.methodology_version ?? null,
      m2_methodology_version: item.m2.latest?.methodology_version ?? null,
      published_at: provenance?.published_at ?? null,
      collected_at: provenance?.collected_at ?? null,
      source: provenance?.source ?? null,
      source_url: provenance?.source_url ?? null,
      quality: provenance?.quality ?? null
    };
  })
);
const latestMoney = computed(() =>
  findLatest(item => item.m1.latest !== null || item.m2.latest !== null)
);
const latestStock = computed(() =>
  findLatest(item => item.social_financing_stock.latest !== null)
);
const latestSocialFlow = computed(() =>
  findLatest(item => item.social_financing_increment.ytd.latest !== null)
);
const latestEnterpriseFlow = computed(() =>
  findLatest(
    item => item.enterprise_medium_long_term_loan_increment.ytd.latest !== null
  )
);
const hasDegraded = computed(() =>
  items.value.some(item =>
    [
      item.m1.latest,
      item.m2.latest,
      item.social_financing_stock.latest,
      item.social_financing_increment.ytd.latest,
      item.enterprise_medium_long_term_loan_increment.ytd.latest
    ].some(observation => observation?.quality === "degraded")
  )
);
const hasPartial = computed(() =>
  items.value.some(item => {
    const count = [
      item.m1.latest,
      item.m2.latest,
      item.social_financing_stock.latest,
      item.social_financing_increment.ytd.latest,
      item.enterprise_medium_long_term_loan_increment.ytd.latest
    ].filter(Boolean).length;
    return count > 0 && count < 5;
  })
);
const hasMissingBase = computed(() =>
  items.value.some(
    item =>
      item.social_financing_increment.derivation_state === "missing_base" ||
      item.enterprise_medium_long_term_loan_increment.derivation_state ===
        "missing_base"
  )
);
const hasStale = computed(() => {
  const end = dayjs(`${dateRange.value[1]}-01`);
  return seriesMetadata.value.some(
    item => end.diff(dayjs(`${item.month}-01`), "month") > 2
  );
});
const hasMoneyTrendData = computed(() =>
  moneySupplyItems.value.some(item =>
    chartMode.value === "balance"
      ? item.m1_balance !== null || item.m2_balance !== null
      : item.m1_yoy !== null ||
        item.m2_yoy !== null ||
        item.m1_m2_yoy_gap !== null
  )
);
const hasStockData = computed(() =>
  items.value.some(item => item.social_financing_stock.latest !== null)
);
const hasSocialFlowData = computed(() =>
  items.value.some(
    item => item.social_financing_increment.monthly_value !== null
  )
);
const hasEnterpriseFlowData = computed(() =>
  items.value.some(
    item =>
      item.enterprise_medium_long_term_loan_increment.monthly_value !== null
  )
);
const seriesMetadata = computed<SeriesMeta[]>(() => {
  const definitions = [
    {
      label: "M1",
      select: (item: MacroLiquidityItem) => item.m1.latest
    },
    {
      label: "M2",
      select: (item: MacroLiquidityItem) => item.m2.latest
    },
    {
      label: "社融存量",
      select: (item: MacroLiquidityItem) => item.social_financing_stock.latest
    },
    {
      label: "社融增量",
      select: (item: MacroLiquidityItem) =>
        item.social_financing_increment.ytd.latest
    },
    {
      label: "企业中长期贷款",
      select: (item: MacroLiquidityItem) =>
        item.enterprise_medium_long_term_loan_increment.ytd.latest
    }
  ];
  return definitions.flatMap(definition => {
    const item = findLatest(candidate => definition.select(candidate) !== null);
    const observation = item ? definition.select(item) : null;
    return item && observation
      ? [{ label: definition.label, month: item.month, observation }]
      : [];
  });
});
const marketSeriesByCode = computed(
  () => new Map(marketSeries.value.map(series => [series.code, series]))
);
const hasMarketData = computed(() =>
  marketSeries.value.some(series => series.observations.length > 0)
);
const marketHasPartial = computed(
  () =>
    hasMarketData.value &&
    marketSeries.value.some(series => series.observations.length === 0)
);
const marketHasStale = computed(() =>
  marketSeries.value.some(series => {
    const latest = series.observations.at(-1);
    return latest
      ? dayjs(marketDateRange.value[1]).diff(dayjs(latest.date), "day") > 7
      : false;
  })
);
const marketHighlights = computed(() =>
  [
    "dr007",
    "cn_govt_10y",
    "cn_govt_30y",
    "credit_spread_aaa_3y",
    "usd_cny_midpoint",
    "us_fed_funds_target_lower",
    "us_fed_funds_target_upper",
    "us_fed_funds_effective",
    "us_treasury_10y"
  ].flatMap(code => {
    const series = marketSeriesByCode.value.get(code);
    const latest = series?.observations.at(-1);
    return series && latest
      ? [{ series: localizeMarketSeries(series), latest }]
      : [];
  })
);
const marketCharts = computed(() => [
  {
    key: "dr007",
    title: t("macroMarket.series.dr007"),
    unit: "%",
    series: selectMarketSeries("dr007")
  },
  {
    key: "china-yields",
    title: t("macroMarket.charts.chinaYields"),
    unit: "%",
    series: selectMarketSeries("cn_govt_10y", "cn_govt_30y")
  },
  {
    key: "term-spread",
    title: t("macroMarket.series.cn_govt_30y_10y_spread"),
    unit: "bp",
    series: selectMarketSeries("cn_govt_30y_10y_spread")
  },
  {
    key: "futures",
    title: t("macroMarket.charts.treasuryFutures"),
    unit: "price",
    series: selectMarketSeries(futuresSeriesCode.value)
  },
  {
    key: "credit-spread",
    title: t("macroMarket.series.credit_spread_aaa_3y"),
    unit: "bp",
    series: selectMarketSeries("credit_spread_aaa_3y")
  },
  {
    key: "rmb-fx",
    title: t("macroMarket.series.usd_cny_midpoint"),
    unit: "CNY/USD",
    series: selectMarketSeries("usd_cny_midpoint")
  },
  {
    key: "fed-funds",
    title: t("macroMarket.charts.usFedFunds"),
    unit: "%",
    series: selectMarketSeries(
      "us_fed_funds_target_lower",
      "us_fed_funds_target_upper",
      "us_fed_funds_effective"
    )
  },
  {
    key: "us-yields",
    title: t("macroMarket.charts.usTreasuryYields"),
    unit: "%",
    series: selectMarketSeries("us_treasury_10y", "us_treasury_30y")
  }
]);

function findLatest(predicate: (item: MacroLiquidityItem) => boolean) {
  return [...items.value].reverse().find(predicate);
}

function selectMarketSeries(...codes: string[]) {
  return codes.flatMap(code => {
    const series = marketSeriesByCode.value.get(code);
    return series ? [localizeMarketSeries(series)] : [];
  });
}

function localizeMarketSeries(series: MacroMarketSeries): MacroMarketSeries {
  const key = `macroMarket.series.${series.code}`;
  return { ...series, name: t(key) };
}

function formatValue(value: number | string | null | undefined, digits = 1) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString(locale.value, { maximumFractionDigits: digits })
    : "-";
}

function formatPercent(value: number | null | undefined) {
  return value === null || value === undefined
    ? "不可比"
    : `${formatValue(value, 2)}%`;
}

function formatTrillion(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? formatValue(number / 10000, 2) : "-";
}

function formatDateTime(value: string | null | undefined) {
  return value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "待确认";
}

function flowState(value: "derived_from_ytd" | "missing_base" | "missing") {
  if (value === "missing_base") return "缺少上月累计基期";
  if (value === "missing") return "累计值缺失";
  return "由官方累计值派生";
}

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const data = await getMacroLiquidity({
      start_month: dateRange.value[0],
      end_month: dateRange.value[1]
    });
    unit.value = data.unit;
    items.value = data.items.sort((left, right) =>
      left.month.localeCompare(right.month)
    );
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "加载宏观流动性数据失败";
  } finally {
    loading.value = false;
  }
}

async function loadMarket() {
  marketLoading.value = true;
  marketErrorMessage.value = "";
  try {
    const data = await getMacroMarket({
      start_date: marketDateRange.value[0],
      end_date: marketDateRange.value[1]
    });
    marketSeries.value = data.series;
  } catch (error) {
    marketErrorMessage.value =
      error instanceof Error
        ? error.message
        : t("macroMarket.states.loadError");
  } finally {
    marketLoading.value = false;
  }
}

onMounted(() => {
  void Promise.all([load(), loadMarket()]);
});
</script>

<template>
  <div v-loading="loading" class="macro-liquidity-page">
    <el-card shadow="never">
      <div class="toolbar">
        <div>
          <h2>宏观流动性</h2>
          <p>人民银行月度货币与信用数据</p>
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

    <template v-else-if="items.length">
      <div class="state-stack">
        <el-alert
          v-if="hasPartial"
          type="info"
          :closable="false"
          show-icon
          title="部分月份仅有部分指标，图表保留可用数据。"
        />
        <el-alert
          v-if="hasDegraded"
          type="warning"
          :closable="false"
          show-icon
          title="部分数据来自降级来源，请以人民银行最终公布数据为准。"
        />
        <el-alert
          v-if="hasMissingBase"
          type="warning"
          :closable="false"
          show-icon
          title="部分单月流量缺少上月累计基期，已按空值展示。"
        />
        <el-alert
          v-if="hasStale"
          type="warning"
          :closable="false"
          show-icon
          title="部分指标最新月份早于查询结束月份超过两个月。"
        />
      </div>

      <section class="summary-grid">
        <el-card shadow="never">
          <span>M1 余额</span>
          <strong
            >{{ formatValue(latestMoney?.m1.latest?.value, 0) }}
            {{ unit }}</strong
          >
          <small>{{ latestMoney?.month ?? "-" }}</small>
        </el-card>
        <el-card shadow="never">
          <span>M2 余额</span>
          <strong
            >{{ formatValue(latestMoney?.m2.latest?.value, 0) }}
            {{ unit }}</strong
          >
          <small>{{ latestMoney?.month ?? "-" }}</small>
        </el-card>
        <el-card shadow="never">
          <span>M1 同比</span>
          <strong>{{ formatPercent(latestMoney?.m1_yoy) }}</strong>
          <small>{{
            latestMoney?.m1.latest?.methodology_version ?? "-"
          }}</small>
        </el-card>
        <el-card shadow="never">
          <span>M1-M2 同比增速差</span>
          <strong>{{ formatPercent(latestMoney?.m1_m2_yoy_gap) }}</strong>
          <small>百分点</small>
        </el-card>
        <el-card shadow="never" class="summary-card-stock">
          <span>社融存量</span>
          <strong
            >{{
              formatTrillion(latestStock?.social_financing_stock.latest?.value)
            }}
            万亿元</strong
          >
          <small>
            {{ latestStock?.month ?? "-" }} · 同比
            {{
              latestStock?.social_financing_stock.latest
                ?.reported_yoy_percent ?? "-"
            }}%
          </small>
        </el-card>
        <el-card shadow="never">
          <span>社融单月增量</span>
          <strong
            >{{
              formatValue(
                latestSocialFlow?.social_financing_increment.monthly_value,
                2
              )
            }}
            {{ unit }}</strong
          >
          <small>
            {{ latestSocialFlow?.month ?? "-" }} ·
            {{
              flowState(
                latestSocialFlow?.social_financing_increment.derivation_state ??
                  "missing"
              )
            }}
          </small>
        </el-card>
        <el-card shadow="never">
          <span>企业中长期贷款单月增量</span>
          <strong
            >{{
              formatValue(
                latestEnterpriseFlow?.enterprise_medium_long_term_loan_increment
                  .monthly_value,
                2
              )
            }}
            {{ unit }}</strong
          >
          <small>
            {{ latestEnterpriseFlow?.month ?? "-" }} ·
            {{
              flowState(
                latestEnterpriseFlow?.enterprise_medium_long_term_loan_increment
                  .derivation_state ?? "missing"
              )
            }}
          </small>
        </el-card>
      </section>

      <el-card shadow="never" class="chart-card">
        <template #header>
          {{ chartMode === "yoy" ? "M1/M2 同比与增速差" : "M1/M2 余额" }}
        </template>
        <div v-if="hasMoneyTrendData" class="chart-wrap">
          <MoneySupplyTrendChart :items="moneySupplyItems" :mode="chartMode" />
        </div>
        <el-empty v-else description="所选月份暂无可用的 M1/M2 趋势数据" />
      </el-card>

      <el-card shadow="never" class="chart-card">
        <template #header>社会融资规模存量</template>
        <SocialFinancingStockTrendChart v-if="hasStockData" :items="items" />
        <el-empty v-else description="所选月份暂无社融存量数据" />
      </el-card>

      <section class="flow-grid">
        <el-card shadow="never" class="chart-card">
          <template #header>社会融资规模单月增量</template>
          <CreditFlowBarChart
            v-if="hasSocialFlowData"
            :items="items"
            kind="social_financing"
          />
          <el-empty v-else description="所选月份暂无可派生的社融单月增量" />
        </el-card>
        <el-card shadow="never" class="chart-card">
          <template #header>企业中长期贷款单月增量</template>
          <CreditFlowBarChart
            v-if="hasEnterpriseFlowData"
            :items="items"
            kind="enterprise_loan"
          />
          <el-empty
            v-else
            description="所选月份暂无可派生的企业中长期贷款单月增量"
          />
        </el-card>
      </section>

      <el-card shadow="never" class="source-card">
        <template #header>数据来源</template>
        <div class="source-list">
          <div
            v-for="metadata in seriesMetadata"
            :key="metadata.label"
            class="source-row"
          >
            <div>
              <strong>{{ metadata.label }}</strong>
              <span>{{ metadata.month }}</span>
            </div>
            <div class="source-detail">
              <span>{{ metadata.observation.source }}</span>
              <el-tag
                :type="
                  metadata.observation.quality === 'fresh'
                    ? 'success'
                    : 'warning'
                "
                size="small"
                effect="plain"
              >
                {{ metadata.observation.quality === "fresh" ? "官方" : "降级" }}
              </el-tag>
              <span>{{
                formatDateTime(metadata.observation.published_at)
              }}</span>
              <a
                :href="metadata.observation.source_url"
                target="_blank"
                rel="noreferrer"
              >
                查看来源
              </a>
            </div>
          </div>
        </div>
      </el-card>
    </template>

    <el-empty
      v-else-if="!loading"
      description="当前查询范围内暂无宏观流动性数据"
    />

    <section v-loading="marketLoading" class="market-section">
      <div class="market-heading">
        <div>
          <h3>{{ t("macroMarket.title") }}</h3>
          <p>{{ t("macroMarket.subtitle") }}</p>
        </div>
        <el-date-picker
          v-model="marketDateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :range-separator="t('macroMarket.dateRange.separator')"
          :start-placeholder="t('macroMarket.dateRange.start')"
          :end-placeholder="t('macroMarket.dateRange.end')"
          :clearable="false"
          @change="loadMarket"
        />
      </div>

      <el-alert
        v-if="marketErrorMessage"
        type="error"
        :closable="false"
        show-icon
      >
        {{ marketErrorMessage }}
        <el-button link type="primary" @click="loadMarket">
          {{ t("macroMarket.states.retry") }}
        </el-button>
      </el-alert>

      <template v-else-if="hasMarketData">
        <div class="state-stack">
          <el-alert
            v-if="marketHasPartial"
            type="info"
            :closable="false"
            show-icon
            :title="t('macroMarket.states.partial')"
          />
          <el-alert
            v-if="marketHasStale"
            type="warning"
            :closable="false"
            show-icon
            :title="t('macroMarket.states.stale')"
          />
        </div>

        <div class="market-metrics">
          <div
            v-for="item in marketHighlights"
            :key="item.series.code"
            class="market-metric"
          >
            <span>{{ item.series.name }}</span>
            <strong>
              {{ formatValue(item.latest.value, 4) }}
              {{
                item.series.unit === "price"
                  ? t("macroMarket.units.points")
                  : item.series.unit
              }}
            </strong>
            <small>{{ item.latest.date }} · {{ item.latest.source }}</small>
          </div>
        </div>

        <div class="market-grid">
          <el-card
            v-for="chart in marketCharts"
            :key="chart.key"
            shadow="never"
            class="chart-card"
          >
            <template #header>
              <div class="market-chart-header">
                <span>{{ chart.title }}</span>
                <el-radio-group
                  v-if="chart.key === 'futures'"
                  v-model="futuresSeriesCode"
                  size="small"
                >
                  <el-radio-button value="cgb_futures_t">T</el-radio-button>
                  <el-radio-button value="cgb_futures_tl">TL</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <MacroMarketTrendChart
              v-if="chart.series.some(item => item.observations.length)"
              :key="`${chart.key}-${locale}`"
              :series="chart.series"
              :unit="chart.unit"
            />
            <el-empty
              v-else
              :description="t('macroMarket.states.chartEmpty')"
            />
          </el-card>
        </div>

        <div class="market-sources">
          <div
            v-for="item in marketHighlights"
            :key="`source-${item.series.code}`"
            class="market-source"
          >
            <span>{{ item.series.name }}</span>
            <span>{{ formatDateTime(item.latest.published_at) }}</span>
            <el-tag
              :type="item.latest.quality === 'fresh' ? 'success' : 'warning'"
              size="small"
              effect="plain"
            >
              {{
                item.latest.quality === "fresh"
                  ? t("macroMarket.quality.official")
                  : t("macroMarket.quality.degraded")
              }}
            </el-tag>
            <a
              v-if="item.latest.source_url"
              :href="item.latest.source_url"
              target="_blank"
              rel="noreferrer"
            >
              {{ t("macroMarket.viewSource") }}
            </a>
          </div>
        </div>
      </template>

      <el-empty
        v-else-if="!marketLoading"
        :description="t('macroMarket.states.empty')"
      />
    </section>
  </div>
</template>

<style scoped>
.macro-liquidity-page {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.toolbar,
.toolbar-actions {
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

.state-stack {
  display: grid;
  gap: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.summary-grid :deep(.el-card__body) {
  display: grid;
  gap: 8px;
  align-content: space-between;
  min-height: 112px;
}

.summary-grid strong {
  font-size: 22px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.summary-grid small,
.summary-grid span {
  color: var(--el-text-color-secondary);
}

.summary-card-stock {
  border-left: 3px solid #2563eb;
}

.chart-wrap {
  min-height: 300px;
}

.flow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.source-list {
  display: grid;
}

.source-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.6fr) minmax(0, 1.4fr);
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.source-row:last-child {
  border-bottom: 0;
}

.source-row > div,
.source-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.source-row span {
  color: var(--el-text-color-secondary);
}

.source-row a {
  color: var(--el-color-primary);
}

.state {
  margin-top: 16px;
}

.market-section {
  display: grid;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}

.market-heading,
.market-chart-header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.market-heading h3,
.market-heading p {
  margin: 0;
}

.market-heading p {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.market-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  border-top: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.market-metric {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.market-metric:last-child {
  border-right: 0;
}

.market-metric span,
.market-metric small {
  color: var(--el-text-color-secondary);
}

.market-metric strong {
  font-size: 20px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.market-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.market-sources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 8px 20px;
}

.market-source {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.market-source span:nth-child(2) {
  color: var(--el-text-color-secondary);
}

.market-source a {
  color: var(--el-color-primary);
}

@media (width <= 900px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar-actions {
    justify-content: flex-start;
  }

  .flow-grid,
  .market-grid {
    grid-template-columns: 1fr;
  }
}

@media (width <= 560px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-actions,
  .toolbar-actions :deep(.el-date-editor),
  .market-heading :deep(.el-date-editor) {
    width: 100%;
  }

  .market-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .market-metrics {
    grid-template-columns: 1fr 1fr;
  }

  .market-metric:nth-child(even) {
    border-right: 0;
  }

  .source-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
