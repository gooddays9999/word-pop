import type { Page } from '@playwright/test'
import compiledWords from '../src/data/words.compiled.json' with { type: 'json' }

interface CompiledWord {
  readonly word: string
  readonly meaning: string
}

const SENSE_SEPARATOR = /[；;，,、]/

export function firstSense(meaning: string): string {
  return (meaning.split(SENSE_SEPARATOR)[0] ?? meaning).trim()
}

const WORDS = compiledWords as readonly CompiledWord[]
const senseByWord = new Map(WORDS.map((entry) => [entry.word, firstSense(entry.meaning)]))
const wordByMeaning = new Map(WORDS.map((entry) => [entry.meaning, entry.word]))
const wordByFirstSense = new Map<string, string>()
for (const entry of WORDS) {
  const sense = firstSense(entry.meaning)
  if (!wordByFirstSense.has(sense)) wordByFirstSense.set(sense, entry.word)
}

export function meaningOf(word: string): string {
  const found = WORDS.find((entry) => entry.word === word)
  if (!found) throw new Error(`词库中没有 ${word}`)
  return found.meaning
}

/** 读取当前选择题并点击正确选项（依据编译词库推导答案） */
export async function answerCurrentQuestion(page: Page): Promise<void> {
  const prompt = ((await page.getByTestId('prompt').textContent()) ?? '').trim()
  const isEnglishPrompt = /^[A-Za-z]/.test(prompt)
  const target = isEnglishPrompt ? senseByWord.get(prompt) : wordByMeaning.get(prompt)
  if (!target) throw new Error(`词库中找不到题目对应答案: "${prompt}"`)

  const options = page.getByTestId('choice-option')
  const count = await options.count()
  for (let i = 0; i < count; i += 1) {
    const label = ((await options.nth(i).getByTestId('choice-label').textContent()) ?? '').trim()
    if (label === target) {
      await options.nth(i).click()
      return
    }
  }
  throw new Error(`选项中没有正确答案 "${target}"（题目 "${prompt}"）`)
}

/** 拼写题：由题面释义反查单词并输入提交（点提交按钮，自动等待可用态） */
export async function answerCurrentSpelling(page: Page): Promise<void> {
  const meaning = ((await page.getByTestId('prompt').textContent()) ?? '').trim()
  const target = wordByFirstSense.get(meaning) ?? wordByMeaning.get(meaning)
  if (!target) throw new Error(`词库中找不到拼写答案: "${meaning}"`)
  await page.getByTestId('spelling-input').fill(target)
  await page.getByTestId('spelling-submit').click()
}

/** 自动通关当前会话（教学卡翻页、选择题/拼写题全部答对），直到结算屏 */
export async function playSessionToResults(page: Page, maxSteps = 300): Promise<void> {
  for (let step = 0; step < maxSteps; step += 1) {
    if (
      await page
        .getByTestId('results')
        .isVisible()
        .catch(() => false)
    )
      return

    const teachNext = page.getByTestId('teach-next')
    if (await teachNext.isVisible().catch(() => false)) {
      await teachNext.click()
      continue
    }

    // 一律先 isVisible()（对不存在的元素立即返回 false）；
    // isEnabled() 对不存在的元素会等到 actionTimeout，绝不能用作存在性判断
    const spelling = page.getByTestId('spelling-input')
    if (await spelling.isVisible().catch(() => false)) {
      if (await spelling.isEnabled().catch(() => false)) {
        await answerCurrentSpelling(page)
      }
      await page.waitForTimeout(120)
      continue
    }

    const firstOption = page.getByTestId('choice-option').first()
    if (await firstOption.isVisible().catch(() => false)) {
      if (await firstOption.isEnabled().catch(() => false)) {
        await answerCurrentQuestion(page)
      }
    }
    await page.waitForTimeout(120)
  }
  throw new Error(`会话未在 ${maxSteps} 步内完成`)
}

/** 构造 v1 存档 JSON，用于把单词预置到指定盒子（今日到期） */
export function buildSeededSaveJson(
  words: readonly { id: string; box: number }[],
  today: string,
  coins = 100,
): string {
  const progressTuple = (box: number) => [box, 0, today, '', 0, 0, '2026-07-01']
  return JSON.stringify({
    version: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    player: {
      xp: 500,
      level: 3,
      coins,
      streak: { current: 0, best: 0, lastActiveDay: null },
    },
    settings: { newWordsPerDay: 20, ttsEnabled: true, sfxEnabled: false },
    wordProgress: Object.fromEntries(words.map(({ id, box }) => [id, progressTuple(box)])),
    levelProgress: {},
    stats: { dailyLog: {} },
    lastBackupDay: today,
  })
}

export async function seedSave(page: Page, json: string): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string)
    },
    ['wordpop:save', json],
  )
}
