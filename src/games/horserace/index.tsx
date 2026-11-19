import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameShell, ResultCard } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { fmt, useT } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { usePlayers, type Player } from '../../core/store'
import { createDeck, shuffle } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import {
  ACCENT,
  ALL_CARDS,
  GOAL,
  LANE_X,
  LOSER_SPOT,
  PODIUM_SPOTS,
  SIDE_COUNT,
  START_Z,
  STEP,
  SUITS,
  T,
  randomLine,
  type Card,
  type LineKind,
} from './data'
import { Horse, type HorseTarget, type World } from './Horse'
import { CameraRig, Confetti, Crowd, Gate, Podium, SceneTuning, SideCards, Track, type CamMode } from './scene'

type Phase = 'bets' | 'countdown' | 'race' | 'photo' | 'podium'

interface Bet {
  suit: number
  amount: number
}

interface RaceState {
  pos: number[]
  /** Draw number at which each horse reached its current square (tie-breaker: first there ranks higher). */
  reached: number[]
  stumbles: number[]
  side: Card[]
  flipped: boolean[]
  card: Card | null
  cardKey: number
  winner: number | null
  order: number[]
}

interface ResultRow {
  player: Player
  bet: Bet
  won: boolean
  text: string
}

const GUESTS: Player[] = [
  { id: 'guest-a', name: '🍻 A', color: '#ffd23d' },
  { id: 'guest-b', name: '🍻 B', color: '#3dd6ff' },
]
const HORSES = [0, 1, 2, 3]

function newRace() {
  const cards = shuffle(ALL_CARDS)
  const side = cards.slice(0, SIDE_COUNT)
  const deck = createDeck(cards.slice(SIDE_COUNT))
  const race: RaceState = {
    pos: [0, 0, 0, 0],
    reached: [0, 0, 0, 0],
    stumbles: [0, 0, 0, 0],
    side,
    flipped: side.map(() => false),
    card: null,
    cardKey: 0,
    winner: null,
    order: HORSES,
  }
  return { race, deck }
}

const leaderOf = (pos: number[], reached: number[]) =>
  HORSES.reduce((best, s) => (pos[s] > pos[best] || (pos[s] === pos[best] && reached[s] < reached[best]) ? s : best), 0)

const CSS = `
@keyframes hr-pop { 0% { transform: scale(.3) rotate(-10deg); opacity: 0 } 60% { transform: scale(1.12) rotate(2deg); opacity: 1 } 100% { transform: none } }
@keyframes hr-flip { 0% { transform: perspective(400px) rotateY(90deg) scale(1.3) } 100% { transform: perspective(400px) rotateY(0) scale(1) } }
@keyframes hr-count { 0% { transform: scale(2.4); opacity: 0 } 25% { transform: scale(1); opacity: 1 } 80% { opacity: 1 } 100% { transform: scale(.85); opacity: 0 } }
@keyframes hr-flash { 0% { opacity: .95 } 100% { opacity: 0 } }
@keyframes hr-blink { 50% { opacity: .55 } }
`

export default function HorseRace({ onExit }: GameProps) {
  const { L } = useT()
  const penalty = usePenalty()
  const stored = usePlayers()
  const players = stored.length >= 2 ? stored : GUESTS

  const [phase, setPhase] = useState<Phase>('bets')
  const [bets, setBets] = useState<Record<string, Bet>>(() => Object.fromEntries(players.map((p, i) => [p.id, { suit: i % 4, amount: 2 }])))
  const [race, setRace] = useState<RaceState>(() => newRace().race)
  const [count, setCount] = useState(-1)
  const [round, setRound] = useState(0)
  const [auto, setAuto] = useState(false)
  const [flash, setFlash] = useState(0)
  const [line, setLine] = useState<{ text: string; key: number } | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])

  const deck = useRef(createDeck(ALL_CARDS))
  const world = useRef<World>({ timeScale: 1, horseZ: HORSES.map(() => START_Z), excitement: 0.2 })
  const busy = useRef(false)
  const drawNo = useRef(0)
  const stretchSaid = useRef<boolean[]>([false, false, false, false])
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => void timers.current.push(window.setTimeout(fn, ms))
  const clearTimers = () => timers.current.splice(0).forEach((id) => clearTimeout(id))
  useEffect(() => {
    const list = timers.current
    return () => list.forEach((id) => clearTimeout(id))
  }, [])

  const horseName = (s: number) => `${SUITS[s].sym} ${L(SUITS[s].name)}`
  const say = (kind: LineKind, s = 0) => setLine((prev) => ({ text: fmt(L(randomLine(kind)), { h: horseName(s) }), key: (prev?.key ?? 0) + 1 }))
  const betOf = (p: Player, i: number): Bet => bets[p.id] ?? { suit: i % 4, amount: 2 }

  const startRace = () => {
    clearTimers()
    const r = newRace()
    deck.current = r.deck
    setRace(r.race)
    busy.current = false
    drawNo.current = 0
    stretchSaid.current = [false, false, false, false]
    world.current.timeScale = 1
    setRound((n) => n + 1)
    setResults([])
    setLine(null)
    setPhase('countdown')
    setCount(3)
    sfx.tick()
    vibrate(20)
    later(() => {
      setCount(2)
      sfx.tick()
      vibrate(20)
    }, 800)
    later(() => {
      setCount(1)
      sfx.tick()
      vibrate(20)
    }, 1600)
    later(() => {
      setCount(0)
      sfx.horn()
      vibrate([60, 30, 60])
      setPhase('race')
      say('start')
      sfx.cheer(1.4)
      world.current.excitement = 1
    }, 2400)
    later(() => setCount(-1), 3300)
  }

  const finish = (winner: number, pos: number[]) => {
    busy.current = true
    setPhase('photo')
    world.current.timeScale = 0.25
    const close = pos.some((p, i) => i !== winner && p >= GOAL - 1)
    say(close ? 'photo' : 'finish', winner)
    sfx.drumroll(2.2)
    later(() => {
      setFlash((f) => f + 1)
      sfx.shutter()
      vibrate(40)
    }, 2300)
    later(() => {
      world.current.timeScale = 1
      const rows = players.map((player, i) => {
        const bet = betOf(player, i)
        const won = bet.suit === winner
        if (!won && !player.id.startsWith('guest')) penalty.apply(player.id, bet.amount)
        return { player, bet, won, text: won ? penalty.give(Math.min(bet.amount * 2, 5)) : penalty.drink(bet.amount) }
      })
      setResults(rows)
      setPhase('podium')
      say('finish', winner)
      sfx.win()
      sfx.cheer(2.4)
      vibrate([60, 40, 120])
      world.current.excitement = 1
      busy.current = false
    }, 3100)
  }

  const draw = () => {
    if (phase !== 'race' || busy.current || race.winner !== null) return
    const card = deck.current.draw()
    const s = card.suit
    const n = ++drawNo.current
    sfx.flip()
    vibrate(15)
    sfx.gallop()

    const pos = [...race.pos]
    pos[s] = Math.min(GOAL, pos[s] + 1)
    const reached = [...race.reached]
    reached[s] = n
    const next: RaceState = { ...race, pos, reached, card, cardKey: n }

    if (pos[s] >= GOAL) {
      next.winner = s
      next.order = [...HORSES].sort((a, b) => pos[b] - pos[a] || reached[a] - reached[b])
      setRace(next)
      finish(s, pos)
      return
    }

    const before = leaderOf(race.pos, race.reached)
    const lead = leaderOf(pos, reached)
    const sole = pos.every((p, i) => i === lead || p < pos[lead])
    if (lead === s && lead !== before && sole) {
      say('overtake', s)
      sfx.cheer(1.2)
      world.current.excitement = 1
    } else if (pos[s] === GOAL - 1 && !stretchSaid.current[s]) {
      stretchSaid.current[s] = true
      say('stretch', s)
      world.current.excitement = 0.8
    } else if (Math.random() < 0.35) say('advance', s)
    setRace(next)

    // Hurdle: once every horse has passed checkpoint k, its card flips and that suit steps back.
    const k = Math.min(...pos)
    if (k >= 1 && k <= SIDE_COUNT && !next.flipped[k - 1]) {
      busy.current = true
      const victim = next.side[k - 1].suit
      later(() => {
        sfx.reveal()
        vibrate(20)
        setRace((r) => ({ ...r, flipped: r.flipped.map((f, i) => (i === k - 1 ? true : f)) }))
      }, 650)
      later(() => {
        const rn = ++drawNo.current
        sfx.thud()
        vibrate([30, 30, 30])
        setRace((r) => {
          if (r.pos[victim] === 0) return r
          const p2 = [...r.pos]
          p2[victim] -= 1
          const re = [...r.reached]
          re[victim] = rn
          const st = [...r.stumbles]
          st[victim] += 1
          return { ...r, pos: p2, reached: re, stumbles: st }
        })
        say('setback', victim)
        busy.current = false
      }, 1250)
    }
  }

  const drawRef = useRef(draw)
  drawRef.current = draw
  useEffect(() => {
    if (!auto || phase !== 'race') return
    const id = window.setInterval(() => drawRef.current(), 1250)
    return () => window.clearInterval(id)
  }, [auto, phase])

  const targetFor = (s: number): HorseTarget => {
    if (phase === 'podium') {
      const place = race.order.indexOf(s)
      if (place >= 0 && place < 3) return PODIUM_SPOTS[place]
      if (place === 3) return LOSER_SPOT
    }
    const p = race.pos[s]
    return { x: LANE_X[s], y: 0, z: START_Z + p * STEP + (p >= GOAL ? 0.9 : 0) }
  }

  const camMode: CamMode = phase === 'bets' ? 'bets' : phase === 'photo' ? 'photo' : phase === 'podium' ? 'podium' : 'race'
  const winner = race.winner

  const setBet = (id: string, patch: Partial<Bet>, i: number) => {
    sfx.tap()
    setBets((b) => ({ ...b, [id]: { ...(b[id] ?? { suit: i % 4, amount: 2 }), ...patch } }))
  }

  const scene = (
    <Stage accent={ACCENT} table={false} camera={{ position: [0.6, 3.1, START_Z + 5.4], fov: 50 }}>
      <SceneTuning />
      <Track finishText={L(T.finish)} world={world} />
      <Gate open={phase === 'race' || phase === 'photo' || phase === 'podium'} />
      <Crowd world={world} />
      <SideCards cards={race.side} flipped={race.flipped} />
      <Podium visible={phase === 'podium'} />
      <Confetti active={phase === 'podium'} />
      {HORSES.map((s) => (
        <Horse
          key={s}
          suit={s}
          target={targetFor(s)}
          world={world}
          stumble={race.stumbles[s]}
          celebrate={phase === 'podium' && winner === s}
          sad={phase === 'podium' && race.order[3] === s}
          snapKey={round}
        />
      ))}
      <CameraRig mode={camMode} world={world} />
    </Stage>
  )

  const top =
    line && phase !== 'bets' ? (
      <div key={line.key} style={styles.ticker}>
        🎙️ {line.text}
      </div>
    ) : null

  let bottom = null
  if (phase === 'race' || phase === 'countdown') {
    bottom = (
      <>
        <div style={styles.hurdles}>
          <span className="muted" style={{ fontSize: 13, marginRight: 4 }}>
            🚧 {L(T.hurdles)}
          </span>
          {race.side.map((c, i) => (
            <MiniCard key={i} card={race.flipped[i] ? c : null} />
          ))}
        </div>
        <div className="row" style={{ alignItems: 'stretch' }}>
          <BigCard card={race.card} animKey={race.cardKey} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
            <button className="btn yellow block" disabled={phase !== 'race'} onClick={() => drawRef.current()}>
              🃏 {L(T.flip)}
            </button>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <button
                className={'chip' + (auto ? ' active' : '')}
                style={{ minHeight: 40, fontSize: 16, ...(auto ? { background: ACCENT } : null) }}
                onClick={() => {
                  sfx.tap()
                  setAuto((a) => !a)
                }}
              >
                {auto ? '⏸' : '⏩'} {L(T.auto)}
              </button>
              <span className="muted" style={{ fontSize: 13 }}>
                👆 {L(T.tapHint)}
              </span>
            </div>
          </div>
        </div>
      </>
    )
  } else if (phase === 'podium' && winner !== null) {
    const anyWinner = results.some((r) => r.won)
    bottom = (
      <>
        <ResultCard
          animKey={`win-${round}`}
          color={SUITS[winner].color}
          who="🏆"
          big={`${horseName(winner)} ${L(T.wins)}`}
          sub={
            <div style={{ maxHeight: '26vh', overflowY: 'auto', display: 'grid', gap: 6, marginTop: 6, textAlign: 'left' }}>
              {results.map((r) => (
                <div key={r.player.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
                  <span className="dot" style={{ color: r.player.color, background: r.player.color }} />
                  <b style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.player.name}</b>
                  <span style={{ color: SUITS[r.bet.suit].color, whiteSpace: 'nowrap' }}>
                    {SUITS[r.bet.suit].sym}×{r.bet.amount}
                  </span>
                  <span style={{ marginLeft: 'auto', textAlign: 'right', color: r.won ? 'var(--green)' : 'var(--yellow)' }}>
                    {r.won ? '🎉 ' : ''}
                    {r.text}
                  </span>
                </div>
              ))}
              {!anyWinner && <div className="muted center">{L(T.nobody)}</div>}
            </div>
          }
        />
        <div className="row">
          <button className="btn yellow grow" onClick={startRace}>
            {L(T.rematch)}
          </button>
          <button
            className="btn secondary small"
            onClick={() => {
              sfx.tap()
              clearTimers()
              setRace(newRace().race)
              setRound((n) => n + 1)
              setLine(null)
              setPhase('bets')
            }}
          >
            {L(T.newBets)}
          </button>
        </div>
      </>
    )
  }

  const overlay = (
    <>
      <style>{CSS}</style>
      {phase === 'bets' && (
        <div style={styles.betsWrap}>
          <div className="sheet" style={{ maxHeight: '64vh', padding: '18px 14px calc(var(--safe-bottom) + 16px)' }}>
            <h2 className="center" style={{ fontSize: 26, marginBottom: 2 }}>
              {L(T.betsTitle)}
            </h2>
            <div className="muted center" style={{ fontSize: 14, marginBottom: 10 }}>
              {L(T.betsHint)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
              {SUITS.map((s, i) => (
                <span key={i} className="chip" style={{ borderColor: s.color, color: s.color, fontSize: 13, padding: '5px 10px' }}>
                  {i + 1} · {s.sym} {L(s.name)}
                </span>
              ))}
            </div>
            <div className="list" style={{ gap: 8 }}>
              {players.map((p, i) => {
                const b = betOf(p, i)
                return (
                  <div key={p.id} className="list-item" style={{ padding: '8px 8px 8px 10px', gap: 8 }}>
                    <span className="dot" style={{ color: p.color, background: p.color }} />
                    <b style={{ flex: 1, minWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16 }}>{p.name}</b>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {SUITS.map((s, si) => (
                        <button key={si} aria-label={L(s.name)} style={suitBtn(b.suit === si, s.color)} onClick={() => setBet(p.id, { suit: si }, i)}>
                          {s.sym}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <button style={styles.step} disabled={b.amount <= 1} onClick={() => setBet(p.id, { amount: Math.max(1, b.amount - 1) }, i)}>
                        −
                      </button>
                      <span style={styles.amount} aria-label={L(T.bet)}>
                        {b.amount}
                      </span>
                      <button style={styles.step} disabled={b.amount >= 5} onClick={() => setBet(p.id, { amount: Math.min(5, b.amount + 1) }, i)}>
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="btn yellow block" style={{ marginTop: 14 }} onClick={startRace}>
              {L(T.go)}
            </button>
          </div>
        </div>
      )}
      {phase === 'race' && <div style={styles.tapZone} onClick={() => drawRef.current()} />}
      {count >= 0 && (
        <div style={styles.center}>
          <div key={count} style={{ ...styles.count, color: count === 0 ? ACCENT : '#fff' }}>
            {count === 0 ? L(T.goShort) : count}
          </div>
        </div>
      )}
      {phase === 'photo' && (
        <div style={styles.photo}>
          <span>{L(T.photo)}</span>
        </div>
      )}
      {flash > 0 && phase !== 'bets' && <div key={flash} style={styles.flash} />}
    </>
  )

  return <GameShell gameId="horserace" onExit={onExit} scene={scene} top={top} bottom={bottom} overlay={overlay} />
}

function BigCard({ card, animKey }: { card: Card | null; animKey: number }) {
  if (!card)
    return (
      <div style={{ ...styles.card, background: 'linear-gradient(160deg, #2a1050, #12061f)', border: `3px solid ${ACCENT}`, fontSize: 40 }}>🏇</div>
    )
  const s = SUITS[card.suit]
  return (
    <div key={animKey} style={{ ...styles.card, color: s.ink, boxShadow: `0 0 28px ${s.color}`, animation: 'hr-flip .35s cubic-bezier(.2,1.4,.4,1)' }}>
      <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 20, lineHeight: 1 }}>{card.rank}</span>
      <span style={{ fontSize: 52, lineHeight: 1 }}>{s.sym}</span>
    </div>
  )
}

function MiniCard({ card }: { card: Card | null }) {
  if (!card) return <div style={{ ...styles.mini, background: 'linear-gradient(160deg, #3a1a6a, #1a0b2e)', border: `2px solid ${ACCENT}` }} />
  const s = SUITS[card.suit]
  return (
    <div style={{ ...styles.mini, color: s.ink, animation: 'hr-pop .4s ease-out' }}>
      <span style={{ fontSize: 15, lineHeight: 1 }}>{s.sym}</span>
    </div>
  )
}

const suitBtn = (active: boolean, color: string): CSSProperties => ({
  width: 38,
  height: 42,
  borderRadius: 12,
  fontSize: 22,
  lineHeight: 1,
  display: 'grid',
  placeItems: 'center',
  background: active ? color : 'rgba(255,255,255,0.06)',
  color: active ? '#14081f' : color,
  border: `2px solid ${active ? '#fff' : color + '66'}`,
  boxShadow: active ? `0 0 16px ${color}` : 'none',
  transform: active ? 'scale(1.06)' : 'none',
  transition: 'transform .12s',
})

const styles: Record<string, CSSProperties> = {
  ticker: {
    alignSelf: 'center',
    marginTop: 8,
    maxWidth: '100%',
    padding: '8px 16px',
    borderRadius: 18,
    background: 'rgba(0,0,0,0.5)',
    border: `2px solid ${ACCENT}`,
    fontSize: 16,
    textAlign: 'center',
    backdropFilter: 'blur(8px)',
    animation: 'hr-pop .4s cubic-bezier(.2,1.5,.4,1)',
  },
  hurdles: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 16,
    background: 'rgba(0,0,0,0.4)',
    alignSelf: 'center',
  },
  card: {
    position: 'relative',
    width: 78,
    minHeight: 108,
    borderRadius: 14,
    background: '#fffaf0',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'var(--font-display)',
    flex: 'none',
  },
  mini: {
    width: 26,
    height: 36,
    borderRadius: 6,
    background: '#fffaf0',
    display: 'grid',
    placeItems: 'center',
    fontFamily: 'var(--font-display)',
  },
  betsWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', zIndex: 20 },
  step: {
    width: 34,
    height: 42,
    borderRadius: 12,
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    fontSize: 22,
    lineHeight: 1,
  },
  amount: { width: 24, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 24, color: ACCENT },
  tapZone: { position: 'absolute', left: 0, right: 0, top: 'calc(var(--safe-top) + 120px)', bottom: '42%', zIndex: 5 },
  center: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', zIndex: 30 },
  count: {
    fontFamily: 'var(--font-display)',
    fontSize: 120,
    lineHeight: 1,
    textShadow: `0 0 30px ${ACCENT}, 0 6px 0 rgba(0,0,0,.4)`,
    animation: 'hr-count .8s ease-out forwards',
  },
  photo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 30,
    fontFamily: 'var(--font-display)',
    fontSize: 34,
    color: '#fff',
    textShadow: '0 0 20px #000, 0 0 40px rgba(255,210,61,.8)',
    animation: 'hr-blink .5s steps(2) infinite',
  },
  flash: { position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none', zIndex: 40, animation: 'hr-flash .6s ease-out forwards' },
}
