import type { StreakState } from '../../types/save'
import { dayDiff, type DayStamp } from '../../utils/date'

/** 完成任一会话即记当日活跃；时钟回拨按同日处理，不清零 */
export function updateStreak(streak: StreakState, today: DayStamp): StreakState {
  const last = streak.lastActiveDay
  if (last === null) {
    return { current: 1, best: Math.max(1, streak.best), lastActiveDay: today }
  }
  const diff = dayDiff(last, today)
  if (diff <= 0) return streak
  const current = diff === 1 ? streak.current + 1 : 1
  return { current, best: Math.max(current, streak.best), lastActiveDay: today }
}
