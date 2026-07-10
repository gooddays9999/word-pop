import { useEffect } from 'react'
import type { ChoiceQuestion } from '../../types/question'
import type { WordId } from '../../types/word'

interface ChoicePanelProps {
  readonly question: ChoiceQuestion
  readonly selectedId: WordId | null
  readonly locked: boolean
  /** 被 50/50 提示排除的选项 */
  readonly removedIds: readonly WordId[]
  readonly onSelect: (wordId: WordId) => void
}

function optionClass(
  question: ChoiceQuestion,
  optionId: WordId,
  selectedId: WordId | null,
  locked: boolean,
  removed: boolean,
): string {
  if (removed) return 'choice-btn is-dim'
  if (!locked) return 'choice-btn'
  if (optionId === question.correctWordId) return 'choice-btn is-correct'
  if (optionId === selectedId) return 'choice-btn is-wrong'
  return 'choice-btn is-dim'
}

export function ChoicePanel({
  question,
  selectedId,
  locked,
  removedIds,
  onSelect,
}: ChoicePanelProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (locked) return
      const digit = Number.parseInt(event.key, 10)
      if (digit >= 1 && digit <= question.options.length) {
        const option = question.options[digit - 1]
        if (option && !removedIds.includes(option.wordId)) onSelect(option.wordId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, locked, removedIds, onSelect])

  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-3">
      {question.options.map((option, index) => {
        const removed = removedIds.includes(option.wordId)
        return (
          <button
            key={option.wordId}
            className={optionClass(question, option.wordId, selectedId, locked, removed)}
            onClick={() => onSelect(option.wordId)}
            disabled={locked || removed}
            data-testid="choice-option"
          >
            <span className="choice-key">{index + 1}</span>
            <span
              className="truncate"
              data-testid="choice-label"
              style={question.type === 'reverse' ? { fontFamily: 'var(--font-latin)' } : undefined}
            >
              {removed ? '💨' : option.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
