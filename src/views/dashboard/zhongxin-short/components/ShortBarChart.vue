<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch, type PropType } from "vue";

export type ShortBarChartItem = {
  label: string;
  value: number;
};

const props = defineProps({
  data: {
    type: Array as PropType<ShortBarChartItem[]>,
    default: () => []
  },
  color: {
    type: String,
    default: "#409eff"
  }
});

const emit = defineEmits<{
  click: [];
}>();

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, { theme });

function formatChartValue(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

watch(
  () => [props.data, props.color],
  async () => {
    await nextTick();

    setOptions({
      color: [props.color],
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        },
        valueFormatter: formatChartValue
      },
      grid: {
        top: 24,
        right: 16,
        bottom: 42,
        left: 72
      },
      xAxis: {
        type: "category",
        data: props.data.map(item => item.label),
        axisTick: {
          alignWithLabel: true
        },
        axisLabel: {
          fontSize: 13
        }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          fontSize: 13,
          formatter: (value: number) => value.toLocaleString()
        },
        splitLine: {
          lineStyle: {
            type: "dashed"
          }
        }
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 42,
          data: props.data.map(item => item.value),
          itemStyle: {
            borderRadius: [6, 6, 0, 0]
          },
          label: {
            show: true,
            position: "top",
            formatter: ({ value }) => formatChartValue(value)
          }
        }
      ]
    });
  },
  {
    deep: true,
    immediate: true
  }
);
</script>

<template>
  <div ref="chartRef" class="h-90 w-full" @click="emit('click')" />
</template>
