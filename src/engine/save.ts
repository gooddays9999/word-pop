import { DEFAULT_NEW_WORDS_PER_DAY } from '../config/session'
import type { SaveData } from '../types/save'
import type { DayStamp } from '../utils/date'

/** 新玩家初始存档。安装日视作已备份，备份提醒从 7 天后开始。 */
export function createInitialSave(today: DayStamp, nowIso: string): SaveData {
  return {
    createdAt: nowIso,
    updatedAt: nowIso,
    player: {
      xp: 0,
      level: 1,
      coins: 0,
      streak: { current: 0, best: 0, lastActiveDay: null },
    },
    settings: {
      newWordsPerDay: DEFAULT_NEW_WORDS_PER_DAY,
      ttsEnabled: true,
      sfxEnabled: true,
    },
    wordProgress: {},
    levelProgress: {},
    stats: { dailyLog: {} },
    lastBackupDay: today,
  }
}
