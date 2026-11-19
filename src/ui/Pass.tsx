import { useState, type CSSProperties } from 'react'
import { useT, type Loc } from '../core/i18n'
import { useApp } from '../core/store'
import { purchase, type PassSku } from '../core/purchases'
import { usePrice } from '../core/usePrice'
import { sfx } from '../core/feedback'
import { Sheet } from './GameShell'

const S = {
  title: { it: 'Brindy Pass', en: 'Brindy Pass', es: 'Brindy Pass', fr: 'Brindy Pass', de: 'Brindy Pass' },
  tagline: {
    it: 'Tutto sbloccato, zero pubblicità',
    en: 'Everything unlocked, zero ads',
    es: 'Todo desbloqueado, cero anuncios',
    fr: 'Tout débloqué, zéro pub',
    de: 'Alles freigeschaltet, null Werbung',
  },
  b1: { it: '🌶️ Tutti i pacchetti piccanti', en: '🌶️ Every spicy pack', es: '🌶️ Todos los packs picantes', fr: '🌶️ Tous les packs épicés', de: '🌶️ Alle scharfen Pakete' },
  b2: { it: '💑 Coppie · 🎉 Addio al celibato · 🏢 Colleghi', en: '💑 Couples · 🎉 Bachelor party · 🏢 Office', es: '💑 Parejas · 🎉 Despedida · 🏢 Oficina', fr: '💑 Couples · 🎉 EVJF/EVG · 🏢 Collègues', de: '💑 Paare · 🎉 JGA · 🏢 Kollegen' },
  b3: { it: '🚫 Niente pubblicità', en: '🚫 No ads', es: '🚫 Sin anuncios', fr: '🚫 Sans pub', de: '🚫 Keine Werbung' },
  b4: { it: '🆕 Ogni nuovo pacchetto incluso', en: '🆕 Every new pack included', es: '🆕 Cada pack nuevo incluido', fr: '🆕 Chaque nouveau pack inclus', de: '🆕 Jedes neue Paket inklusive' },
  monthly: { it: 'Mensile', en: 'Monthly', es: 'Mensual', fr: 'Mensuel', de: 'Monatlich' },
  yearly: { it: 'Annuale', en: 'Yearly', es: 'Anual', fr: 'Annuel', de: 'Jährlich' },
  perMonth: { it: '/mese', en: '/month', es: '/mes', fr: '/mois', de: '/Monat' },
  perYear: { it: '/anno', en: '/year', es: '/año', fr: '/an', de: '/Jahr' },
  save: { it: 'RISPARMI 58%', en: 'SAVE 58%', es: 'AHORRA 58%', fr: '-58%', de: '58% SPAREN' },
  active: { it: '💎 Brindy Pass attivo', en: '💎 Brindy Pass active', es: '💎 Brindy Pass activo', fr: '💎 Brindy Pass actif', de: '💎 Brindy Pass aktiv' },
  thanks: { it: 'Grazie! Tutto sbloccato 🍻', en: 'Thanks! Everything unlocked 🍻', es: '¡Gracias! Todo desbloqueado 🍻', fr: 'Merci ! Tout est débloqué 🍻', de: 'Danke! Alles freigeschaltet 🍻' },
  error: { it: 'Acquisto non riuscito, riprova.', en: 'Purchase failed, please try again.', es: 'La compra falló, inténtalo de nuevo.', fr: "L'achat a échoué, réessaie.", de: 'Kauf fehlgeschlagen, bitte nochmal.' },
  cta: { it: '💎 Prova Brindy Pass', en: '💎 Try Brindy Pass', es: '💎 Prueba Brindy Pass', fr: '💎 Essaie Brindy Pass', de: '💎 Brindy Pass testen' },
  orPass: { it: '💎 Tutti i pacchetti con Brindy Pass', en: '💎 All packs with Brindy Pass', es: '💎 Todos los packs con Brindy Pass', fr: '💎 Tous les packs avec Brindy Pass', de: '💎 Alle Pakete mit Brindy Pass' },
  // Required by App Store guideline 3.1.2 for auto-renewing subscriptions.
  legal: {
    it: "Abbonamento con rinnovo automatico. Il pagamento viene addebitato sul tuo account dello store alla conferma. Si rinnova automaticamente salvo disdetta almeno 24 ore prima della scadenza; puoi disdire in qualsiasi momento dalle impostazioni dell'account dello store.",
    en: 'Auto-renewing subscription. Payment is charged to your store account at confirmation. It renews automatically unless cancelled at least 24 hours before the end of the period; cancel anytime in your store account settings.',
    es: 'Suscripción con renovación automática. El pago se carga a tu cuenta de la tienda al confirmar. Se renueva automáticamente salvo cancelación al menos 24 horas antes del fin del periodo; cancela cuando quieras en los ajustes de tu cuenta.',
    fr: "Abonnement à renouvellement automatique. Le paiement est débité de ton compte store à la confirmation. Il se renouvelle sauf résiliation au moins 24 h avant la fin de la période ; résilie à tout moment dans les réglages de ton compte.",
    de: 'Automatisch verlängertes Abo. Die Zahlung wird bei Bestätigung deinem Store-Konto belastet. Es verlängert sich, sofern nicht mindestens 24 Stunden vor Ablauf gekündigt; jederzeit in den Kontoeinstellungen kündbar.',
  },
  terms: { it: 'Termini', en: 'Terms', es: 'Términos', fr: 'Conditions', de: 'AGB' },
  privacy: { it: 'Privacy', en: 'Privacy', es: 'Privacidad', fr: 'Confidentialité', de: 'Datenschutz' },
} satisfies Record<string, Loc>

/** Full-screen offer for the Brindy Pass subscription. */
export function PassSheet({ onClose }: { onClose: () => void }) {
  const { L, t } = useT()
  const go = useApp((s) => s.go)
  const owned = useApp((s) => s.pass)
  const monthly = usePrice('pass_monthly', '1,99 €')
  const yearly = usePrice('pass_yearly', '9,99 €')
  const [busy, setBusy] = useState<PassSku | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const buy = async (sku: PassSku) => {
    if (busy) return
    sfx.tap()
    setBusy(sku)
    setMsg(null)
    try {
      const res = await purchase(sku)
      if (res === 'ok') {
        sfx.win()
        setMsg(L(S.thanks))
        setTimeout(onClose, 1200)
      } else if (res === 'error') setMsg(L(S.error))
    } finally {
      setBusy(null)
    }
  }

  const openLegal = (doc: 'terms' | 'privacy') => {
    onClose()
    go({ name: 'legal', doc })
  }

  return (
    <Sheet onClose={onClose}>
      <div className="center">
        <div className="big-emoji">💎</div>
        <h2 className="logo" style={{ fontSize: 38, marginTop: 6 }}>
          {L(S.title)}
        </h2>
        <p style={{ margin: '4px 0 12px' }}>{L(S.tagline)}</p>
      </div>
      <div className="list" style={{ marginBottom: 16 }}>
        {[S.b1, S.b2, S.b3, S.b4].map((b, i) => (
          <div key={i} className="list-item" style={{ fontSize: 16 }}>
            {L(b)}
          </div>
        ))}
      </div>
      {owned ? (
        <div className="result center">
          <div className="big">{L(S.active)}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          <button className="btn block yellow" style={{ position: 'relative' }} disabled={!!busy} onClick={() => buy('pass_yearly')}>
            <span className="badge" style={{ top: -10, right: 16, background: 'var(--pink)', color: '#1a0b16' }}>
              {L(S.save)}
            </span>
            {L(S.yearly)} · {busy === 'pass_yearly' ? '…' : yearly + L(S.perYear)}
          </button>
          <button className="btn block secondary" disabled={!!busy} onClick={() => buy('pass_monthly')}>
            {L(S.monthly)} · {busy === 'pass_monthly' ? '…' : monthly + L(S.perMonth)}
          </button>
        </div>
      )}
      {msg && (
        <p className="center" style={{ color: 'var(--text)' }}>
          {msg}
        </p>
      )}
      <p style={{ fontSize: 11, lineHeight: 1.4, marginTop: 14 }}>{L(S.legal)}</p>
      <div className="row" style={{ justifyContent: 'center', gap: 18, fontSize: 13 }}>
        <button className="muted" onClick={() => openLegal('terms')}>
          {L(S.terms)}
        </button>
        <button className="muted" onClick={() => openLegal('privacy')}>
          {L(S.privacy)}
        </button>
        <button className="muted" onClick={onClose}>
          {t('close')}
        </button>
      </div>
    </Sheet>
  )
}

/** Entry point (Settings, pack lock sheet): opens the PassSheet, or shows the active badge. */
export function PassButton({ style, upsell }: { style?: CSSProperties; upsell?: boolean }) {
  const { L } = useT()
  const owned = useApp((s) => s.pass)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="btn block"
        style={{ background: 'linear-gradient(90deg, var(--violet), var(--pink))', color: '#fff', ...style }}
        onClick={() => {
          sfx.tap()
          setOpen(true)
        }}
      >
        {owned ? L(S.active) : L(upsell ? S.orPass : S.cta)}
      </button>
      {open && <PassSheet onClose={() => setOpen(false)} />}
    </>
  )
}
