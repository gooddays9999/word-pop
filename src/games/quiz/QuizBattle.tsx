import { useEffect, useMemo, useRef, useState } from 'react'
import { speakWord } from '../../audio/tts'
import { RECENT_DISTRACTOR_WINDOW } from '../../config/session'
import { WORD_DB } from '../../data/words'
import { firstSense } from '../../engine/question/distractors'
import { generateQuestion } from '../../engine/question/generate'
import { currentItem } from '../../engine/session/runner'
import { useAppStore } from '../../store/store'
import type { SessionState } from '../../types/session'
import { todayStamp } from '../../utils/date'
import { mulberry32, seedFromString } from '../../utils/random'
import { ChoicePanel } from './ChoicePanel'
import { MonsterView, type MonsterPhase } from './MonsterView'
import { TeachCard } from './TeachCard'

/** E2E/开发提速：URL 带 ?fast=1 时缩短反馈停留 */
const FAST_MODE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast')
const FEEDBACK_MS_CORRECT = FAST_MODE ? 150 : 900
const FEEDBACK_MS_WRONG = FAST_MODE ? 300 : 2000

interface Feedback {
  readonly correct: boolean
  readonly selectedId: string
}

function teachPosition(session: SessionState): { index: number; total: number } {
  const teachItems = session.items.filter((item) => item.kind === 'teach')
  const passed = session.items
    .slice(0, session.cursor + 1)
    .filter((item) => item.kind === 'teach').length
  return { index: passed, total: teachItems.length }
}

function comboCount(session: SessionState): number {
  let combo = 0
  for (let i = session.records.length - 1; i >= 0; i -= 1) {
    if (!session.records[i]?.correct) break
    combo += 1
  }
  return combo
}

const PROMPT_HINTS: Record<string, string> = {
  recognition: '它的意思是？',
  reverse: '哪个单词是这个意思？',
}

export function QuizBattle() {
  const session = useAppStore((state) => state.session)
  const teachNext = useAppStore((state) => state.teachNext)
  const answerCurrent = useAppStore((state) => state.answerCurrent)
  const ttsEnabled = useAppStore((state) => state.save.settings.ttsEnabled)

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const startedAtRef = useRef(performance.now())
  const item = session ? currentItem(session) : null

  const question = useMemo(() => {
    if (!session || !item || item.kind !== 'question') return null
    const entry = WORD_DB.byId.get(item.wordId)
    if (!entry) return null
    const recent = new Set(
      session.records.slice(-RECENT_DISTRACTOR_WINDOW).map((record) => record.wordId),
    )
    const rng = mulberry32(
      seedFromString(`${todayStamp()}:${session.records.length}:${item.wordId}`),
    )
    return generateQuestion(entry, item.questionType, WORD_DB, recent, rng)
    // session 引用变化即换题
  }, [session, item])

  useEffect(() => {
    startedAtRef.current = performance.now()
  }, [question])

  if (!session || !item) return null

  if (item.kind === 'teach') {
    const entry = WORD_DB.byId.get(item.wordId)
    if (!entry) return null
    const { index, total } = teachPosition(session)
    return <TeachCard entry={entry} index={index} total={total} onNext={teachNext} />
  }

  if (!question || question.kind !== 'choice') return null

  const monsterPhase: MonsterPhase = feedback === null ? 'idle' : feedback.correct ? 'hit' : 'happy'
  const combo = comboCount(session)
  const answerEntry = WORD_DB.byId.get(question.correctWordId)

  const handleSelect = (wordId: string) => {
    if (feedback !== null) return
    const correct = wordId === question.correctWordId
    const responseMs = Math.round(performance.now() - startedAtRef.current)
    setFeedback({ correct, selectedId: wordId })
    if (!correct && ttsEnabled && answerEntry) speakWord(answerEntry.word)
    setTimeout(
      () => {
        setFeedback(null)
        answerCurrent(correct, responseMs)
      },
      correct ? FEEDBACK_MS_CORRECT : FEEDBACK_MS_WRONG,
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6">
      <MonsterView wordId={question.wordId} phase={monsterPhase} />

      <div className="text-center">
        <div className="mb-1 text-sm font-bold text-[var(--ink-dim)]">
          {question.type === 'recognition' ? '⚔️ 单词怪拦路！' : '⚔️ 单词怪出暗号！'}
          {combo >= 3 && <span className="ml-2 text-[var(--star-gold)]">🔥 连击 x{combo}</span>}
        </div>
        <div
          className="text-4xl font-extrabold"
          data-testid="prompt"
          style={question.promptKind === 'en' ? { fontFamily: 'var(--font-latin)' } : undefined}
        >
          {question.prompt}
        </div>
        <div className="mt-2 text-sm text-[var(--ink-dim)]">
          {PROMPT_HINTS[question.type] ?? ''}
        </div>
      </div>

      <ChoicePanel
        question={question}
        selectedId={feedback?.selectedId ?? null}
        locked={feedback !== null}
        onSelect={handleSelect}
      />

      <div className="h-16 text-center">
        {feedback !== null && feedback.correct && (
          <div className="xp-float text-xl font-extrabold text-[var(--leaf)]">砰！答对啦 ✨</div>
        )}
        {feedback !== null && !feedback.correct && answerEntry && (
          <div className="anim-slide-up rounded-xl bg-black/30 px-5 py-2 text-[15px]">
            正确答案：
            <span className="mx-1 font-extrabold" style={{ fontFamily: 'var(--font-latin)' }}>
              {answerEntry.word}
            </span>
            <span className="text-[var(--ink-dim)]">
              {answerEntry.pos} {firstSense(answerEntry.meaning)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
