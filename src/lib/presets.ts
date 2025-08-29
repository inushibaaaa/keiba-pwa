import { db } from './db'
import type { Preset } from './types'


export async function upsertPreset(p: Preset){
  const row = { ...p, createdAt: p.createdAt ?? Date.now() }
  await db.presets.put(row)
  return row
}
export async function getPreset(id: string){ return db.presets.get(id) }
export async function deletePreset(id: string){ return db.presets.delete(id) }


export async function setActive(p: Preset){
  await db.presets.put({ ...p, id: 'ACTIVE', label: 'ACTIVE', createdAt: Date.now() })
}
export async function getActive(){ return getPreset('ACTIVE') }