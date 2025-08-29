// src/pages/Predict.tsx
import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { logicRegistry } from '@/logic/registry'
import type { LogicDefinition } from '@/lib/types'
import { getActive, upsertPreset } from '@/lib/presets'
import { thisWeekendRange } from '@/lib/week'

type Row = { date: string; raceId: string; course: string; main: string | null; rivals: string[] }

function logicLabel(id: string){
  const l = logicRegistry[id];
  return l ? l.name : id; // 見つからなければIDのまま
}
function summarizeParams(p: Record<string,any>){
  return Object.entries(p).map(([k,v])=>`${k}:${v}`).join(', ');
}

export default function Predict() {
  // 週範囲初期化（今週の土〜日）
  const wk = thisWeekendRange()
  const [from, setFrom] = useState(wk.from)
  const [to, setTo] = useState(wk.to)

  // ロジックとパラメータ
  const defaultLogicId = Object.keys(logicRegistry)[0]
  const [logicId, setLogicId] = useState(defaultLogicId)
  const logic: LogicDefinition = logicRegistry[logicId]
  const [params, setParams] = useState<Record<string, any>>(
    Object.fromEntries(logic.params.map(p => [p.key, p.defaultValue]))
  )

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [activeInfo, setActiveInfo] = useState<string>('')

  // 起動時：ACTIVEを読み込んで自動適用
  useEffect(() => {
    ;(async () => {
      const act = await getActive();
      if(act){
        setLogicId(act.logicId);
        setTimeout(()=>{
          setParams(act.params);
          setActiveInfo(`${logicLabel(act.logicId)} / ${summarizeParams(act.params)}`);
        }, 0);
      } else {
        setActiveInfo('未設定（デフォルト）');
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ※ ロジックを手動で切り替えた時に既定値へ戻したい場合は下をONに
  // useEffect(() => {
  //   setParams(Object.fromEntries(logic.params.map(p => [p.key, p.defaultValue])))
  // }, [logicId])

  async function run() {
    setLoading(true)
    try {
      const races = await db.races.where('date').between(from, to, true, true).toArray()
      const out: Row[] = []
      for (const r of races) {
        const entries = await db.entries.where('raceId').equals(r.raceId).toArray()
        const res = logic.run(entries, params)
        if (res.filtered) {
          out.push({ date: r.date, raceId: r.raceId, course: r.course, main: res.main, rivals: res.rivals })
        }
      }
      // 日付→コース順
      out.sort((a, b) => (a.date === b.date ? a.course.localeCompare(b.course) : a.date.localeCompare(b.date)))
      setRows(out)
    } finally {
      setLoading(false)
    }
  }

  function applyThisWeekend() {
    const k = thisWeekendRange()
    setFrom(k.from)
    setTo(k.to)
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">
        予想 <span className="text-sm text-gray-500">（使用中: {activeInfo}）</span>
      </h2>

      <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
        <label>
          From
          <input className="input" value={from} onChange={e => setFrom(e.target.value)} />
        </label>
        <label>
          To
          <input className="input" value={to} onChange={e => setTo(e.target.value)} />
        </label>
        <button className="btn" onClick={applyThisWeekend}>
          今週に合わせる
        </button>
        <label>
          ロジック
          <select className="input" value={logicId} onChange={e => setLogicId(e.target.value)}>
            {Object.values(logicRegistry).map(l => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* パラメータ編集（ACTIVEをベースに微調整OK） */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {logic.params.map(p => (
          <label key={p.key} className="flex items-center gap-2">
            <span className="whitespace-nowrap">{p.label}</span>
            {p.type === 'number' && (
              <input
                className="input"
                type="number"
                step={p.step}
                min={p.min}
                max={p.max}
                value={params[p.key]}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
              />
            )}
            {p.type === 'switch' && (
              <input
                type="checkbox"
                checked={!!params[p.key]}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.checked }))}
              />
            )}
            {p.type === 'select' && (
              <select
                className="input"
                value={params[p.key]}
                onChange={e => setParams(prev => ({ ...prev, [p.key]: e.target.value }))}
              >
                {p.options?.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn" onClick={run} disabled={loading}>
          {loading ? '実行中…' : 'この条件で実行'}
        </button>
        <button
          className="btn"
          onClick={async () => {
            await upsertPreset({ id:'ACTIVE', label:'ACTIVE', logicId: logic.id, params });
            setActiveInfo(`${logicLabel(logic.id)} / ${summarizeParams(params)}`);
          }}
        >
          ACTIVEを更新
        </button>
      </div>

      

      <div className="grid gap-2">
        {rows.length === 0 && <div className="text-sm text-gray-500">対象レースはありません</div>}
        {rows.map(r => (
          <div key={r.raceId} className="card">
            <div className="text-xs text-gray-500">
              {r.date} / {r.raceId} / {r.course}
            </div>
            <div className="font-semibold">本命: {r.main ?? '-'}</div>
            <div>相手: {r.rivals.join('、')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
