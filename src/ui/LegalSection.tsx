import { useState } from 'react'
import { fmt, useT } from '../core/i18n'
import { useApp } from '../core/store'
import { openAdConsent } from '../core/ads'
import { restorePurchases } from '../core/purchases'
import { APP_VERSION, CONTACT_EMAIL } from '../core/appInfo'
import { sfx } from '../core/feedback'
import { LS } from './legalStrings'

function LinkRow({ icon, label, onClick, href }: { icon: string; label: string; onClick?: () => void; href?: string }) {
  const style = { minHeight: 56, width: '100%', textAlign: 'left' as const, color: 'var(--text)', textDecoration: 'none', fontSize: 17 }
  const inner = (
    <>
      <span className="grow">
        {icon} {label}
      </span>
      <span className="muted">›</span>
    </>
  )
  return href ? (
    <a className="list-item" href={href} style={style}>
      {inner}
    </a>
  ) : (
    <button className="list-item" onClick={onClick} style={style}>
      {inner}
    </button>
  )
}

/** Settings → "Privacy & legal": policy, terms, ad consent, restore purchases, contact, version. */
export function LegalSection() {
  const { L } = useT()
  const go = useApp((s) => s.go)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const adPrivacy = async () => {
    sfx.tap()
    const r = await openAdConsent()
    setNote(r === 'shown' ? '' : r === 'web' ? L(LS.adPrivacyWeb) : r === 'notRequired' ? L(LS.adPrivacyNotRequired) : L(LS.genericError))
  }
  const restore = async () => {
    if (busy) return
    sfx.tap()
    setBusy(true)
    try {
      const n = await restorePurchases()
      setNote(n === null ? L(LS.restoreWeb) : n === 0 ? L(LS.restoreNone) : fmt(L(LS.restoreDone), { n }))
    } catch {
      setNote(L(LS.genericError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="section-title">{L(LS.section)}</div>
      <div className="list">
        <LinkRow icon="🔒" label={L(LS.privacy)} onClick={() => go({ name: 'legal', doc: 'privacy' })} />
        <LinkRow icon="📄" label={L(LS.terms)} onClick={() => go({ name: 'legal', doc: 'terms' })} />
        <LinkRow icon="📢" label={L(LS.adPrivacy)} onClick={adPrivacy} />
        <LinkRow icon="🛍️" label={busy ? '…' : L(LS.restore)} onClick={restore} />
        <LinkRow icon="✉️" label={`${L(LS.contact)}: ${CONTACT_EMAIL}`} href={`mailto:${CONTACT_EMAIL}?subject=Brindy%20${APP_VERSION}`} />
      </div>
      {note && (
        <div className="muted center" style={{ fontSize: 14, marginTop: 8 }} role="status">
          {note}
        </div>
      )}
    </>
  )
}
