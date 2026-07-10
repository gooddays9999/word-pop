import { describe, expect, it } from 'vitest'
import { updateStreak } from './streak'

const EMPTY = { current: 0, best: 0, lastActiveDay: null }

describe('updateStreak', () => {
  it('首次活跃从 1 开始', () => {
    expect(updateStreak(EMPTY, '2026-07-10')).toEqual({
      current: 1,
      best: 1,
      lastActiveDay: '2026-07-10',
    })
  })

  it('同日重复活跃不变', () => {
    const s = { current: 3, best: 5, lastActiveDay: '2026-07-10' }
    expect(updateStreak(s, '2026-07-10')).toEqual(s)
  })

  it('连续次日 +1 并刷新最佳', () => {
    const s = { current: 5, best: 5, lastActiveDay: '2026-07-10' }
    expect(updateStreak(s, '2026-07-11')).toEqual({
      current: 6,
      best: 6,
      lastActiveDay: '2026-07-11',
    })
  })

  it('断签重置为 1，保留最佳', () => {
    const s = { current: 5, best: 8, lastActiveDay: '2026-07-10' }
    expect(updateStreak(s, '2026-07-13')).toEqual({
      current: 1,
      best: 8,
      lastActiveDay: '2026-07-13',
    })
  })

  it('时钟回拨按同日处理，不清零', () => {
    const s = { current: 5, best: 8, lastActiveDay: '2026-07-10' }
    expect(updateStreak(s, '2026-07-09')).toEqual(s)
  })
})
