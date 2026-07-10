/**
 * 发音（TTS）：speechSynthesis 封装。
 * 失败永远静默——发音问题绝不能阻塞答题；听音题的可用性由 ttsUsable 提前把关。
 */

const SPEECH_RATE = 0.85

let cachedVoice: SpeechSynthesisVoice | null = null
let voicesHooked = false

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** E2E/调试开关：URL 带 ?notts=1 时视为无发音环境（验证听音题降级路径） */
export function ttsDisabledByUrl(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('notts')
}

/** 听音题是否可出：API 支持 + 设置开启 + 未被调试参数禁用 */
export function ttsUsable(ttsEnabledSetting: boolean): boolean {
  return ttsEnabledSetting && ttsSupported() && !ttsDisabledByUrl()
}

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  cachedVoice =
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.startsWith('en')) ??
    null
  return cachedVoice
}

function hookVoicesChanged(): void {
  if (voicesHooked || !ttsSupported()) return
  voicesHooked = true
  // Chromium 声音列表异步加载：就绪后刷新缓存的英语声音
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null
    pickEnglishVoice()
  })
}

/** 朗读英文单词；不可用或失败时静默 */
export function speakWord(word: string): void {
  if (!ttsSupported() || ttsDisabledByUrl()) return
  try {
    hookVoicesChanged()
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = SPEECH_RATE
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  } catch (cause) {
    console.warn('[word-pop] 发音失败:', cause)
  }
}
