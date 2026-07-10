import { describe, expect, it } from 'vitest'
import { downgradeQuestionType, questionTypeForBox, starsForBox } from './stage'
import { GRADUATED } from '../../types/progress'

describe('questionTypeForBox', () => {
  it('题型随盒子升级：认词→中选英→听音→拼写', () => {
    expect(questionTypeForBox(0)).toBe('recognition')
    expect(questionTypeForBox(1)).toBe('recognition')
    expect(questionTypeForBox(2)).toBe('reverse')
    expect(questionTypeForBox(3)).toBe('listening')
    expect(questionTypeForBox(4)).toBe('spelling')
    expect(questionTypeForBox(5)).toBe('spelling')
    expect(questionTypeForBox(6)).toBe('spelling')
    expect(questionTypeForBox(GRADUATED)).toBe('spelling')
  })
})

describe('downgradeQuestionType', () => {
  const m1Types = ['recognition', 'reverse'] as const
  it('允许时保持原题型', () => {
    expect(downgradeQuestionType('reverse', m1Types)).toBe('reverse')
  })
  it('听音降级为认词，拼写降级为中选英', () => {
    expect(downgradeQuestionType('listening', m1Types)).toBe('recognition')
    expect(downgradeQuestionType('spelling', m1Types)).toBe('reverse')
  })
  it('拼写在无中选英时兜底为认词', () => {
    expect(downgradeQuestionType('spelling', ['recognition'])).toBe('recognition')
  })
})

describe('starsForBox', () => {
  it('图鉴星级随盒子提升', () => {
    expect(starsForBox(0)).toBe(0)
    expect(starsForBox(1)).toBe(1)
    expect(starsForBox(2)).toBe(1)
    expect(starsForBox(3)).toBe(2)
    expect(starsForBox(4)).toBe(3)
    expect(starsForBox(5)).toBe(4)
    expect(starsForBox(6)).toBe(4)
    expect(starsForBox(GRADUATED)).toBe(5)
  })
})
