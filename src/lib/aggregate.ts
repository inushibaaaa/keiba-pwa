// src/lib/aggregate.ts
export function toYm(d: string) { return d.slice(0, 6); }          // YYYYMM
export function toY(d: string) { return d.slice(0, 4); }           // YYYY
export function toSeason(d: string) {                              // YYYYQx
  const m = Number(d.slice(4, 6));
  const q = Math.floor((m - 1) / 3) + 1;
  return `${d.slice(0, 4)}Q${q}`;
}

export interface MetricRow {
  bucket: string;
  target: number;
  win: number;
  hitRate: number;
  buy: number;
  pay: number;
  roi: number;
}

export function rollup(
  records: { bucket: string; target: number; win: number; buy: number; pay: number; }[]
): MetricRow[] {
  const g = new Map<string, { t: number; w: number; b: number; p: number }>();

  for (const r of records) {
    const v = g.get(r.bucket) ?? { t: 0, w: 0, b: 0, p: 0 };
    v.t += r.target;
    v.w += r.win;
    v.b += r.buy;
    v.p += r.pay;
    g.set(r.bucket, v);
  }

  return [...g.entries()]
    .map(([bucket, v]) => ({
      bucket,
      target: v.t,
      win: v.w,
      hitRate: v.t ? v.w / v.t : 0,
      buy: v.b,
      pay: v.p,
      roi: v.b ? v.p / v.b : 0,
    }))
    .sort((a, b) => a.bucket.localeCompare(b.bucket));
}
