import { describe, expect, it } from 'vitest'
import { exportSaveText, importSaveText, summarizeSave } from './exportImport'
import { createInitialSave } from '../engine/save'
import { TODAY } from '../test/fixtures'

const NOW_ISO = '2026-07-10T08:00:00.000Z'

describe('exportSaveText / importSaveText', () => {
  it('导出文本可完整导入', () => {
    const save = createInitialSave(TODAY, NOW_ISO)
    const text = exportSaveText(save)
    const result = importSaveText(text)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(save)
  })

  it('垃圾文本返回中文错误信息', () => {
    const result = importSaveText('这不是 JSON')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
  })

  it('结构不符的 JSON 返回错误', () => {
    const result = importSaveText(JSON.stringify({ hello: 'world' }))
    expect(result.ok).toBe(false)
  })
})

describe('summarizeSave', () => {
  it('汇总学习词数与最后活跃日', () => {
    const base = createInitialSave(TODAY, NOW_ISO)
    const save = {
      ...base,
      player: { ...base.player, streak: { current: 1, best: 3, lastActiveDay: TODAY } },
      wordProgress: {
        a: { wordId: 'a', box: 1, box0Hits: 0, dueDay: TODAY, lastDay: TODAY, wrongCount: 0, correctCount: 2, introducedDay: TODAY },
        b: { wordId: 'b', box: 0, box0Hits: 1, dueDay: TODAY, lastDay: TODAY, wrongCount: 0, correctCount: 1, introducedDay: TODAY },
      },
    } as typeof base
    const summary = summarizeSave(save)
    expect(summary.introducedWords).toBe(2)
    expect(summary.learnedWords).toBe(1)
    expect(summary.lastActiveDay).toBe(TODAY)
  })
})
