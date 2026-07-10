import { expect, test } from '@playwright/test'

test('每日新词量最高可选 200，首页额度同步', async ({ page }) => {
  await page.goto('./?day=2026-08-20')
  await page.getByRole('button', { name: /开始冒险/ }).click()
  await page.getByRole('button', { name: /设置/ }).click()

  // 六档可选，最高 200
  await expect(page.getByTestId('pace-10')).toBeVisible()
  await expect(page.getByTestId('pace-200')).toBeVisible()
  await page.getByTestId('pace-200').click()

  // 回基地：今日新词额度变为 200
  await page.getByRole('button', { name: /返回/ }).click()
  await expect(page.locator('main')).toContainText('/ 200 今日新词额度')

  // 刷新后设置仍在（已持久化；未学词时标题按钮仍是"开始冒险"）
  await page.reload()
  await page.getByRole('button', { name: /冒险/ }).click()
  await expect(page.locator('main')).toContainText('/ 200 今日新词额度')
})
