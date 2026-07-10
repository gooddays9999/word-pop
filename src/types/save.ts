import type { DayStamp } from '../utils/date'
import type { ProgressMap } from './progress'

export interface StreakState {
  readonly current: number
  readonly best: number
  readonly lastActiveDay: DayStamp | null
}

export interface PlayerState {
  readonly xp: number
  readonly level: number
  readonly coins: number
  readonly streak: StreakState
}

export interface SettingsState {
  readonly newWordsPerDay: number
  readonly ttsEnabled: boolean
  readonly sfxEnabled: boolean
}

export interface DailyLogEntry {
  readonly reviews: number
  readonly news: number
  readonly correct: number
  readonly wrong: number
}

export interface LevelProgressEntry {
  readonly stars: number
  readonly completedDay: DayStamp
}

/** 运行时存档结构（序列化细节由 storage 层处理） */
export interface SaveData {
  readonly createdAt: string
  readonly updatedAt: string
  readonly player: PlayerState
  readonly settings: SettingsState
  readonly wordProgress: ProgressMap
  readonly levelProgress: Readonly<Record<string, LevelProgressEntry>>
  readonly stats: {
    readonly dailyLog: Readonly<Record<DayStamp, DailyLogEntry>>
  }
  readonly lastBackupDay: DayStamp | null
}
