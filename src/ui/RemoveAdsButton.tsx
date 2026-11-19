import { useState } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { purchase } from '../core/purchases'
import { usePrice } from '../core/usePrice'
import { sfx } from '../core/feedback'

/** "Remove ads" purchase (store purchase on native, instant stub on web). Hidden once ads are removed. */
export function RemoveAdsButton() {
  const { t } = useT()
  const adsRemoved = useApp((s) => s.adsRemoved)
  const price = usePrice('no_ads', '3,99 €')
  const [busy, setBusy] = useState(false)
  if (adsRemoved) return null
  return (
    <button
      className="btn block yellow"
      style={{ marginTop: 22 }}
      disabled={busy}
      onClick={async () => {
        sfx.tap()
        setBusy(true)
        try {
          await purchase('no_ads')
        } finally {
          setBusy(false)
        }
      }}
    >
      🚫 {t('removeAds')} · {busy ? '…' : price}
    </button>
  )
}
