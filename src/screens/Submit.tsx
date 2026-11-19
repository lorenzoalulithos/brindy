import { useState } from 'react'
import { useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx } from '../core/feedback'
import { LegalView } from './Legal'
import { LS } from '../ui/legalStrings'
import type { LegalDoc } from '../core/store'

/**
 * Community game proposals. Posts JSON to VITE_SUBMIT_ENDPOINT (e.g. Formspree,
 * a Supabase function, Google Apps Script). Without an endpoint, falls back to
 * an email draft so no idea gets lost during the prototype phase.
 */
const ENDPOINT = import.meta.env.VITE_SUBMIT_ENDPOINT as string | undefined
const FALLBACK_EMAIL = 'giochi@brindy.app'

export function Submit() {
  const { t, L, lang } = useT()
  const go = useApp((s) => s.go)
  const [form, setForm] = useState({ name: '', rules: '', players: '', needs: '', country: '', nick: '', email: '' })
  const [consent, setConsent] = useState(false)
  // Shown as an overlay so the half-filled form survives a look at the policy.
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.name.trim().length > 1 && form.rules.trim().length > 20 && consent

  const send = async () => {
    if (!valid) return
    setState('sending')
    const payload = { ...form, lang, submittedAt: new Date().toISOString() }
    try {
      if (ENDPOINT) {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error(String(res.status))
      } else {
        const body = Object.entries(payload)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n')
        window.location.href = `mailto:${FALLBACK_EMAIL}?subject=${encodeURIComponent('[Brindy] ' + form.name)}&body=${encodeURIComponent(body)}`
      }
      sfx.win()
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="screen" style={{ gap: 12 }}>
      <div className="topbar">
        <button className="icon-btn" onClick={() => go({ name: 'home' })}>
          ←
        </button>
        <h2>💡 {t('submitTitle')}</h2>
        <div style={{ width: 46 }} />
      </div>

      {state === 'done' ? (
        <div className="center" style={{ marginTop: 60 }}>
          <div className="big-emoji">🍻</div>
          <p style={{ fontSize: 20, lineHeight: 1.4 }}>{t('fThanks')}</p>
          <button className="btn" onClick={() => go({ name: 'home' })}>
            {t('back')}
          </button>
        </div>
      ) : (
        <>
          <p className="muted" style={{ margin: 0, lineHeight: 1.45 }}>
            {t('submitIntro')}
          </p>
          <label className="field">
            {t('fGameName')} *
            <input value={form.name} onChange={set('name')} maxLength={60} />
          </label>
          <label className="field">
            {t('fRules')} *
            <textarea value={form.rules} onChange={set('rules')} rows={6} maxLength={3000} />
          </label>
          <div className="row">
            <label className="field grow">
              {t('fPlayers')}
              <input value={form.players} onChange={set('players')} inputMode="numeric" maxLength={10} />
            </label>
            <label className="field grow">
              {t('fCountry')}
              <input value={form.country} onChange={set('country')} maxLength={40} />
            </label>
          </div>
          <label className="field">
            {t('fNeeds')}
            <input value={form.needs} onChange={set('needs')} maxLength={120} />
          </label>
          <label className="field">
            {t('fNick')}
            <input value={form.nick} onChange={set('nick')} maxLength={30} />
          </label>
          <label className="field">
            {t('fEmail')}
            <input type="email" value={form.email} onChange={set('email')} maxLength={120} />
          </label>
          <label className="row" style={{ fontSize: 14, alignItems: 'flex-start' }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ width: 22, height: 22, flex: 'none' }} />
            <span className="muted">{t('fConsent')}</span>
          </label>
          {!valid && <div className="muted center" style={{ fontSize: 13 }}>{t('fRequired')}</div>}
          {state === 'error' && <div className="center" style={{ color: 'var(--danger)' }}>⚠️ Error</div>}
          <button className="btn block" disabled={!valid || state === 'sending'} onClick={send} style={{ marginTop: 6 }}>
            {t('fSend')}
          </button>
          <button className="muted center" style={{ fontSize: 13, textDecoration: 'underline', padding: '6px 0' }} onClick={() => setLegal('privacy')}>
            🔒 {L(LS.submitPrivacy)}
          </button>
        </>
      )}
      {legal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'var(--bg)' }}>
          <LegalView doc={legal} onBack={() => setLegal(null)} onOpen={setLegal} />
        </div>
      )}
    </div>
  )
}
