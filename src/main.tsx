import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (offline + native). Latin subsets cover it/en/es/fr/de.
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/lilita-one/latin-ext-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-800.css'
import '@fontsource/nunito/latin-900.css'
import '@fontsource/nunito/latin-ext-600.css'
import '@fontsource/nunito/latin-ext-800.css'
import '@fontsource/nunito/latin-ext-900.css'
import './index.css'
import App from './App.tsx'
import { startAds } from './core/ads'
import { initPurchases } from './core/purchases'

// Native only, in the background: AdMob + consent (after the age gate) and RevenueCat entitlement sync.
startAds()
initPurchases()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
