import { expect, test } from '@playwright/test'

test('导出备份 → 重置 → 导入恢复', async ({ page }) => {
  await page.goto('./?day=2026-07-10')
  await page.getByRole('button', { name: /开始冒险/ }).click()
  await page.getByRole('button', { name: /设置/ }).click()

  // 导出备份文件
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: /导出备份/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/word-pop-backup-.*\.json/)
  const backupPath = await download.path()
  expect(backupPath).toBeTruthy()

  // 重置进度（回到标题屏）
  await page.getByRole('button', { name: /重置全部进度/ }).click()
  await page.getByRole('button', { name: /确认重置/ }).click()
  await expect(page.getByRole('button', { name: /开始冒险/ })).toBeVisible()

  // 导入刚才的备份
  await page.getByRole('button', { name: /开始冒险/ }).click()
  await page.getByRole('button', { name: /设置/ }).click()
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(backupPath as string)
  await page.getByRole('button', { name: /确认导入/ }).click()
  await expect(page.getByText('导入成功')).toBeVisible()
})
