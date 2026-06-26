interface FormItemProps {
  /** 任务名称 */
  task_name: string;
  /** Cron 表达式 */
  cron_expr: string;
  /** 处理器 */
  handler: string;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
