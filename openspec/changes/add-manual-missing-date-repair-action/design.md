# Manual Missing-Date Repair Action Design

## Context

`/scheduler/tasks` 当前是数据更新记录页，已经具备更新任务列表、筛选、分页、复制提交和调度状态 tab。后端配套 change `add-manual-missing-date-scan-api` 将提供 `POST /api/dashboard/daily/missing-date-scans`，用于立即执行一次缺失日期扫描并提交 `repair_scheduler` 来源的补采任务。

前端不应自行判断缺失日期，也不应循环调用普通 `POST /daily/updates`。缺失日期窗口、工作日候选、已有快照跳过、未完成任务跳过和失败重试语义都应由后端统一维护。

## Goals / Non-Goals

**Goals:**

- 在数据更新记录页提供手动触发缺失数据修复的按钮。
- 调用后端手动扫描接口，并展示本次扫描摘要。
- 防止重复点击造成并发请求。
- 成功后刷新数据更新记录列表，使用户能看到新提交的 `repair_scheduler` 任务。
- 保持现有手动区间更新、筛选、分页和调度状态 tab 行为不变。

**Non-Goals:**

- 不在前端计算缺失日期。
- 不提供自定义扫描时间窗口或选择部分数据类型。
- 不改变“提交更新任务”弹窗的 `api` 来源任务语义。
- 不新增独立页面或路由。

## Decisions

### Decision 1: 将操作放在数据更新记录工具栏

新增按钮与“提交更新任务”并列。这个位置最贴近用户观察补采结果的列表，也避免把一次性操作放到调度状态 tab 中造成“修改调度器”的误解。

按钮文案建议为“修复缺失数据”，使用工具类图标。点击后弹出确认框，说明会扫描最近 21 天至昨天的工作日缺口并提交补采任务。

### Decision 2: 前端只调用后端扫描接口

在 `src/api/dataUpdates.ts` 增加 `submitMissingDateScan()` 和响应类型。页面调用 `POST /api/dashboard/daily/missing-date-scans`，不传数据类型或日期范围。

这样前端不会复制后端缺失判定逻辑，也能确保提交的任务来源为 `repair_scheduler`。

### Decision 3: 用摘要反馈而不是新增结果面板

接口成功后用消息提示展示 `submitted`、`missing`、`skipped_existing` 和 `skipped_unfinished` 等关键计数，并刷新更新记录列表。若 `submitted=0`，提示“未发现需要提交的缺失补采任务”。

不新增弹窗详情表格，避免引入额外状态管理；具体任务仍通过现有列表筛选 `trigger_source=repair_scheduler` 查看。

### Decision 4: 请求失败保持当前列表状态

接口失败时展示错误消息，不清空当前列表、不切换 tab。用户可以重试或查看后端日志。

## Risks / Trade-offs

- [Risk] 用户不理解扫描窗口。→ 确认弹窗中明确“最近 21 天至昨天、工作日候选”。
- [Risk] 成功提示摘要过长。→ 只展示核心计数，完整任务明细通过列表查看。
- [Risk] 后端接口尚未发布时按钮调用失败。→ 前后端配套 change 同步实施；失败时保留错误提示。
- [Risk] 重复点击触发多次扫描。→ 使用 `repairingMissingDates` loading 状态禁用按钮。

## Migration Plan

1. 增加手动扫描 API 类型和请求函数。
2. 在数据更新记录页工具栏增加“修复缺失数据”按钮、确认框、loading 和成功/失败提示。
3. 成功后刷新数据更新记录列表。
4. 更新前端 OpenSpec 规格。
5. 运行 `pnpm typecheck` 和相关 ESLint 检查。

## Open Questions

无。首版按钮触发全量默认窗口扫描，不提供自定义参数。
