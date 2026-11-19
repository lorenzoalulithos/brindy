import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'

/** Game ids in Home-grid order, read from the registry source at test time (no app code is imported into node). */
export function gameIds(): string[] {
  const src = readFileSync(fileURLToPath(new URL('../src/games/registry.ts', import.meta.url)), 'utf8')
  const body = src.slice(src.indexOf('export const GAMES'))
  return [...body.matchAll(/^ {4}id: '([a-z0-9-]+)'/gm)].map((m) => m[1])
}

export const PLAYERS = [
  { id: 'p1', name: 'Anna', color: '#ff3d8b' },
  { id: 'p2', name: 'Marco', color: '#3dd6ff' },
  { id: 'p3', name: 'Giulia', color: '#ffd23d' },
  { id: 'p4', name: 'Luca', color: '#7b5cff' },
]

/** Date after every drip release so all games are playable in the production build. */
const FAKE_NOW = Date.parse('2027-01-15T20:00:00')

/**
 * Prepares a page: shifts the clock forward (timers keep running normally), pre-seeds the
 * persisted store once per tab, and records console errors / page errors.
 */
export async function setup(page: Page, opts: { seed?: boolean; state?: Record<string, unknown> } = {}) {
  const seed = opts.seed ?? true
  const state = {
    ageOk: true,
    onboarded: true,
    lang: 'it',
    penaltyMode: 'sips',
    spicy: false,
    sound: false,
    vibration: false,
    lowPower: false,
    players: PLAYERS,
    adsRemoved: true,
    ...opts.state,
  }
  await page.addInitScript(
    ({ offset, seed, state }) => {
      const RealDate = Date
      class ShiftedDate extends RealDate {
        constructor(...args: ConstructorParameters<typeof Date> | []) {
          if (args.length === 0) super(RealDate.now() + offset)
          else super(...(args as ConstructorParameters<typeof Date>))
        }
        static now() {
          return RealDate.now() + offset
        }
      }
      globalThis.Date = ShiftedDate as DateConstructor
      if (seed && !sessionStorage.getItem('__seeded')) {
        localStorage.setItem('brindy', JSON.stringify({ state, version: 0 }))
        sessionStorage.setItem('__seeded', '1')
      }
    },
    { offset: FAKE_NOW - Date.now(), seed, state },
  )

  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  return {
    errors,
    expectNoErrors(context: string) {
      expect(errors, `errors during ${context}`).toEqual([])
    },
  }
}

export const home = (page: Page) => page.locator('h1.logo')

/** Performs the game's main action: an open setup sheet first, else the primary HUD button, else a tap on the 3D scene. */
export async function mainAction(page: Page) {
  const sheetBtn = page.locator('.game .backdrop .btn:not([disabled])').last()
  if (await sheetBtn.isVisible().catch(() => false)) {
    await sheetBtn.click()
    return 'sheet'
  }
  const hudBtn = page.locator('.game .hud-bottom button.btn:not([disabled])').last()
  if (await hudBtn.isVisible().catch(() => false)) {
    await hudBtn.click()
    return 'button'
  }
  const vp = page.viewportSize()!
  await page.mouse.click(vp.width / 2, vp.height * 0.4)
  return 'tap'
}
