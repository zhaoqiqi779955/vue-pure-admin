<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { taskTypeOptions } from "./utils/taskType";
import type { FormProps } from "./utils/types";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    task_type: undefined,
    input: "",
    output: "",
    status: "",
    isEdit: false
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
    <el-form-item label="任务类型" prop="task_type">
      <el-select
        v-model="newFormInline.task_type"
        class="w-full!"
        placeholder="请选择任务类型"
      >
        <el-option
          v-for="item in taskTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="输入" prop="input">
      <el-input
        v-model="newFormInline.input"
        type="textarea"
        :rows="4"
        clearable
        placeholder="请输入输入"
      />
    </el-form-item>

    <el-form-item v-if="newFormInline.isEdit" label="输出" prop="output">
      <el-input
        v-model="newFormInline.output"
        type="textarea"
        :rows="4"
        clearable
        placeholder="请输入输出"
      />
    </el-form-item>

    <el-form-item v-if="newFormInline.isEdit" label="状态" prop="status">
      <el-input
        v-model="newFormInline.status"
        clearable
        placeholder="请输入状态"
      />
    </el-form-item>
  </el-form>
</template>
