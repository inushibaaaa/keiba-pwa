import { useEffect, useState } from 'react'
import { importJson, clearAll } from '@/lib/import'
import { db } from '@/lib/db'
import { parseCsv, mapTimeIndexRows, mapResultSimpleTop3, mapPaybacks, combineResults } from '@/lib/csvImport'

export default function Settings(){
  const [races, setRaces] = useState(0)
  const [entries, setEntries] = useState(0)
  const [results, setResults] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  // 一時保持（別々にアップしても後で結合できる）
  const [stashTop3, setStashTop3] = useState<Record<string,string[]>>({})
  const [stashPayouts, setStashPayouts] = useState<Record<string,Record<string,number>>>({})

  async function refreshCounts(){
    setRaces(await db.races.count())
    setEntries(await db.entries.count())
    setResults(await db.results.count())
  }
  useEffect(()=>{ refreshCounts() },[])

  async function onTimeIndexCsv(file: File){
    setBusy(true); setMsg('')
    try{
      const rows = await parseCsv(file)
      const { entries, races } = mapTimeIndexRows(rows)
      await db.transaction('rw', db.races, db.entries, async ()=>{
        await db.races.bulkPut(races)
        await db.entries.bulkPut(entries)
      })
      await refreshCounts()
      setMsg(`time_index をインポート（races:${races.length}, entries:${entries.length}）`)
    }catch(err:any){
      console.error(err); setMsg('time_indexインポート失敗: '+(err?.message ?? err))
    }finally{ setBusy(false) }
  }

  async function onResultSimpleCsv(file: File){
    setBusy(true); setMsg('')
    try{
      const rows = await parseCsv(file)
      const { top3ByRace } = mapResultSimpleTop3(rows)
      setStashTop3(prev => ({...prev, ...top3ByRace}))
      await maybeCombineResults(top3ByRace, null)
      await refreshCounts()
      setMsg(`result_simple を読み込み（${Object.keys(top3ByRace).length} レース）`)
    }catch(err:any){
      console.error(err); setMsg('result_simple読み込み失敗: '+(err?.message ?? err))
    }finally{ setBusy(false) }
  }

  async function onPaybacksCsv(file: File){
    setBusy(true); setMsg('')
    try{
      const rows = await parseCsv(file)
      const { payoutsByRace } = mapPaybacks(rows)
      setStashPayouts(prev => ({...prev, ...payoutsByRace}))
      await maybeCombineResults(null, payoutsByRace)
      await refreshCounts()
      setMsg(`paybacks を読み込み（${Object.keys(payoutsByRace).length} レース）`)
    }catch(err:any){
      console.error(err); setMsg('paybacks読み込み失敗: '+(err?.message ?? err))
    }finally{ setBusy(false) }
  }

  // 片方ずつでも呼べるように結合→保存
  async function maybeCombineResults(addTop3: Record<string,string[]>|null, addPays: Record<string,Record<string,number>>|null){
    const top3 = { ...(stashTop3), ...(addTop3 ?? {}) }
    const pays = { ...(stashPayouts), ...(addPays ?? {}) }
    // どちらかが空でもOK：ある分だけ保存。既存レースは上書き更新されます
    const results = combineResults(top3, pays)
    if (results.length){
      await db.results.bulkPut(results)
    }
  }

  async function importJsonFile(f: File){
    const text = await f.text()
    const json = JSON.parse(text)
    await importJson(json)
    await refreshCounts()
    setMsg('JSONインポート完了')
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">設定（データ管理）</h2>

      <div className="card grid gap-2">
        <div className="text-sm text-gray-600">現在の件数: Races {races} / Entries {entries} / Results {results}</div>

        {/* JSON（従来） */}
        <label className="block">
          <span className="block mb-1">JSONインポート</span>
          <input type="file" accept="application/json" onChange={e=>{ const f=e.target.files?.[0]; if(f) importJsonFile(f) }} disabled={busy} />
        </label>

        {/* CSV（新規） */}
        <div className="grid gap-2">
          <div className="font-semibold">CSVインポート（7月版フォーマット）</div>
          <label className="block">time_index CSV
            <input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) onTimeIndexCsv(f) }} disabled={busy} />
          </label>
          <label className="block">result_simple CSV
            <input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) onResultSimpleCsv(f) }} disabled={busy} />
          </label>
          <label className="block">paybacks CSV
            <input type="file" accept=".csv" onChange={e=>{ const f=e.target.files?.[0]; if(f) onPaybacksCsv(f) }} disabled={busy} />
          </label>
        </div>

        <div className="flex gap-2">
          <button className="btn" onClick={refreshCounts} disabled={busy}>件数を更新</button>
          <button className="btn" onClick={async()=>{ if(confirm('全データ削除します。よろしいですか？')){ await clearAll(); await refreshCounts(); setMsg('全消去しました') } }} disabled={busy}>全データ消去</button>
        </div>

        {!!msg && <div className="text-sm">{msg}</div>}
      </div>

      <div className="card text-sm text-gray-600">
        <div className="font-semibold mb-1">想定列</div>
        <pre className="whitespace-pre-wrap">
time_index: race_id, rank, waku, umaban, name, avg_index, avg_class, idx1, class1, ..., idx5, class5
result_simple: race_id, rank, waku, umaban, horse_name
paybacks: race_id, 単勝, 複勝, 馬連, 馬単, 三連複, 三連単, ワイド
        </pre>
      </div>
    </div>
  )
}
