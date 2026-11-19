import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { canvasTexture, DISPLAY_FONT } from '../../three/textures'
import { sfx } from '../../core/feedback'

export const ACCENT = '#ff3d3d'
export const GLASSES = 6
const RING = 1.25
const BASE_Y = 0.11
/** Shots are filled almost to the rim (glass is 0.55 tall, inner base at 0.09). */
const LIQUID_H = 0.41
const GLASS_SCALE = 1.2
const LIQUIDS = ['#ff3d8b', '#3dd6ff', '#ffd23d', '#3dff8b', '#9b7bff', '#ff8a3d']
const SLOT_ANGLE = (slot: number) => (slot / GLASSES) * Math.PI * 2

export type Phase = 'shuffle' | 'pick' | 'lift' | 'safe' | 'cursed'
export type Reveal = 'safe' | 'cursed' | null

interface SlotAnim {
  angle: number
  r: number
  hop: number
}

function coasterTexture(kind: 'hidden' | 'safe' | 'cursed') {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const c = w / 2
    const ring = kind === 'safe' ? '#3dff8b' : kind === 'cursed' ? '#ff3d3d' : '#5a3a8a'
    const g = ctx.createRadialGradient(c, c, 10, c, c, c)
    g.addColorStop(0, kind === 'safe' ? '#0f4a2a' : kind === 'cursed' ? '#4a0a14' : '#24123f')
    g.addColorStop(1, '#12061f')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.lineWidth = 14
    ctx.strokeStyle = ring
    ctx.beginPath()
    ctx.arc(c, c, c - 14, 0, Math.PI * 2)
    ctx.stroke()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    if (kind === 'hidden') {
      ctx.fillStyle = '#7b5cff'
      ctx.font = `120px ${DISPLAY_FONT}`
      ctx.fillText('?', c, c + 8)
    } else {
      ctx.font = `140px ${DISPLAY_FONT}`
      ctx.fillStyle = ring
      ctx.fillText(kind === 'safe' ? '✓' : '💀', c, c + 8)
    }
  })
}

function skullTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,61,61,0.7)')
    g.addColorStop(1, 'rgba(255,61,61,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.font = `160px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('💀', w / 2, h / 2 + 10)
  })
}

/** Shot glass profile (radius, height), revolved by LatheGeometry. */
function glassGeometry() {
  const pts = [
    [0, 0],
    [0.17, 0],
    [0.182, 0.012],
    [0.222, 0.55],
    [0.2, 0.55],
    [0.158, 0.09],
    [0, 0.09],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(pts, 40)
}

export function RouletteScene({
  phase,
  lifted,
  tipped,
  reveal,
  shuffleKey,
  onShuffled,
  onPick,
}: {
  phase: Phase
  lifted: number | null
  tipped: boolean[]
  reveal: Reveal
  shuffleKey: number
  onShuffled: () => void
  onPick: (id: number) => void
}) {
  const tray = useRef<THREE.Group>(null)
  const orb = useRef<THREE.Mesh>(null)
  const anims = useRef<SlotAnim[]>(Array.from({ length: GLASSES }, (_, i) => ({ angle: SLOT_ANGLE(i), r: RING, hop: 0 })))
  const shuffle = useRef({
    key: -1,
    slotOf: Array.from({ length: GLASSES }, (_, i) => i),
    queue: [] as [number, number][],
    current: null as null | { a: number; b: number; fromA: number; fromB: number; dA: number; dB: number; t: number; dur: number },
    swapsDone: 0,
    wait: 0,
  })
  const shake = useRef(0)
  const onShuffledRef = useRef(onShuffled)
  onShuffledRef.current = onShuffled
  const lastPhase = useRef(phase)
  const camTarget = useMemo(() => new THREE.Vector3(), [])
  // Transmission glass is the heaviest thing here: cap pixel ratio on dense phone screens.
  const setDpr = useThree((s) => s.setDpr)
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, 1.5))
  }, [setDpr])

  const shared = useMemo(
    () => ({
      geo: glassGeometry(),
      liquid: new THREE.CylinderGeometry(0.19, 0.152, LIQUID_H, 32).translate(0, LIQUID_H / 2, 0),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transmission: 1,
        thickness: 0.18,
        roughness: 0.03,
        ior: 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        specularIntensity: 1,
        envMapIntensity: 1.4,
      }),
      coaster: { hidden: coasterTexture('hidden'), safe: coasterTexture('safe'), cursed: coasterTexture('cursed') },
      skull: skullTexture(),
    }),
    [],
  )

  useFrame(({ camera, clock }, raw) => {
    const dt = Math.min(raw, 0.05)
    const sh = shuffle.current
    if (lastPhase.current !== phase) {
      if (phase === 'cursed') shake.current = 1
      lastPhase.current = phase
    }

    // New round: queue a burst of random swaps.
    if (sh.key !== shuffleKey && phase === 'shuffle') {
      sh.key = shuffleKey
      sh.queue = []
      for (let i = 0; i < 9; i++) {
        const a = Math.floor(Math.random() * GLASSES)
        let b = Math.floor(Math.random() * (GLASSES - 1))
        if (b >= a) b++
        sh.queue.push([a, b])
      }
      sh.swapsDone = 0
      sh.wait = 0.9
    }
    if (sh.wait > 0) sh.wait -= dt
    else if (!sh.current && sh.queue.length) {
      const [a, b] = sh.queue.shift()!
      const fromA = anims.current[a].angle
      const fromB = anims.current[b].angle
      const toA = SLOT_ANGLE(sh.slotOf[b])
      const toB = SLOT_ANGLE(sh.slotOf[a])
      const short = (from: number, to: number) => {
        let d = (to - from) % (Math.PI * 2)
        if (d > Math.PI) d -= Math.PI * 2
        if (d < -Math.PI) d += Math.PI * 2
        return d
      }
      ;[sh.slotOf[a], sh.slotOf[b]] = [sh.slotOf[b], sh.slotOf[a]]
      sh.current = { a, b, fromA, fromB, dA: short(fromA, toA), dB: short(fromB, toB), t: 0, dur: Math.max(0.2, 0.42 - sh.swapsDone * 0.025) }
      sfx.whoosh()
    }
    if (sh.current) {
      const c = sh.current
      c.t = Math.min(1, c.t + dt / c.dur)
      const e = c.t < 0.5 ? 2 * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 2) / 2
      const bulge = Math.sin(Math.PI * e)
      const A = anims.current[c.a]
      const B = anims.current[c.b]
      A.angle = c.fromA + c.dA * e
      A.r = RING + 0.55 * bulge
      A.hop = 0.18 * bulge
      B.angle = c.fromB + c.dB * e
      B.r = RING - 0.55 * bulge
      B.hop = 0.05 * bulge
      if (c.t >= 1) {
        sfx.click()
        sh.current = null
        sh.swapsDone++
        if (!sh.queue.length) {
          sh.wait = 0.35
          setTimeout(() => onShuffledRef.current(), 350)
        }
      }
    }

    if (tray.current) tray.current.rotation.y += dt * (phase === 'shuffle' ? 0.5 : phase === 'pick' ? 0.12 : 0)
    if (orb.current) {
      const speed = phase === 'lift' ? 18 : phase === 'cursed' ? 30 : 3
      const s = 1 + Math.sin(clock.elapsedTime * speed) * 0.12
      orb.current.scale.setScalar(s)
    }

    // Camera: slight dolly-in during suspense, shake on the curse.
    shake.current = Math.max(0, shake.current - dt * 1.4)
    const k = phase === 'lift' ? 0.86 : 1
    const sx = (Math.random() - 0.5) * 0.35 * shake.current
    const sy = (Math.random() - 0.5) * 0.35 * shake.current
    camTarget.set(sx, 6.8 * k + sy, 6.4 * k + 0.4 * (1 - k))
    camera.position.lerp(camTarget, 1 - Math.exp(-dt * 4))
    camera.lookAt(0, 0, 1.3)
  })

  return (
    <group>
      <group ref={tray}>
        {/* tray */}
        <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.2, 2.25, 0.08, 64]} />
          <meshPhysicalMaterial color="#c8c2d8" metalness={0.9} roughness={0.22} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0.082, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[2.08, 64]} />
          <meshStandardMaterial color="#2a0d1c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.085, 0]} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[2.16, 0.025, 8, 96]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} />
        </mesh>
        {/* center orb */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.28, 0.36, 0.28, 32]} />
          <meshPhysicalMaterial color="#1a0b16" metalness={0.6} roughness={0.3} clearcoat={1} />
        </mesh>
        <mesh ref={orb} position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.9, 0]} intensity={phase === 'cursed' ? 30 : 8} color={ACCENT} distance={5} />
        {Array.from({ length: GLASSES }, (_, id) => (
          <Glass
            key={id}
            id={id}
            anim={anims}
            shared={shared}
            lifted={lifted === id}
            tipped={tipped[id]}
            reveal={lifted === id ? reveal : tipped[id] ? 'safe' : null}
            pickable={phase === 'pick' && !tipped[id]}
            onPick={onPick}
          />
        ))}
      </group>
    </group>
  )
}

function Glass({
  id,
  anim,
  shared,
  lifted,
  tipped,
  reveal,
  pickable,
  onPick,
}: {
  id: number
  anim: React.RefObject<SlotAnim[]>
  shared: { geo: THREE.LatheGeometry; liquid: THREE.BufferGeometry; glass: THREE.Material; coaster: Record<'hidden' | 'safe' | 'cursed', THREE.Texture>; skull: THREE.Texture }
  lifted: boolean
  tipped: boolean
  reveal: Reveal
  pickable: boolean
  onPick: (id: number) => void
}) {
  const slot = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const liquid = useRef<THREE.Mesh>(null)
  const meniscus = useRef<THREE.Mesh>(null)
  const puddle = useRef<THREE.Mesh>(null)
  const st = useRef({ lift: 0, tip: 0, t: Math.random() * 10, hover: 0 })
  const color = LIQUIDS[id]
  const mats = useMemo(
    () => ({
      // Opaque on purpose: transmissive objects are not visible through the transmissive glass.
      liquid: new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0.1 }),
      meniscus: new THREE.MeshBasicMaterial({ color: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5), toneMapped: false }),
      side: new THREE.MeshStandardMaterial({ color: '#1a0b2e', roughness: 0.5 }),
      top: new THREE.MeshStandardMaterial({ map: shared.coaster.hidden, roughness: 0.4 }),
      puddle: new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.3, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85 }),
    }),
    [color, shared],
  )
  const coasterMats = useMemo(() => [mats.side, mats.top, mats.side], [mats])

  useLayoutEffect(() => {
    mats.top.map = reveal ? shared.coaster[reveal] : shared.coaster.hidden
    mats.top.emissive.set(reveal === 'safe' ? '#3dff8b' : reveal === 'cursed' ? '#ff3d3d' : '#000000')
    mats.top.emissiveIntensity = reveal ? 0.25 : 0
    mats.top.needsUpdate = true
  }, [reveal, mats, shared])

  const cursedColor = useMemo(() => new THREE.Color('#2a0638'), [])
  const baseColor = useMemo(() => new THREE.Color(color), [color])
  const topColor = useMemo(() => new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5), [color])
  const cursedTop = useMemo(() => new THREE.Color('#7a1a8a'), [])

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    const s = st.current
    s.t += dt
    const a = anim.current[id]
    if (slot.current) {
      slot.current.position.set(Math.sin(a.angle) * a.r, a.hop, Math.cos(a.angle) * a.r)
      slot.current.rotation.y = a.angle
    }
    s.lift += ((lifted ? 1 : 0) - s.lift) * Math.min(1, dt * (lifted ? 3 : 6))
    s.tip += ((tipped ? 1 : 0) - s.tip) * Math.min(1, dt * 5)
    s.hover += ((pickable ? 1 : 0) - s.hover) * Math.min(1, dt * 4)
    if (body.current) {
      const suspense = lifted && !reveal ? 1 : 0
      const cursed = reveal === 'cursed' && lifted
      const wobble = Math.sin(s.t * 22) * 0.05 * suspense + (cursed ? Math.sin(s.t * 40) * 0.12 : 0)
      const idleBob = Math.sin(s.t * 2.4 + id) * 0.02 * s.hover
      // Picked safe glasses lie on their side (tangentially, so they stay in frame).
      body.current.position.set(s.tip * 0.28, BASE_Y + s.lift * 0.85 + s.tip * 0.19 + idleBob, 0)
      body.current.rotation.set(0, 0, -s.tip * Math.PI * 0.48 + wobble)
    }
    if (liquid.current) {
      liquid.current.scale.y = Math.max(0.001, 1 - s.tip)
      const doom = reveal === 'cursed' && lifted
      const k = Math.min(1, dt * 3)
      mats.liquid.color.lerp(doom ? cursedColor : baseColor, k)
      mats.liquid.emissive.lerp(doom ? cursedColor : baseColor, k)
      mats.meniscus.color.lerp(doom ? cursedTop : topColor, k)
      if (meniscus.current) meniscus.current.position.y = LIQUID_H + 0.003 + Math.sin(s.t * 3 + id) * 0.003
    }
    if (puddle.current) puddle.current.scale.setScalar(Math.max(0.001, s.tip))
  })

  return (
    <group ref={slot} scale={GLASS_SCALE}>
      {/* coaster hides the secret until the glass is lifted */}
      <mesh position={[0, 0.098, 0]} material={coasterMats} receiveShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.03, 40]} />
      </mesh>
      <mesh ref={puddle} position={[0.66, 0.088, 0]} rotation-x={-Math.PI / 2} material={mats.puddle}>
        <circleGeometry args={[0.32, 24]} />
      </mesh>
      <group ref={body}>
        <mesh geometry={shared.geo} material={shared.glass} castShadow />
        <mesh ref={liquid} position={[0, 0.092, 0]} geometry={shared.liquid} material={mats.liquid}>
          {/* bright meniscus sitting just above the liquid's top cap */}
          <mesh ref={meniscus} position={[0, LIQUID_H + 0.003, 0]} rotation-x={-Math.PI / 2} material={mats.meniscus}>
            <circleGeometry args={[0.186, 32]} />
          </mesh>
        </mesh>
        <group position={[0, 0.27, 0]}>
          {reveal === 'cursed' && lifted && <CurseFx skull={shared.skull} />}
        </group>
      </group>
      {reveal === 'safe' && lifted && <Sparkles />}
      {/* fat invisible hit area: easier to tap with a drink in hand */}
      <mesh
        position={[0, 0.4, 0]}
        onClick={(e) => {
          e.stopPropagation()
          if (pickable) onPick(id)
        }}
      >
        <cylinderGeometry args={[0.42, 0.42, 0.9, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Green sparkle burst from the coaster. */
function Sparkles() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const n = 36
  const parts = useMemo(
    () =>
      Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2
        const up = 1.5 + Math.random() * 2.5
        const out = 0.6 + Math.random() * 1.4
        return { v: new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out), p: new THREE.Vector3(0, 0.2, 0), s: 0.5 + Math.random() }
      }),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const age = useRef(0)
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    age.current += dt
    const life = Math.max(0, 1 - age.current / 1.4)
    parts.forEach((q, i) => {
      q.v.y -= 4 * dt
      q.p.addScaledVector(q.v, dt)
      dummy.position.copy(q.p)
      dummy.rotation.set(age.current * 6 + i, age.current * 4, 0)
      dummy.scale.setScalar(q.s * life * 0.06)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(i, dummy.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, n]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#7dffb0" toneMapped={false} />
    </instancedMesh>
  )
}

/** Purple smoke puffs + a rising skull. */
function CurseFx({ skull }: { skull: THREE.Texture }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const sprite = useRef<THREE.Sprite>(null)
  const light = useRef<THREE.PointLight>(null)
  const n = 22
  const parts = useMemo(
    () =>
      Array.from({ length: n }, () => {
        const a = Math.random() * Math.PI * 2
        return { v: new THREE.Vector3(Math.cos(a) * 0.5, 0.6 + Math.random() * 0.9, Math.sin(a) * 0.5), p: new THREE.Vector3(0, 0.1, 0), s: 0.12 + Math.random() * 0.12, d: Math.random() * 0.4 }
      }),
    [],
  )
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3a1050', emissive: '#5a0a3a', emissiveIntensity: 0.4, transparent: true, opacity: 0.8, depthWrite: false }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const age = useRef(0)
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05)
    age.current += dt
    const t = age.current
    parts.forEach((q, i) => {
      const local = Math.max(0, t - q.d)
      if (local > 0) q.p.addScaledVector(q.v, dt)
      q.v.multiplyScalar(1 - dt * 0.8)
      dummy.position.copy(q.p)
      dummy.scale.setScalar(local > 0 ? q.s * (1 + local * 2.2) : 0.0001)
      dummy.updateMatrix()
      mesh.current?.setMatrixAt(i, dummy.matrix)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
    mat.opacity = Math.max(0, 0.8 - t * 0.25)
    if (sprite.current) {
      const pop = Math.min(1, t * 3)
      const s = (0.2 + 0.7 * (1 - Math.pow(1 - pop, 3))) * (1 + Math.sin(t * 8) * 0.04)
      sprite.current.scale.setScalar(s)
      sprite.current.position.y = 0.55 + Math.min(1, t) * 0.5 + Math.sin(t * 3) * 0.05
    }
    if (light.current) light.current.intensity = 25 * Math.max(0.2, 1 - t * 0.5)
  })
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, n]} material={mat} frustumCulled={false}>
        <sphereGeometry args={[1, 12, 10]} />
      </instancedMesh>
      <sprite ref={sprite} position={[0, 0.55, 0]} scale={0.2}>
        <spriteMaterial map={skull} toneMapped={false} depthWrite={false} />
      </sprite>
      <pointLight ref={light} color="#ff3d3d" intensity={25} distance={4} position={[0, 0.5, 0]} />
    </group>
  )
}
