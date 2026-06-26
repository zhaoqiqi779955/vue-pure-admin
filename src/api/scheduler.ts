import { http } from "@/utils/http";

export type ScheduledTaskItem = {
  id: number;
  task_name: string;
  cron_expr: string;
  handler: string;
  next_tick: string;
  last_execution_time: string;
  extra: string;
  created_time: string;
  updated_time: string;
};

export type ListScheduledTasksParams = {
  task_name?: string;
  handler?: string;
  limit?: number;
  offset?: number;
};

export type ListScheduledTasksResult = {
  total: number;
  tasks: ScheduledTaskItem[];
};

export type ScheduledTaskPayload = {
  task_name: string;
  cron_expr: string;
  handler: string;
};

export type ScheduledTaskResult = {
  task: ScheduledTaskItem;
};

export type DeleteScheduledTaskResult = {
  deleted: boolean;
};

/** 获取定时任务列表 */
export const getScheduledTaskList = (params?: ListScheduledTasksParams) => {
  return http.request<ListScheduledTasksResult>(
    "get",
    "/api/scheduler/tasks",
    params ? { params } : undefined
  );
};

/** 新增定时任务 */
export const createScheduledTask = (data: ScheduledTaskPayload) => {
  return http.request<ScheduledTaskResult>("post", "/api/scheduler/tasks", {
    data
  });
};

/** 更新定时任务 */
export const updateScheduledTask = (id: number, data: ScheduledTaskPayload) => {
  return http.request<ScheduledTaskResult>(
    "put",
    `/api/scheduler/tasks/${id}`,
    { data }
  );
};

/** 删除定时任务 */
export const deleteScheduledTask = (id: number) => {
  return http.request<DeleteScheduledTaskResult>(
    "delete",
    `/api/scheduler/tasks/${id}`
  );
};
