<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import type { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    task_name: "",
    cron_expr: "",
    handler: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="100px"
  >
    <el-form-item label="任务名称" prop="task_name">
      <el-input
        v-model="newFormInline.task_name"
        clearable
        placeholder="请输入任务名称"
      />
    </el-form-item>

    <el-form-item label="Cron 表达式" prop="cron_expr">
      <el-input
        v-model="newFormInline.cron_expr"
        clearable
        placeholder="请输入 Cron 表达式"
      />
    </el-form-item>

    <el-form-item label="处理器" prop="handler">
      <el-input
        v-model="newFormInline.handler"
        clearable
        placeholder="请输入处理器"
      />
    </el-form-item>
  </el-form>
</template>
