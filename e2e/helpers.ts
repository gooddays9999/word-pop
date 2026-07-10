import type { Page } from '@playwright/test'
import compiledWords from '../src/data/words.compiled.json' with { type: 'json' }

interface CompiledWord {
  readonly word: string
  readonly meaning: string
}

const SENSE_SEPARATOR = /[；;，,、]/

function firstSense(meaning: string): string {
  return (meaning.split(SENSE_SEPARATOR)[0] ?? meaning).trim()
}

const WORDS = compiledWords as readonly CompiledWord[]
const senseByWord = new Map(WORDS.map((entry) => [entry.word, firstSense(entry.meaning)]))
const wordByMeaning = new Map(WORDS.map((entry) => [entry.meaning, entry.word]))

/** 读取当前题目并点击正确选项（依据编译词库推导答案） */
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

/** 自动通关当前会话（教学卡直接翻页，题目全部答对），直到结算屏 */
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

    const firstOption = page.getByTestId('choice-option').first()
    const canAnswer = await firstOption.isEnabled().catch(() => false)
    if (canAnswer) {
      await answerCurrentQuestion(page)
    }
    await page.waitForTimeout(120)
  }
  throw new Error(`会话未在 ${maxSteps} 步内完成`)
}
