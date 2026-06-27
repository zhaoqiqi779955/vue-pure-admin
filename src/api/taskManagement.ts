import { http } from "@/utils/http";

export type TaskManagementItem = {
  id: number | string;
  task_type: number;
  input: string;
  output: string;
  status: string;
  created_time: string;
  updated_time: string;
};

export type ListTaskManagementParams = {
  task_type?: number;
  status?: string;
  created_time_start?: string;
  created_time_end?: string;
  limit?: number;
  offset?: number;
};

export type ListTaskManagementResult = {
  total: number;
  tasks: TaskManagementItem[];
};

export type TaskManagementPayload = {
  task_type: number;
  input: string;
  output?: string;
  status?: string;
};

export type TaskManagementResult = {
  task: TaskManagementItem;
};

export type DeleteTaskManagementResult = {
  deleted: boolean;
};

/** 获取任务管理列表 */
export const getTaskManagementList = (params?: ListTaskManagementParams) => {
  return http.request<ListTaskManagementResult>(
    "get",
    "/api/task-management/tasks",
    params ? { params } : undefined
  );
};

/** 新增任务 */
export const createTaskManagement = (data: TaskManagementPayload) => {
  return http.request<TaskManagementResult>(
    "post",
    "/api/task-management/tasks",
    {
      data
    }
  );
};

/** 更新任务 */
export const updateTaskManagement = (
  id: number | string,
  data: TaskManagementPayload
) => {
  return http.request<TaskManagementResult>(
    "put",
    `/api/task-management/tasks/${id}`,
    { data }
  );
};

/** 删除任务 */
export const deleteTaskManagement = (id: number | string) => {
  return http.request<DeleteTaskManagementResult>(
    "delete",
    `/api/task-management/tasks/${id}`
  );
};
