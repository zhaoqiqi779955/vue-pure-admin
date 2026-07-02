## Why

Dashboard 目前已有中信空单数据和大盘核心数据，但缺少核心 ETF 的份额与净值趋势。新增核心 ETF 数据面板可以让用户在同一 Dashboard 页面查看沪深300ETF、中证500ETF、中证1000ETF 等核心 ETF 的基金份额和单位净值变化。

## What Changes

- 在 Dashboard 页面新增「核心 ETF 数据」面板。
- 接入 `GET /api/data/etf/core`，默认不传查询参数以展示最新可用数据。
- 展示每只 ETF 对应的：
  - 基金份额，字段 `share_yi`，单位亿份
  - 单位净值，字段 `unit_nav`
- 以折线图形式展示趋势：
  - 一张基金份额折线图，按 ETF 分多条线展示 `share_yi`
  - 一张单位净值折线图，按 ETF 分多条线展示 `unit_nav`
- 趋势查询支持 `start_date` 和 `end_date`，默认展示最近半年数据。

## Capabilities

### New Capabilities

- `dashboard-core-etf-panel`: 定义 Dashboard 核心 ETF 数据面板、最新数据加载、ETF 指标展示和份额/单位净值折线图行为。

### Modified Capabilities

- 无。

## Impact

- 影响 `src/api/dashboard.ts`：新增核心 ETF 数据接口类型和请求方法。
- 影响 `src/views/dashboard/zhongxin-short/index.vue`：新增核心 ETF 数据面板和两张折线图展示区域。
- 可能新增 Dashboard 局部组件，用于复用多 ETF 折线图渲染。
- 不新增外部依赖，继续使用现有 Element Plus、ECharts 和 `@pureadmin/utils`。
