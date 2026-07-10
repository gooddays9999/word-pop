import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { serializeSave } from './saveSchema'
import { createInitialSave } from '../engine/save'
import { TODAY } from '../test/fixtures'

describe('migrateSave', () => {
  it('v1 合法存档迁移成功', () => {
    const save = createInitialSave(TODAY, '2026-07-10T08:00:00.000Z')
    const result = migrateSave(serializeSave(save))
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(save)
  })

  it('未知版本给出可读错误', () => {
    const result = migrateSave({ version: 99 })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('版本')
  })

  it('非对象/结构损坏给出错误', () => {
    expect(migrateSave(null).ok).toBe(false)
    expect(migrateSave('junk').ok).toBe(false)
    expect(migrateSave({ version: 1, player: {} }).ok).toBe(false)
  })
})
