import { useEffect, useState } from 'react'
import { AD_POLICY, useAdQueue } from '../core/ads'
import { useT } from '../core/i18n'

/** Web placeholder for ads (house ad). Native builds route the same queue to AdMob. */
export function AdOverlay() {
  const pending = useAdQueue((s) => s.pending)
  const { t } = useT()
  const total = pending?.kind === 'rewarded' ? AD_POLICY.rewardedSeconds : AD_POLICY.interstitialSkipSeconds
  const [left, setLeft] = useState(total)

  useEffect(() => {
    if (!pending) return
    setLeft(total)
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [pending, total])

  if (!pending) return null
  const done = left === 0

  return (
    <div className="backdrop center" style={{ zIndex: 100 }}>
      <div className="sheet center" style={{ maxWidth: 420 }}>
        <div className="muted" style={{ fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
          {t('adTitle')}
        </div>
        <div
          style={{
            margin: '16px 0',
            aspectRatio: '9 / 12',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #ff3d8b, #7b5cff 60%, #3dd6ff)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: 30,
            color: '#fff',
            textShadow: '0 4px 20px rgba(0,0,0,.4)',
          }}
        >
          <div>
            🥤
            <br />
            Your brand here
          </div>
        </div>
        <button
          className={'btn block' + (done ? '' : ' secondary')}
          disabled={!done && pending.kind === 'rewarded'}
          onClick={() => (done || pending.kind === 'interstitial' ? pending.resolve(done) : undefined)}
        >
          {done ? (pending.kind === 'rewarded' ? '🎁 OK!' : t('adSkip')) : t('adSkipIn', { n: left })}
        </button>
      </div>
    </div>
  )
}
