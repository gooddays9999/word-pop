import { GRADUATED, type BoxOrGraduated, type ProgressMap, type WordProgress } from '../../types/progress'
import { dayDiff, type DayStamp } from '../../utils/date'
import { shuffle, type Rng } from '../../utils/random'

export function isDue(progress: WordProgress, today: DayStamp): boolean {
  return progress.box !== GRADUATED && progress.dueDay <= today
}

function boxRank(box: BoxOrGraduated): number {
  return box === GRADUATED ? Number.MAX_SAFE_INTEGER : box
}

/**
 * 选取今日到期词：逾期越久越优先，同逾期时低盒子优先，
 * 其余次序随机（注入 rng 保证可测）。
 */
export function selectDue(
  progress: ProgressMap,
  today: DayStamp,
  cap: number,
  rng: Rng,
): WordProgress[] {
  const due = Object.values(progress).filter((p) => isDue(p, today))
  const shuffled = shuffle(due, rng)
  const sorted = [...shuffled].sort((a, b) => {
    const overdueA = dayDiff(a.dueDay, today)
    const overdueB = dayDiff(b.dueDay, today)
    if (overdueA !== overdueB) return overdueB - overdueA
    return boxRank(a.box) - boxRank(b.box)
  })
  return sorted.slice(0, Math.max(0, cap))
}
