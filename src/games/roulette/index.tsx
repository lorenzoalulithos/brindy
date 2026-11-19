import { useEffect, useRef, useState } from 'react'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { fmt, useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { pick, randInt } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { ACCENT, GLASSES, RouletteScene, type Phase, type Reveal } from './scene'
import { CURSED_SUB, CURSED_TITLE, SAFE, SUSPENSE, T } from './text'

const CURSE_PENALTY = 3
const fresh = () => Array.from({ length: GLASSES }, () => false)

interface Message {
  title: Loc
  sub?: Loc
  next?: string
  penalty?: string
  key: number
}

export default function ShotRoulette({ onExit }: GameProps) {
  const { L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const [phase, setPhase] = useState<Phase>('shuffle')
  const [round, setRound] = useState(0)
  const [tipped, setTipped] = useState<boolean[]>(fresh)
  const [lifted, setLifted] = useState<number | null>(null)
  const [reveal, setReveal] = useState<Reveal>(null)
  const [msg, setMsg] = useState<Message | null>(null)
  const cursed = useRef(0)
  const msgKey = useRef(0)
  const timers = useRef<number[]>([])

  const later = (fn: () => void, ms: number) => void timers.current.push(window.setTimeout(fn, ms))
  useEffect(() => {
    const list = timers.current
    return () => list.forEach((id) => clearTimeout(id))
  }, [])

  const show = (m: Omit<Message, 'key'>) => setMsg({ ...m, key: ++msgKey.current })
  const remaining = GLASSES - tipped.filter(Boolean).length
  // Computed locally (useTurn has no peek): who plays after the current player.
  const nextPlayer = turn.players[(turn.index + 1) % turn.players.length]

  const onShuffled = () => {
    // The curse is decided only after the shuffle: nobody can track it.
    cursed.current = randInt(0, GLASSES - 1)
    while (tipped[cursed.current]) cursed.current = randInt(0, GLASSES - 1)
    setPhase('pick')
    sfx.reveal()
    vibrate(20)
  }

  const choose = (id: number) => {
    if (phase !== 'pick' || tipped[id]) return
    const player = turn.current
    sfx.tap()
    vibrate(25)
    setLifted(id)
    setPhase('lift')
    show({ title: pick(SUSPENSE) })
    sfx.drumroll(1.5)
    if (id === cursed.current) later(() => sfx.fuse(0.45), 1150)
    later(() => {
      if (id === cursed.current) {
        setReveal('cursed')
        setPhase('cursed')
        sfx.boom()
        vibrate([220, 80, 220, 80, 320])
        penalty.apply(player.id, CURSE_PENALTY)
        show({ title: CURSED_TITLE, sub: pick(CURSED_SUB), penalty: penalty.drink(CURSE_PENALTY) })
        return
      }
      setReveal('safe')
      setPhase('safe')
      sfx.win()
      sfx.cheer(0.9)
      vibrate(40)
      show({ title: pick(SAFE), sub: T.safeSub, next: nextPlayer.name })
      const left = tipped.filter((v, i) => !v && i !== id).length
      later(() => {
        setTipped((arr) => arr.map((v, i) => v || i === id))
        setLifted(null)
        setReveal(null)
        sfx.thud()
      }, 1200)
      later(() => {
        turn.next()
        setMsg(null)
        setPhase('pick')
      }, 2300)
      // Only the cursed glass is left: no point making anyone tap it.
      if (left === 1) later(() => chooseRef.current(cursed.current), 3300)
    }, 1600)
  }

  const chooseRef = useRef(choose)
  chooseRef.current = choose

  const randomPick = () => {
    const free = tipped.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0)
    if (free.length) choose(pick(free))
  }

  const newRound = () => {
    sfx.whoosh()
    vibrate(20)
    turn.next()
    setTipped(fresh())
    setLifted(null)
    setReveal(null)
    setMsg(null)
    setRound((r) => r + 1)
    setPhase('shuffle')
  }

  const risk = Math.round(100 / remaining)

  let bottom = null
  if (phase === 'shuffle') {
    bottom = (
      <>
        <ResultCard animKey={`shuffle-${round}`} big="🔀" sub={L(T.shuffling)} color={ACCENT} />
        <button className="btn block" disabled>
          🥃 …
        </button>
      </>
    )
  } else if (phase === 'pick') {
    bottom = (
      <>
        <div className="result" style={{ padding: '12px 16px' }}>
          <div className="big" style={{ fontSize: 26 }}>
            {L(remaining === 1 ? T.lastGlass : T.pick)}
          </div>
        </div>
        <button className="btn block" disabled={remaining === 1} onClick={randomPick}>
          {L(T.random)}
        </button>
      </>
    )
  } else if (msg) {
    const isCursed = phase === 'cursed'
    bottom = (
      <>
        <ResultCard
          animKey={msg.key}
          color={isCursed ? ACCENT : phase === 'safe' ? '#3dff8b' : '#ffd23d'}
          who={turn.current.name}
          big={L(msg.title)}
          sub={
            <>
              {msg.penalty && <div style={{ fontSize: 24, color: 'var(--yellow)', fontFamily: 'var(--font-display)' }}>{msg.penalty}</div>}
              {msg.sub && <div className="muted">{L(msg.sub)}</div>}
              {msg.next && <div style={{ marginTop: 6, fontSize: 19, color: 'var(--green)' }}>👉 {fmt(L(T.nextUp), { name: msg.next })}</div>}
            </>
          }
        />
        {isCursed && (
          <button className="btn block" onClick={newRound}>
            {L(T.newRound)}
          </button>
        )}
      </>
    )
  }

  return (
    <GameShell
      gameId="roulette"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 6.8, 6.4], fov: 46 }}>
          <RouletteScene phase={phase} lifted={lifted} tipped={tipped} reveal={reveal} shuffleKey={round} onShuffled={onShuffled} onPick={choose} />
        </Stage>
      }
      top={
        <>
          <TurnPill player={turn.current} />
          <div
            key={remaining}
            className="chip"
            style={{
              alignSelf: 'center',
              marginTop: 8,
              background: 'rgba(0,0,0,0.45)',
              borderColor: remaining <= 2 ? ACCENT : 'var(--border)',
              color: remaining <= 2 ? ACCENT : undefined,
              animation: 'pop .35s cubic-bezier(.2,1.6,.4,1)',
            }}
          >
            ☠️ {L(T.risk)}: 1/{remaining} · {risk}%
          </div>
        </>
      }
      bottom={bottom}
    />
  )
}
