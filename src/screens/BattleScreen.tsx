import { useState } from 'react'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { ProgressBar } from '../components/ProgressBar'
import { QuizBattle } from '../games/quiz/QuizBattle'
import { useAppStore } from '../store/store'

const SESSION_LABELS: Record<string, string> = {
  review: '⚔️ 复习副本',
  level: '🚩 关卡挑战',
  boss: '👑 Boss 战',
}

export function BattleScreen() {
  const session = useAppStore((state) => state.session)
  const quitSession = useAppStore((state) => state.quitSession)
  const [confirmQuit, setConfirmQuit] = useState(false)

  if (!session) return null
  const ratio = session.items.length === 0 ? 0 : session.cursor / session.items.length

  return (
    <div className="flex h-full flex-col">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-4 px-6 py-5">
        <span className="text-sm font-extrabold">{SESSION_LABELS[session.kind] ?? '战斗'}</span>
        <div className="flex-1">
          <ProgressBar ratio={ratio} />
        </div>
        <span className="text-xs text-[var(--ink-dim)]" style={{ fontFamily: 'var(--font-num)' }}>
          {session.cursor}/{session.items.length}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirmQuit(true)}
          aria-label="退出战斗"
        >
          ✕
        </button>
      </header>

      <main className="flex flex-1 items-start justify-center pt-4">
        <QuizBattle />
      </main>

      {confirmQuit && (
        <Modal
          title="要撤退吗？"
          actions={
            <>
              <Button variant="ghost" size="md" onClick={() => setConfirmQuit(false)}>
                继续战斗
              </Button>
              <Button variant="danger" size="md" onClick={quitSession}>
                撤退（不保存本次成果）
              </Button>
            </>
          }
        >
          中途撤退不会保存这一场的答题成果，已学会的单词也不会记录。确定要退出吗？
        </Modal>
      )}
    </div>
  )
}
