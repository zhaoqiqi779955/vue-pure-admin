## Context

前端当前自动加载 `src/router/modules/**/*.ts`，因此 `taskManagement.ts` 会持续注册“任务管理”一级菜单和 `/task-management/tasks` 页面。该页面调用 Go `ecom_backend` 的通用任务 CRUD；现有 `/scheduler/tasks` 则展示 Python `ecom` 数据面板的更新记录与调度状态。两套入口并存造成业务语义重复，但后端能力彼此独立。

工作区已有与 Dashboard 相关的未提交改动，本变更必须避免修改这些文件。

## Goals / Non-Goals

**Goals:**

- 从静态路由和菜单中彻底移除旧任务管理入口。
- 删除仅供该入口使用的页面、表单、工具函数和 API 客户端代码。
- 保持数据更新记录与调度状态页面行为不变。
- 保持其他菜单的现有排序不变。

**Non-Goals:**

- 不删除或修改 Go `ecom_backend` 的通用任务接口与执行链路。
- 不修改 Python `ecom` 的数据更新 API。
- 不将旧路由重定向到数据更新记录页。
- 不处理浏览器中已经持久化的旧标签页数据。

## Decisions

### Decision 1: 硬删除旧路由，不增加兼容重定向

删除 `taskManagement.ts` 后，静态路由自动加载器不再注册 `/task-management`。旧通用任务与数据更新记录的数据模型和后端不同，重定向会让用户误以为两者等价，因此旧地址按未匹配路由处理。

### Decision 2: 同步删除页面专属代码

`src/api/taskManagement.ts` 和 `src/views/task-management/` 仅由旧路由引用。删除路由时同步删除这些文件，避免保留不可达代码和失效接口调用。

### Decision 3: 保留其他菜单 rank 数值

只移除 `taskManagement` 常量及导出，不重排后续菜单 rank。路由排序只要求数值可比较，不要求连续；保留现有数值可避免无关菜单顺序变化和扩大 diff。

## Risks / Trade-offs

- [Risk] 旧书签和持久化标签页重新加载后无法访问。→ 明确采用硬删除语义，由全局未匹配路由处理。
- [Risk] 误删后端仍使用的通用任务能力。→ 本变更严格限制在前端仓库，不修改任何后端代码或接口。
- [Risk] 路由自动加载仍发现残留引用。→ 删除后执行全局文本检索、类型检查和生产构建。

## Migration Plan

1. 删除旧路由、页面目录和 API 封装。
2. 清理菜单 rank 与中英文文案。
3. 验证 `/scheduler/tasks` 相关文件无改动并执行前端检查。
4. 回滚时恢复被删除文件和文案即可，无数据迁移。

## Open Questions

无。
