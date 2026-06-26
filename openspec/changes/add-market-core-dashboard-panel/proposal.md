## Why

Dashboard 当前只展示中信空单数据，缺少大盘层面的核心概览。新增大盘核心数据面板可以让用户进入 Dashboard 后先看到成交额、涨停家数、跌停家数，并能继续查看单指标趋势。

## What Changes

- 在 Dashboard 页面顶部新增「大盘核心数据」展示面板。
- 接入 `GET /api/data/market/core`，默认不传查询参数以展示最新数据。
- 展示三个核心指标：
  - 成交额，字段 `total_amount_yi`，单位亿
  - 涨停家数，字段 `limit_up_count`
  - 跌停家数，字段 `limit_down_count`
- 点击任一指标后，打开该单指标最近半年折线图。
- 趋势弹窗支持调整日期范围，使用 `start_date` 和 `end_date` 查询。

## Capabilities

### New Capabilities

- `market-core-dashboard-panel`: 定义 Dashboard 大盘核心数据面板、最新数据加载、指标展示和单指标趋势图行为。

### Modified Capabilities

- 无。

## Impact

- 影响 `src/api/dashboard.ts`：新增大盘核心数据接口类型和请求方法。
- 影响 `src/views/dashboard/zhongxin-short/index.vue`：在页面顶部加入大盘核心数据面板及趋势弹窗入口。
- 可能新增 Dashboard 局部组件，用于复用指标卡片或趋势折线图。
- 不新增外部依赖，继续使用现有 Element Plus、ECharts 和 `@pureadmin/utils`。
