import { describe, expect, it } from 'vitest'
import { applyResults } from './results'
import { createInitialSave } from '../save'
import { createSessionState, answerQuestion } from './runner'
import type { SessionItem, SessionState } from '../../types/session'
import type { LevelDef } from '../../types/word'
import { TODAY, TOMORROW } from '../../test/fixtures'

const CFG = { requiredNewHits: 2, requeueGap: 4, maxRequeues: 3 }
const NOW_ISO = '2026-07-10T08:00:00.000Z'

const LEVEL: LevelDef = { id: 'food-1', regionId: 'food', index: 1, wordIds: ['a', 'b'] }

function newQ(wordId: string): SessionItem {
  return { kind: 'question', wordId, questionType: 'recognition', isNew: true }
}
function oldQ(wordId: string): SessionItem {
  return { kind: 'question', wordId, questionType: 'recognition', isNew: false }
}

/** 按给定正误序列跑完一个会话 */
function playSession(state: SessionState, answers: readonly boolean[]): SessionState {
  let current = state
  for (const correct of answers) {
    if (current.done) throw new Error('答案序列超出会话长度')
    current = answerQuestion(current, correct, 1000, CFG)
  }
  if (!current.done) throw new Error('答案序列未完成会话')
  return current
}

describe('applyResults — 进度回放', () => {
  it('新词两连对升入 box1，记入 newlyLearned 与当日新词数', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const session = playSession(
      createSessionState('level', 'food-1', [newQ('a'), newQ('b')]),
      // a 对 → b 对 → a(重插) 对 → b(重插) 对
      [true, true, true, true],
    )
    const { save: next, summary } = applyResults(save, session, { today: TODAY, level: LEVEL })

    expect(next.wordProgress['a']?.box).toBe(1)
    expect(next.wordProgress['b']?.box).toBe(1)
    expect([...summary.newlyLearned].sort()).toEqual(['a', 'b'])
    expect(next.stats.dailyLog[TODAY]).toMatchObject({ news: 2, reviews: 0, correct: 4, wrong: 0 })
  })

  it('复习词答对按盒子晋级，答错降级', () => {
    const base = createInitialSave(TODAY, NOW_ISO)
    const save = {
      ...base,
      wordProgress: {
        a: {
          wordId: 'a',
          box: 2,
          box0Hits: 0,
          dueDay: TODAY,
          lastDay: null,
          wrongCount: 0,
          correctCount: 0,
          introducedDay: '2026-07-01',
        },
        b: {
          wordId: 'b',
          box: 3,
          box0Hits: 0,
          dueDay: TODAY,
          lastDay: null,
          wrongCount: 0,
          correctCount: 0,
          introducedDay: '2026-07-01',
        },
      },
    } as typeof base
    const session = playSession(
      createSessionState('review', null, [oldQ('a'), oldQ('b')]),
      // a 对（box2→3）；b 错（box3→1）→ b 重插 对（box1→2）
      [true, false, true],
    )
    const { save: next, summary } = applyResults(save, session, { today: TODAY, level: null })
    expect(next.wordProgress['a']?.box).toBe(3)
    expect(next.wordProgress['b']?.box).toBe(2)
    expect(summary.newlyLearned).toEqual([])
    expect(next.stats.dailyLog[TODAY]).toMatchObject({ news: 0, reviews: 2, correct: 2, wrong: 1 })
  })
})

describe('applyResults — 经济与连击', () => {
  it('XP 与金币按对错累计', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const session = playSession(createSessionState('review', null, [oldQ('a'), oldQ('b')]), [
      true,
      true,
    ])
    // 手动放入进度，避免"复习未知词"分支干扰
    const prepared = {
      ...save,
      wordProgress: {
        a: {
          wordId: 'a',
          box: 1,
          box0Hits: 0,
          dueDay: TODAY,
          lastDay: null,
          wrongCount: 0,
          correctCount: 0,
          introducedDay: '2026-07-01',
        },
        b: {
          wordId: 'b',
          box: 1,
          box0Hits: 0,
          dueDay: TODAY,
          lastDay: null,
          wrongCount: 0,
          correctCount: 0,
          introducedDay: '2026-07-01',
        },
      },
    } as typeof save
    const { save: next, summary } = applyResults(prepared, session, { today: TODAY, level: null })
    expect(summary.xpGained).toBe(20)
    expect(summary.coinsGained).toBe(2 + 5) // 每题 1 + 会话奖励 5
    expect(next.player.xp).toBe(20)
    expect(next.player.coins).toBe(7)
  })

  it('连续天数与最佳纪录', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const s1 = playSession(createSessionState('review', null, [oldQ('a')]), [true])
    const day1 = applyResults(save, s1, { today: TODAY, level: null }).save
    expect(day1.player.streak).toMatchObject({ current: 1, best: 1, lastActiveDay: TODAY })

    const day2 = applyResults(day1, s1, { today: TOMORROW, level: null }).save
    expect(day2.player.streak).toMatchObject({ current: 2, best: 2, lastActiveDay: TOMORROW })

    const day5 = applyResults(day2, s1, { today: '2026-07-15', level: null }).save
    expect(day5.player.streak).toMatchObject({ current: 1, best: 2 })
  })
})

describe('applyResults — 关卡完成', () => {
  it('全部关卡词 box≥1 时判定完成并按正确率给星', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const session = playSession(createSessionState('level', 'food-1', [newQ('a'), newQ('b')]), [
      true,
      true,
      true,
      true,
    ])
    const { save: next, summary } = applyResults(save, session, { today: TODAY, level: LEVEL })
    expect(summary.levelCompleted).toBe(true)
    expect(summary.stars).toBe(3) // 100% 正确
    expect(next.levelProgress['food-1']).toMatchObject({ stars: 3, completedDay: TODAY })
  })

  it('有词未达 box1 时不判定完成', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    // a 一直答错到重插上限：结束时仍是 box0
    const session = playSession(createSessionState('level', 'food-1', [newQ('a'), newQ('b')]), [
      false,
      true,
      false,
      true,
      false,
      false,
    ])
    const { summary } = applyResults(save, session, { today: TODAY, level: LEVEL })
    expect(summary.levelCompleted).toBe(false)
    expect(summary.stars).toBe(0)
  })

  it('星级保留历史最高', () => {
    const base = createInitialSave(TODAY, NOW_ISO)
    const withHistory = {
      ...base,
      levelProgress: { 'food-1': { stars: 3, completedDay: '2026-07-01' } },
    } as typeof base
    // 本次正确率 80%（2 星）：a 错一次再两连对，b 两连对
    const session = playSession(createSessionState('level', 'food-1', [newQ('a'), newQ('b')]), [
      false,
      true,
      true,
      true,
      true,
    ])
    const { save: next } = applyResults(withHistory, session, { today: TODAY, level: LEVEL })
    expect(next.levelProgress['food-1']?.stars).toBe(3)
    expect(next.levelProgress['food-1']?.completedDay).toBe('2026-07-01')
  })
})
