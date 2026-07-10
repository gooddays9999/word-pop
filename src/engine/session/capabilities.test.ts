import { describe, expect, it } from 'vitest'
import { computeAllowedTypes } from './capabilities'
import { downgradeQuestionType } from '../srs/stage'

describe('computeAllowedTypes', () => {
  it('发音可用时开放全部题型', () => {
    const types = computeAllowedTypes({ ttsUsable: true })
    expect(types).toContain('recognition')
    expect(types).toContain('reverse')
    expect(types).toContain('spelling')
    expect(types).toContain('listening')
  })

  it('发音不可用时不出听音题，拼写不受影响', () => {
    const types = computeAllowedTypes({ ttsUsable: false })
    expect(types).not.toContain('listening')
    expect(types).toContain('spelling')
  })

  it('与降级链协同：无发音时听音题降级为认词', () => {
    const types = computeAllowedTypes({ ttsUsable: false })
    expect(downgradeQuestionType('listening', types)).toBe('recognition')
    expect(downgradeQuestionType('spelling', types)).toBe('spelling')
  })
})
