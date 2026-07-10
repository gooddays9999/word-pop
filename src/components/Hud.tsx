import { WORD_DB } from '../data/words'
import { xpForLevel } from '../engine/economy/xp'
import { learnedCount } from '../store/selectors'
import { useAppStore } from '../store/store'
import { parseDayOverride } from '../utils/date'
import { ProgressBar } from './ProgressBar'

interface HudProps {
  readonly onBack?: () => void
}

export function Hud({ onBack }: HudProps) {
  const save = useAppStore((state) => state.save)
  const { level, xp, coins, streak } = save.player
  const currentFloor = xpForLevel(level)
  const nextNeed = xpForLevel(level + 1)
  const levelRatio = nextNeed === currentFloor ? 1 : (xp - currentFloor) / (nextNeed - currentFloor)
  const collected = learnedCount(save)
  const dayOverride =
    typeof window === 'undefined' ? null : parseDayOverride(window.location.search)

  return (
    <header className="mx-auto flex w-full max-w-5xl items-center gap-4 px-6 py-4">
      {onBack && (
        <button className="btn btn-ghost btn-sm" onClick={onBack} aria-label="返回">
          ← 返回
        </button>
      )}
      <div className="flex min-w-40 items-center gap-2">
        <span className="text-xl">🚀</span>
        <div className="w-full">
          <div className="flex justify-between text-xs font-bold text-[var(--ink-dim)]">
            <span>Lv.{level}</span>
            <span style={{ fontFamily: 'var(--font-num)' }}>{xp} XP</span>
          </div>
          <ProgressBar ratio={levelRatio} heightClass="h-2" />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4 text-sm font-extrabold">
        {dayOverride && (
          <span className="rounded-lg border border-dashed border-[var(--star-gold)] px-2 py-1 text-xs text-[var(--star-gold)]">
            ⏰ 时间旅行 {dayOverride}
          </span>
        )}
        <span title="金币">
          🪙 <span style={{ fontFamily: 'var(--font-num)' }}>{coins}</span>
        </span>
        <span title="连续冒险天数">
          🔥 <span style={{ fontFamily: 'var(--font-num)' }}>{streak.current}</span>
        </span>
        <span title="图鉴收集">
          📖{' '}
          <span style={{ fontFamily: 'var(--font-num)' }}>
            {collected}/{WORD_DB.list.length}
          </span>
        </span>
      </div>
    </header>
  )
}
