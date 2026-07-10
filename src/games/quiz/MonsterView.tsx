import { seedFromString } from '../../utils/random'

const MONSTERS = ['👾', '🐙', '👻', '🦖', '🐲', '🤖', '👽', '🦑', '🐍', '🦂'] as const

export type MonsterPhase = 'idle' | 'hit' | 'happy'

interface MonsterViewProps {
  readonly wordId: string
  readonly phase: MonsterPhase
}

/** 单词怪：每个词固定对应一只 emoji 怪，答对时泡泡爆裂（word-pop！） */
export function MonsterView({ wordId, phase }: MonsterViewProps) {
  const emoji = MONSTERS[seedFromString(wordId) % MONSTERS.length]
  const phaseClass = phase === 'hit' ? 'is-hit' : phase === 'happy' ? 'is-happy' : ''
  return (
    <div className={`monster-ring ${phaseClass}`} aria-hidden="true">
      <span className="monster-emoji">{emoji}</span>
    </div>
  )
}
