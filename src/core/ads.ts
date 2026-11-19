import { create } from 'zustand'
import { useApp } from './store'
import { initAds, isNativeAds, showNativeConsent, showNativeInterstitial, showNativeRewarded, type ConsentResult } from './admob'

/**
 * Ad policy — "poca ma mirata":
 * - NEVER during a game turn: only at natural breaks (leaving a game).
 * - First minutes of a session are ad-free (first impression = party mode).
 * - At most one interstitial every N games AND every M minutes.
 * - Rewarded videos are opt-in: watch one to unlock a premium pack for tonight.
 * - Paying "remove ads" disables interstitials (rewarded stays available, it's optional).
 *
 * On web this shows a house-ad placeholder; in the native build the provider is
 * swapped for AdMob (via @capacitor-community/admob) behind the same API.
 */
export const AD_POLICY = {
  interstitialEveryGames: 3,
  minMinutesBetween: 6,
  sessionGraceMinutes: 8,
  rewardedSeconds: 15,
  interstitialSkipSeconds: 5,
}

const sessionStart = Date.now()

export function shouldShowInterstitial(now = Date.now()): boolean {
  const s = useApp.getState()
  if (s.adsRemoved) return false
  if (now - sessionStart < AD_POLICY.sessionGraceMinutes * 60_000) return false
  if (now - s.lastAdAt < AD_POLICY.minMinutesBetween * 60_000) return false
  return s.gamesSinceAd >= AD_POLICY.interstitialEveryGames
}

type PendingAd = { kind: 'interstitial' | 'rewarded'; resolve: (rewarded: boolean) => void }

export const useAdQueue = create<{ pending: PendingAd | null; set: (p: PendingAd | null) => void }>((set) => ({
  pending: null,
  set: (pending) => set({ pending }),
}))

function show(kind: PendingAd['kind']): Promise<boolean> {
  if (isNativeAds()) return showNative(kind)
  return new Promise((resolve) => {
    useAdQueue.getState().set({
      kind,
      resolve: (r) => {
        useAdQueue.getState().set(null)
        if (kind === 'interstitial') useApp.getState().markAdShown()
        resolve(r)
      },
    })
  })
}

/** Native builds: AdMob instead of the house-ad overlay. */
async function showNative(kind: PendingAd['kind']): Promise<boolean> {
  if (kind === 'rewarded') return showNativeRewarded()
  const shown = await showNativeInterstitial()
  if (shown) useApp.getState().markAdShown()
  return shown
}

/** Starts AdMob + consent in the background (native only; waits for the age gate). Safe to call more than once. */
export function startAds() {
  if (isNativeAds()) void initAds()
}

/** Called when the user leaves a game. Shows an interstitial only if the policy allows. */
export async function onGameFinished() {
  useApp.getState().markGamePlayed()
  if (shouldShowInterstitial()) await show('interstitial')
}

/** Opt-in rewarded video. Resolves true if watched to the end. */
export function showRewarded(): Promise<boolean> {
  return show('rewarded')
}

/** A rewarded unlock lasts until 6 AM ("for tonight"). */
export function tonightExpiry(now = new Date()): number {
  const d = new Date(now)
  if (d.getHours() >= 6) d.setDate(d.getDate() + 1)
  d.setHours(6, 0, 0, 0)
  return d.getTime()
}

export const FOREVER = 9e15

/**
 * "Ad privacy" entry in Settings: reopens the UMP privacy options form so the user can change their choice.
 * 'web' = house ads only (no third-party tracking), 'notRequired' = no consent form applies in this region.
 */
export function openAdConsent(): Promise<ConsentResult> {
  return showNativeConsent()
}
