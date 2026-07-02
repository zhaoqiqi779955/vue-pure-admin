## Context

Dashboard 核心 ETF 面板已接入 `/api/data/etf/core`，最新数据请求不传查询参数，趋势数据请求传入 `start_date` 和 `end_date`。当前趋势默认范围在 `src/views/dashboard/zhongxin-short/index.vue` 中通过 `dayjs(...).subtract(6, "month")` 计算，并在加载到最新 ETF 日期后再次重置为最近半年。

## Goals / Non-Goals

**Goals:**

- 将核心 ETF 趋势图默认日期范围调整为最近 1 年。
- 保持默认结束日期优先锚定最新 ETF 数据日期。
- 保持用户手动选择日期范围后的查询逻辑不变。

**Non-Goals:**

- 不修改核心 ETF 最新数据接口调用方式。
- 不修改大盘核心数据、中信空单数据或其他趋势图默认范围。
- 不新增日期快捷项、配置项或后端参数。

## Decisions

### Decision: 仅调整核心 ETF 趋势日期计算

当前需求只影响核心 ETF 趋势默认展示周期。实现时只修改 `coreETFTrendDateRange` 初始化值和 `resetCoreETFTrendDateRange()` 中的起始日期计算，从 `subtract(6, "month")` 改为 `subtract(1, "year")`。

备选方案是新增通用常量或配置项统一管理所有趋势周期，但这会扩大改动范围，并可能影响大盘核心数据和中信空单趋势的现有行为。本次变更保持局部最小改动。

## Risks / Trade-offs

- [Risk] 默认查询范围变长可能增加接口返回数据量和图表渲染点数。→ 仅从半年扩展到 1 年，仍属于可控范围；如后续出现性能问题，再考虑后端分页或前端抽样。
- [Risk] 与大盘核心数据趋势默认半年不一致。→ 这是产品语义差异，本次只按核心 ETF 需求调整，不改变其他模块。

## Migration Plan

- 更新 delta spec 后实施前端最小代码改动。
- 运行 `pnpm typecheck` 和 `pnpm lint`。
- 如需回滚，将核心 ETF 两处 `subtract(1, "year")` 恢复为 `subtract(6, "month")`，并回滚对应规格。

## Open Questions

- 无。
