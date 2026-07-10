import { useEffect } from 'react'
import type { ChoiceQuestion } from '../../types/question'
import type { WordId } from '../../types/word'

interface ChoicePanelProps {
  readonly question: ChoiceQuestion
  readonly selectedId: WordId | null
  readonly locked: boolean
  readonly onSelect: (wordId: WordId) => void
}

function optionClass(
  question: ChoiceQuestion,
  optionId: WordId,
  selectedId: WordId | null,
  locked: boolean,
): string {
  if (!locked) return 'choice-btn'
  if (optionId === question.correctWordId) return 'choice-btn is-correct'
  if (optionId === selectedId) return 'choice-btn is-wrong'
  return 'choice-btn is-dim'
}

export function ChoicePanel({ question, selectedId, locked, onSelect }: ChoicePanelProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (locked) return
      const digit = Number.parseInt(event.key, 10)
      if (digit >= 1 && digit <= question.options.length) {
        const option = question.options[digit - 1]
        if (option) onSelect(option.wordId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [question, locked, onSelect])

  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-3">
      {question.options.map((option, index) => (
        <button
          key={option.wordId}
          className={optionClass(question, option.wordId, selectedId, locked)}
          onClick={() => onSelect(option.wordId)}
          disabled={locked}
        >
          <span className="choice-key">{index + 1}</span>
          <span
            className="truncate"
            style={question.type === 'reverse' ? { fontFamily: 'var(--font-latin)' } : undefined}
          >
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}
