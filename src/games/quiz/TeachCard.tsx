import { useEffect } from 'react'
import { Button } from '../../components/Button'
import { speakWord } from '../../audio/tts'
import { useAppStore } from '../../store/store'
import type { WordEntry } from '../../types/word'

interface TeachCardProps {
  readonly entry: WordEntry
  readonly index: number
  readonly total: number
  readonly onNext: () => void
}

export function TeachCard({ entry, index, total, onNext }: TeachCardProps) {
  const ttsEnabled = useAppStore((state) => state.save.settings.ttsEnabled)

  useEffect(() => {
    if (ttsEnabled) speakWord(entry.word)
  }, [entry.id, entry.word, ttsEnabled])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext])

  return (
    <div className="panel anim-slide-up mx-auto w-full max-w-xl p-8 text-center" key={entry.id}>
      <div className="mb-4 inline-block rounded-full bg-[var(--star-gold)]/15 px-4 py-1 text-sm font-bold text-[var(--star-gold)]">
        🆕 新单词 {index}/{total}
      </div>
      <div className="mb-1 flex items-center justify-center gap-3">
        <span className="text-5xl font-extrabold" style={{ fontFamily: 'var(--font-latin)' }}>
          {entry.word}
        </span>
        <button
          className="btn btn-ghost btn-sm text-xl"
          onClick={() => speakWord(entry.word)}
          aria-label="播放发音"
          title="播放发音"
        >
          🔊
        </button>
      </div>
      {entry.phonetic && (
        <div
          className="mb-4 text-lg text-[var(--ink-dim)]"
          style={{ fontFamily: 'var(--font-num)' }}
        >
          {entry.phonetic}
        </div>
      )}
      <div className="mb-5 text-2xl font-bold">
        <span className="mr-2 text-base font-bold text-[var(--nova)]">{entry.pos}</span>
        {entry.meaning}
      </div>
      {entry.example && (
        <div className="mb-6 rounded-xl bg-black/25 p-4 text-left">
          <p className="mb-1 text-[17px]" style={{ fontFamily: 'var(--font-latin)' }}>
            {entry.example}
          </p>
          <p className="text-sm text-[var(--ink-dim)]">{entry.exampleZh}</p>
        </div>
      )}
      <Button variant="gold" size="lg" onClick={onNext} data-testid="teach-next">
        认识了，下一个 →
      </Button>
      <p className="mt-3 text-xs text-[var(--ink-dim)]">按回车键继续</p>
    </div>
  )
}
