import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { detectLang, type Lang } from './i18n'

export type PenaltyMode = 'sips' | 'points' | 'dares'

export interface Player {
  id: string
  name: string
  color: string
}

export type Screen =
  | { name: 'home' }
  | { name: 'players'; then?: string }
  | { name: 'settings' }
  | { name: 'submit' }
  | { name: 'game'; id: string }
  | { name: 'legal'; doc: LegalDoc }

export type LegalDoc = 'privacy' | 'terms'

export const PLAYER_COLORS = ['#ff3d8b', '#3dd6ff', '#ffd23d', '#7b5cff', '#3dff8b', '#ff8a3d', '#ff5c5c', '#c6ff3d', '#3d7bff', '#ff3df0']

interface AppState {
  lang: Lang
  ageOk: boolean
  penaltyMode: PenaltyMode
  spicy: boolean
  sound: boolean
  vibration: boolean
  /** Lighter 3D rendering (dpr 1, no shadows). Defaults on for weak devices. */
  lowPower: boolean
  players: Player[]
  screen: Screen
  /** Penalty points per player id (used by 'points' mode scoreboard). */
  points: Record<string, number>
  /** packId -> unlock expiry timestamp (ms). Infinity-like (9e15) for purchased. */
  unlocks: Record<string, number>
  adsRemoved: boolean
  /** Brindy Pass subscription active (all packs + no ads). */
  pass: boolean
  gamesSinceAd: number
  lastAdAt: number
  /** Total games played (for the install prompt). */
  gamesPlayed: number
  installDismissed: boolean
  /** First-run onboarding (players + penalty mode) done or skipped. */
  onboarded: boolean

  setLang: (l: Lang) => void
  confirmAge: () => void
  setPenaltyMode: (m: PenaltyMode) => void
  setSpicy: (v: boolean) => void
  setSound: (v: boolean) => void
  setVibration: (v: boolean) => void
  setLowPower: (v: boolean) => void
  addPlayer: (name: string) => void
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  go: (s: Screen) => void
  addPoints: (playerId: string, n: number) => void
  resetPoints: () => void
  unlock: (packId: string, untilMs: number) => void
  isUnlocked: (packId: string) => boolean
  setAdsRemoved: (v: boolean) => void
  setPass: (v: boolean) => void
  markAdShown: () => void
  markGamePlayed: () => void
  dismissInstall: () => void
  finishOnboarding: () => void
}

const uid = () => Math.random().toString(36).slice(2, 9)

/** Few cores or little RAM: start in low-power mode (only used until the user's choice is persisted). */
function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return (cores !== undefined && cores > 0 && cores <= 4) || (memory !== undefined && memory <= 3)
}

const safeStorage = createJSONStorage(() => {
  try {
    const k = '__t'
    localStorage.setItem(k, k)
    localStorage.removeItem(k)
    return localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
})

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      lang: detectLang(),
      ageOk: false,
      penaltyMode: 'sips',
      spicy: false,
      sound: true,
      vibration: true,
      lowPower: isLowEndDevice(),
      players: [],
      screen: { name: 'home' },
      points: {},
      unlocks: {},
      adsRemoved: false,
      pass: false,
      gamesSinceAd: 0,
      lastAdAt: 0,
      gamesPlayed: 0,
      installDismissed: false,
      onboarded: false,

      setLang: (lang) => set({ lang }),
      confirmAge: () => set({ ageOk: true }),
      setPenaltyMode: (penaltyMode) => set({ penaltyMode }),
      setSpicy: (spicy) => set({ spicy }),
      setSound: (sound) => set({ sound }),
      setVibration: (vibration) => set({ vibration }),
      setLowPower: (lowPower) => set({ lowPower }),
      addPlayer: (name) =>
        set((s) => {
          const trimmed = name.trim().slice(0, 16)
          if (!trimmed) return s
          const color = PLAYER_COLORS[s.players.length % PLAYER_COLORS.length]
          return { players: [...s.players, { id: uid(), name: trimmed, color }] }
        }),
      removePlayer: (id) => set((s) => ({ players: s.players.filter((p) => p.id !== id) })),
      renamePlayer: (id, name) =>
        set((s) => ({ players: s.players.map((p) => (p.id === id ? { ...p, name: name.slice(0, 16) } : p)) })),
      go: (screen) => set({ screen }),
      addPoints: (playerId, n) => set((s) => ({ points: { ...s.points, [playerId]: (s.points[playerId] ?? 0) + n } })),
      resetPoints: () => set({ points: {} }),
      unlock: (packId, untilMs) => set((s) => ({ unlocks: { ...s.unlocks, [packId]: untilMs } })),
      isUnlocked: (packId) => (get().unlocks[packId] ?? 0) > Date.now(),
      setAdsRemoved: (adsRemoved) => set({ adsRemoved }),
      setPass: (pass) => set({ pass }),
      markAdShown: () => set({ gamesSinceAd: 0, lastAdAt: Date.now() }),
      markGamePlayed: () => set((s) => ({ gamesSinceAd: s.gamesSinceAd + 1, gamesPlayed: s.gamesPlayed + 1 })),
      dismissInstall: () => set({ installDismissed: true }),
      finishOnboarding: () => set({ onboarded: true }),
    }),
    {
      name: 'brindy',
      storage: safeStorage,
      // Users from before onboarding existed who already set up players skip it.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        return { ...current, ...p, onboarded: p.onboarded ?? (p.players?.length ?? 0) > 0 }
      },
      partialize: (s) => {
        const { screen, ...rest } = s
        void screen
        return rest
      },
    },
  ),
)

/** Selector helper for the current player list. */
export function usePlayers(): Player[] {
  return useApp((s) => s.players)
}
