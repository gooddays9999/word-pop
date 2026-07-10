import { describe, expect, it } from 'vitest'
import { buildLevelSession, buildReviewSession, type BuildContext } from './builder'
import { FIXTURE_DB, makeProgress, TODAY } from '../../test/fixtures'
import type { LevelDef } from '../../types/word'
import type { ProgressMap } from '../../types/progress'
import { mulberry32 } from '../../utils/random'

const M1_TYPES = ['recognition', 'reverse'] as const

function ctx(progress: ProgressMap, allowedTypes = M1_TYPES): BuildContext {
  return {
    db: FIXTURE_DB,
    progress,
    today: TODAY,
    rng: mulberry32(1),
    allowedTypes: [...allowedTypes],
  }
}

const LEVEL: LevelDef = {
  id: 'food-1',
  regionId: 'food',
  index: 1,
  wordIds: ['apple', 'banana', 'orange', 'grape', 'bread', 'run', 'jump'],
}

describe('buildReviewSession', () => {
  it('无到期词返回 null', () => {
    expect(buildReviewSession(ctx({}), 120)).toBeNull()
    const future = { a: makeProgress('apple', { dueDay: '2026-08-01' }) }
    expect(buildReviewSession(ctx(future), 120)).toBeNull()
  })

  it('到期词生成复习题，题型按盒子映射并降级到允许集合', () => {
    const progress: ProgressMap = {
      apple: makeProgress('apple', { box: 1 }),
      banana: makeProgress('banana', { box: 2 }),
      run: makeProgress('run', { box: 3 }),
      jump: makeProgress('jump', { box: 5 }),
    }
    const session = buildReviewSession(ctx(progress), 120)
    if (!session) throw new Error('应生成会话')
    expect(session.kind).toBe('review')
    expect(session.items).toHaveLength(4)
    const byWord = new Map(
      session.items.map((item) => [item.wordId, item.kind === 'question' ? item.questionType : null]),
    )
    expect(byWord.get('apple')).toBe('recognition')
    expect(byWord.get('banana')).toBe('reverse')
    // listening 降级 recognition；spelling 降级 reverse
    expect(byWord.get('run')).toBe('recognition')
    expect(byWord.get('jump')).toBe('reverse')
    expect(session.items.every((item) => item.kind === 'question' && !item.isNew)).toBe(true)
  })

  it('遵守数量上限', () => {
    const progress = Object.fromEntries(
      ['apple', 'banana', 'orange', 'grape', 'bread'].map((id) => [id, makeProgress(id)]),
    )
    const session = buildReviewSession(ctx(progress), 3)
    expect(session?.items).toHaveLength(3)
  })
})

describe('buildLevelSession', () => {
  it('新词按小批组织：先教学卡后提问', () => {
    const session = buildLevelSession(ctx({}), LEVEL, 20)
    if (!session) throw new Error('应生成会话')
    expect(session.kind).toBe('level')
    expect(session.levelId).toBe('food-1')
    // 7 个新词 → 批1: 5 教 + 5 问，批2: 2 教 + 2 问
    expect(session.items).toHaveLength(14)
    expect(session.items.slice(0, 5).every((i) => i.kind === 'teach')).toBe(true)
    expect(session.items.slice(5, 10).every((i) => i.kind === 'question')).toBe(true)
    expect(session.items.slice(10, 12).every((i) => i.kind === 'teach')).toBe(true)
    expect(session.items.slice(12).every((i) => i.kind === 'question')).toBe(true)
    // 每个新词恰好一张教学卡 + 一道首题
    const teachIds = session.items.filter((i) => i.kind === 'teach').map((i) => i.wordId)
    expect(new Set(teachIds).size).toBe(7)
  })

  it('新词额度限制引入数量', () => {
    const session = buildLevelSession(ctx({}), LEVEL, 3)
    if (!session) throw new Error('应生成会话')
    const teachIds = session.items.filter((i) => i.kind === 'teach').map((i) => i.wordId)
    expect(teachIds).toHaveLength(3)
  })

  it('已引入但未过 box0 的词只出题不再教学，且不占新词额度', () => {
    const progress: ProgressMap = {
      apple: makeProgress('apple', { box: 0, box0Hits: 1 }),
    }
    const session = buildLevelSession(ctx(progress), LEVEL, 2)
    if (!session) throw new Error('应生成会话')
    const teachIds = session.items.filter((i) => i.kind === 'teach').map((i) => i.wordId)
    expect(teachIds).not.toContain('apple')
    expect(teachIds).toHaveLength(2)
    const appleQuestions = session.items.filter(
      (i) => i.kind === 'question' && i.wordId === 'apple',
    )
    expect(appleQuestions).toHaveLength(1)
  })

  it('全部学完且额度为 0 时返回 null', () => {
    const progress = Object.fromEntries(
      LEVEL.wordIds.map((id) => [id, makeProgress(id, { box: 1 })]),
    )
    expect(buildLevelSession(ctx(progress), LEVEL, 20)).toBeNull()
    expect(buildLevelSession(ctx({}), LEVEL, 0)).toBeNull()
  })
})
