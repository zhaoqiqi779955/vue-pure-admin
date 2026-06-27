import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive(<FormRules>{
  task_type: [{ required: true, message: "任务类型为必填项", trigger: "blur" }],
  input: [{ required: true, message: "输入为必填项", trigger: "blur" }],
  status: [{ required: true, message: "状态为必填项", trigger: "blur" }]
});
