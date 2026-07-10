import type { QuestionType } from '../../types/question'

export interface TypeCapabilities {
  /** 发音（TTS）当前是否真正可用：API 支持 + 用户开启 + 未被调试参数禁用 */
  readonly ttsUsable: boolean
}

/** 当前环境可出的题型：拼写恒可用；听音辨词依赖发音能力 */
export function computeAllowedTypes({ ttsUsable }: TypeCapabilities): QuestionType[] {
  const base: QuestionType[] = ['recognition', 'reverse', 'spelling']
  return ttsUsable ? [...base, 'listening'] : base
}
