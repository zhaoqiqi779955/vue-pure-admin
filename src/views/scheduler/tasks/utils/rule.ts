import { reactive } from "vue";
import type { FormRules } from "element-plus";

export const formRules = reactive(<FormRules>{
  task_name: [{ required: true, message: "任务名称为必填项", trigger: "blur" }],
  cron_expr: [
    { required: true, message: "Cron 表达式为必填项", trigger: "blur" }
  ],
  handler: [{ required: true, message: "处理器为必填项", trigger: "blur" }]
});
