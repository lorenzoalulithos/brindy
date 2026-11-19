/**
 * True inside the Capacitor iOS/Android shell. Reads the bridge the native runtime injects on `window`
 * instead of importing @capacitor/core, so the web bundle doesn't pay for it.
 */
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  return !!cap?.isNativePlatform?.()
}
