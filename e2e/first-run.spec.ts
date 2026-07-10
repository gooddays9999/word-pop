import { expect, test } from '@playwright/test'
import { playSessionToResults } from './helpers'

const DAY_ONE = '2026-07-10'
const DAY_TWO = '2026-07-11'

test('首跑闭环：学 20 词 → 三星过关 → 刷新持久 → 次日出现复习', async ({ page }) => {
  test.setTimeout(150_000)

  // 第 1 天：新玩家进入第一关
  await page.goto(`./?day=${DAY_ONE}&fast=1`)
  await page.getByRole('button', { name: /开始冒险/ }).click()
  await page.getByTestId('go-map').click()
  await page.getByTestId('level-school-1').click()

  // 教学 + 全部答对（每个新词两连对）
  await playSessionToResults(page)
  const results = page.getByTestId('results')
  await expect(results).toContainText('关卡完成')
  await expect(results).toContainText('⭐⭐⭐')
  await expect(results).toContainText('新收集 20 张图鉴卡')

  await page.getByTestId('back-home').click()
  await expect(page.locator('header')).toContainText('20/100')
  await expect(page.getByTestId('due-count')).toHaveText('0')

  // 刷新后进度仍在
  await page.reload()
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await expect(page.locator('header')).toContainText('20/100')

  // 地图上第一关已完成、第二关解锁
  await page.getByTestId('go-map').click()
  await expect(page.getByTestId('level-school-1')).toContainText('⭐⭐⭐')
  await expect(page.getByTestId('level-school-2')).toContainText('可挑战')

  // 第 2 天：昨天学的 20 词到期复习
  await page.goto(`./?day=${DAY_TWO}&fast=1`)
  await page.getByRole('button', { name: /继续冒险/ }).click()
  await expect(page.getByTestId('due-count')).toHaveText('20')

  // 打复习副本：全部答对后到期清零
  await page.getByTestId('start-review').click()
  await playSessionToResults(page)
  await expect(page.getByTestId('results')).toContainText('20')
  await page.getByTestId('back-home').click()
  await expect(page.getByTestId('due-count')).toHaveText('0')
})
