## Context

Dashboard 当前页面位于 `src/views/dashboard/zhongxin-short/index.vue`，已具备默认加载最新数据、点击图表打开最近半年趋势弹窗的局部模式。后端在 `/Users/bytedance/src/ecom_backend/idl/ecom.proto` 中提供 `GetMarketCoreData`：

- `GET /api/data/market/core`
- 查询参数：`start_date`、`end_date`
- 返回列表：`items: MarketCoreDataItem[]`
- 关键字段：`date`、`total_amount_yi`、`limit_up_count`、`limit_down_count`

现有 API 接口集中在 `src/api/dashboard.ts`，页面图表使用 ECharts 与 `@pureadmin/utils`，不需要新增依赖。

## Goals / Non-Goals

**Goals:**

- 在 Dashboard 页面最上方展示大盘核心数据面板。
- 默认不传参数请求 `/api/data/market/core`，选择返回 items 中日期最新的一条作为当前展示值。
- 展示成交额、涨停家数、跌停家数三个指标。
- 点击任一指标后打开单指标最近半年折线图。
- 趋势弹窗允许用户调整 `start_date` / `end_date` 后重新加载。
- 保持现有中信空单展示行为不变。

**Non-Goals:**

- 不展示 proto 中的 `sources`、`exclude_st`、`sh_amount_yuan`、`sz_amount_yuan`、`limit_total_count`、`total_amount_yuan`。
- 不新增大盘核心数据采集任务提交入口。
- 不新增路由或菜单；该面板属于现有 Dashboard 页面的一部分。
- 不引入新的图表库或状态管理模块。

## Decisions

### Decision: 将 API 扩展放入 `src/api/dashboard.ts`

大盘核心数据属于 Dashboard 展示域，与已有 `getZhongxinFutureShortPosition` 相邻。新增 `MarketCoreDataParams`、`MarketCoreDataItem`、`MarketCoreDataResult` 和 `getMarketCoreData()`，保持 `/api` 相对路径和 `http.request<T>()` 模式。

备选方案是创建 `src/api/market.ts`。当前只有一个 Dashboard 消费方，独立 API 文件会增加跳转成本，因此暂不拆分。

### Decision: 当前值取返回列表中日期最新的一条

默认请求不传 `start_date` / `end_date`，但接口仍返回 `items` 数组。前端按 `date` 排序选择最新记录，和现有中信空单页面保持一致。

### Decision: 指标面板使用三个卡片

页面顶部新增一个 `el-card` 容器，内部使用三张可点击指标卡片：

- 成交额：`total_amount_yi`，展示单位「亿」
- 涨停家数：`limit_up_count`，展示单位「家」
- 跌停家数：`limit_down_count`，展示单位「家」

这种形式比柱状图更适合概览数据，且点击目标明确。

### Decision: 趋势图为单指标折线图

用户已确认点击哪个指标就展示哪个指标的单指标折线图。趋势弹窗默认日期范围为最近半年，沿用现有中信空单趋势弹窗的交互习惯。

### Decision: 新增局部趋势组件优先复用现有 ECharts 写法

现有 `CumulativeTrendChart.vue` 的 tooltip 绑定了 diff 数据，不适合直接复用。实现时新增一个轻量的单指标折线图组件，接受 `dates`、`label`、`unit`、`values`，并复用 `useECharts`、暗色主题和虚线网格样式。

## Risks / Trade-offs

- `total_amount_yi` 是 string → 渲染图表前必须转换为 number；转换失败时按 0 或过滤处理，避免 ECharts 接收非法值。
- 接口默认不传参数时可能返回空数组 → 面板应显示空态或 `-`，不能展示误导性的 0。
- 最近半年范围以当前日期计算可能与最新数据日期不一致 → 更稳妥做法是以最新记录 `date` 为结束日期，向前推 6 个月。
- 新增顶部面板会增加 Dashboard 页面长度 → 保持卡片紧凑，放在中信空单卡片上方。
