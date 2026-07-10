import { useEffect } from 'react'
import { playSfx } from '../audio/sfx'
import { Button } from '../components/Button'
import { WORD_DB } from '../data/words'
import { firstSense } from '../engine/question/distractors'
import { dueCount } from '../store/selectors'
import { useAppStore } from '../store/store'

export function ResultsScreen() {
  const summary = useAppStore((state) => state.lastSummary)
  const save = useAppStore((state) => state.save)
  const goTo = useAppStore((state) => state.goTo)
  const startReview = useAppStore((state) => state.startReview)

  useEffect(() => {
    if (summary === null) goTo({ name: 'home' })
  }, [summary, goTo])

  const sfxEnabled = useAppStore((state) => state.save.settings.sfxEnabled)
  const levelCompleted = summary?.levelCompleted ?? false
  useEffect(() => {
    if (summary !== null && sfxEnabled) playSfx(levelCompleted ? 'levelup' : 'coin')
  }, [summary, sfxEnabled, levelCompleted])

  if (summary === null) return null

  const accuracyPercent = Math.round(summary.accuracy * 100)
  const due = dueCount(save)

  return (
    <div className="grid min-h-full place-items-center px-6 py-10">
      <div className="panel anim-slide-up w-full max-w-xl p-8 text-center" data-testid="results">
        <div className="mb-2 text-6xl">{summary.levelCompleted ? '🏆' : '🎖️'}</div>
        <h1 className="mb-1 text-2xl font-extrabold">
          {summary.levelCompleted ? '关卡完成！' : '冒险成果'}
        </h1>
        {summary.levelCompleted && (
          <div className="mb-2 text-3xl tracking-widest text-[var(--star-gold)]">
            {'⭐'.repeat(summary.stars)}
          </div>
        )}

        <div className="my-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-black/25 p-4">
            <div className="text-2xl font-extrabold text-[var(--leaf)]">{summary.correct}</div>
            <div className="text-xs text-[var(--ink-dim)]">答对</div>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <div className="text-2xl font-extrabold text-[var(--hp-red)]">{summary.wrong}</div>
            <div className="text-xs text-[var(--ink-dim)]">答错</div>
          </div>
          <div className="rounded-xl bg-black/25 p-4">
            <div className="text-2xl font-extrabold">{accuracyPercent}%</div>
            <div className="text-xs text-[var(--ink-dim)]">正确率</div>
          </div>
        </div>

        <div className="mb-5 flex justify-center gap-6 text-lg font-extrabold">
          <span className="text-[var(--nova)]">+{summary.xpGained} XP</span>
          <span className="text-[var(--star-gold)]">+{summary.coinsGained} 🪙</span>
        </div>

        {summary.newlyLearned.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-bold text-[var(--ink-dim)]">
              ✨ 新收集 {summary.newlyLearned.length} 张图鉴卡
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {summary.newlyLearned.map((wordId) => {
                const entry = WORD_DB.byId.get(wordId)
                if (!entry) return null
                return (
                  <span
                    key={wordId}
                    className="rounded-lg border border-[var(--star-gold)]/40 bg-[var(--star-gold)]/10 px-3 py-1 text-sm font-bold"
                  >
                    <span style={{ fontFamily: 'var(--font-latin)' }}>{entry.word}</span>
                    <span className="ml-1 text-xs text-[var(--ink-dim)]">
                      {firstSense(entry.meaning)}
                    </span>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={() => goTo({ name: 'home' })}
            data-testid="back-home"
          >
            🛰️ 返回基地
          </Button>
          {due > 0 ? (
            <Button variant="gold" size="md" onClick={startReview}>
              ⚔️ 继续复习（{due}）
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={() => goTo({ name: 'map' })}>
              🗺️ 继续闯关
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
