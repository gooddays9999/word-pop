export type WordId = string

export interface WordEntry {
  readonly id: WordId
  readonly word: string
  readonly phonetic?: string
  readonly pos: string
  readonly meaning: string
  readonly example?: string
  readonly exampleZh?: string
  readonly theme: string
}

export interface WordDb {
  readonly list: readonly WordEntry[]
  readonly byId: ReadonlyMap<WordId, WordEntry>
}

export interface LevelDef {
  readonly id: string
  readonly regionId: string
  readonly index: number
  readonly wordIds: readonly WordId[]
}

export interface RegionDef {
  readonly id: string
  readonly name: string
  readonly emoji: string
  readonly description: string
  readonly levelIds: readonly string[]
}
