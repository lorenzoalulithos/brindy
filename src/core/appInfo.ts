/** Shown in Settings. Keep in sync with the store version (Capacitor build number lives in the native projects). */
export const APP_VERSION = '0.1.0'

/** Support / privacy contact shown in Settings. TODO: confirm the final address before launch (must match privacy-policy.md). */
export const CONTACT_EMAIL = 'ciao@brindy.app'

/** `VITE_REVIEW_BUILD=1` builds for App Review / Play review: every scheduled game is playable and no countdown is shown. */
export const REVIEW_BUILD = import.meta.env.VITE_REVIEW_BUILD === '1'
