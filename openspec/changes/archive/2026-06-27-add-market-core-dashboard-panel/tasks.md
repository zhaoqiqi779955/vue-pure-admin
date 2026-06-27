## 1. API Types and Request Method

- [x] 1.1 Add `MarketCoreDataParams`, `MarketCoreSources`, `MarketCoreDataItem`, and `MarketCoreDataResult` types in `src/api/dashboard.ts`
- [x] 1.2 Add `getMarketCoreData(params?)` using `http.request<MarketCoreDataResult>("get", "/api/data/market/core", ...)`
- [x] 1.3 Ensure empty params are omitted so default loading calls `/api/data/market/core` without `start_date` or `end_date`

## 2. Market Core Panel UI

- [x] 2.1 Add market core state to `src/views/dashboard/zhongxin-short/index.vue`
- [x] 2.2 Load latest market core data on page mount and select the latest item by `date`
- [x] 2.3 Render the market core panel above existing Zhongxin short position content
- [x] 2.4 Render three clickable metrics: `成交额` from `total_amount_yi` with unit `亿`, `涨停家数` from `limit_up_count` with unit `家`, and `跌停家数` from `limit_down_count` with unit `家`
- [x] 2.5 Add loading, error, and empty states for the market core panel

## 3. Single Metric Trend Dialog

- [x] 3.1 Add selected metric state for `total_amount_yi`, `limit_up_count`, and `limit_down_count`
- [x] 3.2 Open a trend dialog when a metric card is clicked
- [x] 3.3 Default the trend range to the latest market core date minus six months through the latest market core date
- [x] 3.4 Reload trend data when the user changes the date range
- [x] 3.5 Show trend loading, error, and empty states independently from the latest-data panel

## 4. Chart Component

- [x] 4.1 Add a local single metric line chart component under `src/views/dashboard/zhongxin-short/components/`
- [x] 4.2 Reuse the existing ECharts setup style with `useECharts`, dark theme support, dashed grid lines, and formatted tooltip values
- [x] 4.3 Convert `total_amount_yi` string values to numbers before plotting
- [x] 4.4 Sort trend records by `date` ascending before passing them to the chart

## 5. Verification

- [x] 5.1 Run `pnpm typecheck`
- [x] 5.2 Run `pnpm lint`
- [x] 5.3 Manually verify default latest-data request uses no query parameters
- [x] 5.4 Manually verify each metric opens a single-metric recent-half-year trend chart
