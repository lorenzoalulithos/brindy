import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { canvasTexture, DISPLAY_FONT } from '../../three/textures'
import { SUITS } from './data'
import { bibTexture } from './art'
import { horseGeometry } from './horseGeometry'

/** Mutable race state shared between the 3D components (no re-renders). */
export interface World {
  timeScale: number
  horseZ: number[]
  /** 0..1, makes the crowd jump. Decays by itself. */
  excitement: number
}

export interface HorseTarget {
  x: number
  y: number
  z: number
  /** When set, the horse turns to face where it walks, then settles on this heading. */
  yaw?: number
  /** Ground waypoint [x, z] reached first (to walk around obstacles). */
  via?: readonly [number, number]
  /** Jump from the waypoint up onto the target (podium blocks). */
  hop?: boolean
}

/** Draws a (normally single, merged) list of geometries with one material. */
function Parts({ geos, material, castShadow }: { geos: THREE.BufferGeometry[]; material: THREE.Material; castShadow?: boolean }) {
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={material} castShadow={castShadow} />
      ))}
    </>
  )
}

const angleTo = (from: number, to: number) => {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

const HIPS: [number, number, number][] = [
  [0.11, -0.05, 0.25],
  [-0.11, -0.05, 0.25],
  [0.11, -0.03, -0.25],
  [-0.11, -0.03, -0.25],
]
/** Rotary gallop: front pair and rear pair half a stride apart, slight offset inside each pair. */
const LEG_PHASE = [0, 0.55, Math.PI, Math.PI + 0.55]

function markerTexture(suit: number) {
  const s = SUITS[suit]
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 56, 0, Math.PI * 2)
    ctx.fillStyle = s.color
    ctx.fill()
    ctx.lineWidth = 7
    ctx.strokeStyle = '#fff'
    ctx.stroke()
    ctx.fillStyle = '#14081f'
    ctx.font = `78px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(s.sym, w / 2, h / 2 + 4)
  })
}

export function Horse({
  suit,
  target,
  world,
  stumble,
  celebrate,
  sad,
  snapKey,
}: {
  suit: number
  target: HorseTarget
  world: React.RefObject<World>
  stumble: number
  celebrate: boolean
  sad: boolean
  /** Changing it teleports the horse to its target (new race). */
  snapKey: number
}) {
  const def = SUITS[suit]
  const geo = horseGeometry()
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const neck = useRef<THREE.Group>(null)
  const tail = useRef<THREE.Group>(null)
  const jockey = useRef<THREE.Group>(null)
  const arms = useRef<THREE.Group>(null)
  const marker = useRef<THREE.Sprite>(null)
  const hips = useRef<(THREE.Group | null)[]>([])
  const knees = useRef<(THREE.Group | null)[]>([])
  const st = useRef({
    x: target.x,
    y: target.y,
    z: target.z,
    v: 0,
    dir: 1,
    run: 0,
    phase: Math.random() * 6,
    stumbleT: 0,
    lastStumble: stumble,
    snap: snapKey,
    t: Math.random() * 10,
    yaw: 0,
    tkey: NaN,
    viaDone: true,
    hop: -1,
    hx: 0,
    hz: 0,
    arrived: true,
    rush: 2.8,
  })

  const mats = useMemo(() => {
    const bib = bibTexture(suit)
    return {
      coat: new THREE.MeshPhysicalMaterial({ color: def.coat, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.3 }),
      mane: new THREE.MeshStandardMaterial({ color: def.mane, roughness: 0.8 }),
      hoof: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }),
      eye: new THREE.MeshPhysicalMaterial({ color: '#050307', roughness: 0.05, clearcoat: 1 }),
      silk: new THREE.MeshPhysicalMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.18,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
      white: new THREE.MeshStandardMaterial({ color: '#f4f0ea', roughness: 0.6 }),
      skin: new THREE.MeshStandardMaterial({ color: '#f0c49b', roughness: 0.7 }),
      boot: new THREE.MeshStandardMaterial({ color: '#16121c', roughness: 0.35 }),
      leather: new THREE.MeshStandardMaterial({ color: '#4a2a16', roughness: 0.6 }),
      bib: new THREE.MeshStandardMaterial({ map: bib, roughness: 0.5 }),
      marker: new THREE.SpriteMaterial({ map: markerTexture(suit), toneMapped: false, depthWrite: false }),
    }
  }, [suit, def])

  useFrame((_, raw) => {
    const w = world.current
    const dt = Math.min(raw, 0.05) * w.timeScale
    const s = st.current
    s.t += dt
    if (s.snap !== snapKey) {
      s.snap = snapKey
      s.x = target.x
      s.y = target.y
      s.z = target.z
      s.v = 0
      s.yaw = target.yaw ?? 0
      s.tkey = NaN
    }
    if (s.lastStumble !== stumble) {
      s.lastStumble = stumble
      s.stumbleT = 1
    }

    const key = target.x * 1000 + target.y * 100 + target.z
    if (key !== s.tkey) {
      s.tkey = key
      s.viaDone = !target.via
      s.hop = -1
      // Off-track walks (podium) must finish in ~2s however far back the horse was.
      const wx = target.via ? target.via[0] : target.x
      const wz = target.via ? target.via[1] : target.z
      s.rush = target.yaw !== undefined ? Math.max(2.8, Math.hypot(wx - s.x, wz - s.z) / 1.4) : 2.8
    }
    const turns = target.yaw !== undefined
    let headTo = target.yaw ?? 0
    let moving = false
    if (s.hop >= 0) {
      // Arc from the waypoint onto the block: rise early so the hooves clear the edge.
      s.hop = Math.min(1, s.hop + dt / 0.5)
      const h = s.hop
      s.x = s.hx + (target.x - s.hx) * h
      s.z = s.hz + (target.z - s.hz) * h
      s.y = target.y * Math.min(1, h * 1.7) + Math.sin(Math.PI * h) * 0.42
      s.v = 1.2
      s.dir = 1
      headTo = Math.atan2(target.x - s.hx, target.z - s.hz)
      moving = true
      if (h >= 1) {
        s.hop = -1
        s.y = target.y
        s.v = 0
      }
    } else {
      const gx = s.viaDone ? target.x : target.via![0]
      const gz = s.viaDone ? target.z : target.via![1]
      const dx = gx - s.x
      const dz = gz - s.z
      const dist = Math.hypot(dx, dz)
      const desired = Math.min(dist * (turns ? 8 : 5), s.rush)
      s.v += (desired - s.v) * Math.min(1, dt * 8)
      if (dist > 1e-4) {
        const m = Math.min(dist, s.v * dt)
        s.x += (dx / dist) * m
        s.z += (dz / dist) * m
        if (dist > 0.02) s.dir = turns ? 1 : dz < -0.01 ? -1 : 1
      }
      if (dist > 0.08) {
        moving = true
        if (turns) headTo = Math.atan2(dx, dz)
      }
      if (!s.viaDone && dist < 0.12) {
        s.viaDone = true
        if (target.hop) {
          s.hop = 0
          s.hx = s.x
          s.hz = s.z
        }
      }
      s.y += ((s.viaDone && s.hop < 0 ? target.y : 0) - s.y) * Math.min(1, dt * 5)
    }
    s.arrived = s.viaDone && s.hop < 0 && !moving
    if (turns) s.yaw += angleTo(s.yaw, headTo) * Math.min(1, dt * 6)
    else s.yaw += angleTo(s.yaw, 0) * Math.min(1, dt * 6)
    const run = Math.min(1, s.v / 1.4)
    s.run += (run - s.run) * Math.min(1, dt * 6)
    s.phase += dt * (2.5 + 15 * s.run) * s.dir
    s.stumbleT = Math.max(0, s.stumbleT - dt * 1.1)
    w.horseZ[suit] = s.z

    const r = s.run
    const cheer = celebrate && s.arrived
    const down = sad && s.arrived
    const p = s.phase
    const g = root.current
    if (g) {
      g.position.set(s.x, s.y, s.z)
      g.rotation.z = Math.sin(s.t * 26) * 0.22 * s.stumbleT
      g.rotation.y = s.yaw + Math.sin(s.t * 13) * 0.25 * s.stumbleT
    }
    const bob = Math.abs(Math.sin(p)) * 0.1 * r
    if (torso.current) {
      let y = 0.72 + bob + Math.sin(s.t * 2) * 0.006
      let pitch = Math.sin(p) * 0.07 * r
      if (cheer) {
        y += 0.14
        pitch = -0.42 + Math.sin(s.t * 5) * 0.08
      }
      torso.current.position.y = y
      torso.current.rotation.x = pitch
    }
    if (neck.current) neck.current.rotation.x = 0.55 + Math.sin(p + 0.8) * 0.14 * r + (down ? 0.55 : 0) + s.stumbleT * 0.5
    if (tail.current) {
      tail.current.rotation.x = 0.55 + r * 0.6 + Math.sin(p * 0.5) * 0.15 * r
      tail.current.rotation.z = Math.sin(s.t * (2 + r * 8)) * (0.12 + 0.2 * r)
    }
    if (jockey.current) jockey.current.position.y = 0.2 - bob * 0.45
    if (arms.current) arms.current.rotation.x = Math.sin(p) * 0.35 * r + (cheer ? -1.6 + Math.sin(s.t * 10) * 0.4 : 0)
    for (let i = 0; i < 4; i++) {
      const hip = hips.current[i]
      const knee = knees.current[i]
      if (!hip || !knee) continue
      const front = i < 2
      const ph = p + LEG_PHASE[i]
      let swing = Math.sin(ph) * (front ? 0.85 : 0.75) * r + Math.sin(s.t * 1.5 + i) * 0.03 * (1 - r)
      let bend = front ? Math.max(0, -Math.cos(ph)) * 1.3 * r : -Math.max(0, Math.cos(ph)) * 0.9 * r
      if (cheer && front) {
        swing = -0.9 + Math.sin(s.t * 12 + i * 2) * 0.45
        bend = 1.1
      }
      hip.rotation.x = swing
      knee.rotation.x = bend
    }
    if (marker.current) marker.current.position.y = 1.85 + Math.sin(s.t * 3 + suit) * 0.05 + (cheer ? 0.3 : 0)
  })

  const leg = (i: number) => (
    <group key={i} position={HIPS[i]} ref={(el) => void (hips.current[i] = el)}>
      <Parts geos={geo.upperLeg[i < 2 ? 0 : 1]} material={mats.coat} castShadow />
      <group position={[0, -0.32, 0]} ref={(el) => void (knees.current[i] = el)}>
        <Parts geos={geo.lowerLeg} material={mats.coat} />
        <Parts geos={geo.hoof} material={mats.hoof} />
      </group>
    </group>
  )

  const jt = geo.jockeyTorsoFrame
  return (
    <group ref={root}>
      <group scale={0.85}>
        <group ref={torso} position={[0, 0.72, 0]}>
          <Parts geos={geo.torso.coat} material={mats.coat} castShadow />
          <Parts geos={geo.torso.bib} material={mats.bib} />
          <Parts geos={geo.torso.silk} material={mats.silk} />
          <group ref={neck} position={[0, 0.1, 0.3]} rotation-x={0.55}>
            <Parts geos={geo.neck.coat} material={mats.coat} castShadow />
            <Parts geos={geo.neck.mane} material={mats.mane} />
            <Parts geos={geo.neck.eye} material={mats.eye} />
            <Parts geos={geo.neck.silk} material={mats.silk} />
          </group>
          <group ref={tail} position={[0, 0.08, -0.42]} rotation-x={0.6}>
            <Parts geos={geo.tail} material={mats.mane} />
          </group>
          {[0, 1, 2, 3].map(leg)}
          <group ref={jockey} position={[0, 0.2, 0.02]}>
            <Parts geos={geo.jockey.leather} material={mats.leather} />
            <Parts geos={geo.jockey.white} material={mats.white} />
            <Parts geos={geo.jockey.boot} material={mats.boot} />
            <Parts geos={geo.jockey.silk} material={mats.silk} castShadow />
            <Parts geos={geo.jockey.bib} material={mats.bib} />
            <Parts geos={geo.jockey.skin} material={mats.skin} />
            <group position={jt.position} rotation-x={jt.rotationX}>
              <group ref={arms} position={[0, 0.19, 0.02]}>
                <Parts geos={geo.arms} material={mats.silk} />
              </group>
            </group>
          </group>
        </group>
      </group>
      <sprite ref={marker} position={[0, 1.85, 0]} scale={0.34} material={mats.marker} />
    </group>
  )
}
