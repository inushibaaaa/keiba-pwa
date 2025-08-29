import Papa from 'papaparse'
import type { Race, Entry, Result } from './types'

/** CSV -> 配列 */
export async function parseCsv(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => resolve(res.data as any[]),
      error: reject,
    })
  })
}

/** "85*" や "-" を数値/nullに */
function toNumOrNull(v: any): number|null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s === '-' ) return null
  const m = s.match(/-?\d+(\.\d+)?/) // 先頭の数値を拾う
  return m ? Number(m[0]) : null
}

/** race_id -> YYYYMMDD */
function dateFromRaceId(raceId: string): string {
  const s = String(raceId).trim()
  return s.slice(0, 8) // 例: 20250201
}

/* =========================
   1) time_index_YYYYMM.csv
   =========================
   列例：
   race_id, rank, waku, umaban, name, avg_index, avg_class,
   idx1,class1,idx2,class2,idx3,class3,idx4,class4,idx5,class5
*/
export function mapTimeIndexRows(rows: any[]): {
  entries: Entry[];
  races: Race[];
} {
  const entries: Entry[] = []
  const raceSet = new Set<string>()

  for (const r of rows) {
    const raceId = String(r.race_id).trim()
    const horseId = String(r.umaban).trim() // 馬番を便宜上IDに
    const horseName = String(r.name).trim()

    const timeIndex5 = [
      toNumOrNull(r.idx1),
      toNumOrNull(r.idx2),
      toNumOrNull(r.idx3),
      toNumOrNull(r.idx4),
      toNumOrNull(r.idx5),
    ]

    const flags: Record<string, any> = {
      avg_index: toNumOrNull(r.avg_index),
      avg_class: r.avg_class ?? null,
      class1: r.class1 ?? null,
      class2: r.class2 ?? null,
      class3: r.class3 ?? null,
      class4: r.class4 ?? null,
      class5: r.class5 ?? null,
      waku: r.waku ?? null,
      umaban: r.umaban ?? null,
      rankLabel: r.rank ?? null, // "1位" 等のラベル
    }

    entries.push({ raceId, horseId, horseName, timeIndex5, flags })
    raceSet.add(raceId)
  }

  const races: Race[] = [...raceSet].map(raceId => ({
    raceId,
    date: dateFromRaceId(raceId),
    // course/distance/surface はCSVにないため未設定
  }))

  return { entries, races }
}

/* ==============================
   2) result_simple_YYYYMM.csv
   ==============================
   列例：
   race_id, rank(1..), waku, umaban, horse_name
*/
export function mapResultSimpleTop3(rows: any[]): {top3ByRace: Record<string, string[]>} {
  const byRace: Record<string, {rank:number, name:string}[]> = {}
  for (const r of rows) {
    const raceId = String(r.race_id).trim()
    const rank = Number(r.rank)
    const name = String(r.horse_name).trim()
    if (!byRace[raceId]) byRace[raceId] = []
    if (Number.isFinite(rank) && rank >= 1 && rank <= 3) {
      byRace[raceId].push({ rank, name })
    }
  }
  const top3ByRace: Record<string, string[]> = {}
  for (const [raceId, arr] of Object.entries(byRace)) {
    const sorted = arr.sort((a,b)=>a.rank-b.rank)
    top3ByRace[raceId] = sorted.map(x=>x.name)
  }
  return { top3ByRace }
}

/* ==========================================
   3) paybacks_with_horse_numbers_YYYYMM.csv
   ==========================================
   列例：
   race_id, 単勝(例: "1:170"), 複勝("1:110/6:140/4:560"), 馬連("1 - 6:450"), 馬単("1 → 6:760"),
   三連複("1 - 4 - 6:3740"), 三連単("1 → 6 → 4:11490"), ワイド("1 - 6:200|1 - 4:1220|4 - 6:1210")
*/
function parseKeyedAmount(s: any): number|null {
  // "1:170" → 170
  // "1 - 6:450" → 450
  // "1 → 6:760" → 760
  if (s == null) return null
  const m = String(s).match(/:(\d+)/)
  return m ? Number(m[1]) : null
}

export function mapPaybacks(rows: any[]): { payoutsByRace: Record<string, Record<string, number>> } {
  const payoutsByRace: Record<string, Record<string, number>> = {}
  for (const r of rows) {
    const raceId = String(r.race_id).trim()
    const pay: Record<string, number> = {}

    const t = parseKeyedAmount(r['単勝'])
    if (t != null) pay['単勝'] = t

    // 複勝は複数あるが、ここでは「勝ち馬の複勝」を使わないので省略可
    // 必要になったらパース拡張してください
    // const fList = String(r['複勝'] ?? '').split('/').map(s => parseKeyedAmount(s))

    const umaren = parseKeyedAmount(r['馬連'])
    if (umaren != null) pay['馬連'] = umaren

    const umatan = parseKeyedAmount(r['馬単'])
    if (umatan != null) pay['馬単'] = umatan

    const sanrenpuku = parseKeyedAmount(r['三連複'])
    if (sanrenpuku != null) pay['三連複'] = sanrenpuku

    const sanrentan = parseKeyedAmount(r['三連単'])
    if (sanrentan != null) pay['三連単'] = sanrentan

    // ワイド（複数）も必要なら分解して配列で持つのが安全
    // ここでは省略（ROI計算の主対象が単勝なので）

    payoutsByRace[raceId] = pay
  }
  return { payoutsByRace }
}

/* ==========================
   4) 統合して Result[] を作成
   ==========================
   - top3ByRace: result_simple から
   - payoutsByRace: paybacks から
*/
export function combineResults(top3ByRace: Record<string, string[]>, payoutsByRace: Record<string, Record<string, number>>): Result[] {
  const allRaceIds = new Set<string>([...Object.keys(top3ByRace), ...Object.keys(payoutsByRace)])
  const results: Result[] = []
  for (const raceId of allRaceIds) {
    const top3 = top3ByRace[raceId] ?? []
    const payouts = payoutsByRace[raceId] ?? {}
    results.push({ raceId, top3, payouts })
  }
  return results
}
