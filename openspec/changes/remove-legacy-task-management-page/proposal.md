## Why

前端同时展示旧“任务管理”和新的“数据更新记录”两个任务入口，用户容易混淆 Go 通用任务与 Python 数据面板更新任务。旧任务管理页面不再作为当前数据面板的操作入口，应从前端导航和代码中移除。

## What Changes

- **BREAKING**：移除 `/task-management` 与 `/task-management/tasks` 静态路由，旧地址不再可访问。
- 删除旧任务管理页面、表单、页面专属工具代码及 `/api/task-management/tasks` 前端请求封装。
- 删除旧任务管理菜单排序常量和中英文国际化文案。
- 保留 `/scheduler/tasks` 数据更新记录与调度状态页面的现有行为。
- 不修改 `ecom_backend` 的通用任务接口、任务执行链路或数据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `data-update-records`: 明确数据更新记录是当前前端唯一保留的任务操作入口，并移除旧任务管理导航与路由。

## Impact

- 影响前端静态路由、菜单排序、国际化文案、任务管理视图和 API 封装。
- 旧书签或已持久化的 `/task-management/tasks` 标签页在重新加载后将进入未匹配路由。
- 不新增依赖，不修改 Python `ecom` 后端或 Go `ecom_backend` 后端。
