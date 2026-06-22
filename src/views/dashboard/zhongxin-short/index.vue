<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import {
  getZhongxinFutureShortPosition,
  type ZhongxinFutureShortPositionItem
} from "@/api/dashboard";
import CumulativeTrendChart, {
  type TrendSeriesItem
} from "./components/CumulativeTrendChart.vue";
import ShortBarChart, {
  type ShortBarChartItem
} from "./components/ShortBarChart.vue";

defineOptions({
  name: "DashboardZhongxinShort"
});

type ShortField = keyof ZhongxinFutureShortPositionItem;

const loading = ref(false);
const errorMessage = ref("");
const latestItem = ref<ZhongxinFutureShortPositionItem>();
const trendDialogVisible = ref(false);
const trendLoading = ref(false);
const trendErrorMessage = ref("");
const trendItems = ref<ZhongxinFutureShortPositionItem[]>([]);
const trendDateRange = ref<[string, string]>([
  dayjs().subtract(6, "month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD")
]);

const cumulativeFields = [
  "IH_net_short",
  "IF_net_short",
  "IC_net_short",
  "IM_net_short",
  "total_net_short"
] as const satisfies ReadonlyArray<ShortField>;

const diffFields = [
  "IH_net_short_diff",
  "IF_net_short_diff",
  "IC_net_short_diff",
  "IM_net_short_diff",
  "total_net_short_diff"
] as const satisfies ReadonlyArray<ShortField>;

const fieldLabelMap: Partial<Record<ShortField, string>> = {
  IH_net_short: "上证50",
  IF_net_short: "沪深300",
  IC_net_short: "中证500",
  IM_net_short: "中证1000",
  total_net_short: "总空单"
};

function getTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLatestItem(items: ZhongxinFutureShortPositionItem[]) {
  return [...items]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(next.date) - getTimestamp(prev.date))[0];
}

function getFieldLabel(field: ShortField) {
  const baseField = field.replace(/_diff$/, "") as ShortField;
  return fieldLabelMap[baseField] ?? field;
}

function toChartData(
  item: ZhongxinFutureShortPositionItem | undefined,
  fields: ReadonlyArray<ShortField>
): ShortBarChartItem[] {
  if (!item) return [];

  return fields.map(field => ({
    label: getFieldLabel(field),
    value: Number(item[field] ?? 0)
  }));
}

const hasData = computed(() => Boolean(latestItem.value));

const cumulativeChartData = computed(() =>
  toChartData(latestItem.value, cumulativeFields)
);

const diffChartData = computed(() => toChartData(latestItem.value, diffFields));

const sortedTrendItems = computed(() =>
  [...trendItems.value]
    .filter(item => item && item.date)
    .sort((prev, next) => getTimestamp(prev.date) - getTimestamp(next.date))
);

const trendDates = computed(() =>
  sortedTrendItems.value.map(item => item.date)
);

const trendSeries = computed<TrendSeriesItem[]>(() =>
  cumulativeFields.map(field => ({
    name: getFieldLabel(field),
    data: sortedTrendItems.value.map(item => Number(item[field] ?? 0))
  }))
);

const hasTrendData = computed(() => sortedTrendItems.value.length > 0);

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { items } = await getZhongxinFutureShortPosition();
    latestItem.value = getLatestItem(items ?? []);
  } catch {
    latestItem.value = undefined;
    errorMessage.value = "中信空单数据加载失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

async function loadTrendData() {
  const [start_date, end_date] = trendDateRange.value;

  trendLoading.value = true;
  trendErrorMessage.value = "";

  try {
    const { items } = await getZhongxinFutureShortPosition({
      start_date,
      end_date
    });
    trendItems.value = items ?? [];
  } catch {
    trendItems.value = [];
    trendErrorMessage.value = "累计空单趋势加载失败，请稍后重试";
  } finally {
    trendLoading.value = false;
  }
}

function openTrendDialog() {
  trendDialogVisible.value = true;
  loadTrendData();
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="zhongxin-short-page">
    <el-card shadow="never" class="mb-4">
      <div class="flex-bc flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-medium">中信空单数据</h2>
          <p class="mt-1 text-sm text-text_color_regular">
            默认展示接口最新值，字段按累计空单和空单变化量拆分。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="latestItem?.date" class="text-sm text-text_color_regular">
            数据日期：{{ latestItem.date }}
          </span>
          <el-button :loading="loading" @click="loadData">刷新</el-button>
        </div>
      </div>
    </el-card>

    <el-alert
      v-if="errorMessage"
      class="mb-4"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-skeleton v-if="loading" :rows="8" animated />

    <el-empty v-else-if="!hasData" description="暂无中信空单数据" />

    <el-row v-else :gutter="16">
      <el-col :xs="24" :lg="12" class="mb-4">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">累计空单</span>
          </template>
          <ShortBarChart
            class="cursor-pointer"
            :data="cumulativeChartData"
            color="#409eff"
            @click="openTrendDialog"
          />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12" class="mb-4">
        <el-card shadow="never">
          <template #header>
            <span class="font-medium">空单变化量</span>
          </template>
          <ShortBarChart :data="diffChartData" color="#e6a23c" />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="trendDialogVisible"
      title="累计空单变化趋势"
      width="80%"
      top="6vh"
    >
      <div class="mb-4 flex-bc flex-wrap gap-3">
        <span class="text-sm text-text_color_regular">
          默认展示最近半年数据，可手动输入时间范围。
        </span>
        <el-date-picker
          v-model="trendDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :clearable="false"
          @change="loadTrendData"
        />
      </div>

      <el-alert
        v-if="trendErrorMessage"
        class="mb-4"
        :title="trendErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <el-skeleton v-if="trendLoading" :rows="8" animated />
      <el-empty v-else-if="!hasTrendData" description="暂无累计空单趋势数据" />
      <CumulativeTrendChart v-else :dates="trendDates" :series="trendSeries" />
    </el-dialog>
  </div>
</template>

<style scoped>
.zhongxin-short-page {
  padding: 16px;
}
</style>
