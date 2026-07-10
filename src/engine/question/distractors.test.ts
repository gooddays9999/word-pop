import { describe, expect, it } from 'vitest'
import { firstSense, meaningsConflict, selectDistractors } from './distractors'
import { FIXTURE_DB, FIXTURE_WORDS } from '../../test/fixtures'
import { mulberry32 } from '../../utils/random'

const byId = (id: string) => {
  const entry = FIXTURE_DB.byId.get(id)
  if (!entry) throw new Error(`fixture 缺少 ${id}`)
  return entry
}

describe('firstSense', () => {
  it('取第一义项', () => {
    expect(firstSense('橙子；橙色')).toBe('橙子')
    expect(firstSense('苹果')).toBe('苹果')
  })
})

describe('meaningsConflict', () => {
  it('首义项相同或互相包含视为冲突', () => {
    expect(meaningsConflict('学期；术语', '学期（半学年）')).toBe(true)
    expect(meaningsConflict('苹果', '香蕉')).toBe(false)
    expect(meaningsConflict('跑；奔跑', '跑步')).toBe(true)
  })
})

describe('selectDistractors', () => {
  it('返回指定数量的不重复干扰项，且不含正确答案', () => {
    const picked = selectDistractors(byId('apple'), FIXTURE_DB, 3, new Set(), mulberry32(1))
    expect(picked).toHaveLength(3)
    const ids = picked.map((w) => w.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids).not.toContain('apple')
  })

  it('排除释义冲突的词（term 的干扰项不含 semester）', () => {
    for (let seed = 0; seed < 20; seed += 1) {
      const picked = selectDistractors(byId('term'), FIXTURE_DB, 3, new Set(), mulberry32(seed))
      expect(picked.map((w) => w.id)).not.toContain('semester')
    }
  })

  it('池足够时优先同词性同主题', () => {
    const picked = selectDistractors(byId('apple'), FIXTURE_DB, 3, new Set(), mulberry32(2))
    expect(picked.every((w) => w.pos === 'n.' && w.theme === 'food')).toBe(true)
  })

  it('尽量避开最近出现过的词', () => {
    const recent = new Set(['banana', 'orange', 'grape'])
    const picked = selectDistractors(byId('apple'), FIXTURE_DB, 3, recent, mulberry32(3))
    // food 同主题只剩 bread，其余从更宽的池补齐
    expect(picked.map((w) => w.id)).toContain('bread')
    expect(picked.filter((w) => recent.has(w.id))).toHaveLength(0)
  })

  it('池不足时逐级放宽但绝不引入冲突义项', () => {
    const tinyWords = FIXTURE_WORDS.filter((w) => ['term', 'semester', 'desk'].includes(w.id))
    const tinyDb = { list: tinyWords, byId: new Map(tinyWords.map((w) => [w.id, w])) }
    const picked = selectDistractors(byId('term'), tinyDb, 3, new Set(), mulberry32(1))
    expect(picked.map((w) => w.id)).toEqual(['desk'])
  })
})
