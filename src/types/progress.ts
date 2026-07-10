import type { WordId } from './word'
import type { DayStamp } from '../utils/date'

export const GRADUATED = 'graduated'

export type Box = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type BoxOrGraduated = Box | typeof GRADUATED

export interface WordProgress {
  readonly wordId: WordId
  readonly box: BoxOrGraduated
  /** box0 阶段的会话内累计答对次数（跨会话保留，满足 BOX0_REQUIRED_HITS 才升级） */
  readonly box0Hits: number
  readonly dueDay: DayStamp
  readonly lastDay: DayStamp | null
  readonly wrongCount: number
  readonly correctCount: number
  readonly introducedDay: DayStamp
}

export type ProgressMap = Readonly<Record<WordId, WordProgress>>
