import { describe, expect, it } from 'vitest'
import { levelForXp, xpForLevel } from './xp'

describe('xpForLevel / levelForXp', () => {
  it('等级曲线：L1=0, L2=100, L3=300, L4=600', () => {
    expect(xpForLevel(1)).toBe(0)
    expect(xpForLevel(2)).toBe(100)
    expect(xpForLevel(3)).toBe(300)
    expect(xpForLevel(4)).toBe(600)
  })

  it('由累计 XP 反推等级', () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelForXp(299)).toBe(2)
    expect(levelForXp(300)).toBe(3)
    expect(levelForXp(10_000)).toBeGreaterThan(3)
  })
})
