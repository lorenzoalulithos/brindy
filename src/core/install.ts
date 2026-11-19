import { create } from 'zustand'
import { isNativePlatform } from './native'

/** Chromium's install prompt event (not in lib.dom yet). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const useInstall = create<{ deferred: BeforeInstallPromptEvent | null; installed: boolean }>(() => ({
  deferred: null,
  installed: false,
}))

// Registered at module load (this file is imported eagerly from Home) so an early event isn't missed.
if (typeof window !== 'undefined' && !isNativePlatform()) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    useInstall.setState({ deferred: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => useInstall.setState({ deferred: null, installed: true }))
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** What kind of install hint to show, if any: the native prompt (Android/desktop) or the iOS Share-sheet instructions. */
export function useInstallOffer(): 'prompt' | 'ios' | null {
  const deferred = useInstall((s) => s.deferred)
  const installed = useInstall((s) => s.installed)
  if (isNativePlatform() || installed || isStandalone()) return null
  if (deferred) return 'prompt'
  if (isIOS()) return 'ios'
  return null
}

export async function promptInstall(): Promise<boolean> {
  const e = useInstall.getState().deferred
  if (!e) return false
  await e.prompt()
  const { outcome } = await e.userChoice
  useInstall.setState({ deferred: null, installed: outcome === 'accepted' })
  return outcome === 'accepted'
}
