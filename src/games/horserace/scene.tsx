import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { ACCENT, FINISH_Z, GOAL, LANE_W, PODIUM_SPOTS, PODIUM_Z, SIDE_COUNT, START_Z, STEP, SUITS, TRACK_HALF, type Card } from './data'
import { bannerTexture, cardBackTexture, cardFaceTexture, checkerTexture, markerTexture, podiumTexture } from './art'
import type { World } from './Horse'

const TRACK_FROM = START_Z - 3
const TRACK_TO = PODIUM_Z + 6
const TRACK_LEN = TRACK_TO - TRACK_FROM
const TRACK_MID = (TRACK_FROM + TRACK_TO) / 2
const RAIL_X = TRACK_HALF + 0.22
const FLAG_COLORS = [...SUITS.map((s) => s.color), ACCENT]

export function Track({ finishText, world }: { finishText: string; world: React.RefObject<World> }) {
  const checker = useMemo(() => checkerTexture(), [])
  const banner = useMemo(() => bannerTexture(finishText), [finishText])
  const markers = useMemo(() => Array.from({ length: GOAL - 1 }, (_, i) => markerTexture(i + 1)), [])
  const railPosts = useMemo(() => {
    const out: [number, number][] = []
    for (let z = TRACK_FROM + 0.5; z < TRACK_TO; z += 1.1) out.push([-RAIL_X, z], [RAIL_X, z])
    return out
  }, [])
  const posts = useRef<THREE.InstancedMesh>(null)
  const stepLines = useRef<THREE.InstancedMesh>(null)
  const markerPosts = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const rot = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    railPosts.forEach(([x, z], i) => posts.current?.setMatrixAt(i, m.makeTranslation(x, 0.22, z)))
    for (let i = 0; i < GOAL - 1; i++) {
      const z = START_Z + (i + 1) * STEP
      stepLines.current?.setMatrixAt(i, m.makeTranslation(0, -0.006, z).multiply(rot))
      markerPosts.current?.setMatrixAt(i, m.makeTranslation(-RAIL_X, 0.75, z))
    }
    for (const im of [posts.current, stepLines.current, markerPosts.current]) if (im) im.instanceMatrix.needsUpdate = true
  }, [railPosts])

  return (
    <group>
      {/* grass + infield */}
      <mesh position={[0, -0.02, TRACK_MID]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 60]} />
        <meshStandardMaterial color="#0e2a1a" roughness={1} />
      </mesh>
      {/* dirt track */}
      <mesh position={[0, -0.012, TRACK_MID]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[TRACK_HALF * 2 + 0.2, TRACK_LEN]} />
        <meshStandardMaterial color="#8a5634" roughness={0.95} />
      </mesh>
      {/* lane lines */}
      {[-2, -1, 0, 1, 2].map((k) => (
        <mesh key={k} position={[k * LANE_W, -0.008, TRACK_MID]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[Math.abs(k) === 2 ? 0.06 : 0.025, TRACK_LEN]} />
          <meshBasicMaterial color="#fff6e6" transparent opacity={Math.abs(k) === 2 ? 0.9 : 0.45} />
        </mesh>
      ))}
      {/* step lines + distance markers */}
      <instancedMesh ref={stepLines} args={[undefined, undefined, GOAL - 1]}>
        <planeGeometry args={[TRACK_HALF * 2, 0.03]} />
        <meshBasicMaterial color="#fff6e6" transparent opacity={0.22} />
      </instancedMesh>
      <instancedMesh ref={markerPosts} args={[undefined, undefined, GOAL - 1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </instancedMesh>
      {markers.map((map, i) => (
        <sprite key={i} position={[-RAIL_X, 1.1, START_Z + (i + 1) * STEP]} scale={0.3}>
          <spriteMaterial map={map} toneMapped={false} />
        </sprite>
      ))}
      {/* rails */}
      {[-RAIL_X, RAIL_X].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.45, TRACK_MID]} castShadow>
            <boxGeometry args={[0.05, 0.05, TRACK_LEN]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[x + Math.sign(x) * 0.12, 0.004, TRACK_MID]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.05, TRACK_LEN]} />
            <meshBasicMaterial color={x < 0 ? '#ff3d8b' : '#3dd6ff'} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={posts} args={[undefined, undefined, railPosts.length]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.45, 6]} />
        <meshStandardMaterial color="#e8e8f0" />
      </instancedMesh>
      {/* finish line */}
      <mesh position={[0, -0.004, FINISH_Z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[TRACK_HALF * 2, 0.4]} />
        <meshBasicMaterial map={checker} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (RAIL_X + 0.1), 0, FINISH_Z]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.06, 3.2, 10]} />
            <meshStandardMaterial color="#f4f4ff" metalness={0.4} roughness={0.3} />
          </mesh>
          <mesh position={[0, 3.25, 0]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshBasicMaterial color={ACCENT} toneMapped={false} />
          </mesh>
          <WavingFlag position={[0, 3.0, 0]} color={side < 0 ? '#ff3d8b' : '#3dd6ff'} side={side} />
        </group>
      ))}
      <Banner map={banner} world={world} />
      <Bunting />
      <LightTowers />
    </group>
  )
}

function WavingFlag({ position, color, side }: { position: [number, number, number]; color: string; side: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 4 + side) * 0.35 + (side < 0 ? Math.PI : 0)
  })
  return (
    <group position={position}>
      <mesh ref={ref}>
        <planeGeometry args={[0.5, 0.32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

const BANNER_Y = 2.95
const BANNER_H = 0.42

/** Finish banner that fades out whenever it would cover a horse from the current camera. */
function Banner({ map, world }: { map: THREE.Texture; world: React.RefObject<World> }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ camera }, dt) => {
    const cz = camera.position.z
    const cy = camera.position.y
    let blocked = false
    if (cz > FINISH_Z + 0.1) {
      for (const hz of world.current.horseZ) {
        if (hz > FINISH_Z - 0.3) continue
        // Heights where the camera->horse sight lines (hooves..badge) cross the banner plane.
        const f = (cz - FINISH_Z) / (cz - hz)
        const yLow = cy - cy * f
        const yHigh = cy + (2.1 - cy) * f
        if (yHigh > BANNER_Y - BANNER_H / 2 - 0.05 && yLow < BANNER_Y + BANNER_H / 2 + 0.05) blocked = true
      }
    }
    if (mat.current) mat.current.opacity += ((blocked ? 0.1 : 1) - mat.current.opacity) * Math.min(1, dt * 8)
  })
  return (
    <mesh position={[0, BANNER_Y, FINISH_Z]} renderOrder={2}>
      <planeGeometry args={[RAIL_X * 2 + 0.2, BANNER_H]} />
      <meshBasicMaterial ref={mat} map={map} toneMapped={false} side={THREE.DoubleSide} transparent depthWrite={false} />
    </mesh>
  )
}

/** String of little triangle flags over the start straight (one instanced draw call). */
function Bunting() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = 14
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const tt = i / (n - 1)
      o.position.set(-RAIL_X + tt * RAIL_X * 2, 2.1 - Math.sin(tt * Math.PI) * 0.35, START_Z + 0.9)
      o.rotation.set(0, 0, Math.PI)
      o.updateMatrix()
      ref.current?.setMatrixAt(i, o.matrix)
      ref.current?.setColorAt(i, c.set(FLAG_COLORS[i % FLAG_COLORS.length]))
    }
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    }
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <coneGeometry args={[0.09, 0.2, 3]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

const TOWERS: [number, number][] = [
  [RAIL_X + 1.1, START_Z + 1.5],
  [RAIL_X + 1.1, FINISH_Z - 1.5],
  [-RAIL_X - 3.2, START_Z + 4.5],
]

/** Stadium light towers: poles, heads and lamps are instanced; only two real lights. */
function LightTowers() {
  const poles = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const lamps = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const o = new THREE.Object3D()
    let l = 0
    TOWERS.forEach(([x, z], i) => {
      const yaw = x > 0 ? -0.5 : 0.5
      o.rotation.set(0, 0, 0)
      o.position.set(x, 2.2, z)
      o.updateMatrix()
      poles.current?.setMatrixAt(i, o.matrix)
      o.rotation.set(0, yaw, 0)
      o.position.set(x, 4.5, z)
      o.updateMatrix()
      heads.current?.setMatrixAt(i, o.matrix)
      for (const lx of [-0.28, 0, 0.28])
        for (const ly of [-0.12, 0.12]) {
          // Lamp grid on the head's front face, in the head's rotated frame.
          o.position.set(x + lx * Math.cos(yaw) + 0.07 * Math.sin(yaw), 4.5 + ly, z - lx * Math.sin(yaw) + 0.07 * Math.cos(yaw))
          o.updateMatrix()
          lamps.current?.setMatrixAt(l++, o.matrix)
        }
    })
    for (const im of [poles.current, heads.current, lamps.current]) if (im) im.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      <instancedMesh ref={poles} args={[undefined, undefined, TOWERS.length]}>
        <cylinderGeometry args={[0.06, 0.09, 4.4, 8]} />
        <meshStandardMaterial color="#2c2440" metalness={0.6} roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, TOWERS.length]}>
        <boxGeometry args={[0.9, 0.5, 0.12]} />
        <meshStandardMaterial color="#2c2440" />
      </instancedMesh>
      <instancedMesh ref={lamps} args={[undefined, undefined, TOWERS.length * 6]}>
        <circleGeometry args={[0.09, 12]} />
        <meshBasicMaterial color="#fffbe0" toneMapped={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <pointLight position={[RAIL_X + 1.1, 4.2, START_Z + 2.5]} intensity={16} distance={13} color="#fff1c4" />
      <pointLight position={[RAIL_X + 1.1, 4.2, FINISH_Z - 0.5]} intensity={16} distance={13} color="#fff1c4" />
    </group>
  )
}

const SHADOW_HALF = 15

/**
 * Local tweaks on top of the shared Stage: pushes the fog back and widens the directional
 * light's shadow camera so the whole (long) track is covered, and caps DPR for weaker phones.
 */
export function SceneTuning({ maxDpr = 1.5 }: { maxDpr?: number }) {
  const scene = useThree((s) => s.scene)
  const setDpr = useThree((s) => s.setDpr)
  const frame = useRef(0)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, maxDpr))
  }, [setDpr, maxDpr])
  useFrame(() => {
    // Re-checked twice a second in case the Stage re-applies its props; cheap otherwise.
    if (frame.current++ % 30) return
    const fog = scene.fog
    if (fog instanceof THREE.Fog && fog.far !== 48) {
      fog.near = 20
      fog.far = 48
    }
    scene.traverse(applyShadowBounds)
  })
  return null
}

function applyShadowBounds(o: THREE.Object3D) {
  if (!(o instanceof THREE.DirectionalLight) || !o.castShadow) return
  const cam = o.shadow.camera
  if (cam.left === -SHADOW_HALF) return
  cam.left = -SHADOW_HALF
  cam.right = SHADOW_HALF
  cam.top = SHADOW_HALF
  cam.bottom = -SHADOW_HALF
  cam.far = 45
  cam.updateProjectionMatrix()
}

/** Four stalls with see-through neon doors that swing open at the start. */
export function Gate({ open }: { open: boolean }) {
  const doors = useRef<(THREE.Group | null)[]>([])
  const amount = useRef(0)
  const z = START_Z + 0.75
  useFrame((_, dt) => {
    const target = open ? 1 : 0
    amount.current += (target - amount.current) * Math.min(1, dt * (open ? 9 : 4))
    doors.current.forEach((d, i) => {
      if (d) d.rotation.y = (i % 2 ? 1 : -1) * amount.current * 1.7
    })
  })
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[TRACK_HALF * 2 + 0.3, 0.16, 0.3]} />
        <meshStandardMaterial color="#efeaff" roughness={0.3} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.5, 0.152]}>
        <planeGeometry args={[TRACK_HALF * 2 + 0.2, 0.06]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
      {[-2, -1, 0, 1, 2].map((k) => (
        <mesh key={k} position={[k * LANE_W, 0.75, 0]} castShadow>
          <boxGeometry args={[0.07, 1.5, 0.3]} />
          <meshStandardMaterial color="#efeaff" roughness={0.3} metalness={0.3} />
        </mesh>
      ))}
      {[0, 1, 2, 3].flatMap((lane) =>
        [0, 1].map((half) => {
          const i = lane * 2 + half
          const hingeX = (lane - 2) * LANE_W + (half ? LANE_W : 0) + (half ? -0.035 : 0.035)
          const w = LANE_W / 2 - 0.04
          return (
            <group key={i} position={[hingeX, 0, 0.14]} ref={(el) => void (doors.current[i] = el)}>
              <mesh position={[half ? -w / 2 : w / 2, 0.7, 0]}>
                <boxGeometry args={[w, 0.8, 0.03]} />
                <meshStandardMaterial color={SUITS[lane].color} emissive={SUITS[lane].color} emissiveIntensity={0.5} transparent opacity={0.35} />
              </mesh>
              <mesh position={[half ? -w / 2 : w / 2, 1.1, 0]}>
                <boxGeometry args={[w, 0.05, 0.05]} />
                <meshBasicMaterial color={SUITS[lane].color} toneMapped={false} />
              </mesh>
            </group>
          )
        }),
      )}
    </group>
  )
}

/** Bleachers on the left with a bouncing crowd. */
export function Crowd({ world }: { world: React.RefObject<World> }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const seats = useMemo(() => {
    const out: { x: number; y: number; z: number; ph: number; sp: number }[] = []
    for (let tier = 0; tier < 3; tier++)
      for (let z = START_Z - 1.5; z < PODIUM_Z + 2; z += 0.42)
        out.push({ x: -RAIL_X - 0.75 - tier * 0.55, y: 0.3 + tier * 0.3, z: z + (tier % 2) * 0.2, ph: Math.random() * 6, sp: 5 + Math.random() * 4 })
    return out
  }, [])
  useLayoutEffect(() => {
    const c = new THREE.Color()
    const palette = ['#ff3d8b', '#3dd6ff', '#ffd23d', '#7b5cff', '#3dff8b', '#ff8a3d', '#ffffff']
    seats.forEach((_, i) => {
      mesh.current?.setColorAt(i, c.set(palette[i % palette.length]))
      heads.current?.setColorAt(i, c.set(['#f0c49b', '#c68a5b', '#8a5a3b', '#ffd9b8'][i % 4]))
    })
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
    if (heads.current?.instanceColor) heads.current.instanceColor.needsUpdate = true
  }, [seats])
  const m = useMemo(() => new THREE.Matrix4(), [])
  useFrame(({ clock }, dt) => {
    const w = world.current
    w.excitement = Math.max(0.15, w.excitement - dt * 0.35)
    const t = clock.elapsedTime
    seats.forEach((s, i) => {
      const jump = Math.max(0, Math.sin(t * s.sp + s.ph)) * 0.14 * w.excitement
      mesh.current?.setMatrixAt(i, m.makeTranslation(s.x, s.y + 0.14 + jump, s.z))
      heads.current?.setMatrixAt(i, m.makeTranslation(s.x, s.y + 0.33 + jump, s.z))
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
    if (heads.current) heads.current.instanceMatrix.needsUpdate = true
  })
  const len = PODIUM_Z + 2.5 - (START_Z - 2)
  const mid = (PODIUM_Z + 2.5 + START_Z - 2) / 2
  return (
    <group>
      {[0, 1, 2].map((tier) => (
        <group key={tier}>
          <mesh position={[-RAIL_X - 0.75 - tier * 0.55, (0.3 + tier * 0.3) / 2, mid]} receiveShadow>
            <boxGeometry args={[0.55, 0.3 + tier * 0.3, len]} />
            <meshStandardMaterial color="#261640" roughness={0.8} />
          </mesh>
          <mesh position={[-RAIL_X - 0.75 - tier * 0.55 + 0.276, 0.3 + tier * 0.3 - 0.03, mid]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[len, 0.04]} />
            <meshBasicMaterial color={tier % 2 ? '#3dd6ff' : '#ff3d8b'} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={mesh} args={[undefined, undefined, seats.length]}>
        <capsuleGeometry args={[0.08, 0.12, 4, 8]} />
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, seats.length]}>
        <sphereGeometry args={[0.065, 10, 8]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  )
}

/** The classic face-down "side cards" laid along the infield; they flip when every horse has passed them. */
export function SideCards({ cards, flipped }: { cards: Card[]; flipped: boolean[] }) {
  const back = useMemo(() => cardBackTexture(), [])
  return (
    <group>
      {cards.slice(0, SIDE_COUNT).map((c, i) => (
        <SideCard key={`${i}-${c.suit}-${c.rank}`} card={c} back={back} flipped={flipped[i]} z={START_Z + (i + 1) * STEP} />
      ))}
    </group>
  )
}

function SideCard({ card, back, flipped, z }: { card: Card; back: THREE.Texture; flipped: boolean; z: number }) {
  const face = useMemo(() => cardFaceTexture(card), [card])
  const g = useRef<THREE.Group>(null)
  const anim = useRef(0)
  useFrame((_, dt) => {
    anim.current += ((flipped ? 1 : 0) - anim.current) * Math.min(1, dt * 5)
    if (!g.current) return
    const a = anim.current
    g.current.rotation.z = Math.PI * (1 - a)
    g.current.position.y = 0.03 + Math.sin(a * Math.PI) * 0.6
  })
  return (
    <group position={[RAIL_X + 0.45, 0, z]} rotation-y={-0.25}>
      <group ref={g} rotation-z={Math.PI}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
          <planeGeometry args={[0.46, 0.64]} />
          <meshStandardMaterial map={face} transparent roughness={0.4} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position={[0, -0.002, 0]}>
          <planeGeometry args={[0.46, 0.64]} />
          <meshStandardMaterial map={back} transparent roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

export function Podium({ visible }: { visible: boolean }) {
  const g = useRef<THREE.Group>(null)
  const s = useRef(0)
  const tex = useMemo(() => [1, 2, 3].map(podiumTexture), [])
  useFrame((_, dt) => {
    s.current += ((visible ? 1 : 0) - s.current) * Math.min(1, dt * 6)
    if (!g.current) return
    g.current.visible = s.current > 0.01
    g.current.scale.set(1, Math.max(0.001, s.current), 1)
  })
  return (
    <group ref={g} visible={false}>
      {PODIUM_SPOTS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <RoundedBox args={[0.88, p.y, 0.95]} radius={0.05} smoothness={3} position={[0, p.y / 2, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color="#2a1650" roughness={0.35} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0, p.y / 2, 0.477]}>
            <planeGeometry args={[0.42, 0.42 * Math.min(1, p.y / 0.42)]} />
            <meshBasicMaterial map={tex[i]} toneMapped={false} />
          </mesh>
          <mesh position={[0, p.y + 0.003, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.3, 0.34, 32]} />
            <meshBasicMaterial color={['#ffd23d', '#d7dbe6', '#ff9a5c'][i]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const CONFETTI = 180
export function Confetti({ active }: { active: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(
    () =>
      Array.from({ length: CONFETTI }, () => ({
        p: new THREE.Vector3(),
        v: new THREE.Vector3(),
        r: new THREE.Euler(),
        spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        alive: false,
      })),
    [],
  )
  useLayoutEffect(() => {
    const c = new THREE.Color()
    const palette = [...FLAG_COLORS, '#ffffff', '#7b5cff']
    for (let i = 0; i < CONFETTI; i++) mesh.current?.setColorAt(i, c.set(palette[i % palette.length]))
    if (mesh.current?.instanceColor) mesh.current.instanceColor.needsUpdate = true
  }, [])
  const wasActive = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    if (active && !wasActive.current) {
      parts.forEach((q, i) => {
        q.alive = true
        q.p.set((Math.random() - 0.5) * 0.6, 1.4, PODIUM_Z + (Math.random() - 0.5) * 0.6)
        const a = Math.random() * Math.PI * 2
        const sp = 1.5 + Math.random() * 3
        q.v.set(Math.cos(a) * sp, 4 + Math.random() * 4 + (i % 3), Math.sin(a) * sp * 0.6)
      })
    }
    wasActive.current = active
    if (!mesh.current) return
    parts.forEach((q, i) => {
      if (!q.alive) {
        dummy.position.set(0, -50, 0)
      } else {
        q.v.y -= 6 * dt
        q.v.multiplyScalar(1 - dt * 1.4)
        q.v.y = Math.max(q.v.y, -1.1)
        q.p.addScaledVector(q.v, dt)
        q.p.x += Math.sin(q.p.y * 3 + i) * dt * 0.4
        q.r.x += q.spin.x * dt
        q.r.y += q.spin.y * dt
        q.r.z += q.spin.z * dt
        if (q.p.y < 0) {
          if (active) {
            q.p.set((Math.random() - 0.5) * 4, 4 + Math.random() * 2, PODIUM_Z + (Math.random() - 0.5) * 3)
            q.v.set(0, -0.5, 0)
          } else q.alive = false
        }
        dummy.position.copy(q.p)
      }
      dummy.rotation.copy(q.r)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]} frustumCulled={false}>
      <planeGeometry args={[0.07, 0.11]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}

export type CamMode = 'bets' | 'race' | 'photo' | 'podium'

/** Smoothly frames the action: gate close-up, leader-follow, side photo-finish, podium. */
export function CameraRig({ mode, world }: { mode: CamMode; world: React.RefObject<World> }) {
  const look = useRef(new THREE.Vector3(0, 0, START_Z + 1.5))
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, clock }, raw) => {
    const dt = Math.min(raw, 0.05)
    const zs = world.current.horseZ
    const t = clock.elapsedTime
    let k = 2.4
    if (mode === 'bets') {
      pos.set(0.6 + Math.sin(t * 0.3) * 0.5, 3.1, START_Z + 5.4)
      tgt.set(0, 0, START_Z + 1.6)
    } else if (mode === 'race') {
      let max = -Infinity
      let sum = 0
      for (const z of zs) {
        max = Math.max(max, z)
        sum += z
      }
      const mean = sum / zs.length
      const f = Math.min(max * 0.65 + mean * 0.35, FINISH_Z)
      pos.set(0.6, 5.6, f + 7.4)
      tgt.set(0, 0, f + 1.1)
    } else if (mode === 'photo') {
      pos.set(2.9, 1.3, FINISH_Z + 2.6)
      tgt.set(0, 0.55, FINISH_Z - 0.4)
      k = 3.2
    } else {
      pos.set(Math.sin(t * 0.4) * 0.4, 2.8, PODIUM_Z + 8)
      tgt.set(0.2, 0.25, PODIUM_Z + 1.4)
      k = 1.8
    }
    const a = 1 - Math.exp(-dt * k)
    camera.position.lerp(pos, a)
    look.current.lerp(tgt, a)
    camera.lookAt(look.current)
  })
  return null
}
