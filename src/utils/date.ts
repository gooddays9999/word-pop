/** 'YYYY-MM-DD' 格式的本地日期戳。字符串比较即日期比较。 */
export type DayStamp = string

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 24 * 60 * 60 * 1000

export function isDayStamp(value: string): value is DayStamp {
  if (!DAY_PATTERN.test(value)) return false
  const [year, month, day] = splitDay(value)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  )
}

function splitDay(stamp: DayStamp): [number, number, number] {
  const parts = stamp.split('-')
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    throw new Error(`非法日期戳: ${stamp}`)
  }
  return [year, month, day]
}

export function toDayStamp(date: Date): DayStamp {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(stamp: DayStamp, days: number): DayStamp {
  const [year, month, day] = splitDay(stamp)
  return toDayStamp(new Date(year, month - 1, day + days))
}

/** 从 from 到 to 的天数差（to 在后为正） */
export function dayDiff(from: DayStamp, to: DayStamp): number {
  const [fy, fm, fd] = splitDay(from)
  const [ty, tm, td] = splitDay(to)
  const a = new Date(fy, fm - 1, fd).getTime()
  const b = new Date(ty, tm - 1, td).getTime()
  return Math.round((b - a) / DAY_MS)
}

/** 从 query string 提取 ?day=YYYY-MM-DD 时间旅行参数（供开发与 E2E 使用） */
export function parseDayOverride(search: string): DayStamp | null {
  const raw = new URLSearchParams(search).get('day')
  return raw !== null && isDayStamp(raw) ? raw : null
}

/** 当前本地日期戳；URL 中带合法 ?day= 时以其为准 */
export function todayStamp(now: Date = new Date()): DayStamp {
  const override =
    typeof window === 'undefined' ? null : parseDayOverride(window.location.search)
  return override ?? toDayStamp(now)
}
