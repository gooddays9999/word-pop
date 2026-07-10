import { expect, test } from '@playwright/test'
import { playSessionToResults } from './helpers'

/** 三"天"复习循环：学习 → 次日复习涨连击 → 断签一天后连击归 1 */
test('多天循环：复习按期到来，断签后连续天数重置', async ({ page }) => {
  test.setTimeout(180_000)

  // 第 1 天：学完第一关
  await page.goto('./?day=2026-08-01&fast=1')
  await page.getByRole('button', { name: /开始冒险/ }).click()
  await page.getByTestId('go-map').click()
  await page.getByTestId('level-school-1').click()
  await playSessionToResults(page)
  await page.getByTestId('back-home').click()
  await expect(page.getByTestId('streak')).toHaveText('1')

  // 第 2 天：20 词到期，复习后连续 2 天
  await page.goto('./?day=2026-08-02&fast=1')
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await expect(page.getByTestId('due-count')).toHaveText('20')
  await page.getByTestId('start-review').click()
  await playSessionToResults(page)
  await page.getByTestId('back-home').click()
  await expect(page.getByTestId('streak')).toHaveText('2')
  await expect(page.getByTestId('due-count')).toHaveText('0')

  // 第 4 天（跳过第 3 天）：box2 的词到期；断签后连续天数归 1
  await page.goto('./?day=2026-08-04&fast=1')
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await expect(page.getByTestId('due-count')).toHaveText('20')
  await page.getByTestId('start-review').click()
  await playSessionToResults(page)
  await page.getByTestId('back-home').click()
  await expect(page.getByTestId('streak')).toHaveText('1')
})
