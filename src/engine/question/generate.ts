import { CHOICE_OPTION_COUNT } from '../../config/session'
import type { Question, QuestionType } from '../../types/question'
import type { WordDb, WordEntry, WordId } from '../../types/word'
import { shuffle, type Rng } from '../../utils/random'
import { firstSense, selectDistractors } from './distractors'

function optionLabel(entry: WordEntry, type: QuestionType): string {
  return type === 'reverse' ? entry.word : firstSense(entry.meaning)
}

function promptKindFor(type: QuestionType): 'en' | 'zh' | 'audio' {
  if (type === 'reverse') return 'zh'
  if (type === 'listening') return 'audio'
  return 'en'
}

/** 由词条生成一道题。type 需已经过 downgradeQuestionType 处理。 */
export function generateQuestion(
  entry: WordEntry,
  type: QuestionType,
  db: WordDb,
  recentIds: ReadonlySet<WordId>,
  rng: Rng,
): Question {
  if (type === 'spelling') {
    return {
      kind: 'spelling',
      type,
      wordId: entry.id,
      meaning: firstSense(entry.meaning),
      answer: entry.word,
      ...(entry.phonetic !== undefined ? { phonetic: entry.phonetic } : {}),
    }
  }
  const distractors = selectDistractors(entry, db, CHOICE_OPTION_COUNT - 1, recentIds, rng)
  const options = shuffle(
    [entry, ...distractors].map((candidate) => ({
      wordId: candidate.id,
      label: optionLabel(candidate, type),
    })),
    rng,
  )
  return {
    kind: 'choice',
    type,
    wordId: entry.id,
    prompt: type === 'reverse' ? entry.meaning : entry.word,
    promptKind: promptKindFor(type),
    options,
    correctWordId: entry.id,
  }
}
