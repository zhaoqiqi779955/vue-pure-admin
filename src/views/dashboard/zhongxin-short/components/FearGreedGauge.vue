<script setup lang="ts">
import { useDark, useECharts } from "@pureadmin/utils";
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  }
});

const { isDark } = useDark();
const theme = computed(() => (isDark.value ? "dark" : "light"));
const chartRef = ref();
const { setOptions } = useECharts(chartRef, {
  theme,
  renderer: "svg"
});

watch(
  () => [props.value, props.label, props.unit],
  async () => {
    await nextTick();

    setOptions({
      series: [
        {
          type: "gauge",
          min: 0,
          max: 100,
          startAngle: 180,
          endAngle: 0,
          center: ["50%", "72%"],
          radius: "100%",
          splitNumber: 10,
          axisLine: {
            lineStyle: {
              width: 18,
              color: [
                [0.1, "#f56c6c"],
                [0.3, "#e6a23c"],
                [0.5, "#f7ba2a"],
                [0.7, "#95d475"],
                [0.9, "#67c23a"],
                [1, "#409eff"]
              ]
            }
          },
          pointer: {
            icon: "path://M2.4,0.8 L-2.4,0.8 L-1.2,-58 L1.2,-58 Z",
            length: "62%",
            width: 8,
            offsetCenter: [0, "-4%"],
            itemStyle: {
              color: "auto"
            }
          },
          anchor: {
            show: true,
            size: 14,
            itemStyle: {
              color: "auto",
              borderWidth: 3,
              borderColor: "#fff"
            }
          },
          axisTick: {
            distance: -24,
            length: 6,
            lineStyle: {
              color: "#fff",
              width: 1
            }
          },
          splitLine: {
            distance: -25,
            length: 12,
            lineStyle: {
              color: "#fff",
              width: 2
            }
          },
          axisLabel: {
            distance: 8,
            fontSize: 11,
            formatter: (value: number) =>
              value === 0 || value === 50 || value === 100 ? String(value) : ""
          },
          title: {
            offsetCenter: [0, "20%"],
            fontSize: 14,
            fontWeight: 500
          },
          detail: {
            offsetCenter: [0, "48%"],
            valueAnimation: true,
            formatter: `{value|${props.value.toFixed(1)}} {unit|${props.unit}}`,
            rich: {
              value: {
                fontSize: 30,
                fontWeight: 600,
                lineHeight: 36
              },
              unit: {
                fontSize: 12,
                color: "#909399"
              }
            }
          },
          data: [
            {
              value: props.value,
              name: props.label
            }
          ]
        }
      ]
    });
  },
  { immediate: true }
);
</script>

<template>
  <div ref="chartRef" class="h-60 w-full" />
</template>
