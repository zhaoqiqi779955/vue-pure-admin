# Add Manual Missing-Date Repair Action

## Why

数据更新记录页已经能展示缺失扫描产生的补采任务，但用户发现近端数据缺口时仍无法从前端主动触发一次统一补缺扫描。需要在页面提供一个明确的手动修复入口，调用后端补缺扫描 API，并把提交结果反馈给用户。

## What Changes

- 在数据更新记录页工具栏新增“修复缺失数据”操作。
- 点击后展示确认提示，说明会扫描最近 21 天到昨天的工作日缺口，并提交补采任务。
- 新增前端 API 方法调用 `POST /api/dashboard/daily/missing-date-scans`。
- 成功后展示扫描摘要，突出本次提交的补采任务数量，并刷新数据更新记录列表。
- 请求期间按钮展示 loading，避免重复点击。
- 保留现有“提交更新任务”、筛选、分页和调度状态 tab 行为。

## Capabilities

### New Capabilities

### Modified Capabilities

- `data-update-records`: 在数据更新记录页增加手动触发缺失日期修复任务的操作入口和反馈。

## Impact

- 影响 `src/api/dataUpdates.ts` 和 `src/views/scheduler/tasks/index.vue`。
- 可能少量调整 `src/views/scheduler/tasks/utils/hook.tsx` 以复用文案或刷新逻辑。
- 依赖后端配套 change `add-manual-missing-date-scan-api` 提供 `POST /api/dashboard/daily/missing-date-scans`。
- 不新增前端路由、不改变现有列表接口和手动区间更新接口。
