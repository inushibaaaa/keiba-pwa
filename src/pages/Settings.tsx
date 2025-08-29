import { useEffect, useState } from 'react'
import { importJson, clearAll } from '@/lib/import'
import { db } from '@/lib/db'

export default function Settings(){
  const [races, setRaces] = useState(0)
  const [entries, setEntries] = useState(0)
  const [results, setResults] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function refreshCounts(){
    setRaces(await db.races.count())
    setEntries(await db.entries.count())
    setResults(await db.results.count())
  }
  useEffect(()=>{ refreshCounts() },[])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const f = e.target.files?.[0]
    if(!f) return
    setBusy(true); setMsg('')
    try{
      const text = await f.text()
      const json = JSON.parse(text)
      await importJson(json)
      await refreshCounts()
      setMsg('インポート完了')
    }catch(err:any){
      console.error(err)
      setMsg('インポート失敗: '+(err?.message ?? err))
    }finally{ setBusy(false) }
  }

  async function onClear(){
    if(!confirm('全データを削除します。よろしいですか？')) return
    setBusy(true); setMsg('')
    try{
      await clearAll()
      await refreshCounts()
      setMsg('全消去しました')
    }catch(err:any){
      setMsg('削除失敗: '+(err?.message ?? err))
    }finally{ setBusy(false) }
  }

  // 👇 return は必ずこの関数の中にあること！
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">設定（データ管理）</h2>

      <div className="card grid gap-2">
        <div className="text-sm text-gray-600">現在の件数: Races {races} / Entries {entries} / Results {results}</div>
        <label className="block">
          <span className="block mb-1">JSONインポート</span>
          <input type="file" accept="application/json" onChange={onFile} disabled={busy} />
        </label>
        <div className="flex gap-2">
          <button className="btn" onClick={refreshCounts} disabled={busy}>件数を更新</button>
          <button className="btn" onClick={onClear} disabled={busy}>全データ消去</button>
        </div>
        {!!msg && <div className="text-sm">{msg}</div>}
      </div>
    </div>
  )
}
