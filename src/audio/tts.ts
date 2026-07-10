/**
 * 发音（M1 最小实现）：speechSynthesis 尽力而为，失败静默。
 * M2 会补充能力探测、选声与语速设置。
 */

let cachedVoice: SpeechSynthesisVoice | null = null

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
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

/** 朗读英文单词；不可用或失败时静默（发音永不阻塞游戏） */
export function speakWord(word: string): void {
  if (!ttsAvailable()) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    const voice = pickEnglishVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  } catch (cause) {
    console.warn('[word-pop] 发音失败:', cause)
  }
}
