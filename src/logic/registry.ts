import type { LogicDefinition, Entry } from '@/lib/types'

const basicLogic: LogicDefinition = {
  id: 'basic-check-avg', name: 'チェック平均ベース', version: '1.0.0',
  params: [
    { key: 'minGap',  label: '1位と2位の差', type: 'number', defaultValue: 0, min:0, max:20, step:0.5 },
    { key: 'rivals',  label: '相手頭数',       type: 'number', defaultValue: 4, min:1, max:8,  step:1   },
    { key: 'recent3', label: '直近3走にcheck必須', type: 'switch', defaultValue: false },
    { key: 'ratioMin',label: 'check割合の下限', type: 'number', defaultValue: 0.0, min:0, max:1, step:0.05 },
  ],
  run(entries: Entry[], p){
    // flags.checkValues を平均値に。ペナルティは簡易。
    const scored = entries.map(e=>{
      const checks = (e.flags?.checkValues ?? []) as number[]
      const avg = checks.length ? checks.reduce((a,b)=>a+b)/checks.length : -Infinity
      let score = avg
      const recent3 = (e.timeIndex5 ?? []).slice(-3)
      const hasRecent = recent3.some(v=>v!=null)
      const totalNonNull = (e.timeIndex5 ?? []).filter(v=>v!=null).length
      const ratio = totalNonNull ? (checks.length / totalNonNull) : 0
      if(p.recent3 && !hasRecent) score -= 3
      if(ratio < (p.ratioMin ?? 0)) score -= 3
      return { name: e.horseName, score }
    }).sort((a,b)=>b.score-a.score)

    if(scored.length===0 || scored[0].score===-Infinity) return { main: null, rivals: [], filtered: false }
    const top=scored[0], second=scored[1]
    if(second && (top.score - second.score) < (p.minGap ?? 0)) return { main: null, rivals: [], filtered: false }

    const main = top.name
    const rivals = scored.filter(s=>s.name!==main).slice(0, p.rivals ?? 4).map(s=>s.name)
    return { main, rivals, filtered: true }
  }
}

export const logicRegistry: Record<string, LogicDefinition> = { [basicLogic.id]: basicLogic }
