import Dexie, { Table } from 'dexie'
import type { Race, Entry, Result, Preset } from './types'

export class KeibaDB extends Dexie {
  races!: Table<Race, string>
  entries!: Table<Entry, [string, string]>
  results!: Table<Result, string>
  presets!: Table<Preset, string>
  constructor(){
    super('keiba_pwa')
    this.version(1).stores({
      races: 'raceId,date',
      entries: '[raceId+horseId],raceId,horseId,horseName',
      results: 'raceId',
      presets: 'id,label,logicId'
    })
  }
}
export const db = new KeibaDB()
