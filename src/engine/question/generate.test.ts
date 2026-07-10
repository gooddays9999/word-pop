import { describe, expect, it } from 'vitest'
import { generateQuestion } from './generate'
import { FIXTURE_DB } from '../../test/fixtures'
import { mulberry32 } from '../../utils/random'

const apple = FIXTURE_DB.byId.get('apple')!

describe('generateQuestion — recognition', () => {
  it('题干为英文单词，选项为中文首义项，含且仅含一个正确项', () => {
    const q = generateQuestion(apple, 'recognition', FIXTURE_DB, new Set(), mulberry32(1))
    if (q.kind !== 'choice') throw new Error('应为选择题')
    expect(q.prompt).toBe('apple')
    expect(q.promptKind).toBe('en')
    expect(q.options).toHaveLength(4)
    expect(q.options.filter((o) => o.wordId === 'apple')).toHaveLength(1)
    expect(q.options.find((o) => o.wordId === 'apple')?.label).toBe('苹果')
    expect(q.correctWordId).toBe('apple')
  })

  it('相同种子生成相同题目（可复现）', () => {
    const a = generateQuestion(apple, 'recognition', FIXTURE_DB, new Set(), mulberry32(5))
    const b = generateQuestion(apple, 'recognition', FIXTURE_DB, new Set(), mulberry32(5))
    expect(a).toEqual(b)
  })
})

describe('generateQuestion — reverse', () => {
  it('题干为完整中文释义，选项为英文单词', () => {
    const q = generateQuestion(apple, 'reverse', FIXTURE_DB, new Set(), mulberry32(2))
    if (q.kind !== 'choice') throw new Error('应为选择题')
    expect(q.prompt).toBe('苹果')
    expect(q.promptKind).toBe('zh')
    expect(q.options.find((o) => o.wordId === 'apple')?.label).toBe('apple')
  })
})

describe('generateQuestion — listening', () => {
  it('promptKind 为 audio，选项为中文', () => {
    const q = generateQuestion(apple, 'listening', FIXTURE_DB, new Set(), mulberry32(3))
    if (q.kind !== 'choice') throw new Error('应为选择题')
    expect(q.promptKind).toBe('audio')
    expect(q.prompt).toBe('apple')
  })
})

describe('generateQuestion — spelling', () => {
  it('给出释义与答案', () => {
    const q = generateQuestion(apple, 'spelling', FIXTURE_DB, new Set(), mulberry32(4))
    if (q.kind !== 'spelling') throw new Error('应为拼写题')
    expect(q.answer).toBe('apple')
    expect(q.meaning).toBe('苹果')
  })
})
