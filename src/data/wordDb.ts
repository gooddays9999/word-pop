import type { WordDb, WordEntry } from '../types/word'

export function makeWordDb(list: readonly WordEntry[]): WordDb {
  return {
    list,
    byId: new Map(list.map((entry) => [entry.id, entry])),
  }
}
