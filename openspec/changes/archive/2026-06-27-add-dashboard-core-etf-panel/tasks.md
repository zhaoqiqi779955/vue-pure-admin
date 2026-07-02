## 1. API Types and Request Method

- [x] 1.1 Add `CoreETFDataParams`, `CoreETFItem`, `CoreETFDataItem`, and `CoreETFDataResult` types in `src/api/dashboard.ts`
- [x] 1.2 Add `getCoreETFData(params?)` using `http.request<CoreETFDataResult>("get", "/api/data/etf/core", ...)`
- [x] 1.3 Ensure empty params are omitted so default loading calls `/api/data/etf/core` without `start_date` or `end_date`

## 2. Core ETF Panel State and Data Transformation

- [x] 2.1 Add core ETF loading, error, latest item, trend items, and date range state to `src/views/dashboard/zhongxin-short/index.vue`
- [x] 2.2 Load latest core ETF data on page mount and select the latest item by `date`
- [x] 2.3 Build a stable ETF list ordered by `510300`, `510500`, `512100`, with any extra API-returned ETF codes appended
- [x] 2.4 Convert ETF map data into chart series for `share_yi` and `unit_nav`
- [x] 2.5 Treat missing or non-finite ETF values as `null` for chart rendering

## 3. Core ETF Panel UI

- [x] 3.1 Render the core ETF panel in the Dashboard page without changing existing market core or Zhongxin short sections
- [x] 3.2 Show each ETF's latest `share_yi` as 基金份额 with unit 亿份
- [x] 3.3 Show each ETF's latest `unit_nav` as 单位净值
- [x] 3.4 Add loading, error, and empty states for the core ETF panel
- [x] 3.5 Add a refresh action for latest core ETF data

## 4. ETF Trend Charts

- [x] 4.1 Add a local multi ETF line chart component under `src/views/dashboard/zhongxin-short/components/`
- [x] 4.2 Render one line chart for ETF `share_yi` with unit 亿份
- [x] 4.3 Render one line chart for ETF `unit_nav`
- [x] 4.4 Sort trend records by `date` ascending before passing data to the charts
- [x] 4.5 Add a date range picker that reloads both charts from `/api/data/etf/core` with `start_date` and `end_date`
- [x] 4.6 Default the trend range to the latest ETF data date minus six months through the latest ETF data date

## 5. Verification

- [x] 5.1 Run `pnpm typecheck`
- [x] 5.2 Run `pnpm lint`
- [ ] 5.3 Manually verify default latest-data request uses no query parameters
- [ ] 5.4 Manually verify the ETF panel shows each ETF's latest share and unit NAV
- [ ] 5.5 Manually verify the share and unit NAV line charts render one series per ETF and update after date range changes
