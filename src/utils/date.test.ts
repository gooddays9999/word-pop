import { describe, expect, it } from 'vitest'
import { addDays, dayDiff, isDayStamp, parseDayOverride, toDayStamp, todayStamp } from './date'

describe('toDayStamp', () => {
  it('按本地时区格式化为 YYYY-MM-DD', () => {
    expect(toDayStamp(new Date(2026, 6, 10, 23, 59))).toBe('2026-07-10')
    expect(toDayStamp(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })
})

describe('addDays', () => {
  it('跨月与跨年正确进位', () => {
    expect(addDays('2026-07-10', 1)).toBe('2026-07-11')
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-07-10', 30)).toBe('2026-08-09')
  })
})

describe('dayDiff', () => {
  it('返回 a 到 b 的天数差', () => {
    expect(dayDiff('2026-07-10', '2026-07-11')).toBe(1)
    expect(dayDiff('2026-07-10', '2026-07-10')).toBe(0)
    expect(dayDiff('2026-07-11', '2026-07-10')).toBe(-1)
    expect(dayDiff('2026-06-30', '2026-07-02')).toBe(2)
  })
})

describe('isDayStamp', () => {
  it('校验格式', () => {
    expect(isDayStamp('2026-07-10')).toBe(true)
    expect(isDayStamp('2026-7-10')).toBe(false)
    expect(isDayStamp('20260710')).toBe(false)
    expect(isDayStamp('abcd-ef-gh')).toBe(false)
  })
})

describe('parseDayOverride', () => {
  it('从 query string 提取合法 day 参数', () => {
    expect(parseDayOverride('?day=2026-07-12')).toBe('2026-07-12')
    expect(parseDayOverride('?foo=1&day=2026-01-02')).toBe('2026-01-02')
  })
  it('非法或缺失时返回 null', () => {
    expect(parseDayOverride('')).toBeNull()
    expect(parseDayOverride('?day=oops')).toBeNull()
    expect(parseDayOverride('?other=1')).toBeNull()
  })
})

describe('todayStamp', () => {
  it('无覆盖时返回传入时间的本地日', () => {
    expect(todayStamp(new Date(2026, 6, 10, 12))).toBe('2026-07-10')
  })
})
