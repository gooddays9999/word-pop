import { z } from 'zod'
import compiledWords from './words.compiled.json'
import { makeWordDb } from './wordDb'
import type { WordDb } from '../types/word'

const wordEntrySchema = z.object({
  id: z.string().min(1),
  word: z.string().min(1),
  phonetic: z.string().optional(),
  pos: z.string().min(1),
  meaning: z.string().min(1),
  example: z.string().optional(),
  exampleZh: z.string().optional(),
  theme: z.string().min(1),
})

function loadWordDb(): WordDb {
  const parsed = z.array(wordEntrySchema).min(1).safeParse(compiledWords)
  if (!parsed.success) {
    // 词库是构建期产物，出错说明构建产物损坏，直接失败并给出线索
    throw new Error(`词库数据损坏，请重新运行 npm run words:build（${parsed.error.issues[0]?.message}）`)
  }
  return makeWordDb(parsed.data)
}

export const WORD_DB: WordDb = loadWordDb()
