import type { ReactNode } from 'react'
import { LANGS, LANG_LABELS, useT } from '../core/i18n'
import { useApp, type PenaltyMode } from '../core/store'
import { APP_VERSION } from '../core/appInfo'
import { LegalSection } from '../ui/LegalSection'
import { RemoveAdsButton } from '../ui/RemoveAdsButton'
import { PassButton } from '../ui/Pass'
import { LS } from '../ui/legalStrings'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return <button className={'toggle' + (on ? ' on' : '')} role="switch" aria-checked={on} onClick={() => onChange(!on)} />
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="list-item" style={{ minHeight: 60 }}>
      <span className="grow" style={{ fontSize: 17 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

export function Settings() {
  const { t, L } = useT()
  const s = useApp()

  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => s.go({ name: 'home' })}>
          ←
        </button>
        <h2>⚙️ {t('settings')}</h2>
        <div style={{ width: 46 }} />
      </div>

      <div className="section-title">{t('language')}</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {LANGS.map((l) => (
          <button key={l} className={'chip' + (s.lang === l ? ' active' : '')} onClick={() => s.setLang(l)}>
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="section-title">{t('penaltyMode')}</div>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {(
          [
            ['sips', t('modeSips')],
            ['points', t('modePoints')],
            ['dares', t('modeDares')],
          ] as [PenaltyMode, string][]
        ).map(([m, label]) => (
          <button key={m} className={'chip' + (s.penaltyMode === m ? ' active' : '')} onClick={() => s.setPenaltyMode(m)}>
            {label}
          </button>
        ))}
      </div>

      <div className="list" style={{ marginTop: 18 }}>
        <Row label={t('spicy')}>
          <Toggle on={s.spicy} onChange={s.setSpicy} />
        </Row>
        <Row label={`🔊 ${t('sound')}`}>
          <Toggle on={s.sound} onChange={s.setSound} />
        </Row>
        <Row label={`📳 ${t('vibration')}`}>
          <Toggle on={s.vibration} onChange={s.setVibration} />
        </Row>
        <Row
          label={
            <>
              ⚡ {t('lowPower')}
              <div className="muted" style={{ fontSize: 13, fontWeight: 700 }}>
                {t('lowPowerSub')}
              </div>
            </>
          }
        >
          <Toggle on={s.lowPower} onChange={s.setLowPower} />
        </Row>
      </div>

      <PassButton style={{ marginTop: 22 }} />
      <RemoveAdsButton />

      <LegalSection />

      <div className="grow" />
      <div className="fineprint">
        🔞 {t('responsible')}
        <br />
        Brindy · {L(LS.version)} {APP_VERSION}
      </div>
    </div>
  )
}
