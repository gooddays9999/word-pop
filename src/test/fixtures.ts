import type { WordEntry, WordDb } from '../types/word'
import type { WordProgress } from '../types/progress'
import type { WordId } from '../types/word'
import { makeWordDb } from '../data/wordDb'

export const TODAY = '2026-07-10'
export const TOMORROW = '2026-07-11'

export function makeWord(overrides: Partial<WordEntry> & { id: string }): WordEntry {
  return {
    word: overrides.id,
    phonetic: '/test/',
    pos: 'n.',
    meaning: `释义-${overrides.id}`,
    theme: 'school',
    ...overrides,
  }
}

export const FIXTURE_WORDS: readonly WordEntry[] = [
  makeWord({ id: 'apple', pos: 'n.', theme: 'food', meaning: '苹果' }),
  makeWord({ id: 'banana', pos: 'n.', theme: 'food', meaning: '香蕉' }),
  makeWord({ id: 'orange', pos: 'n.', theme: 'food', meaning: '橙子；橙色' }),
  makeWord({ id: 'grape', pos: 'n.', theme: 'food', meaning: '葡萄' }),
  makeWord({ id: 'bread', pos: 'n.', theme: 'food', meaning: '面包' }),
  makeWord({ id: 'run', pos: 'v.', theme: 'sports', meaning: '跑；奔跑' }),
  makeWord({ id: 'jump', pos: 'v.', theme: 'sports', meaning: '跳' }),
  makeWord({ id: 'swim', pos: 'v.', theme: 'sports', meaning: '游泳' }),
  makeWord({ id: 'term', pos: 'n.', theme: 'school', meaning: '学期；术语' }),
  makeWord({ id: 'semester', pos: 'n.', theme: 'school', meaning: '学期（半学年）' }),
  makeWord({ id: 'desk', pos: 'n.', theme: 'school', meaning: '课桌' }),
  makeWord({ id: 'chair', pos: 'n.', theme: 'school', meaning: '椅子' }),
]

export const FIXTURE_DB: WordDb = makeWordDb(FIXTURE_WORDS)

export function makeProgress(
  wordId: WordId,
  overrides: Partial<WordProgress> = {},
): WordProgress {
  return {
    wordId,
    box: 0,
    box0Hits: 0,
    dueDay: TODAY,
    lastDay: null,
    wrongCount: 0,
    correctCount: 0,
    introducedDay: TODAY,
    ...overrides,
  }
}
