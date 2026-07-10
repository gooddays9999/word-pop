import { describe, expect, it } from 'vitest'
import { isDue, selectDue } from './due'
import { makeProgress, TODAY } from '../../test/fixtures'
import { GRADUATED } from '../../types/progress'
import { mulberry32 } from '../../utils/random'

describe('isDue', () => {
  it('到期日 ≤ 今天为到期，毕业词永不到期', () => {
    expect(isDue(makeProgress('a', { dueDay: TODAY }), TODAY)).toBe(true)
    expect(isDue(makeProgress('a', { dueDay: '2026-07-01' }), TODAY)).toBe(true)
    expect(isDue(makeProgress('a', { dueDay: '2026-07-11' }), TODAY)).toBe(false)
    expect(isDue(makeProgress('a', { box: GRADUATED, dueDay: '2026-07-01' }), TODAY)).toBe(false)
  })
})

describe('selectDue', () => {
  it('只选到期词并遵守上限', () => {
    const map = {
      a: makeProgress('a', { dueDay: '2026-07-01' }),
      b: makeProgress('b', { dueDay: TODAY }),
      c: makeProgress('c', { dueDay: '2026-08-01' }),
      d: makeProgress('d', { dueDay: '2026-07-05' }),
    }
    const selected = selectDue(map, TODAY, 2, mulberry32(1))
    expect(selected).toHaveLength(2)
    expect(selected.every((p) => p.dueDay <= TODAY)).toBe(true)
  })

  it('逾期越久越优先；同逾期时低盒子优先', () => {
    const map = {
      recent: makeProgress('recent', { dueDay: TODAY, box: 1 }),
      overdue: makeProgress('overdue', { dueDay: '2026-07-01', box: 5 }),
      lowBox: makeProgress('lowBox', { dueDay: TODAY, box: 0 }),
    }
    const selected = selectDue(map, TODAY, 10, mulberry32(1))
    expect(selected[0]?.wordId).toBe('overdue')
    const ids = selected.map((p) => p.wordId)
    expect(ids.indexOf('lowBox')).toBeLessThan(ids.indexOf('recent'))
  })

  it('无到期词时返回空数组', () => {
    const map = { a: makeProgress('a', { dueDay: '2026-08-01' }) }
    expect(selectDue(map, TODAY, 10, mulberry32(1))).toEqual([])
  })
})
