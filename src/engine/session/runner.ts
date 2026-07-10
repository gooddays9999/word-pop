import { BOX0_REQUIRED_HITS } from '../../config/srs'
import { MAX_REQUEUES_PER_WORD, REQUEUE_GAP } from '../../config/session'
import type { QuestionType } from '../../types/question'
import type { SessionItem, SessionKind, SessionState } from '../../types/session'

export interface RunnerConfig {
  /** 新词在会话内需要的连续答对次数 */
  readonly requiredNewHits: number
  /** 重插位置与当前位置的间隔 */
  readonly requeueGap: number
  /** 同词最大重插次数 */
  readonly maxRequeues: number
}

export const DEFAULT_RUNNER_CONFIG: RunnerConfig = {
  requiredNewHits: BOX0_REQUIRED_HITS,
  requeueGap: REQUEUE_GAP,
  maxRequeues: MAX_REQUEUES_PER_WORD,
}

export function createSessionState(
  kind: SessionKind,
  levelId: string | null,
  items: readonly SessionItem[],
): SessionState {
  return {
    kind,
    levelId,
    items,
    cursor: 0,
    records: [],
    hits: {},
    requeues: {},
    done: items.length === 0,
  }
}

export function currentItem(state: SessionState): SessionItem | null {
  return state.done ? null : (state.items[state.cursor] ?? null)
}

function requireCurrent(state: SessionState): SessionItem {
  if (state.done) throw new Error('会话已结束，不能继续操作')
  const item = state.items[state.cursor]
  if (!item) throw new Error('会话游标越界')
  return item
}

export function advanceTeach(state: SessionState): SessionState {
  const item = requireCurrent(state)
  if (item.kind !== 'teach') throw new Error('当前项不是教学卡')
  const cursor = state.cursor + 1
  return { ...state, cursor, done: cursor >= state.items.length }
}

/** 三种游戏皮肤唯一的作答入口：更新记录、连对计数并按需重插 */
export function answerQuestion(
  state: SessionState,
  correct: boolean,
  responseMs: number,
  config: RunnerConfig = DEFAULT_RUNNER_CONFIG,
): SessionState {
  const item = requireCurrent(state)
  if (item.kind !== 'question') throw new Error('当前项不是题目')

  const { wordId } = item
  const hits = correct ? (state.hits[wordId] ?? 0) + 1 : 0
  const usedRequeues = state.requeues[wordId] ?? 0
  const requeued = decideRequeue(item, correct, hits, usedRequeues, config)

  const cursor = state.cursor + 1
  const items = requeued
    ? insertAt(state.items, Math.min(cursor + config.requeueGap, state.items.length), requeued)
    : state.items

  return {
    ...state,
    items,
    cursor,
    records: [...state.records, { wordId, correct, responseMs, isNew: item.isNew }],
    hits: { ...state.hits, [wordId]: hits },
    requeues: requeued ? { ...state.requeues, [wordId]: usedRequeues + 1 } : state.requeues,
    done: cursor >= items.length,
  }
}

function decideRequeue(
  item: Extract<SessionItem, { kind: 'question' }>,
  correct: boolean,
  hits: number,
  usedRequeues: number,
  config: RunnerConfig,
): SessionItem | null {
  if (usedRequeues >= config.maxRequeues) return null
  if (!correct) {
    return { kind: 'question', wordId: item.wordId, questionType: item.questionType, isNew: item.isNew }
  }
  if (item.isNew && hits < config.requiredNewHits) {
    return {
      kind: 'question',
      wordId: item.wordId,
      questionType: alternateChoiceType(item.questionType),
      isNew: true,
    }
  }
  return null
}

/** 新词第二问换个方向（认词↔中选英），加深编码 */
function alternateChoiceType(type: QuestionType): QuestionType {
  if (type === 'recognition') return 'reverse'
  if (type === 'reverse') return 'recognition'
  return type
}

function insertAt(
  items: readonly SessionItem[],
  index: number,
  item: SessionItem,
): readonly SessionItem[] {
  return [...items.slice(0, index), item, ...items.slice(index)]
}
