import { GRADUATED } from '../types/progress'
import type { SaveData } from '../types/save'
import type { LevelDef } from '../types/word'
import { isDue } from '../engine/srs/due'
import { todayStamp } from '../utils/date'

/** 今日还可引入的新词数 */
export function newWordsRemainingToday(save: SaveData): number {
  const today = todayStamp()
  const used = save.stats.dailyLog[today]?.news ?? 0
  return Math.max(0, save.settings.newWordsPerDay - used)
}

/** 当前到期待复习词数 */
export function dueCount(save: SaveData): number {
  const today = todayStamp()
  return Object.values(save.wordProgress).filter((progress) => isDue(progress, today)).length
}

/** 已学会（box≥1 或毕业）的词数，即图鉴收集数 */
export function learnedCount(save: SaveData): number {
  return Object.values(save.wordProgress).filter(
    (progress) => progress.box === GRADUATED || progress.box >= 1,
  ).length
}

export type LevelStatus = 'locked' | 'available' | 'inProgress' | 'completed'

export interface LevelView {
  readonly level: LevelDef
  readonly status: LevelStatus
  readonly learnedWords: number
  readonly stars: number
}

/** 关卡视图：顺序解锁（第一关或前一关完成即解锁） */
export function levelViews(save: SaveData, levels: readonly LevelDef[]): LevelView[] {
  return levels.map((level, index) => {
    const learnedWords = level.wordIds.filter((wordId) => {
      const progress = save.wordProgress[wordId]
      return progress !== undefined && (progress.box === GRADUATED || progress.box >= 1)
    }).length
    const completedEntry = save.levelProgress[level.id]
    const previous = index === 0 ? null : (levels[index - 1] ?? null)
    const previousDone = previous === null || save.levelProgress[previous.id] !== undefined
    const started = level.wordIds.some((wordId) => save.wordProgress[wordId] !== undefined)

    let status: LevelStatus
    if (completedEntry) status = 'completed'
    else if (started) status = 'inProgress'
    else if (previousDone) status = 'available'
    else status = 'locked'

    return { level, status, learnedWords, stars: completedEntry?.stars ?? 0 }
  })
}
