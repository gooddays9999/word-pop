import type { WordDb, WordEntry, WordId } from '../../types/word'
import { shuffle, type Rng } from '../../utils/random'

const SENSE_SEPARATOR = /[；;，,、]/

/** 取释义的第一义项（用于选项展示与冲突判断） */
export function firstSense(meaning: string): string {
  const first = meaning.split(SENSE_SEPARATOR)[0]
  return (first ?? meaning).trim()
}

/** 首义项相同或互相包含（如「学期」与「学期（半学年）」）视为冲突，不能同题出现 */
export function meaningsConflict(a: string, b: string): boolean {
  const senseA = firstSense(a)
  const senseB = firstSense(b)
  return senseA === senseB || senseA.includes(senseB) || senseB.includes(senseA)
}

function primaryPos(pos: string): string {
  const first = pos.split('/')[0]
  return (first ?? pos).trim()
}

/**
 * 干扰项选取：候选池按「同词性同主题 → 同词性 → 全库 → 全库(含最近出现)」
 * 逐级放宽，永不抛错；全程排除与正确答案或彼此释义冲突的词。
 */
export function selectDistractors(
  correct: WordEntry,
  db: WordDb,
  count: number,
  recentIds: ReadonlySet<WordId>,
  rng: Rng,
): WordEntry[] {
  const pos = primaryPos(correct.pos)
  const base = db.list.filter(
    (entry) => entry.id !== correct.id && !meaningsConflict(entry.meaning, correct.meaning),
  )
  const tiers: readonly (readonly WordEntry[])[] = [
    base.filter(
      (entry) =>
        primaryPos(entry.pos) === pos && entry.theme === correct.theme && !recentIds.has(entry.id),
    ),
    base.filter((entry) => primaryPos(entry.pos) === pos && !recentIds.has(entry.id)),
    base.filter((entry) => !recentIds.has(entry.id)),
    base,
  ]

  const picked: WordEntry[] = []
  const pickedIds = new Set<WordId>()
  for (const tier of tiers) {
    if (picked.length >= count) break
    for (const candidate of shuffle(tier, rng)) {
      if (picked.length >= count) break
      if (pickedIds.has(candidate.id)) continue
      const conflictsWithPicked = picked.some((existing) =>
        meaningsConflict(existing.meaning, candidate.meaning),
      )
      if (conflictsWithPicked) continue
      picked.push(candidate)
      pickedIds.add(candidate.id)
    }
  }
  return picked
}
