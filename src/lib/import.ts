import { db } from './db'
import type { Race, Entry, Result } from './types'


export async function importJson(payload: {races: Race[]; entries: Entry[]; results?: Result[]}){
if(!payload || !Array.isArray(payload.races) || !Array.isArray(payload.entries)){
throw new Error('Invalid JSON: races[] / entries[] is required')
}
await db.transaction('rw', db.races, db.entries, db.results, async ()=>{
await db.races.bulkPut(payload.races)
await db.entries.bulkPut(payload.entries)
if(payload.results?.length) await db.results.bulkPut(payload.results)
})
}


export async function clearAll(){
await db.transaction('rw', db.races, db.entries, db.results, async ()=>{
await db.races.clear()
await db.entries.clear()
await db.results.clear()
})
}