import { describe, expect, it } from 'vitest'
import { mulberry32, pickOne, seedFromString, shuffle } from './random'

describe('mulberry32', () => {
  it('相同种子产生相同序列', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })
  it('输出在 [0, 1) 区间', () => {
    const rng = mulberry32(7)
    for (let i = 0; i < 100; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  it('不修改原数组且是同元素的排列', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    const shuffled = shuffle(original, mulberry32(1))
    expect(original).toEqual(copy)
    expect([...shuffled].sort((a, b) => a - b)).toEqual(copy)
  })
  it('相同种子结果确定', () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(9))).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(9)))
  })
})

describe('pickOne', () => {
  it('空数组返回 undefined，否则返回元素之一', () => {
    expect(pickOne([], mulberry32(1))).toBeUndefined()
    const items = ['a', 'b', 'c']
    const picked = pickOne(items, mulberry32(1))
    expect(picked !== undefined && items.includes(picked)).toBe(true)
  })
})

describe('seedFromString', () => {
  it('相同字符串产生相同种子，不同字符串大概率不同', () => {
    expect(seedFromString('2026-07-10')).toBe(seedFromString('2026-07-10'))
    expect(seedFromString('a')).not.toBe(seedFromString('b'))
  })
})
