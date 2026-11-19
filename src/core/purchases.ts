import type { CustomerInfo, PRODUCT_CATEGORY, PurchasesStoreProduct } from '@revenuecat/purchases-capacitor'
import { useApp } from './store'
import { FOREVER } from './ads'
import { isNativePlatform } from './native'

/**
 * In-app purchases via RevenueCat (native only). The web build keeps the old
 * behaviour: "unlock forever" / "remove ads" grant immediately (prototype stubs).
 *
 * RevenueCat setup (see README → "Monetization"):
 * - entitlements: `no_ads`, `pass` (all packs + no ads), and `pack_<packId>` for each id in PACK_IDS;
 * - products (non-consumable): see `productId()` below, each attached to its entitlement;
 * - `pass` entitlement: auto-renewing subscriptions `brindy.pass_monthly` and `brindy.pass_yearly`.
 * The SDK is loaded with dynamic import() so it never lands in the web bundle.
 */

/** Every pack id used with usePack()/PackLockSheet in the games. Add new ones here. */
export const PACK_IDS = [
  // per-game spicy packs
  'bottle-spicy',
  'mostlikely-spicy',
  'neverhave-spicy',
  'truthdare-spicy',
  'wheel-spicy',
  // shared premium packs (PACKS in src/core/kit.ts)
  'couples',
  'party-bachelor',
  'office',
] as const

export type PassSku = 'pass_monthly' | 'pass_yearly'
export type Sku = 'no_ads' | PassSku | `pack_${string}`

const isPass = (sku: Sku): sku is PassSku => sku.startsWith('pass_')

/** Web stub / native fallback: what owning the pass unlocks locally. */
function grantPass() {
  const s = useApp.getState()
  for (const id of PACK_IDS) s.unlock(id, FOREVER)
  s.setAdsRemoved(true)
  s.setPass(true)
}

/** Store product id for a SKU. Apple/Google only allow letters, digits, `_` and `.`. */
export const productId = (sku: Sku) => `brindy.${sku.replace(/-/g, '_')}`

const native = isNativePlatform
const platform = () => (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() ?? 'web'

type RC = typeof import('@revenuecat/purchases-capacitor')
let rcPromise: Promise<RC | null> | null = null

/** Lazily loads and configures RevenueCat once. Resolves null on web or without an API key. */
function rc(): Promise<RC | null> {
  rcPromise ??= (async () => {
    if (!native()) return null
    const apiKey = (platform() === 'ios' ? import.meta.env.VITE_RC_IOS_KEY : import.meta.env.VITE_RC_ANDROID_KEY) as string | undefined
    if (!apiKey) {
      console.warn('[purchases] missing VITE_RC_IOS_KEY / VITE_RC_ANDROID_KEY: purchases disabled')
      return null
    }
    try {
      const mod = await import('@revenuecat/purchases-capacitor')
      await mod.Purchases.configure({ apiKey })
      await mod.Purchases.addCustomerInfoUpdateListener(applyEntitlements)
      return mod
    } catch (e) {
      console.warn('[purchases] configure failed', e)
      rcPromise = null
      return null
    }
  })()
  return rcPromise
}

/** Mirrors the active entitlements into the local store (grants and revokes "forever" unlocks). */
function applyEntitlements(info: CustomerInfo) {
  const active = new Set(Object.keys(info.entitlements.active))
  const pass = active.has('pass')
  const s = useApp.getState()
  for (const id of PACK_IDS) {
    const owned = pass || active.has(`pack_${id}`)
    const current = s.unlocks[id] ?? 0
    if (owned && current < FOREVER) s.unlock(id, FOREVER)
    // Revoke only purchase-granted unlocks (refunds); keep "tonight" rewarded unlocks.
    else if (!owned && current >= FOREVER) s.unlock(id, 0)
  }
  const noAds = pass || active.has('no_ads')
  if (noAds !== s.adsRemoved) s.setAdsRemoved(noAds)
  if (pass !== s.pass) s.setPass(pass)
}

/** Call once at startup: syncs entitlements in the background (no-op on web). */
export function initPurchases() {
  if (!native()) return
  void rc().then(async (mod) => {
    if (!mod) return
    try {
      const { customerInfo } = await mod.Purchases.getCustomerInfo()
      applyEntitlements(customerInfo)
    } catch (e) {
      console.warn('[purchases] getCustomerInfo failed', e)
    }
  })
}

const products = new Map<Sku, PurchasesStoreProduct>()
async function product(mod: RC, sku: Sku): Promise<PurchasesStoreProduct | null> {
  const cached = products.get(sku)
  if (cached) return cached
  const type = (isPass(sku) ? 'SUBSCRIPTION' : 'NON_SUBSCRIPTION') as PRODUCT_CATEGORY
  const { products: list } = await mod.Purchases.getProducts({ productIdentifiers: [productId(sku)], type })
  const p = list[0] ?? null
  if (p) products.set(sku, p)
  return p
}

/** Localized store price (e.g. "2,99 €"), or null on web / when unavailable. */
export async function priceOf(sku: Sku): Promise<string | null> {
  const mod = await rc()
  if (!mod) return null
  try {
    return (await product(mod, sku))?.priceString ?? null
  } catch {
    return null
  }
}

export type PurchaseResult = 'ok' | 'cancelled' | 'error'
let inFlight: Promise<PurchaseResult> | null = null

/** Buys a SKU. Native: store purchase, entitlements applied on success. Web: grants immediately (stub). */
export function purchase(sku: Sku): Promise<PurchaseResult> {
  // Drunk users double-tap: never open two store sheets.
  inFlight ??= (async (): Promise<PurchaseResult> => {
    if (!native()) {
      if (isPass(sku)) grantPass()
      else if (sku === 'no_ads') useApp.getState().setAdsRemoved(true)
      else useApp.getState().unlock(sku.slice('pack_'.length), FOREVER)
      return 'ok'
    }
    const mod = await rc()
    if (!mod) return 'error'
    try {
      const p = await product(mod, sku)
      if (!p) return 'error'
      const { customerInfo } = await mod.Purchases.purchaseStoreProduct({ product: p })
      applyEntitlements(customerInfo)
      return 'ok'
    } catch (e) {
      return (e as { userCancelled?: boolean | null }).userCancelled ? 'cancelled' : 'error'
    }
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}

/** Number of active entitlements after restoring, or null when the platform has no store (web). */
export async function restorePurchases(): Promise<number | null> {
  const mod = await rc()
  if (!mod) return null
  const { customerInfo } = await mod.Purchases.restorePurchases()
  applyEntitlements(customerInfo)
  return Object.keys(customerInfo.entitlements.active).length
}
