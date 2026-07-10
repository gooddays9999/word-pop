import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import type { SpellingQuestion } from '../../types/question'

interface SpellingInputProps {
  readonly question: SpellingQuestion
  readonly locked: boolean
  /** 已购买提示揭示的前缀字母数 */
  readonly revealedCount: number
  readonly letterCost: number
  readonly canBuyLetter: boolean
  readonly onBuyLetter: () => void
  readonly onSubmit: (typed: string) => void
}

/** 允许的拼写字符（与词库 word 规则一致） */
const SPELL_CHAR = /[^a-zA-Z '\-.]/g

export function SpellingInput({
  question,
  locked,
  revealedCount,
  letterCost,
  canBuyLetter,
  onBuyLetter,
  onSubmit,
}: SpellingInputProps) {
  const [typed, setTyped] = useState('')
  const [imeActive, setImeActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTyped('')
    inputRef.current?.focus()
  }, [question])

  const answer = question.answer
  const slots = [...answer].map((char, index) => {
    if (char === ' ') return { char: ' ', shown: true }
    return { char, shown: index < revealedCount }
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (locked || typed.trim() === '') return
    onSubmit(typed)
  }

  return (
    <form className="flex w-full max-w-xl flex-col items-center gap-4" onSubmit={handleSubmit}>
      <div
        className="flex flex-wrap justify-center gap-1.5"
        aria-label="单词长度提示"
        data-testid="letter-slots"
      >
        {slots.map((slot, index) => (
          <span
            key={index}
            className={`grid h-10 w-8 place-items-center rounded-lg border-2 text-xl font-extrabold ${
              slot.char === ' ' ? 'border-transparent' : 'border-[var(--space-line)] bg-black/25'
            } ${slot.shown ? 'text-[var(--star-gold)]' : 'text-transparent'}`}
            style={{ fontFamily: 'var(--font-latin)' }}
          >
            {slot.shown ? slot.char : '·'}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        value={typed}
        disabled={locked}
        onChange={(event) => setTyped(event.target.value.replace(SPELL_CHAR, ''))}
        onCompositionStart={() => setImeActive(true)}
        onCompositionEnd={() => setImeActive(false)}
        placeholder="输入英文单词，回车确认"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={answer.length + 6}
        data-testid="spelling-input"
        className="w-full max-w-sm rounded-xl border-2 border-[var(--space-line)] bg-black/30 px-4 py-3 text-center text-2xl font-extrabold outline-none focus:border-[var(--nova)]"
        style={{ fontFamily: 'var(--font-latin)' }}
      />
      {imeActive && (
        <p className="text-xs font-bold text-[var(--star-gold)]">⚠️ 请切换到英文输入法再输入</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canBuyLetter || locked}
          onClick={onBuyLetter}
          data-testid="buy-letter"
        >
          🪙{letterCost} 提示一个字母
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={locked || typed.trim() === ''}
          data-testid="spelling-submit"
        >
          ⚡ 拼写攻击！
        </Button>
      </div>
    </form>
  )
}
