import { db } from '@/lib/db'
import type { LogicDefinition } from '@/lib/types'
import { toYm, toY, toSeason, rollup } from './aggregate'
import type { Preset } from '@/lib/types'
import { logicRegistry } from '@/logic/registry'

export interface BacktestSummary {
overall: ReturnType<typeof rollup>
monthly: ReturnType<typeof rollup>
seasonal: ReturnType<typeof rollup>
yearly: ReturnType<typeof rollup>
raw: {date:string; raceId:string; main:string|null; hit:boolean; buy:number; pay:number}[]
}

/**
* 単勝100円の簡易検証。
* - ロジックで filtered=true のレースを対象に、main に100円購入したと仮定
* - 的中時は results.payouts['単勝'] を pay に加算（100円券面想定）
*/
export async function runBacktest(from: string, to: string, logic: LogicDefinition, params: Record<string,any>): Promise<BacktestSummary>{
  const races = await db.races.where('date').between(from, to, true, true).toArray()
  const rows: BacktestSummary['raw'] = []

  for (const r of races){
    const entries = await db.entries.where('raceId').equals(r.raceId).toArray()
    const res = logic.run(entries, params)
    if (!res.filtered) continue

    const result = await db.results.get(r.raceId)
    const hit = !!(result && res.main && result.top3[0] === res.main)
    const buy = 100
    const pay = hit ? (result?.payouts?.['単勝'] ?? 0) : 0

    rows.push({ date: r.date, raceId: r.raceId, main: res.main, hit, buy, pay })
  }

  const recAll = rows.map(x=>({ bucket: 'ALL', target: 1, win: x.hit?1:0, buy: x.buy, pay: x.pay }))
  const recYm  = rows.map(x=>({ bucket: toYm(x.date), target: 1, win: x.hit?1:0, buy: x.buy, pay: x.pay }))
  const recSz  = rows.map(x=>({ bucket: toSeason(x.date), target: 1, win: x.hit?1:0, buy: x.buy, pay: x.pay }))
  const recY   = rows.map(x=>({ bucket: toY(x.date), target: 1, win: x.hit?1:0, buy: x.buy, pay: x.pay }))

  return {
    overall: rollup(recAll),
    monthly: rollup(recYm),
    seasonal: rollup(recSz),
    yearly: rollup(recY),
    raw: rows,
  }
}

/** A/B比較：同期間で2つのプリセットを並列実行 */
export async function runCompare(from: string, to: string, presetA: Preset, presetB: Preset){
  const logicA = logicRegistry[presetA.logicId]
  const logicB = logicRegistry[presetB.logicId]
  if(!logicA || !logicB) throw new Error('ロジックが見つかりません')

  const [resA, resB] = await Promise.all([
    runBacktest(from, to, logicA, presetA.params),
    runBacktest(from, to, logicB, presetB.params),
  ])
  return { A: resA, B: resB }
}