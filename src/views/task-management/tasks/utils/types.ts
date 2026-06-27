interface FormItemProps {
  /** 任务类型 */
  task_type: number | undefined;
  /** 输入 */
  input: string;
  /** 输出 */
  output?: string;
  /** 状态 */
  status?: string;
  /** 是否编辑 */
  isEdit?: boolean;
}

interface FormProps {
  formInline: FormItemProps;
}

export type { FormItemProps, FormProps };
