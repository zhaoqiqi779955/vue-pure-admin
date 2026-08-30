## Why

现有“定时任务”页面只显示已经提交的更新任务，无法显示 scheduler 的 Cron、下次执行时间和活跃租约。用户需要在前端直接判断每个已初始化的调度作业是否按预期推进。

## What Changes

- 在既有“定时任务”页面增加“调度状态”页签，保留原有数据更新记录功能。
- 调用后端调度状态接口，展示作业、Cron、下次执行、最近提交结果和租约信息。
- 对空状态、加载失败和刷新提供明确反馈；不增加修改 Cron 或控制 scheduler 的操作。

## Capabilities

### New Capabilities

- `scheduler-status-view`: 在调度管理页面展示已初始化调度作业的只读状态。

### Modified Capabilities

无。

## Impact

- 影响 `src/api/` 和 `src/views/scheduler/tasks/`。
- 依赖后端新增的 `GET /api/dashboard/daily/schedules` 接口。
- 不改变路由、原有更新任务列表或提交更新任务的交互。
