import { Button } from '../components/Button'
import { Hud } from '../components/Hud'
import { ProgressBar } from '../components/ProgressBar'
import { WORD_DB } from '../data/words'
import {
  dueCount,
  learnedCount,
  newWordsRemainingToday,
  reviewGateThreshold,
} from '../store/selectors'
import { useAppStore } from '../store/store'

export function HomeScreen() {
  const save = useAppStore((state) => state.save)
  const goTo = useAppStore((state) => state.goTo)
  const startReview = useAppStore((state) => state.startReview)

  const due = dueCount(save)
  const remaining = newWordsRemainingToday(save)
  const collected = learnedCount(save)
  const total = WORD_DB.list.length

  return (
    <div className="flex h-full flex-col">
      <Hud />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-10">
        <h1 className="mb-1 mt-4 text-3xl font-extrabold">🛰️ 冒险基地</h1>
        <p className="mb-6 text-sm text-[var(--ink-dim)]">
          {save.player.streak.current > 0
            ? `已连续冒险 ${save.player.streak.current} 天，继续保持！`
            : '今天也要出发探索单词星球哦'}
        </p>

        <section className="panel anim-slide-up mb-5 p-6">
          <h2 className="mb-4 text-lg font-extrabold">📋 今日任务</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-black/25 p-5">
              <div className="mb-1 flex items-baseline gap-2">
                <span
                  className="text-3xl font-extrabold text-[var(--star-gold)]"
                  data-testid="due-count"
                >
                  {due}
                </span>
                <span className="text-sm text-[var(--ink-dim)]">个单词到期</span>
              </div>
              <p className="mb-4 text-xs text-[var(--ink-dim)]">
                按记忆曲线安排的复习，打完才能记得牢
              </p>
              <Button
                variant={due > 0 ? 'gold' : 'ghost'}
                size="md"
                onClick={startReview}
                data-testid="start-review"
              >
                ⚔️ 进入复习副本
              </Button>
            </div>
            <div className="rounded-xl bg-black/25 p-5">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--nova)]">{remaining}</span>
                <span className="text-sm text-[var(--ink-dim)]">
                  / {save.settings.newWordsPerDay} 今日新词额度
                </span>
              </div>
              <p className="mb-4 text-xs text-[var(--ink-dim)]">
                {due > reviewGateThreshold(save)
                  ? `⚠️ 待复习超过 ${reviewGateThreshold(save)} 个，先清副本才能开新关`
                  : '去星球地图解锁新关卡、学习新单词'}
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => goTo({ name: 'map' })}
                data-testid="go-map"
              >
                🗺️ 出发闯关
              </Button>
            </div>
          </div>
        </section>

        <section className="panel mb-5 p-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold">📖 图鉴收集</h2>
            <span
              className="text-sm text-[var(--ink-dim)]"
              style={{ fontFamily: 'var(--font-num)' }}
            >
              {collected} / {total}
            </span>
          </div>
          <ProgressBar ratio={total === 0 ? 0 : collected / total} color="var(--star-gold)" />
          <p className="mt-2 text-xs text-[var(--ink-dim)]">
            每学会一个单词点亮一张图鉴卡，集齐全部就是单词星球的主人！
          </p>
        </section>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => goTo({ name: 'settings' })}>
            ⚙️ 设置
          </Button>
        </div>
      </main>
    </div>
  )
}
