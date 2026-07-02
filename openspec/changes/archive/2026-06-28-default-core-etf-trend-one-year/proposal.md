## Why

核心 ETF 份额和净值趋势当前默认只展示最近半年，观察中长期变化时需要用户手动调整日期范围。将默认范围改为最近 1 年，可以让 Dashboard 首次展示时直接覆盖更完整的年度趋势。

## What Changes

- 将核心 ETF 趋势图默认查询范围从最近半年调整为最近 1 年。
- 默认趋势结束日期仍优先使用最新 ETF 数据日期；没有有效最新日期时回退到当天。
- 用户手动选择趋势日期范围后的行为保持不变。
- 不改变核心 ETF 最新数据的默认无参数请求行为。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `dashboard-core-etf-panel`: 核心 ETF 趋势图默认日期范围从最近半年改为最近 1 年。

## Impact

- 影响 `openspec/specs/dashboard-core-etf-panel/spec.md` 的默认趋势范围要求。
- 影响 `src/views/dashboard/zhongxin-short/index.vue` 中核心 ETF 趋势日期范围初始化和重置逻辑。
- 不涉及 API 协议、后端接口、路由、菜单或新增依赖。
