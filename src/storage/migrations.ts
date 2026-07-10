import { SAVE_VERSION } from '../config/storage'
import type { SaveData } from '../types/save'
import { err, ok, type Result } from '../utils/result'
import { deserializeSave, saveFileV1Schema } from './saveSchema'

/**
 * 把任意来源（localStorage/导入文件）的原始数据迁移为当前版本存档。
 * 未来版本升级时在此追加迁移链。
 */
export function migrateSave(raw: unknown): Result<SaveData, string> {
  if (typeof raw !== 'object' || raw === null) {
    return err('存档数据不是有效对象')
  }
  const version = (raw as { version?: unknown }).version
  if (version === SAVE_VERSION) {
    const parsed = saveFileV1Schema.safeParse(raw)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const where = issue ? issue.path.join('.') : '未知位置'
      const detail = issue ? issue.message : '结构不符'
      return err(`存档结构校验失败（${where}: ${detail}）`)
    }
    return ok(deserializeSave(parsed.data))
  }
  return err(`不支持的存档版本: ${String(version)}`)
}
