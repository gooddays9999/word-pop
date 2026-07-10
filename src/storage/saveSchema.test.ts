import { describe, expect, it } from 'vitest'
import { deserializeSave, serializeSave, saveFileV1Schema } from './saveSchema'
import { createInitialSave } from '../engine/save'
import { GRADUATED } from '../types/progress'
import type { SaveData } from '../types/save'
import { TODAY } from '../test/fixtures'

const NOW_ISO = '2026-07-10T08:00:00.000Z'

function sampleSave(): SaveData {
  const base = createInitialSave(TODAY, NOW_ISO)
  return {
    ...base,
    player: { xp: 120, level: 2, coins: 33, streak: { current: 3, best: 5, lastActiveDay: TODAY } },
    wordProgress: {
      apple: {
        wordId: 'apple',
        box: 2,
        box0Hits: 0,
        dueDay: '2026-07-12',
        lastDay: TODAY,
        wrongCount: 1,
        correctCount: 4,
        introducedDay: '2026-07-01',
      },
      run: {
        wordId: 'run',
        box: GRADUATED,
        box0Hits: 0,
        dueDay: '2026-07-01',
        lastDay: null,
        wrongCount: 0,
        correctCount: 9,
        introducedDay: '2026-06-01',
      },
    },
    levelProgress: { 'school-1': { stars: 3, completedDay: TODAY } },
    stats: { dailyLog: { [TODAY]: { reviews: 10, news: 5, correct: 12, wrong: 3 } } },
  }
}

describe('serializeSave / deserializeSave', () => {
  it('往返无损（含毕业盒子与 null lastDay）', () => {
    const save = sampleSave()
    const file = serializeSave(save)
    expect(file.version).toBe(1)
    expect(saveFileV1Schema.safeParse(file).success).toBe(true)
    expect(deserializeSave(file)).toEqual(save)
  })

  it('序列化后的 JSON 往返仍可解析（模拟 localStorage 存取）', () => {
    const save = sampleSave()
    const roundtrip = JSON.parse(JSON.stringify(serializeSave(save)))
    const parsed = saveFileV1Schema.safeParse(roundtrip)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(deserializeSave(parsed.data)).toEqual(save)
    }
  })
})

describe('saveFileV1Schema', () => {
  it('拒绝非法盒子编号与缺字段', () => {
    const file = serializeSave(sampleSave())
    const badBox = {
      ...file,
      wordProgress: { apple: [9, 0, TODAY, '', 0, 0, TODAY] },
    }
    expect(saveFileV1Schema.safeParse(badBox).success).toBe(false)
    const missingPlayer = { ...file, player: undefined }
    expect(saveFileV1Schema.safeParse(missingPlayer).success).toBe(false)
  })
})
