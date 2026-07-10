import {
  COINS_LEVEL_BONUS,
  COINS_PER_CORRECT,
  COINS_SESSION_BONUS,
  STARS_THREE_ACCURACY,
  STARS_TWO_ACCURACY,
  XP_PER_CORRECT,
  XP_PER_WRONG,
} from '../../config/economy'
import { GRADUATED, type BoxOrGraduated } from '../../types/progress'
import type { SaveData } from '../../types/save'
import type { SessionState } from '../../types/session'
import type { LevelDef, WordId } from '../../types/word'
import type { DayStamp } from '../../utils/date'
import { levelForXp } from '../economy/xp'
import { updateStreak } from '../economy/streak'
import { createProgress, reviewWord } from '../srs/srs'

export interface SessionSummary {
  readonly totalAnswers: number
  readonly correct: number
  readonly wrong: number
  readonly accuracy: number
  readonly newlyLearned: readonly WordId[]
  readonly xpGained: number
  readonly coinsGained: number
  readonly levelCompleted: boolean
  readonly stars: number
}

export interface ResultsContext {
  readonly today: DayStamp
  /** 关卡会话对应的关卡定义（其他会话为 null） */
  readonly level: LevelDef | null
}

function isLearned(box: BoxOrGraduated): boolean {
  return box === GRADUATED || box >= 1
}

function starsForAccuracy(accuracy: number): number {
  if (accuracy >= STARS_THREE_ACCURACY) return 3
  if (accuracy >= STARS_TWO_ACCURACY) return 2
  return 1
}

/** 会话结束结算：按答题顺序回放 SRS、累计经济与统计，返回新存档 */
export function applyResults(
  save: SaveData,
  session: SessionState,
  ctx: ResultsContext,
): { save: SaveData; summary: SessionSummary } {
  let progress = save.wordProgress
  for (const record of session.records) {
    const before = progress[record.wordId] ?? createProgress(record.wordId, ctx.today)
    progress = { ...progress, [record.wordId]: reviewWord(before, record.correct, ctx.today) }
  }

  const answeredIds = unique(session.records.map((record) => record.wordId))
  const newlyLearned = answeredIds.filter((wordId) => {
    const before = save.wordProgress[wordId]
    const after = progress[wordId]
    const wasLearned = before !== undefined && isLearned(before.box)
    return !wasLearned && after !== undefined && isLearned(after.box)
  })

  const totalAnswers = session.records.length
  const correct = session.records.filter((record) => record.correct).length
  const wrong = totalAnswers - correct
  const accuracy = totalAnswers === 0 ? 0 : correct / totalAnswers
  const newIds = unique(session.records.filter((r) => r.isNew).map((r) => r.wordId))
  const reviewIds = unique(session.records.filter((r) => !r.isNew).map((r) => r.wordId))

  const level = session.kind === 'level' ? ctx.level : null
  const levelCompleted =
    level !== null &&
    level.wordIds.every((wordId) => {
      const wordProgress = progress[wordId]
      return wordProgress !== undefined && isLearned(wordProgress.box)
    })
  const stars = levelCompleted ? starsForAccuracy(accuracy) : 0

  let levelProgress = save.levelProgress
  let firstCompletion = false
  if (level !== null && levelCompleted) {
    const existing = save.levelProgress[level.id]
    firstCompletion = existing === undefined
    const entry = existing
      ? { stars: Math.max(existing.stars, stars), completedDay: existing.completedDay }
      : { stars, completedDay: ctx.today }
    levelProgress = { ...levelProgress, [level.id]: entry }
  }

  const xpGained = correct * XP_PER_CORRECT + wrong * XP_PER_WRONG
  const coinsGained =
    correct * COINS_PER_CORRECT + COINS_SESSION_BONUS + (firstCompletion ? COINS_LEVEL_BONUS : 0)
  const xp = save.player.xp + xpGained

  const previousLog = save.stats.dailyLog[ctx.today] ?? { reviews: 0, news: 0, correct: 0, wrong: 0 }
  const dailyLog = {
    ...save.stats.dailyLog,
    [ctx.today]: {
      reviews: previousLog.reviews + reviewIds.length,
      news: previousLog.news + newIds.length,
      correct: previousLog.correct + correct,
      wrong: previousLog.wrong + wrong,
    },
  }

  const nextSave: SaveData = {
    ...save,
    player: {
      xp,
      level: levelForXp(xp),
      coins: save.player.coins + coinsGained,
      streak: updateStreak(save.player.streak, ctx.today),
    },
    wordProgress: progress,
    levelProgress,
    stats: { dailyLog },
  }

  return {
    save: nextSave,
    summary: {
      totalAnswers,
      correct,
      wrong,
      accuracy,
      newlyLearned,
      xpGained,
      coinsGained,
      levelCompleted,
      stars,
    },
  }
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)]
}
