import { expect, test, type Page } from '@playwright/test'
import { gameIds, home, mainAction, PLAYERS, setup } from './helpers'

const IDS = gameIds()

async function openGame(page: Page, id: string, s?: { expectNoErrors: (ctx: string) => void }) {
  const index = IDS.indexOf(id)
  await page.locator('.game-grid .game-card:not(.suggest)').nth(index).click()
  // Either the scene mounts or the error boundary shows: report captured errors first, they explain the crash.
  await expect(page.locator('.game canvas').or(page.getByRole('heading', { name: 'Oops!' })).first()).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1500)
  s?.expectNoErrors(`${id} load`)
  await expect(page.getByRole('heading', { name: 'Oops!' })).toHaveCount(0)
  await expect(page.locator('.game-hud')).toBeVisible()
}

async function expectGameAlive(page: Page) {
  await expect(page.getByRole('heading', { name: 'Oops!' })).toHaveCount(0)
  await expect(page.locator('.game-hud .topbar')).toBeVisible()
}

async function backHome(page: Page) {
  await page.locator('.game-hud .topbar button[aria-label="Indietro"]').click()
  await expect(home(page)).toBeVisible()
}

test('registry lists games', () => {
  expect(IDS.length).toBeGreaterThanOrEqual(10)
})

test.describe('every game', () => {
  for (const id of IDS) {
    test(`${id}: opens, main action, back`, async ({ page }) => {
      const s = await setup(page)
      await page.goto('/')
      await expect(home(page)).toBeVisible()
      await openGame(page, id, s)
      const how = await mainAction(page)
      await page.waitForTimeout(3000)
      s.expectNoErrors(`${id} main action (${how})`)
      await expectGameAlive(page)
      await backHome(page)
      s.expectNoErrors(`${id} exit`)
    })
  }
})

test('age gate: deny, then accept, then onboarding', async ({ page }) => {
  const s = await setup(page, { seed: false })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Hai almeno 18 anni?' })).toBeVisible()
  await page.getByRole('button', { name: 'No', exact: true }).click()
  await expect(page.getByText('Torna quando sarai maggiorenne')).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Sì, ho 18+ anni' }).click()
  // First run: players step, then penalty-mode step.
  await expect(page.getByRole('heading', { name: 'Chi gioca stasera?' })).toBeVisible()
  const next = page.getByRole('button', { name: /Avanti/ })
  await expect(next).toBeDisabled()
  await page.getByRole('button', { name: '+ Il Capitano' }).click()
  await page.getByRole('button', { name: '+ La Regina' }).click()
  await expect(next).toBeEnabled()
  await next.click()
  await page.getByRole('button', { name: /Analcolico/ }).first().click()
  await expect(home(page)).toBeVisible()
  await expect(page.locator('button.players-bar')).toContainText('Il Capitano · La Regina')
  // Persisted: no gate / onboarding after a reload.
  await page.reload()
  await expect(home(page)).toBeVisible()
  s.expectNoErrors('age gate + onboarding')
})

test('onboarding can be skipped', async ({ page }) => {
  await setup(page, { state: { onboarded: false, players: [] } })
  await page.goto('/')
  await page.getByRole('button', { name: 'Salta' }).click()
  await page.getByRole('button', { name: /Sorsi/ }).first().click()
  await expect(home(page)).toBeVisible()
})

test('age gate: language switch', async ({ page }) => {
  await setup(page, { seed: false })
  await page.goto('/')
  await page.getByRole('button', { name: /English/ }).click()
  await expect(page.getByRole('heading', { name: 'Are you 18 or older?' })).toBeVisible()
})

test('players: add, ignore empty, remove', async ({ page }) => {
  const s = await setup(page)
  await page.goto('/')
  await page.locator('button.players-bar').click()
  const input = page.getByPlaceholder('Nome')
  const items = page.locator('.list .list-item')
  await expect(items).toHaveCount(PLAYERS.length)
  await page.getByRole('button', { name: 'Aggiungi giocatore' }).click()
  await expect(items).toHaveCount(PLAYERS.length)
  await input.fill('Zoe')
  await input.press('Enter')
  await expect(items).toHaveCount(PLAYERS.length + 1)
  await expect(items.last()).toContainText('Zoe')
  await items.last().getByRole('button').click()
  await expect(items).toHaveCount(PLAYERS.length)
  await page.getByRole('button', { name: 'Chiudi' }).click()
  await expect(home(page)).toBeVisible()
  await expect(page.locator('button.players-bar')).toContainText('Anna · Marco · Giulia · Luca')
  s.expectNoErrors('players')
})

test('players: game needing players redirects to the players screen', async ({ page }) => {
  const s = await setup(page, { state: { players: [] } })
  await page.goto('/')
  // ringoffire needs 2+ players
  await page.locator('.game-grid .game-card:not(.suggest)').nth(IDS.indexOf('ringoffire')).click()
  await expect(page.getByText('Servono almeno 2 giocatori')).toBeVisible()
  const go = page.locator('.screen > .btn.block')
  await expect(go).toBeDisabled()
  for (const n of ['Uno', 'Due']) {
    await page.getByPlaceholder('Nome').fill(n)
    await page.getByPlaceholder('Nome').press('Enter')
  }
  await expect(go).toBeEnabled()
  await go.click()
  await expect(page.locator('.game canvas').first()).toBeVisible({ timeout: 20_000 })
  s.expectNoErrors('players redirect')
})

test('settings: penalty modes, toggles, language', async ({ page }) => {
  const s = await setup(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Impostazioni' }).click()
  for (const label of ['🥤 Analcolico (punti)', '😈 Penitenze', '🍺 Sorsi']) {
    const chip = page.getByRole('button', { name: label })
    await chip.click()
    await expect(chip).toHaveClass(/active/)
  }
  const switches = page.getByRole('switch')
  const n = await switches.count()
  expect(n).toBeGreaterThanOrEqual(4)
  for (let i = 0; i < n; i++) {
    const sw = switches.nth(i)
    const before = await sw.getAttribute('aria-checked')
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', before ?? 'false')
  }
  await page.getByRole('button', { name: /English/ }).click()
  await expect(page.getByRole('heading', { name: /Settings/ })).toBeVisible()
  await page.getByRole('button', { name: /Italiano/ }).click()
  await expect(page.getByRole('heading', { name: /Impostazioni/ })).toBeVisible()
  s.expectNoErrors('settings')
})

for (const [mode, label, pattern] of [
  ['points', '🥤 Analcolico (punti)', /punt/i],
  ['dares', '😈 Penitenze', /penitenz|tutti fanno/i],
] as const) {
  test(`penalty mode "${mode}" set in Settings reaches a game`, async ({ page }) => {
    // Headless SwiftShader draws the full-quality bottle at ~4-5 fps, below the physics' 10 fps real-time floor;
    // low-power mode (~12 fps here) keeps the spin real-time (~5 s) and also exercises that render path.
    const s = await setup(page, { state: { lowPower: true } })
    await page.goto('/')
    await page.getByRole('button', { name: 'Impostazioni' }).click()
    await page.getByRole('button', { name: label }).click()
    await page.locator('.topbar .icon-btn').first().click()
    await expect(home(page)).toBeVisible()
    // The bottle always shows a penalty line (penalty or price for refusing).
    await openGame(page, 'bottle', s)
    await page.locator('.game .hud-bottom button.btn').last().click()
    const card = page.locator('.game .result')
    await expect(card).toBeVisible({ timeout: 20_000 })
    await expect(card).toContainText(pattern)
    await expect(card).not.toContainText(/sors/i)
    s.expectNoErrors(`bottle in ${mode} mode`)
  })
}

test('submit: validation gates the send button', async ({ page }) => {
  const s = await setup(page)
  await page.goto('/')
  await page.locator('.game-card.suggest').click()
  const send = page.getByRole('button', { name: /Invia proposta/ })
  await expect(send).toBeDisabled()
  await expect(page.getByText('Compila nome e regole')).toBeVisible()
  const name = page.locator('label.field', { hasText: 'Nome del gioco' }).locator('input')
  const rules = page.locator('label.field', { hasText: 'Regole' }).locator('textarea')
  await name.fill('Il gioco del tappo')
  await rules.fill('troppo corte')
  await expect(send).toBeDisabled()
  await rules.fill('Si lancia un tappo nel bicchiere, chi fa centro sceglie chi beve. Chi sbaglia due volte paga.')
  await expect(send).toBeDisabled()
  await page.getByRole('checkbox').check()
  await expect(send).toBeEnabled()
  await expect(page.getByText('Compila nome e regole')).toHaveCount(0)
  await name.fill('')
  await expect(send).toBeDisabled()
  s.expectNoErrors('submit')
})

test('party mix opens a game', async ({ page }) => {
  const s = await setup(page)
  await page.goto('/')
  await page.getByRole('button', { name: /Party Mix/ }).click()
  await expect(page.locator('.game canvas').first()).toBeVisible({ timeout: 20_000 })
  await page.waitForTimeout(1500)
  await expectGameAlive(page)
  s.expectNoErrors('party mix')
})
