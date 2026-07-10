import { defineConfig } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}/word-pop/`

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
