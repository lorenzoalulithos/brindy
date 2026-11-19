import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { BallCollider, CuboidCollider, CylinderCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { usePlayers, type Player } from '../../core/store'
import { rand } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'

const ACCENT = '#ff4d6d'
const G = 18
const BALL_R = 0.12
const CUP_TOP = 0.33
const CUP_BOT = 0.23
const CUP_H = 0.75
const SPACING = CUP_TOP * 2 + 0.04
const RACK_Z = -3.6
const TABLE = { w: 3.2, zFront: 5.2, zBack: -5.6 }
const START = new THREE.Vector3(0, 1.5, 4.2)
const HIDDEN = new THREE.Vector3(0, -40, 0)
const CAM_POS = new THREE.Vector3(0, 2.5, 7.4)
const CAM_LOOK = new THREE.Vector3(0, 0.4, -2.6)
const LAUNCH_ANGLE = 0.86
const WALL_SEGMENTS = 14

type Phase = 'aim' | 'flying' | 'outcome' | 'handover' | 'won'

interface Cup {
  id: number
  x: number
  z: number
}

const TXT = {
  team: { it: 'Squadra {n}', en: 'Team {n}', es: 'Equipo {n}', fr: 'Équipe {n}', de: 'Team {n}' },
  swipe: { it: '👆 Scorri verso l’alto per tirare', en: '👆 Swipe up to throw', es: '👆 Desliza hacia arriba para tirar', fr: '👆 Glisse vers le haut pour lancer', de: '👆 Nach oben wischen zum Werfen' },
  throwsLeft: { it: 'Tiri: {n}', en: 'Throws: {n}', es: 'Tiros: {n}', fr: 'Lancers : {n}', de: 'Würfe: {n}' },
  splash: { it: 'CENTRO! 🎯', en: 'SPLASH! 🎯', es: '¡DENTRO! 🎯', fr: 'DEDANS ! 🎯', de: 'TREFFER! 🎯' },
  miss: { it: 'Fuori! 😬', en: 'Miss! 😬', es: '¡Fuera! 😬', fr: 'Raté ! 😬', de: 'Daneben! 😬' },
  ballsBack: { it: 'Palle indietro! 🔁', en: 'Balls back! 🔁', es: '¡Bolas de vuelta! 🔁', fr: 'Balles en retour ! 🔁', de: 'Bälle zurück! 🔁' },
  ballsBackSub: { it: 'Due centri: tirate ancora', en: 'Two in a row: throw again', es: 'Dos seguidas: tirad otra vez', fr: 'Deux de suite : relancez', de: 'Zwei Treffer: nochmal werfen' },
  rerack: { it: '🔺 Ricomponi', en: '🔺 Re-rack', es: '🔺 Recolocar', fr: '🔺 Reformer', de: '🔺 Neu aufstellen' },
  handover: { it: 'Passa il telefono', en: 'Pass the phone', es: 'Pasa el móvil', fr: 'Passe le téléphone', de: 'Gib das Handy weiter' },
  cupsLeft: { it: '{n} bicchieri', en: '{n} cups', es: '{n} vasos', fr: '{n} verres', de: '{n} Becher' },
  cleared: { it: 'Tavolo ripulito! 🏆', en: 'Table cleared! 🏆', es: '¡Mesa limpia! 🏆', fr: 'Table nettoyée ! 🏆', de: 'Tisch abgeräumt! 🏆' },
} satisfies Record<string, Loc>

const fill = (s: string, n: number) => s.replace('{n}', String(n))

let cupIds = 0
function rack6(): Cup[] {
  const rows = [[0], [-0.5, 0.5], [-1, 0, 1]]
  return rows.flatMap((row, r) => row.map((c) => ({ id: ++cupIds, x: c * SPACING, z: RACK_Z - r * SPACING * 0.866 })))
}
function rack3(): Cup[] {
  return [[0], [-0.5, 0.5]].flatMap((row, r) => row.map((c) => ({ id: ++cupIds, x: c * SPACING, z: RACK_Z - r * SPACING * 0.866 })))
}

/** Launch velocity that lands the ball (ignoring bounces) at horizontal distance d, at cup height, along `lateral` radians. */
function launchVelocity(power: number, lateral: number) {
  const d = THREE.MathUtils.clamp(1.5 + 3.2 * power, 3, 13)
  const dy = CUP_H - START.y
  const c = Math.cos(LAUNCH_ANGLE)
  const v = Math.sqrt((G * d * d) / (2 * c * c * (d * Math.tan(LAUNCH_ANGLE) - dy)))
  const h = v * c
  return new THREE.Vector3(h * Math.sin(lateral), v * Math.sin(LAUNCH_ANGLE), -h * Math.cos(lateral))
}
const DEFAULT_AIM = launchVelocity(2.1, 0)

/** Power (screen heights per second over the last 120 ms) and lateral aim (whole-swipe direction) of an upward swipe. */
function swipeParams(pts: { x: number; y: number; t: number }[]) {
  const last = pts[pts.length - 1]
  const first = pts.find((p) => last.t - p.t <= 120) ?? last
  const dtMs = Math.max(16, last.t - first.t)
  const vy = (last.y - first.y) / dtMs
  const total = { x: last.x - pts[0].x, y: last.y - pts[0].y }
  if (total.y > -40) return null
  return { power: Math.max(0, (-vy / window.innerHeight) * 1000), lateral: THREE.MathUtils.clamp(Math.atan2(total.x, -total.y) * 0.5, -0.3, 0.3) }
}

/** Hollow cup collider: a ring of thin slanted slabs plus a bottom disc. */
const WALLS = (() => {
  const rm = (CUP_TOP + CUP_BOT) / 2
  const tilt = Math.atan((CUP_TOP - CUP_BOT) / CUP_H)
  const half = Math.PI * rm / WALL_SEGMENTS + 0.012
  return Array.from({ length: WALL_SEGMENTS }, (_, i) => {
    const a = (i / WALL_SEGMENTS) * Math.PI * 2
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, Math.PI / 2 - a, 0, 'YXZ'))
    return {
      position: [rm * Math.cos(a), CUP_H / 2, rm * Math.sin(a)] as [number, number, number],
      quaternion: [q.x, q.y, q.z, q.w] as [number, number, number, number],
      args: [half, CUP_H / 2 / Math.cos(tilt), 0.02] as [number, number, number],
    }
  })
})()

const OUTER = [
  [CUP_BOT, 0],
  [CUP_TOP, CUP_H],
].map(([x, y]) => new THREE.Vector2(x, y))
const INNER = [
  [CUP_BOT - 0.02, 0.02],
  [CUP_TOP - 0.02, CUP_H],
].map(([x, y]) => new THREE.Vector2(x, y))

function CupVisual() {
  return (
    <>
      <mesh castShadow>
        <latheGeometry args={[OUTER, 40, 0, Math.PI * 2]} />
        <meshPhysicalMaterial color="#e8173a" roughness={0.35} clearcoat={1} clearcoatRoughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <latheGeometry args={[INNER, 40]} />
        <meshStandardMaterial color="#fff4f4" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, CUP_H, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[CUP_TOP - 0.01, 0.022, 8, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh position={[0, CUP_H * 0.45, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[CUP_BOT + (CUP_TOP - CUP_BOT) * 0.45 - 0.025, 32]} />
        <meshStandardMaterial color="#ffb52e" emissive="#ff8a00" emissiveIntensity={0.25} roughness={0.2} />
      </mesh>
    </>
  )
}

const OWN_SCALE = 0.45
const OWN_APEX_Z = 4.0

/** The thrower's own cups at the near end: small and low, so only the apex peeks in at the bottom edge (visual only). */
function OwnRack({ cups }: { cups: Cup[] }) {
  return (
    <group>
      {cups.map((c) => (
        <group key={c.id} position={[-c.x * OWN_SCALE, 0, OWN_APEX_Z + (RACK_Z - c.z) * OWN_SCALE]} scale={OWN_SCALE}>
          <CupVisual />
        </group>
      ))}
    </group>
  )
}

function CupMesh({ cup }: { cup: Cup }) {
  const group = useRef<THREE.Group>(null)
  const born = useRef(performance.now())
  useFrame(() => {
    const t = Math.min(1, (performance.now() - born.current) / 450)
    const s = 1 + Math.sin(t * Math.PI) * 0.25 * (1 - t)
    group.current?.scale.set(s, t < 1 ? 0.6 + 0.4 * t + Math.sin(t * 9) * 0.1 * (1 - t) : 1, s)
  })
  return (
    <RigidBody type="fixed" colliders={false} position={[cup.x, 0, cup.z]}>
      {WALLS.map((w, i) => (
        <CuboidCollider key={i} args={w.args} position={w.position} quaternion={w.quaternion} restitution={0.45} friction={0.4} />
      ))}
      <CylinderCollider args={[0.02, CUP_BOT]} position={[0, 0.02, 0]} restitution={0.2} />
      <group ref={group}>
        <CupVisual />
      </group>
    </RigidBody>
  )
}

function Table() {
  const len = TABLE.zFront - TABLE.zBack
  const mid = (TABLE.zFront + TABLE.zBack) / 2
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[TABLE.w / 2, 0.25, len / 2]} position={[0, -0.25, mid]} restitution={0.75} friction={0.3} />
      </RigidBody>
      <mesh position={[0, -0.25, mid]} receiveShadow>
        <boxGeometry args={[TABLE.w, 0.5, len]} />
        <meshPhysicalMaterial color="#14243f" roughness={0.35} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.002, mid]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[TABLE.w - 0.1, len - 0.1]} />
        <meshStandardMaterial color="#1b2f55" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[TABLE.w - 0.1, 0.04]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * TABLE.w) / 2, 0.01, mid]}>
          <boxGeometry args={[0.05, 0.05, len]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -3.2, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#07030d" roughness={1} />
      </mesh>
    </group>
  )
}

interface Shared {
  ball: THREE.Vector3
  flying: boolean
  preview: THREE.Vector3 | null
  /** 0..1 while dragging (power meter glow), -1 otherwise. */
  power: number
}

const TRAIL = 16
const SPLASH = 60
const HINT_DOTS = 18

/** Ball physics, sink detection, magnetic assist, trail, splash, trajectory hint and follow camera. */
function World({
  cups,
  shared,
  launchRef,
  visible,
  hint,
  onResult,
  onReady,
}: {
  cups: Cup[]
  shared: React.RefObject<Shared>
  launchRef: React.RefObject<((v: THREE.Vector3) => void) | null>
  visible: boolean
  hint: boolean
  onResult: (cupId: number | null) => void
  /** Called once physics (rapier wasm) is up and the ball can be thrown. */
  onReady: () => void
}) {
  const ball = useRef<RapierRigidBody>(null)
  const flight = useRef({ active: false, start: 0, still: 0 })
  const cupsRef = useRef(cups)
  const resultRef = useRef(onResult)
  const readyRef = useRef(onReady)
  useEffect(() => {
    cupsRef.current = cups
    resultRef.current = onResult
    readyRef.current = onReady
  })
  const trail = useRef<THREE.InstancedMesh>(null)
  const history = useMemo(() => Array.from({ length: TRAIL }, () => new THREE.Vector3(0, -40, 0)), [])
  const splash = useRef<THREE.InstancedMesh>(null)
  const sp = useMemo(() => ({ pos: new Float32Array(SPLASH * 3), vel: new Float32Array(SPLASH * 3), life: new Float32Array(SPLASH) }), [])
  const dots = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const look = useRef(CAM_LOOK.clone())
  const land = useMemo(() => new THREE.Vector3(), [])
  const ctrl = useMemo(() => new THREE.Vector3(), [])
  const marker = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.Mesh>(null)
  const glowMat = useRef<THREE.MeshBasicMaterial>(null)
  const ballMat = useRef<THREE.MeshPhysicalMaterial>(null)
  const meterColor = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    launchRef.current = (v) => {
      const rb = ball.current
      if (!rb) return
      rb.setTranslation(START, true)
      rb.setGravityScale(1, true)
      rb.setLinvel(v, true)
      rb.setAngvel({ x: -v.length() * 2, y: rand(-3, 3), z: 0 }, true)
      flight.current = { active: true, start: performance.now(), still: 0 }
      history.forEach((h) => h.copy(START))
    }
    readyRef.current()
    return () => {
      launchRef.current = null
    }
  }, [launchRef, history])

  useEffect(() => {
    const mesh = splash.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < SPLASH; i++) mesh.setColorAt(i, c.set(i % 3 ? '#ffb52e' : '#fffbe8'))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  const burst = (x: number, z: number) => {
    for (let i = 0; i < SPLASH; i++) {
      sp.pos.set([x + rand(-0.15, 0.15), CUP_H * 0.6, z + rand(-0.15, 0.15)], i * 3)
      sp.vel.set([rand(-1.6, 1.6), rand(2.5, 6), rand(-1.6, 1.6)], i * 3)
      sp.life[i] = rand(0.6, 1.1)
    }
  }

  const end = (cupId: number | null) => {
    const rb = ball.current
    flight.current.active = false
    if (rb) {
      rb.setGravityScale(0, true)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      rb.setTranslation(HIDDEN, true)
    }
    resultRef.current(cupId)
  }

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const rb = ball.current
    const s = shared.current
    if (!rb) return
    const f = flight.current
    if (!f.active) {
      rb.setGravityScale(0, false)
      rb.setLinvel({ x: 0, y: 0, z: 0 }, false)
      rb.setAngvel({ x: 0, y: 0, z: 0 }, false)
      rb.setTranslation(visible ? START : HIDDEN, false)
    } else {
      const p = rb.translation()
      const v = rb.linvel()
      // Magnetic assist: gently steer a descending ball toward the closest cup mouth.
      let best: Cup | null = null
      let bestD = Infinity
      for (const c of cupsRef.current) {
        const d = Math.hypot(p.x - c.x, p.z - c.z)
        if (d < bestD) {
          bestD = d
          best = c
        }
      }
      if (best && bestD < CUP_TOP * 1.8 && p.y > CUP_H - 0.05 && p.y < CUP_H + 1.1 && v.y < 0) {
        const k = 9 * dt
        rb.setLinvel({ x: v.x + (best.x - p.x) * k * 6 - v.x * k * 0.4, y: v.y, z: v.z + (best.z - p.z) * k * 6 - v.z * k * 0.4 }, true)
      }
      if (best && bestD < CUP_TOP - 0.06 && p.y < CUP_H * 0.75 && p.y > 0) {
        burst(best.x, best.z)
        end(best.id)
      } else {
        const speed = Math.hypot(v.x, v.y, v.z)
        f.still = speed < 0.25 ? f.still + dt : 0
        const out = p.y < -1.5 || Math.abs(p.x) > 4 || p.z < TABLE.zBack - 2 || p.z > TABLE.zFront + 2
        if (out || f.still > 0.5 || performance.now() - f.start > 6000) end(null)
      }
    }

    const p = rb.translation()
    s.ball.set(p.x, p.y, p.z)
    s.flying = f.active

    // trail
    if (f.active) {
      history.pop()
      history.unshift(new THREE.Vector3(p.x, p.y, p.z))
    }
    const tm = trail.current
    if (tm) {
      history.forEach((h, i) => {
        dummy.position.copy(h)
        dummy.scale.setScalar(f.active ? BALL_R * (1 - i / TRAIL) * 0.9 : 0)
        dummy.updateMatrix()
        tm.setMatrixAt(i, dummy.matrix)
      })
      tm.instanceMatrix.needsUpdate = true
    }

    // splash
    const sm = splash.current
    if (sm) {
      for (let i = 0; i < SPLASH; i++) {
        if (sp.life[i] > 0) {
          sp.life[i] -= dt
          sp.vel[i * 3 + 1] -= 14 * dt
          for (let k = 0; k < 3; k++) sp.pos[i * 3 + k] += sp.vel[i * 3 + k] * dt
        }
        dummy.position.set(sp.pos[i * 3], sp.pos[i * 3 + 1], sp.pos[i * 3 + 2])
        dummy.scale.setScalar(sp.life[i] > 0 ? 0.05 + sp.life[i] * 0.06 : 0)
        dummy.updateMatrix()
        sm.setMatrixAt(i, dummy.matrix)
      }
      sm.instanceMatrix.needsUpdate = true
    }

    // trajectory hint (first throw only)
    const dm = dots.current
    if (dm) {
      // Schematic low arc from the hand to where the throw would land at cup height (not the real, taller parabola).
      const v0 = s.preview ?? DEFAULT_AIM
      const show = hint && visible && !f.active
      const tl = (v0.y + Math.sqrt(v0.y * v0.y + 2 * G * (START.y - CUP_H))) / G
      land.set(START.x + v0.x * tl, CUP_H, START.z + v0.z * tl)
      ctrl.set((START.x + land.x) / 2, START.y + 0.9, (START.z + land.z) / 2)
      for (let i = 0; i < HINT_DOTS; i++) {
        const t = (i + 1) / HINT_DOTS
        const u = 1 - t
        dummy.position.set(
          u * u * START.x + 2 * u * t * ctrl.x + t * t * land.x,
          u * u * START.y + 2 * u * t * ctrl.y + t * t * land.y,
          u * u * START.z + 2 * u * t * ctrl.z + t * t * land.z,
        )
        dummy.scale.setScalar(show ? 0.03 + 0.012 * t : 0)
        dummy.updateMatrix()
        dm.setMatrixAt(i, dummy.matrix)
      }
      dm.instanceMatrix.needsUpdate = true
      if (marker.current) {
        marker.current.visible = show
        marker.current.position.set(land.x, CUP_H + 0.02, land.z)
        marker.current.scale.setScalar(1 + Math.sin(performance.now() / 180) * 0.12)
      }
    }

    // power meter: the held ball glows green → yellow → red with drag speed
    const pw = s.power
    meterColor.setHSL(0.33 * (1 - Math.max(0, pw)), 1, 0.55)
    if (glow.current && glowMat.current) {
      glow.current.visible = pw >= 0 && !f.active
      glow.current.scale.setScalar(1.5 + Math.max(0, pw) * 1.6 + Math.sin(performance.now() / 70) * 0.08)
      glowMat.current.color.copy(meterColor)
      glowMat.current.opacity = 0.25 + Math.max(0, pw) * 0.45
    }
    if (ballMat.current) {
      ballMat.current.emissive.copy(pw >= 0 && !f.active ? meterColor : ballMat.current.color)
      ballMat.current.emissiveIntensity = pw >= 0 && !f.active ? 0.4 + pw * 0.8 : 0.25
    }

    // follow camera
    const targetPos = f.active ? new THREE.Vector3(p.x * 0.35, CAM_POS.y + 0.2, Math.max(1.8, Math.min(CAM_POS.z, p.z + 5.2))) : CAM_POS
    const targetLook = f.active ? new THREE.Vector3(p.x * 0.6, Math.max(0.3, p.y * 0.5), Math.min(p.z - 1.5, CAM_LOOK.z + 1)) : CAM_LOOK
    const a = 1 - Math.exp(-(f.active ? 2.5 : 3.5) * dt)
    camera.position.lerp(targetPos, a)
    look.current.lerp(targetLook, a)
    camera.lookAt(look.current)
  })

  return (
    <>
      <RigidBody ref={ball} colliders={false} position={START.toArray()} gravityScale={0} ccd linearDamping={0.05} angularDamping={0.5}>
        <BallCollider args={[BALL_R]} restitution={0.7} friction={0.2} density={0.3} />
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 24, 24]} />
          <meshPhysicalMaterial ref={ballMat} color="#ffffff" emissive="#fff3e0" emissiveIntensity={0.25} roughness={0.25} clearcoat={1} />
        </mesh>
        <mesh ref={glow} visible={false} scale={1.5}>
          <sphereGeometry args={[BALL_R, 20, 20]} />
          <meshBasicMaterial ref={glowMat} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </RigidBody>
      {cups.map((c) => (
        <CupMesh key={c.id} cup={c} />
      ))}
      <instancedMesh ref={trail} args={[undefined, undefined, TRAIL]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={splash} args={[undefined, undefined, SPLASH]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial roughness={0.2} emissive="#ff9a2e" emissiveIntensity={0.3} />
      </instancedMesh>
      <mesh ref={marker} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.16, 0.22, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined, undefined, HINT_DOTS]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </>
  )
}

function useTeams(): Player[][] {
  const players = usePlayers()
  const { L } = useT()
  return useMemo(() => {
    const guest = (n: number, color: string): Player => ({ id: '', name: fill(L(TXT.team), n), color })
    if (players.length >= 2) return [players.filter((_, i) => i % 2 === 0), players.filter((_, i) => i % 2 === 1)]
    if (players.length === 1) return [[players[0]], [guest(2, '#3dd6ff')]]
    return [[guest(1, ACCENT)], [guest(2, '#3dd6ff')]]
  }, [players, L])
}

export default function CupPongGame({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const teams = useTeams()
  const [team, setTeam] = useState(0)
  const [thrower, setThrower] = useState([0, 0])
  const [cups, setCups] = useState<Cup[][]>(() => [rack6(), rack6()])
  const [reracked, setReracked] = useState([false, false])
  const [throwsLeft, setThrowsLeft] = useState(2)
  const [sunk, setSunk] = useState(0)
  const [phase, setPhase] = useState<Phase>('aim')
  const [thrown, setThrown] = useState(0)
  const [toast, setToast] = useState<{ who: string; big: string; sub?: string; color: string; id: number } | null>(null)
  const [winner, setWinner] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  const shared = useRef<Shared>({ ball: START.clone(), flying: false, preview: null, power: -1 })
  const launchRef = useRef<((v: THREE.Vector3) => void) | null>(null)
  const swipe = useRef<{ x: number; y: number; t: number }[] | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const opp = 1 - team
  const target = cups[opp]
  const current = teams[team][thrower[team] % teams[team].length]
  const defender = (tm: number) => teams[tm][thrower[tm] % teams[tm].length]
  const teamName = (tm: number) => teams[tm].map((p) => p.name).join(' & ')

  // Runs after the outcome toast: next throw, balls back, or hand over to the other team.
  const advance = (sunkNow: number, left: number) => {
    setToast(null)
    if (left > 0) {
      setThrowsLeft(left)
      setPhase('aim')
      return
    }
    if (sunkNow >= 2) {
      setThrowsLeft(2)
      setSunk(0)
      setToast({ who: current.name, big: L(TXT.ballsBack), sub: L(TXT.ballsBackSub), color: '#3dff8b', id: Date.now() })
      sfx.win()
      vibrate([40, 40, 80])
      setPhase('aim')
      return
    }
    setThrower((th) => th.map((v, i) => (i === team ? v + 1 : v)))
    setTeam(opp)
    setThrowsLeft(2)
    setSunk(0)
    setPhase('handover')
  }
  const advanceRef = useRef(advance)
  advanceRef.current = advance

  const onResult = (cupId: number | null) => {
    const left = throwsLeft - 1
    setThrown((n) => n + 1)
    if (cupId === null) {
      sfx.flip()
      setToast({ who: current.name, big: L(TXT.miss), color: '#8a8fa8', id: Date.now() })
      setPhase('outcome')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => advanceRef.current(sunk, left), 1100)
      return
    }
    const remaining = target.filter((c) => c.id !== cupId)
    setCups((cs) => cs.map((list, i) => (i === opp ? remaining : list)))
    const victim = defender(opp)
    penalty.apply(victim.id || undefined, 1)
    sfx.thud()
    sfx.win()
    sfx.drumroll(0.5)
    vibrate([60, 40, 120])
    if (remaining.length === 0) {
      teams[opp].forEach((p) => penalty.apply(p.id || undefined, 2))
      setWinner(team)
      setToast(null)
      setPhase('won')
      timer.current = setTimeout(() => sfx.win(), 400)
      return
    }
    setToast({ who: L(TXT.splash), big: victim.name, sub: penalty.drink(1), color: ACCENT, id: Date.now() })
    setSunk(sunk + 1)
    setPhase('outcome')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => advanceRef.current(sunk + 1, left), 1500)
  }

  const rerack = () => {
    sfx.whoosh()
    vibrate(30)
    setCups((cs) => cs.map((list, i) => (i === opp ? rack3() : list)))
    setReracked((r) => r.map((v, i) => (i === opp ? true : v)))
  }

  const restart = () => {
    clearTimeout(timer.current)
    setCups([rack6(), rack6()])
    setReracked([false, false])
    setThrower((th) => th.map((v) => v + 1))
    setTeam(winner === null ? 0 : 1 - winner)
    setThrowsLeft(2)
    setSunk(0)
    setWinner(null)
    setToast(null)
    setPhase('aim')
    sfx.tap()
  }

  const fire = (v: THREE.Vector3) => {
    if (!launchRef.current) return
    launchRef.current(v)
    sfx.whoosh()
    vibrate(20)
    setToast(null)
    setPhase('flying')
  }
  const aim = useRef({ phase, thrown, fire })
  useEffect(() => {
    aim.current = { phase, thrown, fire }
  })

  // Swipes are read at window level so they work anywhere below the top HUD, whatever element is under the thumb.
  useEffect(() => {
    let pointerId = -1
    const reset = () => {
      swipe.current = null
      pointerId = -1
      shared.current.preview = null
      shared.current.power = -1
    }
    const blocked = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest?.('button, .sheet, .backdrop')) return true
      const top = document.querySelector('.game .topbar')?.getBoundingClientRect().bottom ?? 60
      return e.clientY < top + 70
    }
    const down = (e: PointerEvent) => {
      if (aim.current.phase !== 'aim' || swipe.current || blocked(e)) return
      pointerId = e.pointerId
      swipe.current = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]
      shared.current.power = 0
    }
    const move = (e: PointerEvent) => {
      const pts = swipe.current
      if (!pts || e.pointerId !== pointerId) return
      pts.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
      if (pts.length > 60) pts.splice(1, pts.length - 60)
      const sw = swipeParams(pts)
      shared.current.power = sw ? Math.min(1, sw.power / 3.5) : 0
      if (aim.current.thrown === 0) shared.current.preview = sw ? launchVelocity(sw.power, sw.lateral) : null
    }
    const up = (e: PointerEvent) => {
      const pts = swipe.current
      if (!pts || e.pointerId !== pointerId) return
      reset()
      if (aim.current.phase !== 'aim') return
      pts.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
      const sw = swipeParams(pts)
      if (sw) aim.current.fire(launchVelocity(sw.power, sw.lateral))
    }
    const cancel = (e: PointerEvent) => e.pointerId === pointerId && reset()
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [])

  const showBall = phase === 'aim' || phase === 'handover'

  return (
    <GameShell
      gameId="cuppong"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} table={false} camera={{ position: CAM_POS.toArray() as [number, number, number], fov: 50 }}>
          <Physics gravity={[0, -G, 0]}>
            <Table />
            <OwnRack cups={cups[team]} />
            <World cups={target} shared={shared} launchRef={launchRef} visible={showBall} hint={thrown === 0} onResult={onResult} onReady={() => setReady(true)} />
          </Physics>
        </Stage>
      }
      top={
        phase !== 'won' && (
          <>
            <TurnPill player={current} />
            <div className="row" style={{ justifyContent: 'center', marginTop: 8, gap: 8 }}>
              <span className="chip">🏓 {fill(L(TXT.throwsLeft), throwsLeft)}</span>
              <span className="chip">🥤 {fill(L(TXT.cupsLeft), target.length)}</span>
            </div>
          </>
        )
      }
      bottom={
        <>
          {toast && phase !== 'won' && <ResultCard animKey={toast.id} color={toast.color} who={toast.who} big={toast.big} sub={toast.sub} />}
          {phase === 'handover' && (
            <>
              <div className="center muted">{L(TXT.handover)}</div>
              <button
                className="btn block accent"
                onClick={() => {
                  sfx.tap()
                  setPhase('aim')
                }}
              >
                🏓 {current.name}
              </button>
            </>
          )}
          {phase === 'won' && winner !== null && (
            <>
              <ResultCard
                animKey="won"
                color="#ffd23d"
                who={`${t('winner')}: ${teamName(winner)}`}
                big={L(TXT.cleared)}
                sub={
                  <>
                    <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{penalty.drink(2)}</div>
                    <div className="muted">{teamName(1 - winner)}</div>
                  </>
                }
              />
              <button className="btn block accent" onClick={restart}>
                🏓 {t('again')}
              </button>
            </>
          )}
        </>
      }
      overlay={
        phase === 'aim' && (
          <div
            style={{ position: 'absolute', top: 'calc(var(--safe-top) + 130px)', left: 0, right: 0, bottom: 0, touchAction: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', padding: '0 16px calc(var(--safe-bottom) + 18px)', gap: 12 }}
          >
            {target.length === 3 && !reracked[opp] && (
              <button className="btn small secondary" onClick={rerack}>
                {L(TXT.rerack)}
              </button>
            )}
            <div className="chip" style={{ pointerEvents: 'none', background: 'rgba(0,0,0,0.5)', fontSize: 16, opacity: ready ? 1 : 0.6 }}>
              {ready ? L(TXT.swipe) : '🏓 …'}
            </div>
          </div>
        )
      }
    />
  )
}
