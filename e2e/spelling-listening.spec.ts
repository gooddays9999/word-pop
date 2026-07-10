import { expect, test } from '@playwright/test'
import { buildSeededSaveJson, meaningOf, playSessionToResults, seedSave, firstSense } from './helpers'

const TODAY = '2026-08-10'

test('拼写题：box4 词出拼写，提示字母扣金币', async ({ page }) => {
  // 预置 3 个 box4（拼写阶段）单词今日到期，携带 100 金币
  await seedSave(
    page,
    buildSeededSaveJson(
      [
        { id: 'school', box: 4 },
        { id: 'teacher', box: 4 },
        { id: 'library', box: 4 },
      ],
      TODAY,
    ),
  )
  await page.goto(`./?day=${TODAY}&fast=1`)
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await expect(page.getByTestId('due-count')).toHaveText('3')
  await page.getByTestId('start-review').click()

  // 第一题就是拼写题：有字母槽与输入框
  await expect(page.getByTestId('spelling-input')).toBeVisible()
  await expect(page.getByTestId('letter-slots')).toBeVisible()
  await expect(page.getByTestId('battle-coins')).toContainText('100')

  // 买一个字母提示：金币 100 → 92，首字母亮出
  await page.getByTestId('buy-letter').click()
  await expect(page.getByTestId('battle-coins')).toContainText('92')

  // 全部拼对到结算
  await playSessionToResults(page)
  await expect(page.getByTestId('results')).toContainText('3')
})

test('听音辨词：box3 词出听力题，可重听并按义选出', async ({ page }) => {
  await seedSave(page, buildSeededSaveJson([{ id: 'desk', box: 3 }], TODAY))
  await page.goto(`./?day=${TODAY}&fast=1`)
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await page.getByTestId('start-review').click()

  // 听力题：不显示词形，出现"再听一遍"按钮
  await expect(page.getByTestId('replay-audio')).toBeVisible()
  await expect(page.getByTestId('prompt')).toHaveCount(0)
  await page.getByTestId('replay-audio').click()

  // 依据释义点击正确选项
  const target = firstSense(meaningOf('desk'))
  const options = page.getByTestId('choice-option')
  const count = await options.count()
  for (let i = 0; i < count; i += 1) {
    const label = ((await options.nth(i).getByTestId('choice-label').textContent()) ?? '').trim()
    if (label === target) {
      await options.nth(i).click()
      break
    }
  }
  await expect(page.getByTestId('results')).toBeVisible({ timeout: 10_000 })
})

test('无发音环境（?notts）：听力题自动降级为看词选义', async ({ page }) => {
  await seedSave(page, buildSeededSaveJson([{ id: 'desk', box: 3 }], TODAY))
  await page.goto(`./?day=${TODAY}&fast=1&notts=1`)
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await page.getByTestId('start-review').click()

  // 降级后：词形可见（认词题），没有重听按钮
  await expect(page.getByTestId('prompt')).toHaveText('desk')
  await expect(page.getByTestId('replay-audio')).toHaveCount(0)
})

test('50/50 提示：吹走两个错误选项并扣金币', async ({ page }) => {
  await seedSave(page, buildSeededSaveJson([{ id: 'ruler', box: 1 }], TODAY))
  await page.goto(`./?day=${TODAY}&fast=1`)
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await page.getByTestId('start-review').click()

  await expect(page.getByTestId('battle-coins')).toContainText('100')
  await page.getByTestId('buy-5050').click()
  await expect(page.getByTestId('battle-coins')).toContainText('85')
  // 4 个选项里有 2 个被吹走禁用
  await expect(page.getByTestId('choice-option').locator(':scope:disabled')).toHaveCount(2)
})
