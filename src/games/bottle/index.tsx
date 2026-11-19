import { useMemo, useRef, useState } from 'react'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { PackLockSheet, usePack } from '../../ui/PackLock'
import { BarTable, Stage } from '../../three/Stage'
import { fmt, useT } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { useApp, usePlayers } from '../../core/store'
import { createDeck, pick, rand } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import { showHolidayContent } from '../../core/season'
import type { GameProps } from '../../core/types'
import { BottleScene } from './scene'
import { HOLIDAY_PROMPTS } from './holiday'
import { KIND_LABEL, NEIGHBOUR, PROMPTS, REFUSE, SPICY_PROMPTS, type BottlePrompt } from './prompts'
import { ACCENT, GENERIC_SEATS, newSim, SPICY_LABEL, SPICY_PACK_TITLE, SPIN, SPIN_AGAIN, SWIPE_HINT, TABLE_RADIUS, type BottleSim, type Seat } from './sim'

const BACKGROUND = '#0b0614'

interface Result {
  id: number
  seat: Seat
  prompt: BottlePrompt
  text: string
  /** Computed once: in "dares" mode the penalty text is random. */
  penaltyLine: string
}

export default function BottleGame({ onExit }: GameProps) {
  const { L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const players = usePlayers()
  const spicyOn = useApp((s) => s.spicy)
  const pack = usePack('bottle-spicy')
  const spicyActive = spicyOn && pack.unlocked
  const [showLock, setShowLock] = useState(false)

  const seats = useMemo<Seat[]>(
    () => (players.length ? players.map((p) => ({ id: p.id, label: p.name, color: p.color, playerId: p.id })) : GENERIC_SEATS),
    [players],
  )
  const holiday = useMemo(() => showHolidayContent(), [])
  const deck = useMemo(
    () => createDeck([...PROMPTS, ...(holiday ? HOLIDAY_PROMPTS : []), ...(spicyActive ? SPICY_PROMPTS : [])]),
    [spicyActive, holiday],
  )

  const sim = useRef<BottleSim>(newSim())
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [winner, setWinner] = useState(-1)
  const [fire, setFire] = useState(0)
  const [hint, setHint] = useState(true)
  const count = useRef(0)

  const startSpin = (omega: number) => {
    const s = sim.current
    if (s.mode === 'spin') return
    s.omega = omega
    s.mode = 'spin'
    s.winner = -1
    setWinner(-1)
    setResult(null)
    setSpinning(true)
    setHint(false)
    sfx.whoosh()
    vibrate(25)
  }
  const spinRandom = () => startSpin((Math.random() < 0.5 ? -1 : 1) * rand(13, 24))

  const onGrab = () => {
    if (sim.current.mode === 'spin') return false
    sim.current.winner = -1
    setWinner(-1)
    setResult(null)
    sfx.tap()
    vibrate(10)
    return true
  }
  const onRelease = (omega: number | null) => (omega === null ? spinRandom() : startSpin(omega))

  const onTick = (_seat: number, speed: number) => {
    const s = sim.current
    const now = performance.now()
    if (now - s.lastTick < 38) return
    s.lastTick = now
    sfx.tick()
    if (speed < 9) vibrate(5)
  }

  const onStop = (index: number) => {
    const seat = seats[index]
    const prompt = deck.draw()
    const others = players.filter((p) => p.id !== seat.playerId)
    const other = others.length ? pick(others).name : L(NEIGHBOUR)
    const penaltyLine = prompt.target === 'give' ? penalty.give(prompt.n) : prompt.target === 'all' ? penalty.all(prompt.n) : penalty.drink(prompt.n)
    if (prompt.kind === 'penalty' && prompt.target === 'self') penalty.apply(seat.playerId, prompt.n)
    // Classic rule: whoever the bottle points at spins next.
    const pi = turn.players.findIndex((p) => p.id === seat.playerId)
    if (pi >= 0) turn.setIndex(pi)
    sim.current.winner = index
    setWinner(index)
    setFire((f) => f + 1)
    setSpinning(false)
    setResult({ id: ++count.current, seat, prompt, text: fmt(L(prompt.text), { other }), penaltyLine })
    sfx.reveal()
    vibrate([40, 40, 90])
  }

  return (
    <GameShell
      gameId="bottle"
      onExit={onExit}
      scene={
        <Stage
          accent={ACCENT}
          table={false}
          camera={{ position: [0, 11, 5.87], fov: 50 }}
          fog={[20, 45]}
          fit={{ width: (TABLE_RADIUS + 0.12) * 2, height: TABLE_RADIUS * 1.9, hudTop: 0.16, hudBottom: 0.4 }}
        >
          <BarTable accent={ACCENT} radius={TABLE_RADIUS} />
          {/* The steep top-down view sees BarTable's lit floor as grey: cover it with unlit brand background. */}
          <mesh rotation-x={-Math.PI / 2} position-y={-0.55}>
            <planeGeometry args={[120, 120]} />
            <meshBasicMaterial color={BACKGROUND} />
          </mesh>
          <BottleScene festive={holiday} seats={seats} sim={sim} onGrab={onGrab} onRelease={onRelease} onTick={onTick} onStop={onStop} fire={fire} winner={winner} />
        </Stage>
      }
      top={
        <>
          {players.length > 0 && <TurnPill player={turn.current} />}
          {spicyOn && (
            <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
              <button
                className={'chip big' + (spicyActive ? ' active' : '')}
                style={spicyActive ? { background: '#ff5c5c' } : undefined}
                onClick={() => {
                  sfx.tap()
                  if (!pack.unlocked) setShowLock(true)
                }}
              >
                🌶️ {L(SPICY_LABEL)} {spicyActive ? '✓' : '🔒'}
              </button>
            </div>
          )}
        </>
      }
      bottom={
        <>
          {result && (
            <ResultCard
              animKey={result.id}
              who={
                <span style={{ color: result.seat.color, fontSize: 18, fontWeight: 900 }}>
                  🍾 {result.seat.label}
                  {result.prompt.spicy ? ' 🌶️' : ''}
                  {result.prompt.seasonal ? ' 🎄' : ''}
                </span>
              }
              big={L(KIND_LABEL[result.prompt.kind])}
              sub={
                <>
                  <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{result.text}</div>
                  {result.prompt.kind === 'penalty' ? (
                    <div style={{ fontSize: 22, color: 'var(--yellow)', marginTop: 8 }}>{result.penaltyLine}</div>
                  ) : (
                    <div className="muted" style={{ marginTop: 8 }}>
                      {L(REFUSE)} <b style={{ color: 'var(--yellow)' }}>{result.penaltyLine}</b>
                    </div>
                  )}
                </>
              }
            />
          )}
          {hint && !spinning && !result && (
            <div className="muted center" style={{ fontWeight: 800 }}>
              {L(SWIPE_HINT)}
            </div>
          )}
          <button
            className="btn block"
            style={{ background: 'linear-gradient(180deg, #8dffbb, #3dff8b)', boxShadow: '0 6px 0 #138a45, 0 12px 30px rgba(61,255,139,0.4)' }}
            disabled={spinning}
            onClick={spinRandom}
          >
            {spinning ? '🍾 …' : `🍾 ${L(result ? SPIN_AGAIN : SPIN)}`}
          </button>
        </>
      }
      overlay={showLock && <PackLockSheet packId="bottle-spicy" title={L(SPICY_PACK_TITLE)} onClose={() => setShowLock(false)} />}
    />
  )
}
