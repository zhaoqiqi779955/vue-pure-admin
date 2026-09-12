import type {
  FearGreedDataItem,
  MarketIndicesDataItem,
  MarketIndexQuote
} from "@/api/dashboard";

export const FEAR_GREED_BANDS = [
  { key: "extremeFear", min: 0, max: 10, includeMax: false },
  { key: "fear", min: 10, max: 30, includeMax: false },
  { key: "slightFear", min: 30, max: 50, includeMax: false },
  { key: "slightGreed", min: 50, max: 70, includeMax: false },
  { key: "greed", min: 70, max: 90, includeMax: false },
  { key: "extremeGreed", min: 90, max: 100, includeMax: true }
] as const;

export type FearGreedBandKey = (typeof FEAR_GREED_BANDS)[number]["key"];

export type FearGreedTrendPoint = {
  date: string;
  fearValue: number | null;
  fearSource: string | null;
  csi500Close: number | null;
  benchmarkSource: string | null;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getCSI500Quote(
  item: MarketIndicesDataItem
): MarketIndexQuote | undefined {
  const quote = item.indices?.["000905"];
  return quote?.trade_date && quote.code === "000905" ? quote : undefined;
}

export function getFearGreedBand(value: number | null | undefined) {
  if (!isFiniteNumber(value) || value < 0 || value > 100) return undefined;

  return FEAR_GREED_BANDS.find(
    band =>
      value >= band.min &&
      (value < band.max || (band.includeMax && value <= band.max))
  )?.key;
}

/**
 * 按恐惧贪婪日期与中证500实际交易日取并集；不填补任一缺失的观测值。
 */
export function alignFearGreedTrend(
  fearGreedItems: FearGreedDataItem[],
  marketIndicesItems: MarketIndicesDataItem[]
): FearGreedTrendPoint[] {
  const points = new Map<string, FearGreedTrendPoint>();

  fearGreedItems.forEach(item => {
    if (!item?.date) return;
    points.set(item.date, {
      ...(points.get(item.date) ?? {
        date: item.date,
        csi500Close: null,
        benchmarkSource: null
      }),
      fearValue: isFiniteNumber(item.index_value) ? item.index_value : null,
      fearSource: item.source || null
    });
  });

  marketIndicesItems.forEach(item => {
    const quote = getCSI500Quote(item);
    const date = quote?.trade_date;
    if (!date) return;

    points.set(date, {
      ...(points.get(date) ?? {
        date,
        fearValue: null,
        fearSource: null
      }),
      csi500Close: isFiniteNumber(quote.close) ? quote.close : null,
      benchmarkSource: quote.source || item.source || null
    });
  });

  return [...points.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  );
}

export function getLatestFearGreedItem(items: FearGreedDataItem[]) {
  return [...items]
    .filter(item => item?.date)
    .sort((left, right) => left.date.localeCompare(right.date))
    .at(-1);
}

export function isFearGreedStale(
  latestFearGreedDate: string | undefined,
  trendPoints: FearGreedTrendPoint[]
) {
  const latestBenchmarkDate = trendPoints
    .filter(item => item.csi500Close !== null)
    .map(item => item.date)
    .sort()
    .at(-1);

  return Boolean(
    latestFearGreedDate &&
    latestBenchmarkDate &&
    latestFearGreedDate < latestBenchmarkDate
  );
}
