import type { WordId } from './word'
import type { QuestionType } from './question'

export type SessionKind = 'level' | 'review' | 'boss'

export type SessionItem =
  | { readonly kind: 'teach'; readonly wordId: WordId }
  | {
      readonly kind: 'question'
      readonly wordId: WordId
      readonly questionType: QuestionType
      readonly isNew: boolean
    }

export interface AnswerRecord {
  readonly wordId: WordId
  readonly correct: boolean
  readonly responseMs: number
  readonly isNew: boolean
}

export interface SessionState {
  readonly kind: SessionKind
  readonly levelId: string | null
  readonly items: readonly SessionItem[]
  readonly cursor: number
  readonly records: readonly AnswerRecord[]
  /** 会话内每词连续答对次数（答错清零） */
  readonly hits: Readonly<Record<WordId, number>>
  /** 每词已重插次数（防死循环） */
  readonly requeues: Readonly<Record<WordId, number>>
  readonly done: boolean
}
