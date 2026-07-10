import { useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { speakWord } from '../../audio/tts'
import { HINT_5050_COST, HINT_LETTER_COST } from '../../config/economy'
import { RECENT_DISTRACTOR_WINDOW } from '../../config/session'
import { WORD_DB } from '../../data/words'
import { firstSense } from '../../engine/question/distractors'
import { generateQuestion } from '../../engine/question/generate'
import { currentItem } from '../../engine/session/runner'
import { useAppStore } from '../../store/store'
import type { ChoiceQuestion } from '../../types/question'
import type { SessionState } from '../../types/session'
import { todayStamp } from '../../utils/date'
import { mulberry32, seedFromString } from '../../utils/random'
import { ChoicePanel } from './ChoicePanel'
import { MonsterView, type MonsterPhase } from './MonsterView'
import { SpellingInput } from './SpellingInput'
import { TeachCard } from './TeachCard'

/** E2E/开发提速：URL 带 ?fast=1 时缩短反馈停留 */
const FAST_MODE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('fast')
const FEEDBACK_MS_CORRECT = FAST_MODE ? 150 : 900
const FEEDBACK_MS_WRONG = FAST_MODE ? 300 : 2000

interface Feedback {
  readonly correct: boolean
  readonly selectedId: string | null
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

function normalizeSpelling(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

const PROMPT_TITLES: Record<string, string> = {
  recognition: '⚔️ 单词怪拦路！它的意思是？',
  reverse: '⚔️ 单词怪出暗号！哪个单词是这个意思？',
  listening: '⚔️ 隐身单词怪！听发音，选出它的意思',
  spelling: '⚔️ 大喊出单词的全名，才能击退它！',
}

export function QuizBattle() {
  const session = useAppStore((state) => state.session)
  const teachNext = useAppStore((state) => state.teachNext)
  const answerCurrent = useAppStore((state) => state.answerCurrent)
  const spendCoins = useAppStore((state) => state.spendCoins)
  const coins = useAppStore((state) => state.save.player.coins)
  const { ttsEnabled, sfxEnabled } = useAppStore((state) => state.save.settings)

  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [removedIds, setRemovedIds] = useState<readonly string[]>([])
  const [revealedCount, setRevealedCount] = useState(0)
  const startedAtRef = useRef(performance.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const item = session ? currentItem(session) : null

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

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
  }, [session, item])

  // 换题时重置计时与提示状态；听音题自动朗读
  useEffect(() => {
    startedAtRef.current = performance.now()
    setRemovedIds([])
    setRevealedCount(0)
    if (question?.kind === 'choice' && question.promptKind === 'audio' && ttsEnabled) {
      speakWord(question.prompt)
    }
  }, [question, ttsEnabled])

  if (!session || !item) return null

  if (item.kind === 'teach') {
    const entry = WORD_DB.byId.get(item.wordId)
    if (!entry) return null
    const { index, total } = teachPosition(session)
    return <TeachCard entry={entry} index={index} total={total} onNext={teachNext} />
  }

  if (!question) return null

  const answerEntry = WORD_DB.byId.get(question.wordId)
  const combo = comboCount(session)
  const monsterPhase: MonsterPhase = feedback === null ? 'idle' : feedback.correct ? 'hit' : 'happy'

  const settleAnswer = (correct: boolean, selectedId: string | null) => {
    if (feedback !== null) return
    const responseMs = Math.round(performance.now() - startedAtRef.current)
    setFeedback({ correct, selectedId })
    if (sfxEnabled) playSfx(correct ? 'pop' : 'wrong')
    if (!correct && ttsEnabled && answerEntry) speakWord(answerEntry.word)
    const sessionAtAnswer = session
    feedbackTimerRef.current = setTimeout(
      () => {
        feedbackTimerRef.current = null
        setFeedback(null)
        // 会话已切换（中途撤退后开新会话）时，过期的作答绝不能落到新会话上
        if (useAppStore.getState().session !== sessionAtAnswer) return
        answerCurrent(correct, responseMs)
      },
      correct ? FEEDBACK_MS_CORRECT : FEEDBACK_MS_WRONG,
    )
  }

  const buyFiftyFifty = (choice: ChoiceQuestion) => {
    if (feedback !== null || removedIds.length > 0) return
    const wrongIds = choice.options
      .map((option) => option.wordId)
      .filter((id) => id !== choice.correctWordId)
    if (wrongIds.length < 3 || !spendCoins(HINT_5050_COST)) return
    if (sfxEnabled) playSfx('coin')
    const shuffled = [...wrongIds].sort(() => Math.random() - 0.5)
    setRemovedIds(shuffled.slice(0, 2))
  }

  const buyLetter = () => {
    if (question.kind !== 'spelling' || feedback !== null) return
    if (revealedCount >= question.answer.length - 1) return
    if (!spendCoins(HINT_LETTER_COST)) return
    if (sfxEnabled) playSfx('coin')
    setRevealedCount((count) => count + 1)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6">
      <MonsterView wordId={question.wordId} phase={monsterPhase} />

      <div className="text-center">
        <div className="mb-1 text-sm font-bold text-[var(--ink-dim)]">
          {PROMPT_TITLES[question.type]}
          {combo >= 3 && <span className="ml-2 text-[var(--star-gold)]">🔥 连击 x{combo}</span>}
        </div>

        {question.kind === 'choice' && question.promptKind === 'audio' ? (
          <button
            className="btn btn-ghost btn-lg mt-1 text-3xl"
            onClick={() => speakWord(question.prompt)}
            data-testid="replay-audio"
          >
            🔊 再听一遍
          </button>
        ) : (
          <div
            className="text-4xl font-extrabold"
            data-testid="prompt"
            style={
              question.kind === 'choice' && question.promptKind === 'en'
                ? { fontFamily: 'var(--font-latin)' }
                : undefined
            }
          >
            {question.kind === 'spelling' ? question.meaning : question.prompt}
          </div>
        )}
      </div>

      {question.kind === 'choice' ? (
        <>
          <ChoicePanel
            question={question}
            selectedId={feedback?.selectedId ?? null}
            locked={feedback !== null}
            removedIds={removedIds}
            onSelect={(wordId) => settleAnswer(wordId === question.correctWordId, wordId)}
          />
          <button
            className="btn btn-ghost btn-sm"
            disabled={feedback !== null || removedIds.length > 0 || coins < HINT_5050_COST}
            onClick={() => buyFiftyFifty(question)}
            data-testid="buy-5050"
          >
            🪙{HINT_5050_COST} 吹走两个错误选项
          </button>
        </>
      ) : (
        <SpellingInput
          question={question}
          locked={feedback !== null}
          revealedCount={revealedCount}
          letterCost={HINT_LETTER_COST}
          canBuyLetter={coins >= HINT_LETTER_COST && revealedCount < question.answer.length - 1}
          onBuyLetter={buyLetter}
          onSubmit={(typed) =>
            settleAnswer(normalizeSpelling(typed) === normalizeSpelling(question.answer), null)
          }
        />
      )}

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
