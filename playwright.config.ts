import { defineConfig } from '@playwright/test'

const PORT = 5288
const OUT_DIR = 'node_modules/.e2e-dist'

/**
 * Smoke tests against the production build (own server on 5288, own headless Chromium).
 * Never touches the dev server (5199) or the shared MCP browser.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Software WebGL is CPU-heavy: keep parallelism modest so frames still get rendered.
  workers: 3,
  retries: 0,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'it-IT',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Headless WebGL via SwiftShader so the three.js canvases really render.
      args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium' } }],
  webServer: {
    // Own output dir (git/eslint-ignored) so a run never clobbers dist/ while others build or test.
    command: `npx tsc -b && npx vite build --outDir ${OUT_DIR} --emptyOutDir && npx vite preview --outDir ${OUT_DIR} --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
