import { describe, expect, it } from 'vitest'
import { createProgress, reviewWord } from './srs'
import { makeProgress, TODAY } from '../../test/fixtures'
import { GRADUATED, type Box } from '../../types/progress'

describe('createProgress', () => {
  it('新词从 box0 开始，当日到期', () => {
    const p = createProgress('apple', TODAY)
    expect(p).toEqual({
      wordId: 'apple',
      box: 0,
      box0Hits: 0,
      dueDay: TODAY,
      lastDay: null,
      wrongCount: 0,
      correctCount: 0,
      introducedDay: TODAY,
    })
  })
})

describe('reviewWord — 答对', () => {
  it('box0 第一次答对：留在 box0，hits=1，仍当日到期', () => {
    const next = reviewWord(makeProgress('a'), true, TODAY)
    expect(next.box).toBe(0)
    expect(next.box0Hits).toBe(1)
    expect(next.dueDay).toBe(TODAY)
    expect(next.correctCount).toBe(1)
    expect(next.lastDay).toBe(TODAY)
  })

  it('box0 第二次答对：升 box1，次日到期，hits 清零', () => {
    const next = reviewWord(makeProgress('a', { box0Hits: 1 }), true, TODAY)
    expect(next.box).toBe(1)
    expect(next.box0Hits).toBe(0)
    expect(next.dueDay).toBe('2026-07-11')
  })

  it.each<[Box, string]>([
    [1, '2026-07-12'],
    [2, '2026-07-14'],
    [3, '2026-07-17'],
    [4, '2026-07-25'],
    [5, '2026-08-09'],
  ])('box%i 答对：升一级并按间隔表排期到 %s', (box, expectedDue) => {
    const next = reviewWord(makeProgress('a', { box }), true, TODAY)
    expect(next.box).toBe(box + 1)
    expect(next.dueDay).toBe(expectedDue)
  })

  it('box6 答对：毕业', () => {
    const next = reviewWord(makeProgress('a', { box: 6 }), true, TODAY)
    expect(next.box).toBe(GRADUATED)
  })

  it('毕业词答对：保持毕业', () => {
    const next = reviewWord(makeProgress('a', { box: GRADUATED }), true, TODAY)
    expect(next.box).toBe(GRADUATED)
    expect(next.correctCount).toBe(1)
  })
})

describe('reviewWord — 答错', () => {
  it('box3 答错：降 2 级到 box1，当日到期，hits 清零', () => {
    const next = reviewWord(makeProgress('a', { box: 3, box0Hits: 0 }), false, TODAY)
    expect(next.box).toBe(1)
    expect(next.dueDay).toBe(TODAY)
    expect(next.wrongCount).toBe(1)
    expect(next.correctCount).toBe(0)
  })

  it('box1 答错：降到 box0（不越界）', () => {
    expect(reviewWord(makeProgress('a', { box: 1 }), false, TODAY).box).toBe(0)
    expect(reviewWord(makeProgress('a', { box: 0, box0Hits: 1 }), false, TODAY)).toMatchObject({
      box: 0,
      box0Hits: 0,
    })
  })

  it('毕业词答错：回落到 box4，当日到期', () => {
    const next = reviewWord(makeProgress('a', { box: GRADUATED }), false, TODAY)
    expect(next.box).toBe(4)
    expect(next.dueDay).toBe(TODAY)
  })
})
