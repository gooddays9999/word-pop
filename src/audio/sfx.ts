/**
 * WebAudio 合成音效：零音频资产。
 * AudioContext 在首次播放（必然来自用户点击）时创建/恢复，规避自动播放限制。
 * 所有失败静默——音效绝不能阻塞游戏。
 */

export type SfxKind = 'pop' | 'correct' | 'wrong' | 'coin' | 'levelup'

let audioContext: AudioContext | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  try {
    if (!audioContext) audioContext = new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    return audioContext
  } catch {
    return null
  }
}

interface ToneSpec {
  readonly freq: number
  readonly at: number
  readonly duration: number
  readonly type?: OscillatorType
  readonly gain?: number
  readonly glideTo?: number
}

function tone(ctx: AudioContext, spec: ToneSpec): void {
  const start = ctx.currentTime + spec.at
  const end = start + spec.duration
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.type = spec.type ?? 'sine'
  oscillator.frequency.setValueAtTime(spec.freq, start)
  if (spec.glideTo !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(spec.glideTo, end)
  }
  const peak = spec.gain ?? 0.12
  gainNode.gain.setValueAtTime(0.0001, start)
  gainNode.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, end)
  oscillator.connect(gainNode).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(end + 0.02)
}

const SFX_SCORES: Readonly<Record<SfxKind, readonly ToneSpec[]>> = {
  // 泡泡爆裂：高频叮 + 快速下滑
  pop: [
    { freq: 900, at: 0, duration: 0.05, type: 'triangle', gain: 0.14 },
    { freq: 420, at: 0.02, duration: 0.12, type: 'square', gain: 0.08, glideTo: 90 },
  ],
  correct: [
    { freq: 660, at: 0, duration: 0.08 },
    { freq: 880, at: 0.09, duration: 0.14 },
  ],
  wrong: [{ freq: 190, at: 0, duration: 0.28, type: 'square', gain: 0.09, glideTo: 130 }],
  coin: [
    { freq: 988, at: 0, duration: 0.06, type: 'triangle', gain: 0.14 },
    { freq: 1319, at: 0.07, duration: 0.16, type: 'triangle', gain: 0.14 },
  ],
  levelup: [
    { freq: 523, at: 0, duration: 0.09 },
    { freq: 659, at: 0.1, duration: 0.09 },
    { freq: 784, at: 0.2, duration: 0.09 },
    { freq: 1047, at: 0.3, duration: 0.22 },
  ],
}

/** 播放一段合成音效（调用方负责检查音效开关） */
export function playSfx(kind: SfxKind): void {
  const ctx = ensureContext()
  if (!ctx) return
  try {
    for (const spec of SFX_SCORES[kind]) tone(ctx, spec)
  } catch (cause) {
    console.warn('[word-pop] 音效播放失败:', cause)
  }
}
