import { useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { fmt, useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { shuffle } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { Card3D } from '../../three/cards/Card3D'
import { Sparks } from '../../three/cards/Sparks'
import { applyPose, blendPose, cardLabel, clonePose, fullDeck, pose, tableQuat, type PlayingCard, type Pose } from '../../three/cards/cards'

const ACCENT = '#c6ff3d'
const WRONG = '#ff3d5a'
const CAMERA: [number, number, number] = [0, 7, 6.2]
const HISTORY = 5
const SMALL = 0.58
const LAYER = 0.012
const SPARK_COLORS = ['#c6ff3d', '#ffffff', '#3dd6ff', '#ffd23d']

const CENTER: Pose = (() => {
  const o = new THREE.Object3D()
  o.position.set(0, 1.2, 0.9)
  o.lookAt(new THREE.Vector3(...CAMERA))
  return pose([0, 1.2, 0.9], o.quaternion.clone(), 1.2)
})()
const HISTORY_POSES: Pose[] = Array.from({ length: HISTORY }, (_, k) =>
  pose([-1.1 - k * 0.09, 0.02 + (HISTORY - k) * 0.006, -1.05 + k * 0.07], tableQuat(0.3 - k * 0.15, true), SMALL),
)
const DECK_X = 1.3
const DECK_Z = -1.15
const deckLayers = (n: number) => Math.max(1, Math.min(12, Math.ceil(n / 4)))
const deckTop = (n: number) => pose([DECK_X, deckLayers(n) * LAYER + 0.01, DECK_Z], tableQuat(-0.12, false), SMALL)

/** Ace high: A = 14. */
const value = (c: PlayingCard) => (c.rank === 1 ? 14 : c.rank)

const TXT = {
  higher: { it: 'Più alta', en: 'Higher', es: 'Mayor', fr: 'Plus haute', de: 'Höher' },
  lower: { it: 'Più bassa', en: 'Lower', es: 'Menor', fr: 'Plus basse', de: 'Tiefer' },
  streak: { it: 'Serie', en: 'Streak', es: 'Racha', fr: 'Série', de: 'Serie' },
  best: { it: 'Record', en: 'Best', es: 'Récord', fr: 'Record', de: 'Rekord' },
  note: {
    it: 'Asso = carta più alta · Pari = vince il banco',
    en: 'Ace is high · A tie means the house wins',
    es: 'El As es la más alta · Empate: gana la banca',
    fr: 'L’As est la plus forte · Égalité : la banque gagne',
    de: 'Ass ist am höchsten · Gleichstand: Die Bank gewinnt',
  },
  wrong: { it: 'Sbagliato! 💥', en: 'Wrong! 💥', es: '¡Fallaste! 💥', fr: 'Raté ! 💥', de: 'Daneben! 💥' },
  house: { it: 'vince il banco! 🏠', en: 'the house wins! 🏠', es: '¡gana la banca! 🏠', fr: 'la banque gagne ! 🏠', de: 'Die Bank gewinnt! 🏠' },
  lost: { it: 'Serie persa: {n}', en: 'Streak lost: {n}', es: 'Racha perdida: {n}', fr: 'Série perdue : {n}', de: 'Serie verloren: {n}' },
  pass: { it: 'Passa il mazzo', en: 'Pass the deck', es: 'Pasa el mazo', fr: 'Passe le paquet', de: 'Stapel weitergeben' },
} satisfies Record<string, Loc>

const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const _x = new THREE.Vector3()

/** A card that glides (with an arc) to `target` whenever it changes; it starts at `from`, flipping face-up on the way. */
function MovingCard({
  card,
  from,
  target,
  glow,
  glowStrength = 0,
  shake = 0,
  onArrive,
}: {
  card: PlayingCard
  from: Pose
  target: Pose
  glow?: string
  glowStrength?: number
  shake?: number
  onArrive?: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const [st] = useState(() => ({ from: clonePose(from), to: target, t: 0, flips: 1, lift: 1.3, cur: clonePose(from), arrived: false, flipped: false, shake, shakeT: 0, tiltX: 0, tiltY: 0 }))

  useFrame((state, dt) => {
    const g = ref.current
    if (!g) return
    const d = Math.min(dt, 1 / 30)
    if (target !== st.to) {
      st.from = clonePose(st.cur)
      st.to = target
      st.t = 0
      st.flips = 0
      st.lift = 0.5
      st.arrived = false
    }
    if (shake !== st.shake) {
      // only a rising counter shakes (a card leaving the center gets 0)
      if (shake > st.shake) st.shakeT = 1
      st.shake = shake
    }
    const time = state.clock.elapsedTime
    if (st.t < 1) {
      st.t = Math.min(1, st.t + d / (st.flips ? 0.75 : 0.5))
      blendPose(st.cur, st.from, st.to, st.t, st.lift, st.flips)
      if (st.flips && !st.flipped && st.t > 0.4) {
        st.flipped = true
        sfx.flip()
      }
    } else {
      if (!st.arrived) {
        st.arrived = true
        onArrive?.()
      }
      if (st.to === CENTER) {
        st.tiltX += (-state.pointer.y * 0.25 - st.tiltX) * Math.min(1, d * 6)
        st.tiltY += (state.pointer.x * 0.35 - st.tiltY) * Math.min(1, d * 6)
        _e.set(st.tiltX + Math.sin(time * 1.1) * 0.03, st.tiltY + Math.sin(time * 1.4) * 0.04, 0)
        st.cur.quat.copy(CENTER.quat).multiply(_q.setFromEuler(_e))
        st.cur.pos.copy(CENTER.pos)
        st.cur.pos.y += Math.sin(time * 2) * 0.03
        st.cur.scale = CENTER.scale
      } else {
        st.cur.pos.copy(st.to.pos)
        st.cur.quat.copy(st.to.quat)
        st.cur.scale = st.to.scale
      }
    }
    applyPose(g, st.cur)
    if (st.shakeT > 0) {
      st.shakeT = Math.max(0, st.shakeT - d * 1.8)
      _x.set(1, 0, 0).applyQuaternion(st.cur.quat)
      g.position.addScaledVector(_x, Math.sin(st.shakeT * 42) * 0.12 * st.shakeT)
    }
  })

  return <Card3D ref={ref} card={card} accent={ACCENT} glow={glow} glowStrength={glowStrength} />
}

function DeckPile({ remaining }: { remaining: number }) {
  const layers = deckLayers(remaining)
  const base = deckTop(0)
  return (
    <group>
      {Array.from({ length: layers }, (_, i) => (
        <Card3D key={i} accent={ACCENT} position={[DECK_X + Math.sin(i * 2.3) * 0.012, (i + 0.5) * LAYER, DECK_Z + Math.cos(i * 1.7) * 0.012]} quaternion={base.quat} scale={SMALL} />
      ))}
    </group>
  )
}

interface Slot {
  id: number
  card: PlayingCard
  from: Pose
  /** -1 = center (current card), 0..HISTORY-1 = fanned history, newest first. */
  place: number
}

type Phase = 'deal' | 'ready' | 'flying' | 'wrong'

export default function HigherLower({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const [init] = useState(() => {
    const deck = shuffle(fullDeck())
    const first = deck.pop()!
    return { deck, slot: { id: 1, card: first, from: deckTop(deck.length + 1), place: -1 } as Slot }
  })
  const [deck, setDeck] = useState(init.deck)
  const [slots, setSlots] = useState<Slot[]>([init.slot])
  const [phase, setPhase] = useState<Phase>('deal')
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [burst, setBurst] = useState(0)
  const [shake, setShake] = useState(0)
  const [result, setResult] = useState<{ id: number; tie: boolean; lost: number; text: string; label: string } | null>(null)
  const seq = useRef(1)
  const dir = useRef<'up' | 'down'>('up')
  // Mirrors `phase` synchronously so double taps can't deal twice or pass the turn twice.
  const phaseRef = useRef<Phase>('deal')
  const go = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }

  const guess = (d: 'up' | 'down') => {
    if (phaseRef.current !== 'ready') return
    sfx.tap()
    let pile = deck
    if (!pile.length) {
      const visible = new Set(slots.map((s) => s.card.id))
      pile = shuffle(fullDeck().filter((c) => !visible.has(c.id)))
    }
    const next = pile[pile.length - 1]
    const from = deckTop(pile.length)
    setDeck(pile.slice(0, -1))
    dir.current = d
    setSlots((ss) => [...ss.map((s) => ({ ...s, place: s.place + 1 })).filter((s) => s.place < HISTORY), { id: ++seq.current, card: next, from, place: -1 }])
    go('flying')
    sfx.whoosh()
    vibrate(20)
  }

  const arrived = (slot: Slot) => {
    if (slot.place !== -1) return
    if (phaseRef.current === 'deal') return go('ready')
    if (phaseRef.current !== 'flying') return
    const prev = slots.find((s) => s.place === 0)
    if (!prev) return go('ready')
    const a = value(prev.card)
    const b = value(slot.card)
    const ok = dir.current === 'up' ? b > a : b < a
    if (ok) {
      const s = streak + 1
      setStreak(s)
      setBest((x) => Math.max(x, s))
      setBurst((x) => x + 1)
      if (s % 5 === 0) sfx.win()
      else sfx.reveal()
      vibrate(s >= 3 ? [30, 30, 30, 30, 60] : [30, 30, 60])
      go('ready')
    } else {
      const n = Math.max(1, Math.min(streak, 5))
      penalty.apply(turn.current.id, n)
      setResult({ id: slot.id, tie: a === b, lost: streak, text: penalty.drink(n), label: `${cardLabel(prev.card)} → ${cardLabel(slot.card)}` })
      setShake((x) => x + 1)
      sfx.lose()
      vibrate([80, 40, 160])
      go('wrong')
    }
  }

  const nextPlayer = () => {
    if (phaseRef.current !== 'wrong') return
    sfx.tap()
    turn.next()
    setStreak(0)
    setResult(null)
    go('ready')
  }

  const wrong = phase === 'wrong'
  const centerGlow = wrong ? WRONG : ACCENT
  const centerStrength = wrong ? 1 : Math.min(1, streak * 0.22)
  const busy = phase === 'deal' || phase === 'flying'
  const remaining = deck.length

  const bigBtn: CSSProperties = { flex: 1, minHeight: 92, fontSize: 28, flexDirection: 'column', gap: 0, lineHeight: 1.05, padding: '0 10px' }

  return (
    <GameShell
      gameId="higherlower"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: CAMERA, fov: 48 }} lookAt={[0, 0.2, 0.9]}>
          <DeckPile remaining={remaining} />
          {slots.map((s) => (
            <MovingCard
              key={s.id}
              card={s.card}
              from={s.from}
              target={s.place === -1 ? CENTER : HISTORY_POSES[s.place]}
              glow={s.place === -1 ? centerGlow : undefined}
              glowStrength={s.place === -1 ? centerStrength : 0}
              shake={s.place === -1 ? shake : 0}
              onArrive={() => arrived(s)}
            />
          ))}
          <Sparks trigger={burst} position={CENTER.pos} colors={SPARK_COLORS} count={90} speed={2.4 + Math.min(streak, 6) * 0.35} size={0.025 + Math.min(streak, 6) * 0.004} gravity={3} />
        </Stage>
      }
      top={
        <>
          <TurnPill player={turn.current} />
          <div className="row" style={{ justifyContent: 'center', marginTop: 8, gap: 12 }}>
            <div
              key={streak}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 44,
                lineHeight: 1,
                color: streak ? ACCENT : 'var(--muted)',
                textShadow: streak ? `0 0 ${8 + Math.min(streak, 8) * 4}px ${ACCENT}` : 'none',
                animation: 'pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1)',
              }}
            >
              🔥 {streak}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span className="muted">
                {L(TXT.streak)} · {L(TXT.best)} <b style={{ color: 'var(--text)' }}>{best}</b>
              </span>
              <span className="muted">🃏 {remaining}</span>
            </div>
          </div>
        </>
      }
      bottom={
        wrong && result ? (
          <>
            <ResultCard
              animKey={result.id}
              color={WRONG}
              who={`${result.label} · ${turn.current.name}`}
              big={result.tie ? `${t('tie')}: ${L(TXT.house)}` : L(TXT.wrong)}
              sub={
                <>
                  <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{result.text}</div>
                  {result.lost > 0 && <div className="muted">{fmt(L(TXT.lost), { n: result.lost })}</div>}
                </>
              }
            />
            <button className="btn block" onClick={nextPlayer}>
              {L(TXT.pass)} 👉
            </button>
          </>
        ) : (
          <>
            <div className="row" style={{ gap: 12 }}>
              <button
                className="btn accent"
                disabled={busy}
                onClick={() => guess('up')}
                style={bigBtn}
              >
                <span style={{ fontSize: 30 }}>⬆️</span>
                {L(TXT.higher)}
              </button>
              <button className="btn cyan" disabled={busy} onClick={() => guess('down')} style={bigBtn}>
                <span style={{ fontSize: 30 }}>⬇️</span>
                {L(TXT.lower)}
              </button>
            </div>
            <div className="muted center" style={{ fontSize: 13 }}>
              {L(TXT.note)}
            </div>
          </>
        )
      }
    />
  )
}
