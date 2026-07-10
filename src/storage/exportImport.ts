import { GRADUATED } from '../types/progress'
import type { SaveData } from '../types/save'
import type { DayStamp } from '../utils/date'
import { err, type Result } from '../utils/result'
import { migrateSave } from './migrations'
import { serializeSave } from './saveSchema'

/** 导出为可读 JSON 文本（用户手动备份的最终保险） */
export function exportSaveText(save: SaveData): string {
  return JSON.stringify(serializeSave(save), null, 2)
}

/** 导入并校验备份文本 */
export function importSaveText(text: string): Result<SaveData, string> {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return err('文件不是有效的 JSON，请确认选择的是导出的备份文件')
  }
  return migrateSave(raw)
}

export interface SaveSummary {
  readonly introducedWords: number
  readonly learnedWords: number
  readonly lastActiveDay: DayStamp | null
}

/** 导入前给用户看的存档摘要 */
export function summarizeSave(save: SaveData): SaveSummary {
  const all = Object.values(save.wordProgress)
  const learned = all.filter((p) => p.box === GRADUATED || p.box >= 1)
  return {
    introducedWords: all.length,
    learnedWords: learned.length,
    lastActiveDay: save.player.streak.lastActiveDay,
  }
}
