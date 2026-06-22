## 1. API Contract

- [x] 1.1 Add a frontend API module for `GET /api/data/future/zhongxin` using the existing `http.request<T>()` pattern.
- [x] 1.2 Define TypeScript types for `ZhongxinFutureShortPositionItem`, optional query params, and response `items`.
- [x] 1.3 Ensure the default latest-data request omits `start_date` and `end_date` query parameters.

## 2. Routing And Menu

- [x] 2.1 Add a new static route module for the top-level `dashboard` menu.
- [x] 2.2 Add a child route under dashboard for the Zhongxin short position page.
- [x] 2.3 Add required Chinese and English i18n menu labels for dashboard and Zhongxin short position.

## 3. Dashboard Page

- [x] 3.1 Create the dashboard Zhongxin short position page under `src/views/dashboard/`.
- [x] 3.2 Load latest Zhongxin short position data on page entry and handle loading, error, and empty states.
- [x] 3.3 Select the latest usable record from `items`, falling back to date-desc sorting if more than one item is returned.
- [x] 3.4 Convert cumulative fields into chart data with labels: 上证50、沪深300、中证500、中证1000、总空单.
- [x] 3.5 Convert diff fields into chart data with labels: 上证50、沪深300、中证500、中证1000、总空单.

## 4. Chart Rendering

- [x] 4.1 Implement or locally encapsulate a reusable bar chart block using the existing `useECharts` integration.
- [x] 4.2 Render cumulative short position values as one bar chart.
- [x] 4.3 Render short position change values as one bar chart.
- [x] 4.4 Preserve signed numeric values, including negative diff values, in chart data.

## 5. Verification

- [x] 5.1 Run `pnpm typecheck`.
- [x] 5.2 Run `pnpm lint` if implementation touches shared formatting, style, or reusable components.
- [x] 5.3 Manually verify the dashboard menu, default API request without params, empty state, and two chart sections in local dev if practical. Browser verification was not practical because the shared browser lock tool is unavailable; local dev route was verified with HTTP 200.
