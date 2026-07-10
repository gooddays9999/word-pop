/**
 * 词条 schema 规则 —— scripts 侧唯一副本。
 * src/ 内运行时校验（zod）须与此保持一致。
 */

export const POS_WHITELIST = [
  'n.',
  'v.',
  'adj.',
  'adv.',
  'pron.',
  'prep.',
  'conj.',
  'num.',
  'art.',
  'int.',
  'modal v.',
  'aux. v.',
  'phr.',
]

// 允许 "ice cream"、"o'clock"、"e-mail"、"P.E." 这类词形
export const WORD_PATTERN = /^[A-Za-z][A-Za-z '\-.]*$/

export const CJK_PATTERN = /[一-鿿]/

// 音标统一为 /.../ 包裹
export const PHONETIC_PATTERN = /^\/[^/]+\/$/

// 每关单词数
export const LEVEL_SIZE = 20

const REQUIRED_FIELDS = ['id', 'word', 'pos', 'meaning', 'theme']
const OPTIONAL_FIELDS = ['phonetic', 'example', 'exampleZh']
const ALL_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS])

/**
 * 校验单个词条，返回错误信息数组（空数组 = 合法）。
 * @param {Record<string, unknown>} entry
 * @param {Set<string>} regionIds
 * @returns {string[]}
 */
export function validateWordEntry(entry, regionIds) {
  const errors = []
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return ['词条必须是对象']
  }

  for (const field of REQUIRED_FIELDS) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      errors.push(`缺少必填字段或为空: ${field}`)
    }
  }
  for (const key of Object.keys(entry)) {
    if (!ALL_FIELDS.has(key)) {
      errors.push(`未知字段: ${key}`)
    }
  }
  if (errors.length > 0) return errors

  const { id, word, pos, meaning, theme, phonetic, example, exampleZh } = entry

  if (!WORD_PATTERN.test(word)) {
    errors.push(`word 含非法字符: "${word}"`)
  }
  if (id !== word.toLowerCase()) {
    errors.push(`id 必须是 word 的小写形式: id="${id}" word="${word}"`)
  }
  const posParts = pos.split('/').map((p) => p.trim())
  for (const part of posParts) {
    if (!POS_WHITELIST.includes(part)) {
      errors.push(`词性不在白名单: "${part}" (word="${word}")`)
    }
  }
  if (!CJK_PATTERN.test(meaning)) {
    errors.push(`meaning 必须包含中文: "${meaning}" (word="${word}")`)
  }
  if (!regionIds.has(theme)) {
    errors.push(`theme 不在 regions.json 中: "${theme}" (word="${word}")`)
  }
  if (phonetic !== undefined && !PHONETIC_PATTERN.test(phonetic)) {
    errors.push(`phonetic 需形如 /.../: "${phonetic}" (word="${word}")`)
  }
  const hasExample = example !== undefined
  const hasExampleZh = exampleZh !== undefined
  if (hasExample !== hasExampleZh) {
    errors.push(`example 与 exampleZh 必须成对出现 (word="${word}")`)
  }
  if (hasExample && !CJK_PATTERN.test(exampleZh)) {
    errors.push(`exampleZh 必须包含中文 (word="${word}")`)
  }

  return errors
}
