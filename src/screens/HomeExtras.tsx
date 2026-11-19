import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { fmt, useT } from '../core/i18n'
import { useApp } from '../core/store'
import { sfx, vibrate } from '../core/feedback'
import { pick } from '../core/random'
import { promptInstall, useInstallOffer } from '../core/install'
import { GAMES, daysUntilRelease } from '../games/registry'
import { REVIEW_BUILD } from '../core/appInfo'
import { ScoreboardSheet } from '../ui/Scoreboard'
import { S } from '../ui/strings'

const releaseTime = (releaseAt: string) => new Date(releaseAt + 'T00:00:00').getTime()

/** One tap: shuffles game emojis like a slot machine for ~1s, then opens a random playable game. */
export function PartyMixButton() {
  const { L } = useT()
  const players = useApp((s) => s.players)
  const go = useApp((s) => s.go)
  const [face, setFace] = useState('🎲')
  const [rolling, setRolling] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const roll = () => {
    if (rolling) return
    const released = GAMES.filter((g) => daysUntilRelease(g) === 0)
    const eligible = released.filter((g) => players.length >= g.minPlayers)
    if (!eligible.length) {
      sfx.tap()
      go({ name: 'players' })
      return
    }
    const target = pick(eligible)
    setRolling(true)
    vibrate(30)
    let t = 0
    for (let i = 0, delay = 45; t + delay < 1000; i++, delay *= 1.12) {
      t += delay
      timers.current.push(
        setTimeout(() => {
          setFace(released[(i + Math.floor(Math.random() * released.length)) % released.length].emoji)
          sfx.tick()
        }, t),
      )
    }
    timers.current.push(
      setTimeout(() => {
        setFace(target.emoji)
        sfx.reveal()
        vibrate([30, 30, 60])
      }, t + 60),
      setTimeout(() => {
        setRolling(false)
        setFace('🎲')
        go({ name: 'game', id: target.id })
      }, t + 520),
    )
  }

  return (
    <button
      className="btn block"
      onClick={roll}
      style={{
        minHeight: 76,
        justifyContent: 'flex-start',
        gap: 14,
        padding: '0 18px',
        background: 'linear-gradient(100deg, #ff6aa6, #ffd23d 55%, #3dd6ff)',
        boxShadow: '0 6px 0 #8a2f6b, 0 12px 30px rgba(255, 61, 139, 0.4)',
      }}
    >
      <span
        key={face + String(rolling)}
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
          fontSize: 34,
          background: 'rgba(26, 11, 22, 0.85)',
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)',
          animation: rolling ? 'pop 0.12s ease-out' : undefined,
          flex: 'none',
        }}
      >
        {face}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontSize: 26 }}>{L(S.partyMix)}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 14, opacity: 0.75 }}>{L(S.partyMixSub)}</span>
      </span>
    </button>
  )
}

/** Weekly drip teaser: the next unreleased game with a live countdown. */
export function NextGameStrip() {
  const { L } = useT()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const next = GAMES.filter((g) => g.releaseAt && releaseTime(g.releaseAt) > now).sort((a, b) => releaseTime(a.releaseAt!) - releaseTime(b.releaseAt!))[0]
  // Review builds expose every game, so there's nothing "coming soon" to tease.
  if (!next || REVIEW_BUILD) return null
  const diff = releaseTime(next.releaseAt!) - now
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const when = d > 0 ? fmt(L(S.countdown), { d, h, m }) : fmt(L(S.countdownHours), { h, m })

  return (
    <div
      className="players-bar"
      style={
        {
          '--accent': next.color,
          border: '2px solid color-mix(in srgb, var(--accent) 55%, transparent)',
          background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 22%, transparent), var(--surface))',
        } as CSSProperties
      }
    >
      <span style={{ fontSize: 30, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>{next.emoji}</span>
      <span className="grow" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span className="muted" style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          🔒 {L(S.nextGame)}
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{L(next.name)}</span>
      </span>
      <span className="chip" style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
        ⏳ {when}
      </span>
    </div>
  )
}

/** "Add to home screen" card: after 2+ games, never in the native app, dismissal remembered. */
export function InstallCard() {
  const { L } = useT()
  const offer = useInstallOffer()
  const gamesPlayed = useApp((s) => s.gamesPlayed)
  const dismissed = useApp((s) => s.installDismissed)
  const dismiss = useApp((s) => s.dismissInstall)
  if (!offer || dismissed || gamesPlayed < 2) return null

  return (
    <div className="result" style={{ textAlign: 'left', '--accent': 'var(--cyan)' } as CSSProperties}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span style={{ fontSize: 34 }}>📲</span>
        <div className="grow">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{L(S.installTitle)}</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 2 }}>
            {L(S.installSub)}
          </div>
          {offer === 'ios' && <div style={{ fontSize: 15, marginTop: 8 }}>{L(S.iosHint)}</div>}
        </div>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {offer === 'prompt' && (
          <button
            className="btn cyan small"
            style={{ flex: 1 }}
            onClick={async () => {
              sfx.tap()
              if (await promptInstall()) dismiss()
            }}
          >
            {L(S.installBtn)}
          </button>
        )}
        <button
          className="btn secondary small"
          style={{ flex: offer === 'prompt' ? 'none' : 1 }}
          onClick={() => {
            sfx.tap()
            dismiss()
          }}
        >
          {L(S.notNow)}
        </button>
      </div>
    </div>
  )
}

/** Small 🏆 chip on Home, visible once anyone has penalty points. */
export function ScoreChip() {
  const { L } = useT()
  const points = useApp((s) => s.points)
  const [open, setOpen] = useState(false)
  const total = Object.values(points).reduce((a, b) => a + b, 0)
  if (total <= 0 && !open) return null
  return (
    <>
      <button
        className="chip"
        style={{ minHeight: 46 }}
        onClick={() => {
          sfx.tap()
          setOpen(true)
        }}
      >
        🏆 {L(S.scoreboard)}
      </button>
      {open && <ScoreboardSheet onClose={() => setOpen(false)} />}
    </>
  )
}
