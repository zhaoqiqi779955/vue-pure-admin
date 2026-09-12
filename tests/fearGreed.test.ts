import assert from "node:assert/strict";
import test from "node:test";
import type { FearGreedDataItem, MarketIndicesDataItem } from "@/api/dashboard";
import {
  alignFearGreedTrend,
  getFearGreedBand,
  isFearGreedStale
} from "../src/views/dashboard/zhongxin-short/fearGreed.ts";

function fearGreedItem(date: string, index_value: number): FearGreedDataItem {
  return {
    date,
    index_value,
    source: "fear-greed-test",
    quality: "fresh",
    collected_at: "2026-09-12T00:00:00Z",
    benchmark_code: "000905",
    ingestion_method: "excel_import",
    source_url: null,
    source_file: "baseline.xlsx",
    source_update_time: date,
    upstream_client_version: null,
    methodology_version: "test"
  };
}

function marketIndexItem(
  date: string,
  trade_date: string | null,
  close: number | null
): MarketIndicesDataItem {
  return {
    date,
    source: "market-index-test",
    quality: "fresh",
    collected_at: "2026-09-12T00:00:00Z",
    indices: {
      "000905": {
        code: "000905",
        name: "中证500",
        market: "CN",
        market_status: "closed",
        trade_date,
        close,
        change_amount: null,
        change_percent: null,
        source: "benchmark-test"
      }
    }
  };
}

test("maps every fear-greed boundary to exactly one band", () => {
  assert.equal(getFearGreedBand(0), "extremeFear");
  assert.equal(getFearGreedBand(10), "fear");
  assert.equal(getFearGreedBand(30), "slightFear");
  assert.equal(getFearGreedBand(50), "slightGreed");
  assert.equal(getFearGreedBand(70), "greed");
  assert.equal(getFearGreedBand(90), "extremeGreed");
  assert.equal(getFearGreedBand(100), "extremeGreed");
  assert.equal(getFearGreedBand(101), undefined);
});

test("aligns on the exact date union without forward filling missing values", () => {
  const points = alignFearGreedTrend(
    [fearGreedItem("2026-09-01", 38), fearGreedItem("2026-09-03", 62)],
    [
      marketIndexItem("2026-09-01", "2026-09-01", 6100),
      marketIndexItem("2026-09-02", "2026-09-02", 6200)
    ]
  );

  assert.deepEqual(points, [
    {
      date: "2026-09-01",
      fearValue: 38,
      fearSource: "fear-greed-test",
      csi500Close: 6100,
      benchmarkSource: "benchmark-test"
    },
    {
      date: "2026-09-02",
      fearValue: null,
      fearSource: null,
      csi500Close: 6200,
      benchmarkSource: "benchmark-test"
    },
    {
      date: "2026-09-03",
      fearValue: 62,
      fearSource: "fear-greed-test",
      csi500Close: null,
      benchmarkSource: null
    }
  ]);
});

test("reports staleness only when a newer CSI 500 observation exists", () => {
  const points = alignFearGreedTrend(
    [fearGreedItem("2026-09-01", 38)],
    [marketIndexItem("2026-09-02", "2026-09-02", 6200)]
  );

  assert.equal(isFearGreedStale("2026-09-01", points), true);
  assert.equal(isFearGreedStale("2026-09-02", points), false);
});
