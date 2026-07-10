import { createInitialSave } from '../engine/save'
import { loadSave, persistSave, writeDailyBackup } from '../storage/localStore'
import type { SaveData } from '../types/save'
import { todayStamp } from '../utils/date'

export interface BootResult {
  readonly save: SaveData
  /** 主存档损坏且无可用备份：进入恢复界面，不覆盖原数据 */
  readonly corrupt: boolean
  /** 主档损坏但已从每日备份自动恢复：提示用户 */
  readonly recovered: boolean
}

export function bootLoad(): BootResult {
  const nowIso = new Date().toISOString()
  const today = todayStamp()
  const loaded = loadSave()

  if (loaded.ok) {
    writeDailyBackup(loaded.value.save, today)
    if (loaded.value.recoveredFromBackup) {
      persistSave(loaded.value.save, nowIso)
    }
    return { save: loaded.value.save, corrupt: false, recovered: loaded.value.recoveredFromBackup }
  }

  if (loaded.error === 'empty') {
    const fresh = createInitialSave(today, nowIso)
    persistSave(fresh, nowIso)
    writeDailyBackup(fresh, today)
    return { save: fresh, corrupt: false, recovered: false }
  }

  // corrupt：暂用内存新档渲染恢复界面，绝不写盘覆盖现场
  return { save: createInitialSave(today, nowIso), corrupt: true, recovered: false }
}
