import { db } from './db'
import { sampleData } from './sample'

// 初回だけサンプル投入（既にracesがあればスキップ）
export async function ensureSampleLoaded() {
  const anyRace = await db.races.limit(1).toArray()
  if (anyRace.length) return
  await db.transaction('rw', db.races, db.entries, db.results, async ()=>{
    await db.races.bulkPut(sampleData.races)
    await db.entries.bulkPut(sampleData.entries)
    await db.results.bulkPut(sampleData.results)
  })
}
