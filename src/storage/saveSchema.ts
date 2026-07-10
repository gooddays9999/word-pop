import { z } from 'zod'
import { MAX_NEW_WORDS_PER_DAY } from '../config/session'
import { SAVE_VERSION } from '../config/storage'
import { GRADUATED, type Box, type WordProgress } from '../types/progress'
import type { SaveData } from '../types/save'

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const dayStamp = z.string().regex(DAY_PATTERN, '日期需为 YYYY-MM-DD')

/** 毕业盒子在序列化时编码为 7 */
const GRADUATED_CODE = 7

/** 紧凑进度元组: [box, box0Hits, dueDay, lastDay('' 表示无), wrongCount, correctCount, introducedDay] */
const progressTuple = z.tuple([
  z.number().int().min(0).max(GRADUATED_CODE),
  z.number().int().min(0),
  dayStamp,
  z.union([dayStamp, z.literal('')]),
  z.number().int().min(0),
  z.number().int().min(0),
  dayStamp,
])

export const saveFileV1Schema = z.object({
  version: z.literal(SAVE_VERSION),
  createdAt: z.string(),
  updatedAt: z.string(),
  player: z.object({
    xp: z.number().min(0),
    level: z.number().int().min(1),
    coins: z.number().min(0),
    streak: z.object({
      current: z.number().int().min(0),
      best: z.number().int().min(0),
      lastActiveDay: z.union([dayStamp, z.null()]),
    }),
  }),
  settings: z.object({
    newWordsPerDay: z.number().int().min(1).max(MAX_NEW_WORDS_PER_DAY),
    ttsEnabled: z.boolean(),
    sfxEnabled: z.boolean(),
  }),
  wordProgress: z.record(z.string(), progressTuple),
  levelProgress: z.record(
    z.string(),
    z.object({ stars: z.number().int().min(0).max(3), completedDay: dayStamp }),
  ),
  stats: z.object({
    dailyLog: z.record(
      z.string(),
      z.object({
        reviews: z.number().int().min(0),
        news: z.number().int().min(0),
        correct: z.number().int().min(0),
        wrong: z.number().int().min(0),
      }),
    ),
  }),
  lastBackupDay: z.union([dayStamp, z.null()]),
})

export type SaveFileV1 = z.infer<typeof saveFileV1Schema>
type ProgressTuple = z.infer<typeof progressTuple>

function toTuple(progress: WordProgress): ProgressTuple {
  return [
    progress.box === GRADUATED ? GRADUATED_CODE : progress.box,
    progress.box0Hits,
    progress.dueDay,
    progress.lastDay ?? '',
    progress.wrongCount,
    progress.correctCount,
    progress.introducedDay,
  ]
}

function fromTuple(wordId: string, tuple: ProgressTuple): WordProgress {
  const [boxCode, box0Hits, dueDay, lastDay, wrongCount, correctCount, introducedDay] = tuple
  return {
    wordId,
    box: boxCode === GRADUATED_CODE ? GRADUATED : (boxCode as Box),
    box0Hits,
    dueDay,
    lastDay: lastDay === '' ? null : lastDay,
    wrongCount,
    correctCount,
    introducedDay,
  }
}

export function serializeSave(save: SaveData): SaveFileV1 {
  return {
    version: SAVE_VERSION,
    createdAt: save.createdAt,
    updatedAt: save.updatedAt,
    player: save.player,
    settings: save.settings,
    wordProgress: Object.fromEntries(
      Object.entries(save.wordProgress).map(([wordId, progress]) => [wordId, toTuple(progress)]),
    ),
    levelProgress: save.levelProgress,
    stats: save.stats,
    lastBackupDay: save.lastBackupDay,
  }
}

export function deserializeSave(file: SaveFileV1): SaveData {
  return {
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
    player: file.player,
    settings: file.settings,
    wordProgress: Object.fromEntries(
      Object.entries(file.wordProgress).map(([wordId, tuple]) => [
        wordId,
        fromTuple(wordId, tuple),
      ]),
    ),
    levelProgress: file.levelProgress,
    stats: file.stats,
    lastBackupDay: file.lastBackupDay,
  }
}
