import { useState, type CSSProperties } from 'react'
import { useT, type Loc, type UIKey } from '../core/i18n'
import { useApp, type PenaltyMode } from '../core/store'
import { sfx, vibrate } from '../core/feedback'

const TXT = {
  whoTitle: { it: 'Chi gioca stasera?', en: "Who's playing tonight?", es: '¿Quién juega esta noche?', fr: 'Qui joue ce soir ?', de: 'Wer spielt heute Abend?' },
  whoSub: {
    it: 'Aggiungi almeno 2 giocatori: i giochi sapranno a chi tocca.',
    en: 'Add at least 2 players so the games know whose turn it is.',
    es: 'Añade al menos 2 jugadores para que los juegos sepan a quién le toca.',
    fr: 'Ajoute au moins 2 joueurs pour que les jeux sachent à qui c’est le tour.',
    de: 'Füg mindestens 2 Spieler hinzu, damit die Spiele wissen, wer dran ist.',
  },
  quick: { it: 'Oppure tocca un nome al volo:', en: 'Or tap a name on the fly:', es: 'O toca un nombre al vuelo:', fr: 'Ou touche un nom à la volée :', de: 'Oder tipp schnell einen Namen an:' },
  next: { it: 'Avanti 👉', en: 'Next 👉', es: 'Siguiente 👉', fr: 'Suivant 👉', de: 'Weiter 👉' },
  skip: { it: 'Salta', en: 'Skip', es: 'Saltar', fr: 'Passer', de: 'Überspringen' },
  modeTitle: { it: 'Come si paga?', en: 'How do losers pay?', es: '¿Cómo se paga?', fr: 'Comment on paie ?', de: 'Wie wird bezahlt?' },
  modeSub: { it: 'Puoi cambiarlo quando vuoi nelle impostazioni.', en: 'You can change it anytime in settings.', es: 'Puedes cambiarlo cuando quieras en ajustes.', fr: 'Tu peux le changer à tout moment dans les réglages.', de: 'Du kannst es jederzeit in den Einstellungen ändern.' },
  sipsDesc: { it: 'Il classico: chi perde beve un sorso', en: 'The classic: losers take a sip', es: 'El clásico: quien pierde bebe un trago', fr: 'Le classique : le perdant boit une gorgée', de: 'Der Klassiker: Wer verliert, trinkt einen Schluck' },
  pointsDesc: { it: 'Zero alcol: punti penalità e classifica', en: 'Zero alcohol: penalty points and a scoreboard', es: 'Cero alcohol: puntos de castigo y clasificación', fr: 'Zéro alcool : points de pénalité et classement', de: 'Null Alkohol: Strafpunkte und Rangliste' },
  daresDesc: { it: 'Chi perde fa una penitenza divertente', en: 'Losers do a funny dare', es: 'Quien pierde hace un reto divertido', fr: 'Le perdant fait un gage marrant', de: 'Wer verliert, macht eine lustige Mutprobe' },
} satisfies Record<string, Loc>

const SUGGESTIONS: Loc<string[]> = {
  it: ['Il Capitano', 'La Regina', 'Il Bomber', 'La Prof', 'Lo Chef', 'La Diva'],
  en: ['The Captain', 'The Queen', 'Big Boss', 'The Prof', 'The Chef', 'The Diva'],
  es: ['El Capitán', 'La Reina', 'El Jefe', 'La Profe', 'El Chef', 'La Diva'],
  fr: ['Le Capitaine', 'La Reine', 'Le Boss', 'La Prof', 'Le Chef', 'La Diva'],
  de: ['Der Käpt’n', 'Die Königin', 'Der Boss', 'Die Lehrerin', 'Der Koch', 'Die Diva'],
}

const MODES: { mode: PenaltyMode; label: UIKey; desc: Loc; color: string }[] = [
  { mode: 'sips', label: 'modeSips', desc: TXT.sipsDesc, color: '#ffd23d' },
  { mode: 'points', label: 'modePoints', desc: TXT.pointsDesc, color: '#3dd6ff' },
  { mode: 'dares', label: 'modeDares', desc: TXT.daresDesc, color: '#ff3d8b' },
]

/** First launch only: who's playing (≥2 or skip), then penalty mode (1 tap → Home). */
export function Onboarding() {
  const { t, L } = useT()
  const players = useApp((s) => s.players)
  const addPlayer = useApp((s) => s.addPlayer)
  const removePlayer = useApp((s) => s.removePlayer)
  const penaltyMode = useApp((s) => s.penaltyMode)
  const setPenaltyMode = useApp((s) => s.setPenaltyMode)
  const finish = useApp((s) => s.finishOnboarding)
  const go = useApp((s) => s.go)
  const [step, setStep] = useState<'players' | 'mode'>('players')
  const [name, setName] = useState('')

  const add = (n: string) => {
    if (!n.trim() || players.some((p) => p.name.toLowerCase() === n.trim().toLowerCase())) return
    sfx.tap()
    vibrate(15)
    addPlayer(n)
  }

  const choose = (mode: PenaltyMode) => {
    setPenaltyMode(mode)
    sfx.reveal()
    vibrate([30, 30, 60])
    finish()
    go({ name: 'home' })
  }

  const toMode = () => {
    sfx.tap()
    setStep('mode')
  }

  if (step === 'mode')
    return (
      <div className="screen" key="mode" style={{ gap: 14, justifyContent: 'center' }}>
        <Dots step={1} />
        <h1 className="center" style={{ fontSize: 34 }}>
          {L(TXT.modeTitle)}
        </h1>
        <div className="center muted" style={{ fontSize: 15, marginTop: -6 }}>
          {L(TXT.modeSub)}
        </div>
        {MODES.map((m, i) => (
          <button
            key={m.mode}
            className="game-card"
            onClick={() => choose(m.mode)}
            style={
              {
                '--accent': m.color,
                minHeight: 96,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                animationDelay: `${i * 70}ms`,
                outline: penaltyMode === m.mode ? `3px solid ${m.color}` : undefined,
                outlineOffset: 2,
              } as CSSProperties
            }
          >
            <span style={{ fontSize: 44, lineHeight: 1 }}>{t(m.label).split(' ')[0]}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="game-name" style={{ marginTop: 0 }}>
                {t(m.label).split(' ').slice(1).join(' ')}
              </span>
              <span className="game-tag" style={{ fontSize: 14 }}>
                {L(m.desc)}
              </span>
            </span>
          </button>
        ))}
      </div>
    )

  const suggestions = L(SUGGESTIONS).filter((s) => !players.some((p) => p.name === s))

  return (
    <div className="screen" key="players" style={{ gap: 14 }}>
      <Dots step={0} />
      <div className="center" style={{ fontSize: 56, animation: 'pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1)' }}>
        🍻
      </div>
      <h1 className="center" style={{ fontSize: 34 }}>
        {L(TXT.whoTitle)}
      </h1>
      <div className="center muted" style={{ fontSize: 15, marginTop: -6 }}>
        {L(TXT.whoSub)}
      </div>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          add(name)
          setName('')
        }}
      >
        <input value={name} maxLength={16} placeholder={t('playerName')} onChange={(e) => setName(e.target.value)} enterKeyHint="done" style={{ fontSize: 18 }} />
        <button type="submit" className="btn small" style={{ minWidth: 58 }} aria-label={t('addPlayer')}>
          +
        </button>
      </form>

      {players.length > 0 && (
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {players.map((p) => (
            <button
              key={p.id}
              className="chip"
              style={{ borderColor: p.color, color: p.color, fontSize: 16, minHeight: 42, animation: 'pop 0.3s cubic-bezier(0.2, 1.6, 0.4, 1)' }}
              onClick={() => {
                sfx.tap()
                removePlayer(p.id)
              }}
            >
              {p.name} ✕
            </button>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <>
          <div className="muted" style={{ fontSize: 14 }}>
            {L(TXT.quick)}
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
            {suggestions.map((s, i) => (
              <button key={s} className="chip" style={{ fontSize: 16, minHeight: 46, animation: `card-in 0.4s cubic-bezier(0.2, 1.3, 0.4, 1) ${i * 50}ms both` }} onClick={() => add(s)}>
                + {s}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="grow" />
      {players.length < 2 && <div className="center muted">{t('needPlayers', { n: 2 })}</div>}
      <button className="btn block" disabled={players.length < 2} onClick={toMode}>
        {L(TXT.next)}
      </button>
      <button className="btn block secondary small" onClick={toMode}>
        {L(TXT.skip)}
      </button>
    </div>
  )
}

function Dots({ step }: { step: number }) {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
      {[0, 1].map((i) => (
        <span key={i} style={{ width: i === step ? 26 : 10, height: 10, borderRadius: 99, background: i === step ? 'var(--pink)' : 'var(--surface-2)', transition: 'width 0.3s' }} />
      ))}
    </div>
  )
}
