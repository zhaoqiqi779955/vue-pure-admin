## Why

当前前端没有用于集中展示期指空单数据的一级入口，用户需要一个直达的 dashboard 页面查看中信空单最新状态。
新增该展示能力可以把 `/api/data/future/zhongxin` 的最新数据以图表形式呈现，降低手动查询接口或阅读原始字段的成本。

## What Changes

- 新增一级菜单 `dashboard`，用于承载数据看板类页面。
- 在 `dashboard` 下新增中信空单数据板块，默认请求 `/api/data/future/zhongxin` 且不传任何查询参数。
- 将接口返回的最新一条记录拆分为“累计空单”和“空单变化量”两组展示。
- 每个数值使用柱状图展示，并按业务字段映射展示中文名称：
  - `IH_net_short` / `IH_net_short_diff`：上证50
  - `IF_net_short` / `IF_net_short_diff`：沪深300
  - `IC_net_short` / `IC_net_short_diff`：中证500
  - `IM_net_short` / `IM_net_short_diff`：中证1000
  - `total_net_short` / `total_net_short_diff`：总空单

## Capabilities

### New Capabilities

- `dashboard-zhongxin-short-data`: 定义 dashboard 菜单下中信空单最新值的获取、字段分组、中文映射和柱状图展示要求。

### Modified Capabilities

- 无

## Impact

- 影响前端路由与菜单：新增 `dashboard` 一级路由及其子页面。
- 影响前端 API 层：新增 `/api/data/future/zhongxin` 的类型定义和请求方法。
- 影响前端视图层：新增 dashboard 页面、数据转换逻辑和柱状图展示组件或局部实现。
- 影响国际化文案：新增 dashboard 菜单标题和中信空单相关展示文案。
- 不新增后端接口；后端契约来自 `/Users/bytedance/src/ecom_backend/idl/ecom.proto` 的 `GetZhongxinFutureShortPosition`。
