import { REVIEW_DAILY_CAP, TEACH_BATCH_SIZE } from '../../config/session'
import type { ProgressMap } from '../../types/progress'
import type { QuestionType } from '../../types/question'
import type { SessionItem, SessionState } from '../../types/session'
import type { LevelDef, WordDb, WordId } from '../../types/word'
import type { DayStamp } from '../../utils/date'
import { shuffle, type Rng } from '../../utils/random'
import { selectDue } from '../srs/due'
import { downgradeQuestionType, questionTypeForBox } from '../srs/stage'
import { createSessionState } from './runner'

export interface BuildContext {
  readonly db: WordDb
  readonly progress: ProgressMap
  readonly today: DayStamp
  readonly rng: Rng
  /** 当前环境支持的题型（无 TTS/未实现拼写 UI 时收窄） */
  readonly allowedTypes: readonly QuestionType[]
}

/** 每日复习副本：全部到期词，一词一题，题型按盒子映射 */
export function buildReviewSession(
  ctx: BuildContext,
  cap: number = REVIEW_DAILY_CAP,
): SessionState | null {
  const due = selectDue(ctx.progress, ctx.today, cap, ctx.rng)
  const items = due
    .filter((progress) => ctx.db.byId.has(progress.wordId))
    .map(
      (progress): SessionItem => ({
        kind: 'question',
        wordId: progress.wordId,
        questionType: downgradeQuestionType(questionTypeForBox(progress.box), ctx.allowedTypes),
        isNew: false,
      }),
    )
  if (items.length === 0) return null
  return createSessionState('review', null, items)
}

/**
 * 关卡会话：未引入的词按小批「先教学卡后提问」组织，
 * 已引入但还在 box0 的词只出题不再教学、不占新词额度。
 */
export function buildLevelSession(
  ctx: BuildContext,
  level: LevelDef,
  newAllowance: number,
): SessionState | null {
  const fresh: WordId[] = []
  const relearn: WordId[] = []
  for (const wordId of level.wordIds) {
    if (!ctx.db.byId.has(wordId)) continue
    const progress = ctx.progress[wordId]
    if (!progress) {
      fresh.push(wordId)
    } else if (progress.box === 0) {
      relearn.push(wordId)
    }
  }

  const introduced = fresh.slice(0, Math.max(0, newAllowance))
  if (introduced.length === 0 && relearn.length === 0) return null

  const questionFor = (wordId: WordId): SessionItem => ({
    kind: 'question',
    wordId,
    questionType: downgradeQuestionType(questionTypeForBox(0), ctx.allowedTypes),
    isNew: true,
  })

  const relearnItems = shuffle(relearn, ctx.rng).map(questionFor)
  const batchItems: SessionItem[] = []
  for (const batch of chunk(introduced, TEACH_BATCH_SIZE)) {
    batchItems.push(...batch.map((wordId): SessionItem => ({ kind: 'teach', wordId })))
    batchItems.push(...shuffle(batch, ctx.rng).map(questionFor))
  }

  return createSessionState('level', level.id, [...relearnItems, ...batchItems])
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    chunks.push([...items.slice(start, start + size)])
  }
  return chunks
}
