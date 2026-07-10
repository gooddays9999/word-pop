import { useEffect } from 'react'
import { Button } from '../components/Button'
import { useAppStore } from '../store/store'

export function TitleScreen() {
  const goTo = useAppStore((state) => state.goTo)
  const hasProgress = useAppStore(
    (state) => Object.keys(state.save.wordProgress).length > 0,
  )
  const recovered = useAppStore((state) => state.recoveredFromBackup)
  const showToast = useAppStore((state) => state.showToast)

  useEffect(() => {
    if (recovered) showToast('主存档曾损坏，已自动从最近的每日备份恢复')
  }, [recovered, showToast])

  return (
    <div className="grid h-full place-items-center px-6">
      <div className="anim-slide-up text-center">
        <div className="mb-6 text-8xl" style={{ animation: 'floaty 3.2s ease-in-out infinite' }}>
          🪐
        </div>
        <h1 className="mb-2 text-5xl font-extrabold tracking-wide">
          单词星球
          <span className="ml-3 align-middle text-2xl text-[var(--star-gold)]">大冒险</span>
        </h1>
        <p className="mb-2 text-lg text-[var(--ink-dim)]">
          Word Pop · 点爆单词怪，收集 2100 个初中单词
        </p>
        <p className="mb-10 text-sm text-[var(--ink-dim)]">
          每天先打复习副本，再解锁新星域 —— 多轮记忆，越战越牢
        </p>
        <Button variant="gold" size="lg" onClick={() => goTo({ name: 'home' })}>
          {hasProgress ? '🚀 继续冒险' : '🚀 开始冒险'}
        </Button>
      </div>
    </div>
  )
}
