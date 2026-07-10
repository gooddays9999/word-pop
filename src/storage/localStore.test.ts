import { beforeEach, describe, expect, it } from 'vitest'
import {
  listBackupKeys,
  loadSave,
  persistSave,
  writeDailyBackup,
  writeSnapshotBackup,
} from './localStore'
import { BACKUP_KEEP, BACKUP_KEY_PREFIX, STORAGE_KEY } from '../config/storage'
import { createInitialSave } from '../engine/save'
import { memoryStorage } from '../test/memoryStorage'
import { TODAY } from '../test/fixtures'

const NOW_ISO = '2026-07-10T08:00:00.000Z'

let storage: Storage

beforeEach(() => {
  storage = memoryStorage()
})

describe('persistSave / loadSave', () => {
  it('首次无存档返回 empty', () => {
    const result = loadSave(storage)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('empty')
  })

  it('写入后可读回，并刷新 updatedAt', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const persisted = persistSave(save, '2026-07-10T09:00:00.000Z', storage)
    expect(persisted.ok).toBe(true)
    const result = loadSave(storage)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.save).toEqual({ ...save, updatedAt: '2026-07-10T09:00:00.000Z' })
      expect(result.value.recoveredFromBackup).toBe(false)
    }
  })

  it('主存档损坏时自动回退到备份', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    persistSave(save, NOW_ISO, storage)
    writeDailyBackup(save, TODAY, storage)
    storage.setItem(STORAGE_KEY, '{corrupt json')
    const result = loadSave(storage)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.recoveredFromBackup).toBe(true)
  })

  it('主存档与备份都不可用时返回 corrupt', () => {
    storage.setItem(STORAGE_KEY, '{corrupt json')
    storage.setItem(`${BACKUP_KEY_PREFIX}2026-07-09`, 'also corrupt')
    const result = loadSave(storage)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('corrupt')
  })

  it('存储写入异常返回错误而不抛出', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const throwing = {
      setItem: () => {
        throw new DOMException('QuotaExceededError')
      },
    } as unknown as Storage
    const result = persistSave(save, NOW_ISO, throwing)
    expect(result.ok).toBe(false)
  })
})

describe('writeDailyBackup', () => {
  it('每日一份，超过 BACKUP_KEEP 时裁剪最旧的', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const days = ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', TODAY]
    for (const day of days) writeDailyBackup(save, day, storage)
    const keys = listBackupKeys(storage)
    expect(keys).toHaveLength(BACKUP_KEEP)
    expect(keys).toContain(`${BACKUP_KEY_PREFIX}${TODAY}`)
    expect(keys).not.toContain(`${BACKUP_KEY_PREFIX}2026-07-06`)
  })

  it('同日重复调用不重写', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    writeDailyBackup(save, TODAY, storage)
    const first = storage.getItem(`${BACKUP_KEY_PREFIX}${TODAY}`)
    writeDailyBackup({ ...save, player: { ...save.player, coins: 999 } }, TODAY, storage)
    expect(storage.getItem(`${BACKUP_KEY_PREFIX}${TODAY}`)).toBe(first)
  })
})

describe('writeSnapshotBackup（导入/重置前的安全快照）', () => {
  it('无条件写入，同日重复调用会覆盖为最新状态', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    expect(writeSnapshotBackup(save, TODAY, storage)).toBe(true)
    const first = storage.getItem(`${BACKUP_KEY_PREFIX}${TODAY}-snapshot`)
    expect(first).not.toBeNull()
    writeSnapshotBackup({ ...save, player: { ...save.player, coins: 999 } }, TODAY, storage)
    const second = storage.getItem(`${BACKUP_KEY_PREFIX}${TODAY}-snapshot`)
    expect(second).not.toBe(first)
  })

  it('当日已有每日备份时快照仍写入，且损坏主档优先从快照恢复', () => {
    const stale = createInitialSave(TODAY, NOW_ISO)
    writeDailyBackup(stale, TODAY, storage) // 模拟当天启动时写的旧备份
    const richer = { ...stale, player: { ...stale.player, coins: 777 } }
    writeSnapshotBackup(richer, TODAY, storage) // 导入前快照（含当日进度）
    storage.setItem(STORAGE_KEY, '{corrupt json')
    const result = loadSave(storage)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.recoveredFromBackup).toBe(true)
      expect(result.value.save.player.coins).toBe(777)
    }
  })

  it('写入失败返回 false 而不抛出', () => {
    const throwing = {
      setItem: () => {
        throw new DOMException('QuotaExceededError')
      },
    } as unknown as Storage
    expect(writeSnapshotBackup(createInitialSave(TODAY, NOW_ISO), TODAY, throwing)).toBe(false)
  })
})
