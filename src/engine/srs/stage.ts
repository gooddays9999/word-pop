import { GRADUATED, type BoxOrGraduated } from '../../types/progress'
import type { QuestionType } from '../../types/question'

/** 题型随盒子升级：认词 → 中选英 → 听音 → 拼写 */
export function questionTypeForBox(box: BoxOrGraduated): QuestionType {
  if (box === GRADUATED) return 'spelling'
  if (box <= 1) return 'recognition'
  if (box === 2) return 'reverse'
  if (box === 3) return 'listening'
  return 'spelling'
}

const DOWNGRADE_CHAIN: Readonly<Record<QuestionType, readonly QuestionType[]>> = {
  recognition: ['recognition'],
  reverse: ['reverse', 'recognition'],
  listening: ['listening', 'recognition'],
  spelling: ['spelling', 'reverse', 'recognition'],
}

/** 当前环境/里程碑不支持某题型时逐级降级（如无 TTS 时听音→认词） */
export function downgradeQuestionType(
  type: QuestionType,
  allowed: readonly QuestionType[],
): QuestionType {
  const chain = DOWNGRADE_CHAIN[type]
  return chain.find((candidate) => allowed.includes(candidate)) ?? 'recognition'
}

/** 图鉴卡片星级（0–5） */
export function starsForBox(box: BoxOrGraduated): number {
  if (box === GRADUATED) return 5
  if (box >= 5) return 4
  if (box === 4) return 3
  if (box === 3) return 2
  if (box >= 1) return 1
  return 0
}
