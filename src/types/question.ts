import type { WordId } from './word'

export type QuestionType = 'recognition' | 'reverse' | 'listening' | 'spelling'

export interface ChoiceOption {
  readonly wordId: WordId
  readonly label: string
}

export interface ChoiceQuestion {
  readonly kind: 'choice'
  readonly type: 'recognition' | 'reverse' | 'listening'
  readonly wordId: WordId
  /** recognition/listening: 英文单词；reverse: 中文释义 */
  readonly prompt: string
  readonly promptKind: 'en' | 'zh' | 'audio'
  readonly options: readonly ChoiceOption[]
  readonly correctWordId: WordId
}

export interface SpellingQuestion {
  readonly kind: 'spelling'
  readonly type: 'spelling'
  readonly wordId: WordId
  readonly meaning: string
  readonly answer: string
  readonly phonetic?: string
}

export type Question = ChoiceQuestion | SpellingQuestion
