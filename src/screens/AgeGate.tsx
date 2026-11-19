import { useState } from 'react'
import { LANGS, LANG_LABELS, useT } from '../core/i18n'
import { useApp } from '../core/store'

/** Required by store policies for alcohol-themed apps (and good practice). */
export function AgeGate() {
  const { t } = useT()
  const { lang, setLang, confirmAge } = useApp()
  const [denied, setDenied] = useState(false)

  return (
    <div className="screen center" style={{ justifyContent: 'center', gap: 18 }}>
      <h1 className="logo" style={{ fontSize: 64 }}>
        Brindy
      </h1>
      <div className="big-emoji">🔞</div>
      {denied ? (
        <h2>{t('ageDenied')}</h2>
      ) : (
        <>
          <h2 style={{ fontSize: 30 }}>{t('ageTitle')}</h2>
          <p className="muted" style={{ lineHeight: 1.5, maxWidth: 420, margin: '0 auto' }}>
            {t('ageBody')}
          </p>
          <button className="btn block" style={{ maxWidth: 420, margin: '0 auto' }} onClick={confirmAge}>
            {t('ageYes')}
          </button>
          <button className="btn secondary block" style={{ maxWidth: 420, margin: '0 auto' }} onClick={() => setDenied(true)}>
            {t('ageNo')}
          </button>
        </>
      )}
      <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        {LANGS.map((l) => (
          <button key={l} className={'chip' + (lang === l ? ' active' : '')} onClick={() => setLang(l)}>
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>
    </div>
  )
}
