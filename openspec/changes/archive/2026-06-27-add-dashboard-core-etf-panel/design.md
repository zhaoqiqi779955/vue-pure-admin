## Context

Dashboard 当前页面位于 `src/views/dashboard/zhongxin-short/index.vue`，已接入中信空单数据和大盘核心数据。后端在 `/Users/bytedance/src/ecom_backend/idl/ecom.proto` 中提供 `GetCoreETFData`：

- `GET /api/data/etf/core`
- 查询参数：`start_date`、`end_date`
- 返回列表：`items: CoreETFDataItem[]`
- 单日数据字段：`date`、`etfs`
- `etfs` 为按 ETF 代码组织的映射，单只 ETF 包含 `name`、`share`、`share_yi`、`share_stat_date`、`unit_nav`、`accumulated_nav`、`nav_date`

任务文档中当前覆盖 ETF：

- `510300`：沪深300ETF
- `510500`：中证500ETF
- `512100`：中证1000ETF

现有 API 接口集中在 `src/api/dashboard.ts`，页面图表使用 ECharts 与 `@pureadmin/utils`，不需要新增依赖。

## Goals / Non-Goals

**Goals:**

- 在 Dashboard 页面展示核心 ETF 数据面板。
- 默认不传参数请求 `/api/data/etf/core`，选择返回 items 中日期最新的一条作为当前概览数据。
- 展示每只 ETF 的基金份额 `share_yi` 和单位净值 `unit_nav`。
- 展示两张折线图：
  - 基金份额折线图，单位亿份
  - 单位净值折线图
- 折线图按日期升序展示，且每只 ETF 一条折线。
- 趋势查询默认使用最新 ETF 数据日期向前推 6 个月；如果没有可用最新日期，则使用当天向前推 6 个月。
- 保持现有中信空单数据和大盘核心数据展示行为不变。

**Non-Goals:**

- 不展示 `share` 原始份额、`accumulated_nav`、`share_stat_date`、`nav_date` 的独立趋势图。
- 不新增核心 ETF 数据采集任务提交入口。
- 不新增路由或菜单；该面板属于现有 Dashboard 页面的一部分。
- 不引入新的图表库或状态管理模块。

## Decisions

### Decision: 将 API 扩展放入 `src/api/dashboard.ts`

核心 ETF 数据属于 Dashboard 展示域，与已有中信空单和大盘核心数据相邻。新增 `CoreETFDataParams`、`CoreETFItem`、`CoreETFDataItem`、`CoreETFDataResult` 和 `getCoreETFData()`，保持 `/api` 相对路径和 `http.request<T>()` 模式。

### Decision: 当前概览值取最新日期记录

默认请求不传 `start_date` / `end_date`。前端按 `date` 排序选择最新记录，用于展示每只 ETF 当前的基金份额和单位净值。

### Decision: ETF 顺序以配置优先、接口补充

优先按任务文档覆盖 ETF 顺序展示：`510300`、`510500`、`512100`。如果接口返回额外 ETF 代码，则追加展示，名称优先取接口返回的 `name`，没有名称时回退到代码。

### Decision: 使用一个多 ETF 折线图组件渲染两种指标

新增或复用局部折线图组件，输入 `dates`、`series`、`unit`、`title` 等数据。份额图传入 `share_yi` 序列，净值图传入 `unit_nav` 序列。这样两张图的 ECharts 配置一致，避免重复维护 tooltip、legend、grid 和暗色主题逻辑。

### Decision: 日期范围控件控制两张图

核心 ETF 面板使用同一个日期范围查询趋势数据，两张图共用同一批接口结果。用户调整 `start_date` / `end_date` 后同时刷新基金份额图和单位净值图。

## Risks / Trade-offs

- `etfs` 是按代码组织的对象 → 需要把映射转换为稳定的 ETF 列表和多条 series，避免对象遍历顺序导致图例跳动。
- 部分日期可能缺少某只 ETF → 对缺失值使用 `null`，让 ECharts 断线，而不是用 0 误导用户。
- `share_yi`、`unit_nav` 都是 number → 渲染前仍需做有限数字校验，避免异常数据污染图表。
- 新增两张趋势图会增加 Dashboard 首屏长度 → 面板应保持紧凑，趋势图区域采用响应式双列或窄屏纵向布局。
