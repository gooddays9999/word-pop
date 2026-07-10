import { BACKUP_KEEP, BACKUP_KEY_PREFIX, STORAGE_KEY } from '../config/storage'
import type { SaveData } from '../types/save'
import type { DayStamp } from '../utils/date'
import { err, ok, type Result } from '../utils/result'
import { migrateSave } from './migrations'
import { serializeSave } from './saveSchema'

export interface LoadOutcome {
  readonly save: SaveData
  readonly recoveredFromBackup: boolean
}

export type LoadError = 'empty' | 'corrupt'

function defaultStorage(): Storage {
  return window.localStorage
}

function tryParse(raw: string): Result<SaveData, string> {
  try {
    return migrateSave(JSON.parse(raw))
  } catch (cause) {
    return err(`存档 JSON 解析失败: ${cause instanceof Error ? cause.message : String(cause)}`)
  }
}

/** 读取存档；主档损坏时按新→旧尝试备份 */
export function loadSave(storage: Storage = defaultStorage()): Result<LoadOutcome, LoadError> {
  const raw = storage.getItem(STORAGE_KEY)
  if (raw === null) return err('empty')

  const main = tryParse(raw)
  if (main.ok) return ok({ save: main.value, recoveredFromBackup: false })
  console.error('[word-pop] 主存档损坏，尝试备份恢复:', main.error)

  for (const key of listBackupKeys(storage)) {
    const backupRaw = storage.getItem(key)
    if (backupRaw === null) continue
    const backup = tryParse(backupRaw)
    if (backup.ok) {
      console.warn(`[word-pop] 已从备份 ${key} 恢复存档`)
      return ok({ save: backup.value, recoveredFromBackup: true })
    }
  }
  return err('corrupt')
}

/** 写入存档（刷新 updatedAt），返回实际落盘的数据 */
export function persistSave(
  save: SaveData,
  nowIso: string,
  storage: Storage = defaultStorage(),
): Result<SaveData, string> {
  const stamped: SaveData = { ...save, updatedAt: nowIso }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(serializeSave(stamped)))
    return ok(stamped)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    console.error('[word-pop] 存档写入失败:', message)
    return err(`存档写入失败（可能是存储空间不足）: ${message}`)
  }
}

/** 备份 key 列表，按日期新→旧排序 */
export function listBackupKeys(storage: Storage = defaultStorage()): string[] {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i)
    if (key !== null && key.startsWith(BACKUP_KEY_PREFIX)) keys.push(key)
  }
  return keys.sort((a, b) => b.localeCompare(a))
}

/** 每日首次启动写一份备份快照，只保留最近 BACKUP_KEEP 份 */
export function writeDailyBackup(
  save: SaveData,
  today: DayStamp,
  storage: Storage = defaultStorage(),
): void {
  const key = `${BACKUP_KEY_PREFIX}${today}`
  try {
    if (storage.getItem(key) !== null) return
    storage.setItem(key, JSON.stringify(serializeSave(save)))
    pruneBackups(storage)
  } catch (cause) {
    // 备份失败不阻塞游戏，但要留下线索
    console.error('[word-pop] 每日备份写入失败:', cause)
  }
}

/**
 * 覆盖性操作（导入/重置）前的安全快照：无条件写入、同日可覆盖。
 * key 带 -snapshot 后缀，恢复时按字典序排在同日每日备份之前。
 */
export function writeSnapshotBackup(
  save: SaveData,
  today: DayStamp,
  storage: Storage = defaultStorage(),
): boolean {
  const key = `${BACKUP_KEY_PREFIX}${today}-snapshot`
  try {
    storage.setItem(key, JSON.stringify(serializeSave(save)))
    pruneBackups(storage)
    return true
  } catch (cause) {
    console.error('[word-pop] 安全快照写入失败:', cause)
    return false
  }
}

function pruneBackups(storage: Storage): void {
  for (const staleKey of listBackupKeys(storage).slice(BACKUP_KEEP)) {
    storage.removeItem(staleKey)
  }
}
