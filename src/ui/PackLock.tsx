import { showRewarded, tonightExpiry } from '../core/ads'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { purchase } from '../core/purchases'
import { usePrice } from '../core/usePrice'
import { Sheet } from './GameShell'
import { PassButton } from './Pass'

/** Premium content packs (spicy cards, extra wheels…). Free with a rewarded ad for tonight, or IAP forever. */
export function usePack(packId: string) {
  const unlocked = useApp((s) => (s.unlocks[packId] ?? 0) > Date.now())
  const unlock = useApp((s) => s.unlock)
  return {
    unlocked,
    async unlockTonight() {
      if (await showRewarded()) unlock(packId, tonightExpiry())
    },
    /** Native: real store purchase (RevenueCat grants the unlock). Web: instant stub. True when owned. */
    async unlockForever() {
      return (await purchase(`pack_${packId}`)) === 'ok'
    },
  }
}

export function PackLockSheet({ packId, title, onClose }: { packId: string; title: string; onClose: () => void }) {
  const { t } = useT()
  const pack = usePack(packId)
  const price = usePrice(`pack_${packId}`, '2,99 €')
  return (
    <Sheet onClose={onClose}>
      <div className="big-emoji center">🔒</div>
      <h2 className="center" style={{ marginTop: 8 }}>
        {title}
      </h2>
      <p className="center">{t('locked')}</p>
      <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
        <button
          className="btn block cyan"
          onClick={async () => {
            await pack.unlockTonight()
            onClose()
          }}
        >
          {t('unlockTonight')}
        </button>
        <button
          className="btn block yellow"
          onClick={async () => {
            if (await pack.unlockForever()) onClose()
          }}
        >
          {t('unlockForever')} · {price}
        </button>
        <PassButton upsell style={{ fontSize: 18 }} />
      </div>
    </Sheet>
  )
}
