## Why

前端现有“定时任务”页面依赖已经不再适用于日度数据服务的 `/api/scheduler/tasks` CRUD 接口，无法展示核心 ETF 采集的实际执行结果。后端现已提供 `GET /api/dashboard/daily/updates`，前端需要将任务配置管理入口调整为可观测的数据更新记录入口。

## What Changes

- 将导航和页面用户可见名称从“定时任务”调整为“数据更新记录”，首期保留原路由路径以兼容已有书签和标签页。
- 使用 `GET /api/dashboard/daily/updates` 查询数据更新运行记录，支持数据类型、状态、目标日期范围筛选以及 `limit`/`offset` 分页。
- 提供手动提交数据更新任务入口，调用 `POST /api/dashboard/daily/updates` 按数据类型和闭区间日期异步创建任务。
- 展示任务名称、触发来源、数据类型、目标日期区间、执行状态、聚合进度、错误摘要和提交/执行时间。
- 移除旧定时任务配置的新增、编辑、删除能力，以及 Cron、处理器、下次执行时间等配置字段；保留数据更新任务的手动提交能力。
- 用中文状态标签、空值占位和错误摘要 Tooltip 清晰呈现 `queued`、`running`、`success`、`partial_success`、`failed` 区间任务。

## Capabilities

### New Capabilities

- `data-update-records`: 定义数据更新记录入口、查询筛选、分页和运行结果展示行为。

### Modified Capabilities

- `scheduler-task-management`: 移除旧定时任务菜单、列表筛选及 CRUD 管理要求，由只读数据更新记录能力取代。

## Impact

- 影响前端 API 类型与请求封装、定时任务视图及 hook、路由国际化文案和 OpenSpec 主规范。
- 前端接口依赖从 `/api/scheduler/tasks` 切换至 `/api/dashboard/daily/updates` 的 GET/POST 能力。
- 不新增依赖，不修改后端，也不改动正在进行的 Dashboard 核心 ETF 接口适配。
