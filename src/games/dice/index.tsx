import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { canvasTexture, roundRect } from '../../three/textures'
import { useT } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { rand } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { ruleFor, type DiceRule } from './rules'

const ACCENT = '#ff3d8b'
const SIZE = 0.9
/** Value printed on each BoxGeometry face, in three.js group order: +x, -x, +y, -y, +z, -z. Opposite faces sum to 7. */
const FACE_VALUES = [3, 4, 1, 6, 2, 5]
const FACE_AXES = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
]
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
}

function topValue(q: THREE.Quaternion): number {
  let best = -Infinity
  let value = 1
  const v = new THREE.Vector3()
  FACE_AXES.forEach((axis, i) => {
    const y = v.copy(axis).applyQuaternion(q).y
    if (y > best) {
      best = y
      value = FACE_VALUES[i]
    }
  })
  return value
}

function useDieMaterials(body: string, pip: string) {
  return useMemo(
    () =>
      FACE_VALUES.map((value) => {
        const map = canvasTexture(256, 256, (ctx, w, h) => {
          ctx.fillStyle = '#000'
          ctx.fillRect(0, 0, w, h)
          const g = ctx.createLinearGradient(0, 0, w, h)
          g.addColorStop(0, '#ffffff')
          g.addColorStop(1, body)
          ctx.fillStyle = g
          roundRect(ctx, 6, 6, w - 12, h - 12, 46)
          ctx.fill()
          for (const [x, y] of PIPS[value]) {
            ctx.beginPath()
            ctx.arc(x * w, y * h, value === 1 ? 30 : 22, 0, Math.PI * 2)
            ctx.fillStyle = value === 1 ? ACCENT : pip
            ctx.fill()
          }
        })
        return new THREE.MeshPhysicalMaterial({ map, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 })
      }),
    [body, pip],
  )
}

function Die({ bodyRef, position, color }: { bodyRef: React.RefObject<RapierRigidBody | null>; position: [number, number, number]; color: string }) {
  const materials = useDieMaterials(color, '#1a0b16')
  return (
    <RigidBody
      ref={bodyRef}
      colliders="cuboid"
      position={position}
      restitution={0.35}
      friction={0.7}
      linearDamping={0.3}
      angularDamping={0.4}
      onCollisionEnter={() => {
        const v = bodyRef.current?.linvel()
        if (v && Math.hypot(v.x, v.y, v.z) > 2) sfx.click()
      }}
    >
      <mesh castShadow material={materials}>
        <boxGeometry args={[SIZE, SIZE, SIZE]} />
      </mesh>
    </RigidBody>
  )
}

/** Watches the dice and fires once both have come to rest. */
function SettleWatcher({ bodies, active, onSettle }: { bodies: React.RefObject<RapierRigidBody | null>[]; active: boolean; onSettle: (values: number[]) => void }) {
  const still = useRef(0)
  const elapsed = useRef(0)
  useFrame((_, dt) => {
    if (!active) {
      still.current = 0
      elapsed.current = 0
      return
    }
    elapsed.current += dt
    const resting = bodies.every((b) => {
      const rb = b.current
      if (!rb) return false
      const lv = rb.linvel()
      const av = rb.angvel()
      return Math.hypot(lv.x, lv.y, lv.z) < 0.08 && Math.hypot(av.x, av.y, av.z) < 0.15
    })
    still.current = resting ? still.current + 1 : 0
    if (elapsed.current > 0.6 && (still.current > 18 || elapsed.current > 7)) {
      still.current = 0
      elapsed.current = 0
      onSettle(bodies.map((b) => topValue(new THREE.Quaternion().copy(b.current!.rotation()))))
    }
  })
  return null
}

function Walls() {
  // Narrow, deep box so the dice always stay in frame on a portrait phone.
  const H = 4
  const X = 2.1
  const Z = 3
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[10, 0.5, 10]} position={[0, -0.5, 0]} friction={0.9} />
      <CuboidCollider args={[X, H, 0.2]} position={[0, H, -Z]} />
      <CuboidCollider args={[X, H, 0.2]} position={[0, H, Z]} />
      <CuboidCollider args={[0.2, H, Z]} position={[-X, H, 0]} />
      <CuboidCollider args={[0.2, H, Z]} position={[X, H, 0]} />
      <CuboidCollider args={[X, 0.2, Z]} position={[0, H * 2, 0]} />
    </RigidBody>
  )
}

export default function DiceGame({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const a = useRef<RapierRigidBody>(null)
  const b = useRef<RapierRigidBody>(null)
  const [rolling, setRolling] = useState(false)
  const [result, setResult] = useState<{ values: number[]; rule: DiceRule; id: number } | null>(null)
  const rollCount = useRef(0)
  // Synchronous guard: state updates land after the next render, so a fast double tap would roll (and pass the turn) twice.
  const busy = useRef(false)

  const roll = () => {
    if (busy.current) return
    busy.current = true
    sfx.whoosh()
    vibrate(30)
    setResult(null)
    setRolling(true)
    ;[a, b].forEach((ref, i) => {
      const rb = ref.current
      if (!rb) return
      rb.setTranslation({ x: i ? 0.8 : -0.8, y: 2.2, z: 2.2 }, true)
      rb.setRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0, 6.3), rand(0, 6.3), rand(0, 6.3))), true)
      rb.setLinvel({ x: rand(-1.5, 1.5), y: rand(3, 5), z: -rand(5, 8) }, true)
      rb.setAngvel({ x: rand(-25, 25), y: rand(-25, 25), z: rand(-25, 25) }, true)
    })
  }

  const settle = (values: number[]) => {
    busy.current = false
    setRolling(false)
    const rule = ruleFor(Math.min(...values), Math.max(...values))
    penalty.apply(rule.kind === 'drink' ? turn.current.id : undefined, rule.amount)
    sfx.reveal()
    vibrate([40, 40, 80])
    setResult({ values, rule, id: ++rollCount.current })
  }

  // Shake-to-roll (Android works out of the box; iOS needs a permission granted on a user gesture).
  const rollRef = useRef(roll)
  rollRef.current = roll
  useEffect(() => {
    let last = 0
    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity
      if (!acc) return
      const force = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0)
      if (force > 28 && Date.now() - last > 1500) {
        last = Date.now()
        rollRef.current()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [])

  const penaltyText = (r: DiceRule) =>
    r.kind === 'drink' ? penalty.drink(r.amount) : r.kind === 'give' ? penalty.give(r.amount) : r.kind === 'all' ? penalty.all(r.amount) : L(r.desc)

  const next = () => {
    if (busy.current) return
    turn.next()
    roll()
  }

  return (
    <GameShell
      gameId="dice"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 11, 3.5], fov: 40 }}>
          <Physics gravity={[0, -22, 0]}>
            <Walls />
            <Die bodyRef={a} position={[-0.8, 0.5, 1]} color="#ffd6e8" />
            <Die bodyRef={b} position={[0.8, 0.5, 1]} color="#d6f6ff" />
            <SettleWatcher bodies={[a, b]} active={rolling} onSettle={settle} />
          </Physics>
        </Stage>
      }
      top={<TurnPill player={turn.current} />}
      bottom={
        <>
          {result && (
            <ResultCard
              animKey={result.id}
              who={`🎲 ${result.values[0]} + ${result.values[1]} = ${result.values[0] + result.values[1]}`}
              big={L(result.rule.title)}
              sub={
                <>
                  {result.rule.kind !== 'none' && <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{penaltyText(result.rule)}</div>}
                  {result.rule.kind !== 'none' ? <div className="muted">{L(result.rule.desc)}</div> : penaltyText(result.rule)}
                </>
              }
            />
          )}
          <button className="btn block" disabled={rolling} onClick={result ? next : roll}>
            {rolling ? '🎲 …' : result ? `${t('next')} 👉` : `🎲 ${t('play')}`}
          </button>
        </>
      }
    />
  )
}
