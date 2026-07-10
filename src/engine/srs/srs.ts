import {
  BOX_INTERVALS,
  BOX0_REQUIRED_HITS,
  GRADUATED_WRONG_BOX,
  MAX_BOX,
  WRONG_DROP,
} from '../../config/srs'
import { GRADUATED, type Box, type WordProgress } from '../../types/progress'
import type { WordId } from '../../types/word'
import { addDays, type DayStamp } from '../../utils/date'

export function createProgress(wordId: WordId, today: DayStamp): WordProgress {
  return {
    wordId,
    box: 0,
    box0Hits: 0,
    dueDay: today,
    lastDay: null,
    wrongCount: 0,
    correctCount: 0,
    introducedDay: today,
  }
}

/** Leitner 盒子转移核心：一次作答产生新的进度状态 */
export function reviewWord(progress: WordProgress, correct: boolean, today: DayStamp): WordProgress {
  return correct ? applyCorrect(progress, today) : applyWrong(progress, today)
}

function applyCorrect(progress: WordProgress, today: DayStamp): WordProgress {
  const base = { ...progress, lastDay: today, correctCount: progress.correctCount + 1 }
  if (progress.box === GRADUATED) {
    return base
  }
  if (progress.box === 0) {
    const hits = progress.box0Hits + 1
    if (hits < BOX0_REQUIRED_HITS) {
      return { ...base, box0Hits: hits, dueDay: today }
    }
    return { ...base, box: 1, box0Hits: 0, dueDay: addDays(today, intervalForBox(1)) }
  }
  if (progress.box === MAX_BOX) {
    return { ...base, box: GRADUATED, box0Hits: 0 }
  }
  const nextBox = (progress.box + 1) as Box
  return { ...base, box: nextBox, box0Hits: 0, dueDay: addDays(today, intervalForBox(nextBox)) }
}

function applyWrong(progress: WordProgress, today: DayStamp): WordProgress {
  const box =
    progress.box === GRADUATED
      ? GRADUATED_WRONG_BOX
      : (Math.max(0, progress.box - WRONG_DROP) as Box)
  return {
    ...progress,
    box,
    box0Hits: 0,
    dueDay: today,
    lastDay: today,
    wrongCount: progress.wrongCount + 1,
  }
}

function intervalForBox(box: Box): number {
  const interval = BOX_INTERVALS[box]
  if (interval === undefined) {
    throw new Error(`盒子 ${box} 缺少间隔配置`)
  }
  return interval
}
