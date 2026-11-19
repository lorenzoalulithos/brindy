import { useMemo, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { canvasTexture } from '../../three/textures'
import { fmt, useT } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { pick, shuffle } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { Player } from '../../core/store'
import type { GameProps } from '../../core/types'
import { Card3D } from '../../three/cards/Card3D'
import { Sparks } from '../../three/cards/Sparks'
import { applyPose, blendPose, cardLabel, clonePose, easeOutBack, easeOutCubic, fullDeck, tableQuat, type PlayingCard, type Pose } from '../../three/cards/cards'
import { KING_CUP, RULES, TXT, type RankRule } from './rules'

const ACCENT = '#ff8a3d'
const N = 52
const RING_R = 1.7
const RING_SCALE = 0.55
const PRESENT_DIST = 3.4
const PRESENT_UP = 0.42
const PRESENT_SCALE = 0.72
const LIFT = 0.22
const FLY = 0.78
const FIRE_COLORS = ['#ff8a3d', '#ffd23d', '#ff3d3d', '#ffffff']
const GOLD_COLORS = ['#ffd23d', '#ffb13d', '#fff1a8', '#ff8a3d']

interface Entry {
  id: number
  slot: number
  card: PlayingCard
  player: Player
  /** 1..4 when this card is a King (its order of appearance), else 0. */
  kingNo: number
  from: Pose
  leaving: boolean
}

// ---------- ring ----------

function RingCard({ index, onPick, register }: { index: number; onPick: (i: number) => void; register: (i: number, g: THREE.Group | null) => void }) {
  const ref = useRef<THREE.Group>(null)
  const base = useMemo(() => {
    const a = (index / N) * Math.PI * 2
    return { pos: new THREE.Vector3(Math.sin(a) * RING_R, 0.025 + index * 0.0009, Math.cos(a) * RING_R), quat: tableQuat(a, false, 0.07), a }
  }, [index])
  const t = useRef(-index * 0.016)

  useFrame((state, dt) => {
    const g = ref.current
    if (!g) return
    t.current += Math.min(dt, 1 / 30)
    const p = Math.min(1, Math.max(0, t.current / 0.42))
    g.visible = p > 0
    const drop = (1 - easeOutCubic(p)) * 1.8
    const wave = p >= 1 ? Math.sin(state.clock.elapsedTime * 2.2 - base.a * 3) * 0.006 : 0
    g.position.set(base.pos.x * (0.6 + 0.4 * p), base.pos.y + drop + wave, base.pos.z * (0.6 + 0.4 * p))
    g.quaternion.copy(base.quat)
    g.scale.setScalar(RING_SCALE * Math.max(0.001, easeOutBack(p)))
  })

  return (
    <Card3D
      ref={(g: THREE.Group | null) => {
        ref.current = g
        register(index, g)
      }}
      accent={ACCENT}
      visible={false}
      onClick={(e) => {
        e.stopPropagation()
        onPick(index)
      }}
    />
  )
}

function FireRing() {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const size = (RING_R + 0.9) * 2
  const map = useMemo(
    () =>
      canvasTexture(512, 512, (ctx, w) => {
        const c = w / 2
        const inner = ((RING_R - 0.7) / (size / 2)) * c
        const mid = (RING_R / (size / 2)) * c
        const g = ctx.createRadialGradient(c, c, inner, c, c, c)
        const m = (mid - inner) / (c - inner)
        g.addColorStop(0, 'rgba(255,90,20,0)')
        g.addColorStop(m * 0.6, 'rgba(255,120,40,0.7)')
        g.addColorStop(m, 'rgba(255,190,80,1)')
        g.addColorStop(m + (1 - m) * 0.4, 'rgba(255,80,30,0.6)')
        g.addColorStop(1, 'rgba(255,40,20,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, w)
      }),
    [size],
  )
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(t * 7) * 0.08 + Math.sin(t * 13.3) * 0.06
  })
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0.006}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial ref={mat} map={map} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.008}>
        <ringGeometry args={[RING_R + 0.56, RING_R + 0.6, 128]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- king's cup ----------

const CUP_PROFILE = [
  [0, 0], [0.42, 0], [0.44, 0.04], [0.4, 0.08], [0.14, 0.14], [0.08, 0.22], [0.07, 0.5], [0.11, 0.56], [0.08, 0.62], [0.2, 0.68],
  [0.4, 0.82], [0.52, 1], [0.56, 1.2], [0.58, 1.26], [0.54, 1.26], [0.5, 1.04], [0.38, 0.86], [0.18, 0.74], [0, 0.72],
].map(([x, y]) => new THREE.Vector2(x, y))
const INNER: [number, number][] = [[0.72, 0], [0.74, 0.18], [0.86, 0.38], [1.04, 0.5], [1.26, 0.54]]

function innerRadius(y: number) {
  for (let i = 1; i < INNER.length; i++) {
    const [y1, r1] = INNER[i]
    const [y0, r0] = INNER[i - 1]
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0)
  }
  return INNER[INNER.length - 1][1]
}

function KingsCup({ kings, boom }: { kings: number; boom: number }) {
  const group = useRef<THREE.Group>(null)
  const liquid = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const st = useRef({ level: 0, punch: 0, kings })

  useFrame((state, dt) => {
    const s = st.current
    const d = Math.min(dt, 1 / 30)
    if (kings !== s.kings) {
      s.kings = kings
      s.punch = kings ? 1 : 0
    }
    s.level += (kings / 4 - s.level) * Math.min(1, d * 2.5)
    s.punch = Math.max(0, s.punch - d * 1.4)
    const t = state.clock.elapsedTime
    const wob = Math.sin(s.punch * 20) * 0.1 * s.punch
    if (group.current) {
      group.current.scale.set(1 + wob, 1 - wob, 1 + wob)
      group.current.rotation.y = t * 0.25
    }
    const y = 0.75 + s.level * 0.48
    if (liquid.current) {
      liquid.current.visible = s.level > 0.02
      liquid.current.position.y = y + Math.sin(t * 3) * 0.004
      liquid.current.scale.setScalar(innerRadius(y) * 0.97)
    }
    if (light.current) light.current.intensity = 2 + s.level * 10 + s.punch * 25 + Math.sin(t * 9) * 0.6
  })

  return (
    <group>
      <group ref={group}>
        <mesh castShadow>
          <latheGeometry args={[CUP_PROFILE, 48]} />
          <meshPhysicalMaterial color="#ffc94d" metalness={1} roughness={0.2} clearcoat={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh position-y={1.262} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.56, 0.022, 10, 64]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
        <mesh position-y={0.4} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.085, 0.02, 8, 24]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
        <mesh ref={liquid} rotation-x={-Math.PI / 2} visible={false}>
          <circleGeometry args={[1, 40]} />
          <meshStandardMaterial color="#ff9a2e" emissive="#ff6a00" emissiveIntensity={0.9} roughness={0.08} metalness={0.1} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, 1.6, 0]} color={ACCENT} distance={4} intensity={2} />
      <Sparks trigger={boom} position={[0, 1.3, 0]} colors={GOLD_COLORS} count={80} speed={4.2} size={0.06} gravity={6} />
    </group>
  )
}

// ---------- the drawn card ----------

const _fwd = new THREE.Vector3()
const _up = new THREE.Vector3()
const _right = new THREE.Vector3()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
const Z_AXIS = new THREE.Vector3(0, 0, 1)
const X_AXIS = new THREE.Vector3(1, 0, 0)

function presentPose(camera: THREE.Camera, out: Pose) {
  _fwd.set(0, 0, -1).applyQuaternion(camera.quaternion)
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
  out.pos.copy(camera.position).addScaledVector(_fwd, PRESENT_DIST).addScaledVector(_up, PRESENT_UP)
  out.quat.copy(camera.quaternion)
  out.scale = PRESENT_SCALE
}

function FlyingCard({
  entry,
  revealed,
  onRevealed,
  onGone,
}: {
  entry: Entry
  revealed: boolean
  onRevealed: (e: Entry, pos: THREE.Vector3) => void
  onGone: (id: number) => void
}) {
  const ref = useRef<THREE.Group>(null)
  const [st] = useState(() => ({
    t: 0,
    done: false,
    flipped: false,
    gone: false,
    leaveT: -1,
    punch: 0,
    tiltX: 0,
    tiltY: 0,
    lifted: { pos: entry.from.pos.clone().add(new THREE.Vector3(0, 0.75, 0)), quat: entry.from.quat.clone(), scale: entry.from.scale * 1.1 },
    present: clonePose(entry.from),
    cur: clonePose(entry.from),
    leaveFrom: clonePose(entry.from),
    leaveTo: clonePose(entry.from),
  }))
  const gold = entry.kingNo === 4

  useFrame((state, dt) => {
    const g = ref.current
    if (!g || st.gone) return
    const d = Math.min(dt, 1 / 30)
    const time = state.clock.elapsedTime
    presentPose(state.camera, st.present)

    if (entry.leaving) {
      if (st.leaveT < 0) {
        st.leaveT = 0
        st.leaveFrom = clonePose(st.cur)
        _right.set(1, 0, 0).applyQuaternion(state.camera.quaternion)
        st.leaveTo.pos.copy(st.cur.pos).addScaledVector(_right, 3.2).addScaledVector(_up, 0.9)
        st.leaveTo.quat.copy(st.cur.quat).multiply(_q.setFromAxisAngle(Z_AXIS, -1.4))
        st.leaveTo.scale = st.cur.scale * 0.75
        sfx.flip()
      }
      st.leaveT = Math.min(1, st.leaveT + d / 0.4)
      const k = st.leaveT * st.leaveT
      st.cur.pos.lerpVectors(st.leaveFrom.pos, st.leaveTo.pos, k)
      st.cur.quat.slerpQuaternions(st.leaveFrom.quat, st.leaveTo.quat, k)
      st.cur.scale = st.leaveFrom.scale + (st.leaveTo.scale - st.leaveFrom.scale) * k
      applyPose(g, st.cur)
      if (st.leaveT >= 1) {
        st.gone = true
        g.visible = false
        onGone(entry.id)
      }
      return
    }

    st.t += d
    if (st.t < LIFT) {
      const u = easeOutCubic(st.t / LIFT)
      st.cur.pos.lerpVectors(entry.from.pos, st.lifted.pos, u)
      st.cur.quat.copy(entry.from.quat).multiply(_q.setFromAxisAngle(X_AXIS, Math.sin(u * Math.PI) * 0.3))
      st.cur.scale = entry.from.scale + (st.lifted.scale - entry.from.scale) * u
    } else {
      const v = (st.t - LIFT) / FLY
      if (v < 1) {
        blendPose(st.cur, st.lifted, st.present, v, 0.7, 1)
        if (!st.flipped && v > 0.4) {
          st.flipped = true
          sfx.flip()
          vibrate(15)
        }
      } else {
        if (!st.done) {
          st.done = true
          st.punch = 1
          onRevealed(entry, st.present.pos.clone())
        }
        st.tiltX += (-state.pointer.y * 0.28 - st.tiltX) * Math.min(1, d * 6)
        st.tiltY += (state.pointer.x * 0.4 - st.tiltY) * Math.min(1, d * 6)
        _e.set(st.tiltX + Math.sin(time * 1.1) * 0.03, st.tiltY + Math.sin(time * 1.3) * 0.05, Math.sin(time * 0.9) * 0.02)
        st.cur.quat.copy(st.present.quat).multiply(_q.setFromEuler(_e))
        st.cur.pos.copy(st.present.pos).addScaledVector(_up, Math.sin(time * 2) * 0.025)
        st.punch = Math.max(0, st.punch - d * 2)
        st.cur.scale = PRESENT_SCALE * (1 + Math.sin(st.punch * 14) * 0.1 * st.punch)
      }
    }
    applyPose(g, st.cur)
  })

  return <Card3D ref={ref} card={entry.card} accent={ACCENT} glow={gold ? '#ffd23d' : ACCENT} glowStrength={revealed && !entry.leaving ? (gold ? 1 : 0.8) : 0} />
}

// ---------- game ----------

export default function RingOfFire({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const [deck, setDeck] = useState(() => shuffle(fullDeck()))
  const [drawn, setDrawn] = useState<boolean[]>(() => Array(N).fill(false))
  const [entries, setEntries] = useState<Entry[]>([])
  const [result, setResult] = useState<{ id: number; rule: RankRule; penaltyText: string; kingNo: number } | null>(null)
  const [kings, setKings] = useState(0)
  const [round, setRound] = useState(0)
  const [finished, setFinished] = useState(false)
  const [burst, setBurst] = useState<{ id: number; pos: THREE.Vector3; gold: boolean } | null>(null)
  const [cupBoom, setCupBoom] = useState(0)
  const slots = useRef(new Map<number, THREE.Group>())
  const kingsDrawn = useRef(0)
  const seq = useRef(0)
  // Synchronous locks against button mashing (state only updates after the next render).
  const drawing = useRef(false)
  const lastMain = useRef(0)

  const presented = entries.find((e) => !e.leaving)
  const revealed = !!presented && result?.id === presented.id
  const busy = !!presented && !revealed
  const left = drawn.reduce((n, d) => (d ? n : n + 1), 0)

  const register = (i: number, g: THREE.Group | null) => {
    if (g) slots.current.set(i, g)
    else slots.current.delete(i)
  }

  const draw = (slot?: number) => {
    if (finished || busy || drawing.current) return
    const free = drawn.flatMap((d, i) => (d ? [] : [i]))
    if (!free.length) return
    const s = slot ?? pick(free)
    const g = slots.current.get(s)
    if (drawn[s] || !g) return
    const from: Pose = {
      pos: g.getWorldPosition(new THREE.Vector3()),
      quat: g.getWorldQuaternion(new THREE.Quaternion()),
      scale: Math.max(0.05, g.getWorldScale(new THREE.Vector3()).x),
    }
    let player = turn.current
    if (presented) {
      player = turn.players[(turn.index + 1) % turn.players.length]
      turn.next()
    }
    drawing.current = true
    const card = deck[s]
    const kingNo = card.rank === 13 ? ++kingsDrawn.current : 0
    setDrawn((d) => d.map((v, i) => v || i === s))
    setEntries((es) => [...es.map((e) => (e.leaving ? e : { ...e, leaving: true })), { id: ++seq.current, slot: s, card, player, kingNo, from, leaving: false }])
    sfx.whoosh()
    vibrate(25)
  }

  const penaltyText = (rule: RankRule) => {
    const p = rule.penalty
    if (!p) return ''
    if (p.kind === 'give') return penalty.give(p.amount)
    if (p.kind === 'all') return penalty.all(p.amount)
    if (p.kind === 'loser') return `${t('loser')}: ${penalty.drink(p.amount)}`
    return penalty.drink(p.amount)
  }

  const onRevealed = (e: Entry, pos: THREE.Vector3) => {
    drawing.current = false
    const rule = e.kingNo === 4 ? KING_CUP : RULES[e.card.rank]
    // Computed once: in "dares" mode every penalty call picks a new random dare.
    setResult({ id: e.id, rule, penaltyText: penaltyText(rule), kingNo: e.kingNo })
    if (rule.penalty) penalty.apply(rule.penalty.kind === 'drink' ? e.player.id : undefined, rule.penalty.amount)
    if (e.kingNo) setKings(e.kingNo)
    setBurst({ id: e.id, pos, gold: e.kingNo > 0 })
    if (e.kingNo === 4) {
      setCupBoom((b) => b + 1)
      sfx.boom()
      sfx.win()
      vibrate([80, 40, 80, 40, 220])
    } else {
      sfx.reveal()
      vibrate([30, 30, 60])
    }
  }

  const onGone = (id: number) => setEntries((es) => es.filter((e) => e.id !== id))

  const finish = () => {
    setFinished(true)
    setEntries((es) => es.map((e) => ({ ...e, leaving: true })))
    sfx.win()
    vibrate([40, 40, 120])
  }

  const again = () => {
    drawing.current = false
    setDeck(shuffle(fullDeck()))
    setDrawn(Array(N).fill(false))
    setResult(null)
    setKings(0)
    kingsDrawn.current = 0
    setRound((r) => r + 1)
    setFinished(false)
    turn.next()
    sfx.whoosh()
  }

  const pickSlot = (i: number) => {
    if (!presented || revealed) draw(i)
  }

  const main = () => {
    const now = performance.now()
    if (now - lastMain.current < 400) return
    lastMain.current = now
    sfx.tap()
    if (finished) again()
    else if (revealed && left === 0) finish()
    else draw()
  }

  const shown = revealed && presented && result ? result : null

  return (
    <GameShell
      gameId="ringoffire"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 10.5, 5.5], fov: 50 }} lookAt={[0, 0, 1.2]}>
          <FireRing />
          <KingsCup kings={kings} boom={cupBoom} />
          <group key={round}>
            {deck.map((c, i) => (drawn[i] ? null : <RingCard key={c.id} index={i} onPick={pickSlot} register={register} />))}
          </group>
          {entries.map((e) => (
            <FlyingCard key={e.id} entry={e} revealed={result?.id === e.id} onRevealed={onRevealed} onGone={onGone} />
          ))}
          {burst && <Sparks trigger={burst.id} position={burst.pos} colors={burst.gold ? GOLD_COLORS : FIRE_COLORS} count={64} speed={burst.gold ? 4 : 3} size={0.035} gravity={3} />}
        </Stage>
      }
      top={
        <>
          <TurnPill player={turn.current} />
          <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
            <span className="chip" key={`k${kings}`} style={{ borderColor: kings ? ACCENT : undefined, animation: kings ? 'pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1)' : undefined } as CSSProperties}>
              👑 <b>{kings}/4</b>
            </span>
            <span className="chip">
              🃏 <b>{left}</b>
            </span>
          </div>
        </>
      }
      bottom={
        <>
          {finished ? (
            <ResultCard animKey={`done${round}`} big={L(TXT.doneTitle)} sub={fmt(L(TXT.doneSub), { k: kings })} />
          ) : (
            shown &&
            presented && (
              <ResultCard
                animKey={shown.id}
                color={shown.kingNo === 4 ? '#ffd23d' : undefined}
                who={`${cardLabel(presented.card)} · ${presented.player.name}`}
                big={`${shown.rule.emoji} ${L(shown.rule.title)}`}
                sub={
                  <>
                    {shown.penaltyText && <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{shown.penaltyText}</div>}
                    <div className="muted">{L(shown.rule.desc)}</div>
                    {shown.kingNo > 0 && shown.kingNo < 4 && <div style={{ marginTop: 4, color: ACCENT }}>{'👑'.repeat(shown.kingNo)} {fmt(L(TXT.kingN), { n: shown.kingNo })}</div>}
                  </>
                }
              />
            )
          )}
          {!presented && !finished && <div className="muted center">{L(TXT.tapCard)}</div>}
          <button className="btn accent block" disabled={busy} onClick={main}>
            {finished ? `🔁 ${t('again')}` : busy ? '🃏 …' : revealed && left === 0 ? `🏁 ${L(TXT.finish)}` : revealed ? `${t('next')} 👉` : `🔥 ${L(TXT.draw)}`}
          </button>
        </>
      }
    />
  )
}
