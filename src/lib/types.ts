export type RaceId = string
export type HorseId = string

export interface Race {
  raceId: RaceId;
  date: string;
  course?: string;       // ← 任意に
  distance?: number;     // ← 任意に
  surface?: '芝'|'ダート'|'障害'; // ← 任意に
  classLabel?: string;
}
export interface Entry { raceId: RaceId; horseId: HorseId; horseName: string; timeIndex5?: (number|null)[]; timeIndexAvg?: number|null; flags?: Record<string, any> }
export interface Result { raceId: RaceId; top3: string[]; payouts: Record<string, number> }


export interface LogicParamSchema { key: string; label: string; type: 'number'|'select'|'switch'; defaultValue: any; min?: number; max?: number; step?: number; options?: {label:string; value:any;}[] }
export interface LogicDefinition {
  id: string; name: string; version: string; params: LogicParamSchema[];
  run: (entries: Entry[], params: Record<string, any>) => { main: string|null; rivals: string[]; filtered: boolean }
}
export interface Preset { id: string; label: string; logicId: string; params: Record<string,any>; createdAt?: number }