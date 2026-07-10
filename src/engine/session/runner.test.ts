import { describe, expect, it } from 'vitest'
import {
  advanceTeach,
  answerQuestion,
  createSessionState,
  currentItem,
  type RunnerConfig,
} from './runner'
import type { SessionItem } from '../../types/session'

const CFG: RunnerConfig = { requiredNewHits: 2, requeueGap: 4, maxRequeues: 3 }

const teach = (wordId: string): SessionItem => ({ kind: 'teach', wordId })
const newQ = (wordId: string, questionType: 'recognition' | 'reverse' = 'recognition'): SessionItem => ({
  kind: 'question',
  wordId,
  questionType,
  isNew: true,
})
const oldQ = (wordId: string, questionType: 'recognition' | 'reverse' = 'recognition'): SessionItem => ({
  kind: 'question',
  wordId,
  questionType,
  isNew: false,
})

describe('createSessionState / currentItem', () => {
  it('初始 cursor=0，空清单立即 done', () => {
    const state = createSessionState('review', null, [oldQ('a')])
    expect(state.cursor).toBe(0)
    expect(state.done).toBe(false)
    expect(currentItem(state)).toEqual(oldQ('a'))
    expect(createSessionState('review', null, []).done).toBe(true)
  })
})

describe('advanceTeach', () => {
  it('教学卡前进一格，不产生记录', () => {
    const state = createSessionState('level', 'school-1', [teach('a'), newQ('a')])
    const next = advanceTeach(state)
    expect(next.cursor).toBe(1)
    expect(next.records).toHaveLength(0)
    expect(next.done).toBe(false)
  })
})

describe('answerQuestion — 新词两连对', () => {
  it('第一次答对后重插一道中选英题，第二次答对后结束', () => {
    const state = createSessionState('level', 'school-1', [newQ('a')])
    const afterFirst = answerQuestion(state, true, 1000, CFG)
    expect(afterFirst.items).toHaveLength(2)
    expect(afterFirst.items[1]).toEqual({
      kind: 'question',
      wordId: 'a',
      questionType: 'reverse',
      isNew: true,
    })
    expect(afterFirst.hits['a']).toBe(1)
    expect(afterFirst.done).toBe(false)

    const afterSecond = answerQuestion(afterFirst, true, 800, CFG)
    expect(afterSecond.items).toHaveLength(2)
    expect(afterSecond.hits['a']).toBe(2)
    expect(afterSecond.done).toBe(true)
    expect(afterSecond.records).toHaveLength(2)
  })

  it('答错清零连对并重插认词题', () => {
    const state = createSessionState('level', 'school-1', [newQ('a'), newQ('b')])
    const afterWrong = answerQuestion(state, false, 1500, CFG)
    expect(afterWrong.hits['a']).toBe(0)
    expect(afterWrong.requeues['a']).toBe(1)
    // 重插位置 = min(cursor+1+gap, len)
    expect(afterWrong.items[afterWrong.items.length - 1]).toMatchObject({
      wordId: 'a',
      questionType: 'recognition',
    })
  })
})

describe('answerQuestion — 复习词', () => {
  it('答对不重插', () => {
    const state = createSessionState('review', null, [oldQ('a'), oldQ('b')])
    const next = answerQuestion(state, true, 900, CFG)
    expect(next.items).toHaveLength(2)
    expect(next.cursor).toBe(1)
  })

  it('答错以同题型重插', () => {
    const state = createSessionState('review', null, [oldQ('a', 'reverse'), oldQ('b')])
    const next = answerQuestion(state, false, 900, CFG)
    expect(next.items).toHaveLength(3)
    expect(next.items[2]).toMatchObject({ wordId: 'a', questionType: 'reverse', isNew: false })
  })
})

describe('answerQuestion — 重插上限', () => {
  it('同词最多重插 maxRequeues 次后不再重插', () => {
    let state = createSessionState('review', null, [oldQ('a')])
    for (let i = 0; i < 4; i += 1) {
      if (state.done) break
      state = answerQuestion(state, false, 500, CFG)
    }
    expect(state.records).toHaveLength(4)
    expect(state.requeues['a']).toBe(3)
    expect(state.done).toBe(true)
  })
})

describe('重插位置', () => {
  it('插入到 cursor+1+gap 处（不越界）', () => {
    const items = [oldQ('a'), oldQ('b'), oldQ('c'), oldQ('d'), oldQ('e'), oldQ('f'), oldQ('g')]
    const state = createSessionState('review', null, items)
    const next = answerQuestion(state, false, 500, CFG)
    // cursor 变为 1，插入位置 = 1 + 4 = 5
    expect(next.items[5]).toMatchObject({ wordId: 'a' })
    expect(next.items).toHaveLength(8)
  })
})

describe('异常输入', () => {
  it('对教学卡调用 answerQuestion 抛错', () => {
    const state = createSessionState('level', 'school-1', [teach('a'), newQ('a')])
    expect(() => answerQuestion(state, true, 100, CFG)).toThrow()
  })
  it('会话结束后继续作答抛错', () => {
    const state = createSessionState('review', null, [oldQ('a')])
    const done = answerQuestion(state, true, 100, CFG)
    expect(done.done).toBe(true)
    expect(() => answerQuestion(done, true, 100, CFG)).toThrow()
  })
})
