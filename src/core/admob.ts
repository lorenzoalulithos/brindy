import type { PluginListenerHandle } from '@capacitor/core'
import type { MaxAdContentRating } from '@capacitor-community/admob'
import { useApp } from './store'
import { isNativePlatform } from './native'

/**
 * Native ads via @capacitor-community/admob (iOS/Android only).
 * - Loaded with dynamic import() so the plugin never lands in the web bundle.
 * - Initialised lazily once, after the 18+ age gate: ATT prompt (iOS) → UMP consent (TCF v2.2) → preload.
 * - Ad unit ids come from VITE_ADMOB_*; without them Google's public TEST units are used (see README).
 */

type AdMobModule = typeof import('@capacitor-community/admob')

// The plugin's event/status enums are type-only in this version (not exported at runtime): use their string values.
const EV = {
  interstitialDismissed: 'interstitialAdDismissed',
  interstitialFailedToShow: 'interstitialAdFailedToShow',
  rewarded: 'onRewardedVideoAdReward',
  rewardDismissed: 'onRewardedVideoAdDismissed',
  rewardFailedToShow: 'onRewardedVideoAdFailedToShow',
}

const platform = () => (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor?.getPlatform?.() ?? 'web'

const TEST_IDS = {
  ios: { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
  android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
}

const env = import.meta.env
function adIds() {
  const ios = platform() === 'ios'
  const interstitial = (ios ? env.VITE_ADMOB_IOS_INTERSTITIAL : env.VITE_ADMOB_ANDROID_INTERSTITIAL) as string | undefined
  const rewarded = (ios ? env.VITE_ADMOB_IOS_REWARDED : env.VITE_ADMOB_ANDROID_REWARDED) as string | undefined
  const test = TEST_IDS[ios ? 'ios' : 'android']
  return {
    interstitial: interstitial || test.interstitial,
    rewarded: rewarded || test.rewarded,
    // Test units always serve test ads; VITE_ADMOB_TESTING=1 also flags real units as test requests (for device testing).
    testing: !interstitial || !rewarded || env.VITE_ADMOB_TESTING === '1',
  }
}

export const isNativeAds = isNativePlatform

let ready: Promise<AdMobModule | null> | null = null
let interstitialLoaded = false

/** Waits for the age gate, then initialises AdMob + consent once. Never rejects. */
export function initAds(): Promise<AdMobModule | null> {
  ready ??= (async () => {
    if (!isNativeAds()) return null
    await new Promise<void>((resolve) => {
      if (useApp.getState().ageOk) return resolve()
      const unsub = useApp.subscribe((s) => {
        if (s.ageOk) {
          unsub()
          resolve()
        }
      })
    })
    try {
      const mod = await import('@capacitor-community/admob')
      const { AdMob } = mod
      const { testing } = adIds()
      await AdMob.initialize({
        initializeForTesting: testing,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: 'MatureAudience' as MaxAdContentRating,
      })
      // iOS: App Tracking Transparency first (no-op on Android / older iOS).
      const att = await AdMob.trackingAuthorizationStatus()
      if (att.status === 'notDetermined') await AdMob.requestTrackingAuthorization()
      // UMP / TCF consent, refreshed at every launch.
      const info = await AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false })
      if (info.status === 'REQUIRED' && info.isConsentFormAvailable) await AdMob.showConsentForm()
      void preloadInterstitial(mod)
      return mod
    } catch (e) {
      console.warn('[ads] init failed', e)
      return null
    }
  })()
  return ready
}

async function canRequestAds(mod: AdMobModule) {
  try {
    return (await mod.AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false })).canRequestAds
  } catch {
    return false
  }
}

async function preloadInterstitial(mod: AdMobModule) {
  if (interstitialLoaded || !(await canRequestAds(mod))) return
  const { interstitial, testing } = adIds()
  try {
    await mod.AdMob.prepareInterstitial({ adId: interstitial, isTesting: testing })
    interstitialLoaded = true
  } catch {
    interstitialLoaded = false
  }
}

/** Resolves once `event` fires (or `fallback` ms pass), then removes the listeners. */
function onceAny(mod: AdMobModule, events: string[], fallbackMs: number): Promise<string> {
  return new Promise((resolve) => {
    const handles: Promise<PluginListenerHandle>[] = []
    let done = false
    const finish = (ev: string) => {
      if (done) return
      done = true
      clearTimeout(timer)
      handles.forEach((h) => void h.then((x) => x.remove()))
      resolve(ev)
    }
    const timer = setTimeout(() => finish('timeout'), fallbackMs)
    // The plugin's typed overloads are per-event; a loose call keeps this helper generic.
    const add = mod.AdMob.addListener as unknown as (ev: string, fn: () => void) => Promise<PluginListenerHandle>
    for (const ev of events) handles.push(add(ev, () => finish(ev)))
  })
}

/** Shows a native interstitial if one is loaded. Resolves true if it was shown (after it's dismissed). */
export async function showNativeInterstitial(): Promise<boolean> {
  const mod = await initAds()
  if (!mod) return false
  if (!interstitialLoaded) {
    void preloadInterstitial(mod)
    return false
  }
  const closed = onceAny(mod, [EV.interstitialDismissed, EV.interstitialFailedToShow], 120_000)
  interstitialLoaded = false
  try {
    await mod.AdMob.showInterstitial()
  } catch {
    void preloadInterstitial(mod)
    return false
  }
  const ev = await closed
  void preloadInterstitial(mod)
  return ev === EV.interstitialDismissed
}

/** Loads and shows a rewarded video. Resolves true only if the reward event fired. */
export async function showNativeRewarded(): Promise<boolean> {
  const mod = await initAds()
  if (!mod || !(await canRequestAds(mod))) return false
  const { rewarded, testing } = adIds()
  let earned = false
  const add = mod.AdMob.addListener as unknown as (ev: string, fn: () => void) => Promise<PluginListenerHandle>
  const rewardHandle = add(EV.rewarded, () => {
    earned = true
  })
  try {
    await mod.AdMob.prepareRewardVideoAd({ adId: rewarded, isTesting: testing })
    const closed = onceAny(mod, [EV.rewardDismissed, EV.rewardFailedToShow], 180_000)
    await mod.AdMob.showRewardVideoAd().catch(() => undefined)
    await closed
    return earned
  } catch {
    return false
  } finally {
    void rewardHandle.then((h) => h.remove())
  }
}

export type ConsentResult = 'shown' | 'web' | 'notRequired' | 'error'

/** Settings → "Ad privacy": reopens the UMP privacy options form. */
export async function showNativeConsent(): Promise<ConsentResult> {
  const mod = await initAds()
  if (!mod) return isNativeAds() ? 'error' : 'web'
  try {
    const info = await mod.AdMob.requestConsentInfo({ tagForUnderAgeOfConsent: false })
    // Enum not exported at runtime by the plugin: compare with its string value.
    if (info.privacyOptionsRequirementStatus !== 'REQUIRED') return 'notRequired'
    await mod.AdMob.showPrivacyOptionsForm()
    return 'shown'
  } catch {
    return 'error'
  }
}
