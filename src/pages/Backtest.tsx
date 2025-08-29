import { useEffect, useState } from 'react'
import { logicRegistry } from '@/logic/registry'
import type { LogicDefinition, Preset } from '@/lib/types'
import { runBacktest, runCompare } from '@/lib/backtest'
import { getPreset, upsertPreset, setActive } from '@/lib/presets'  // ← 追加

function logicLabel(id: string){
  const l = logicRegistry[id];
  return l ? l.name : id;
}

export default function Backtest(){
  const [from, setFrom] = useState('20240101')
  const [to, setTo] = useState('20241231')
  const [logicId, setLogicId] = useState('basic-check-avg')
  const logic: LogicDefinition = logicRegistry[logicId]
  const [params, setParams] = useState(() => Object.fromEntries(logic.params.map(p=>[p.key,p.defaultValue])))
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState<any>(null)
  const [compare, setCompare] = useState<{A:any;B:any}|null>(null)

  useEffect(()=>{ setParams(Object.fromEntries(logic.params.map(p=>[p.key,p.defaultValue]))) },[logicId])

  async function run(){
    setBusy(true)
    try{
      setCompare(null)
      const r = await runBacktest(from, to, logic, params)
      setData(r)
    } finally { setBusy(false) }
  }

  async function runAB(){
    setBusy(true)
    try{
      const A = await getPreset('A'); const B = await getPreset('B')
      if(!A || !B){ alert('A または B が保存されていません'); return }
      const r = await runCompare(from, to, A, B)
      setCompare(r); setData(null)
    } finally { setBusy(false) }
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">予想テスト</h2>

      {/* 期間・ロジック・パラメータ */}
      <div className="grid md:grid-cols-3 grid-cols-1 gap-2">
        <label>From<input className="input" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>To<input className="input" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <label>ロジック
          <select className="input" value={logicId} onChange={e=>setLogicId(e.target.value)}>
            {Object.values(logicRegistry).map(l=> <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {logic.params.map(p=>(
          <label key={p.key} className="flex items-center gap-2">
            <span className="whitespace-nowrap">{p.label}</span>
            {p.type==='number' && (
              <input className="input" type="number" step={p.step} min={p.min} max={p.max}
                value={params[p.key]} onChange={e=>setParams(prev=>({...prev,[p.key]: Number(e.target.value)}))} />
            )}
            {p.type==='switch' && (
              <input type="checkbox" checked={!!params[p.key]}
                onChange={e=>setParams(prev=>({...prev,[p.key]: e.target.checked}))} />
            )}
          </label>
        ))}
      </div>

      {/* 実行＋A/B保存（← ここがポイント） */}
      <div className="flex flex-wrap gap-2">
        <button className="btn" onClick={run} disabled={busy}>{busy? '実行中…':'単独実行'}</button>
        <button className="btn" onClick={runAB} disabled={busy}>{busy? '実行中…':'A/B比較を実行'}</button>

        {/* A/B 保存・読み込みはテスト側に集約 */}
        <button className="btn" onClick={async()=>{
          await upsertPreset({ id:'A', label:'設定A', logicId: logic.id, params })
          alert('現在の設定を A に保存しました')
        }}>Aに保存</button>

        <button className="btn" onClick={async()=>{
          await upsertPreset({ id:'B', label:'設定B', logicId: logic.id, params })
          alert('現在の設定を B に保存しました')
        }}>Bに保存</button>

        <button className="btn" onClick={async()=>{
          const A = await getPreset('A'); if(!A) return alert('設定Aがありません')
          if(A.logicId !== logic.id) setLogicId(A.logicId as any)
          setTimeout(()=> setParams(A.params), 0)
        }}>Aを読み込み</button>

        <button className="btn" onClick={async()=>{
          const B = await getPreset('B'); if(!B) return alert('設定Bがありません')
          if(B.logicId !== logic.id) setLogicId(B.logicId as any)
          setTimeout(()=> setParams(B.params), 0)
        }}>Bを読み込み</button>

        {/* この設定を本番採用（ACTIVE） */}
        <button className="btn" onClick={async()=>{
          await setActive({ id:'ACTIVE', label:'ACTIVE', logicId: logic.id, params });
          alert(`ACTIVEに採用: ${logicLabel(logic.id)}`);
        }}>この設定を採用（ACTIVE）</button>
      </div>

      {/* 単独結果 or A/B結果の表示（既存のまま） */}
      {data && (
        <section className="card">
          <h3 className="font-semibold mb-2">全期間（単独）</h3>
          {data.overall.map((r:any)=> <StatRow key={r.bucket} {...r} />)}
        </section>
      )}

      {compare && (
        <section className="grid gap-3">
          <h3 className="font-semibold">A/B 比較</h3>
          <div className="grid md:grid-cols-2 grid-cols-1 gap-3">
            <div className="card">
              <h4 className="font-semibold mb-1">A</h4>
              {compare.A.overall.map((r:any)=> <StatRow key={'A'+r.bucket} {...r} />)}
              <button className="btn mt-2" onClick={async()=>{
                const A = await getPreset('A'); if(!A) return alert('設定Aがありません')
                await setActive(A); alert('Aを ACTIVE に採用しました')
              }}>Aを採用（ACTIVE）</button>
            </div>
            <div className="card">
              <h4 className="font-semibold mb-1">B</h4>
              {compare.B.overall.map((r:any)=> <StatRow key={'B'+r.bucket} {...r} />)}
              <button className="btn mt-2" onClick={async()=>{
                const B = await getPreset('B'); if(!B) return alert('設定Bがありません')
                await setActive(B); alert('Bを ACTIVE に採用しました')
              }}>Bを採用（ACTIVE）</button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatRow({bucket, target, win, hitRate, buy, pay, roi}:{bucket:string; target:number; win:number; hitRate:number; buy:number; pay:number; roi:number}){
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
      <div>Bucket: <b>{bucket}</b></div>
      <div>対象: <b>{target}</b></div>
      <div>的中: <b>{win}</b></div>
      <div>的中率: <b>{(hitRate*100).toFixed(2)}%</b></div>
      <div>購入: <b>{buy}</b></div>
      <div>払戻: <b>{pay}</b>（ROI {(roi*100).toFixed(1)}%）</div>
    </div>
  )
}
