import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { canvasTexture, DISPLAY_FONT, fitText, roundRect } from '../../three/textures'
import { Confetti } from '../../three/Confetti'
import { ACCENT, nearestSeat, planeAngle, SEAT_RADIUS, seatAngle, TABLE_RADIUS, wrapAngle, type BottleSim, type Seat } from './sim'

const TAU = Math.PI * 2
/** Coulomb (constant) + viscous friction, in rad/s² and 1/s. */
const MU = 1.2
const VISCOUS = 0.4
const BODY_R = 0.26
/** Physics timestep and the most steps simulated per rendered frame. */
const STEP = 1 / 120
const MAX_STEPS = 12

function radialTexture(color = '#ffffff') {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, color)
    g.addColorStop(0.35, color + 'aa')
    g.addColorStop(1, color + '00')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

// ---------------------------------------------------------------- bottle

function useBottleParts() {
  return useMemo(() => {
    // Outer profile up to the lip, then back down the inside: a real glass shell with thickness.
    const outer: [number, number][] = [
      [0.001, 0],
      [0.2, 0],
      [0.245, 0.02],
      [BODY_R, 0.07],
      [BODY_R, 0.8],
      [0.252, 0.87],
      [0.225, 0.94],
      [0.18, 1.01],
      [0.13, 1.08],
      [0.098, 1.16],
      [0.088, 1.25],
      [0.086, 1.48],
      [0.104, 1.5],
      [0.106, 1.58],
      [0.092, 1.62],
    ]
    const inner: [number, number][] = [
      [0.068, 1.61],
      [0.068, 1.25],
      [0.078, 1.16],
      [0.11, 1.08],
      [0.16, 1.01],
      [0.205, 0.94],
      [0.232, 0.87],
      [0.237, 0.8],
      [0.237, 0.1],
      [0.15, 0.06],
      [0.001, 0.05],
    ]
    const pts = [...outer, ...inner].map(([r, y]) => new THREE.Vector2(r, y))
    const glass = new THREE.LatheGeometry(pts, 64)
    glass.translate(0, -0.72, 0)

    const label = new THREE.CylinderGeometry(BODY_R + 0.004, BODY_R + 0.004, 0.56, 64, 1, true)
    label.translate(0, 0.46 - 0.72, 0)
    const foil = new THREE.CylinderGeometry(0.093, 0.1, 0.2, 40, 1, true)
    foil.translate(0, 1.4 - 0.72, 0)
    const lip = new THREE.TorusGeometry(0.1, 0.014, 12, 40)
    lip.rotateX(Math.PI / 2)
    lip.translate(0, 1.545 - 0.72, 0)

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#b8ffd6',
      transmission: 1,
      thickness: 0.35,
      roughness: 0.03,
      ior: 1.5,
      attenuationColor: new THREE.Color('#14a050'),
      attenuationDistance: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      envMapIntensity: 1.6,
    })

    const labelMap = canvasTexture(
      1024,
      352,
      (ctx, w, h) => {
        // u wraps around the bottle, v runs along its axis: text is drawn rotated so it reads along the bottle.
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, '#fff6dc')
        g.addColorStop(1, '#f1ddb0')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = '#0d5f33'
        ctx.fillRect(0, 0, w, 34)
        ctx.fillRect(0, h - 34, w, 34)
        ctx.fillStyle = '#d4a531'
        ctx.fillRect(0, 34, w, 8)
        ctx.fillRect(0, h - 42, w, 8)
        for (let k = 0; k < 4; k++) {
          ctx.save()
          ctx.translate(((k + 0.5) * w) / 4, h / 2)
          ctx.rotate(-Math.PI / 2)
          fitText(ctx, 'BRINDY', 0, -12, h - 110, 90, { font: DISPLAY_FONT, weight: '400', maxSize: 78, color: '#0d5f33' })
          fitText(ctx, '★ EST. 2025 ★', 0, 46, h - 110, 30, { maxSize: 24, color: '#b0801a' })
          ctx.restore()
        }
      },
      { fonts: true },
    )
    const labelMat = new THREE.MeshPhysicalMaterial({ map: labelMap, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.2, side: THREE.DoubleSide })
    const foilMat = new THREE.MeshStandardMaterial({ color: '#ffcf4a', metalness: 1, roughness: 0.22 })
    return { glass, label, foil, lip, glassMat, labelMat, foilMat }
  }, [])
}

function Bottle({
  sim,
  n,
  festive,
  onTick,
  onStop,
}: {
  sim: React.RefObject<BottleSim>
  n: number
  festive: boolean
  onTick: (seat: number, speed: number) => void
  onStop: (seat: number) => void
}) {
  const parts = useBottleParts()
  const spin = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const beam = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const acc = useRef(0)
  const haloTex = useMemo(() => radialTexture(ACCENT), [])
  const beamTex = useMemo(
    () =>
      canvasTexture(256, 32, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, 0)
        g.addColorStop(0, 'rgba(255,255,255,0)')
        g.addColorStop(0.25, 'rgba(255,255,255,0.9)')
        g.addColorStop(1, 'rgba(255,255,255,1)')
        ctx.fillStyle = g
        const v = ctx.createLinearGradient(0, 0, 0, h)
        ctx.fillRect(0, 0, w, h)
        v.addColorStop(0, 'rgba(0,0,0,1)')
        v.addColorStop(0.5, 'rgba(0,0,0,0)')
        v.addColorStop(1, 'rgba(0,0,0,1)')
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = v
        ctx.fillRect(0, 0, w, h)
      }),
    [],
  )

  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const s = sim.current
    const t = state.clock.elapsedTime
    // Fixed-timestep physics: real-time correct at any frame rate (down to ~10 fps), remainder carried over.
    acc.current = Math.min(acc.current + raw, STEP * MAX_STEPS)
    while (acc.current >= STEP) {
      acc.current -= STEP
      if (s.mode === 'spin') {
        const w = Math.abs(s.omega)
        const dec = (MU + VISCOUS * w) * STEP
        if (w <= dec) {
          s.omega = 0
          s.mode = 'idle'
          s.settle = 1
          s.seat = nearestSeat(s.angle, n)
          onStop(s.seat)
        } else {
          s.omega -= Math.sign(s.omega) * dec
          s.angle += s.omega * STEP
        }
      }
      const seat = nearestSeat(s.angle, n)
      if (seat !== s.seat) {
        s.seat = seat
        if (s.mode !== 'idle') onTick(seat, Math.abs(s.omega))
      }
    }
    s.settle *= Math.exp(-2.2 * dt)

    const speed = Math.abs(s.omega)
    const amp = Math.min(0.06, speed * 0.0035) + s.settle * 0.07
    const g = tilt.current
    if (g) {
      // Neck bobbing + slight roll: a bottle never spins perfectly flat.
      g.rotation.z = Math.sin(t * 13) * amp
      g.rotation.x = Math.cos(t * 9.5) * amp * 0.6
      const lift = s.mode === 'drag' ? 0.14 : Math.abs(Math.sin(t * 17)) * amp * 0.25
      g.position.y = THREE.MathUtils.damp(g.position.y, BODY_R + lift, 14, dt)
      const sc = s.mode === 'drag' ? 1.06 : 1
      g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, sc, 10, dt))
    }
    if (spin.current) spin.current.rotation.y = s.angle
    if (beam.current) {
      const target = s.winner >= 0 ? 0.75 + Math.sin(t * 6) * 0.2 : s.mode === 'spin' ? Math.min(0.35, speed * 0.03) : 0.12
      beam.current.opacity = THREE.MathUtils.damp(beam.current.opacity, target, 8, dt)
    }
    if (halo.current) halo.current.opacity = THREE.MathUtils.damp(halo.current.opacity, 0.35 + Math.min(0.5, speed * 0.04) + s.settle * 0.3, 6, dt)
  })

  const beamStart = 0.95
  const beamLen = SEAT_RADIUS - 0.35 - beamStart
  return (
    <group ref={spin}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.012}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshBasicMaterial ref={halo} map={haloTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[beamStart + beamLen / 2, 0.016, 0]}>
        <planeGeometry args={[beamLen, 0.12]} />
        <meshBasicMaterial
          ref={beam}
          map={beamTex}
          color={ACCENT}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <group ref={tilt} position-y={BODY_R}>
        <group rotation-z={-Math.PI / 2}>
          <mesh geometry={parts.label} material={parts.labelMat} castShadow />
          <mesh geometry={parts.foil} material={parts.foilMat} castShadow />
          <mesh geometry={parts.lip} material={parts.foilMat} />
          <mesh geometry={parts.glass} material={parts.glassMat} castShadow />
          {festive && <SantaHat />}
        </group>
      </group>
    </group>
  )
}

/** Santa hat on the bottle mouth (bottle-local axis: +y towards the mouth). */
function SantaHat() {
  const mats = useMemo(
    () => ({
      red: new THREE.MeshStandardMaterial({ color: '#e0182d', emissive: '#7a0010', emissiveIntensity: 0.35, roughness: 0.6 }),
      fur: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.15, roughness: 0.95 }),
    }),
    [],
  )
  return (
    <group position-y={1.5 - 0.72}>
      <mesh position-y={0.17} rotation-x={0.12} material={mats.red} castShadow>
        <coneGeometry args={[0.125, 0.34, 20]} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} material={mats.fur}>
        <torusGeometry args={[0.118, 0.036, 10, 28]} />
      </mesh>
      <mesh position={[0, 0.34, 0.04]} material={mats.fur}>
        <sphereGeometry args={[0.045, 14, 12]} />
      </mesh>
    </group>
  )
}

const SNOW = 180

/** Gentle snowfall over the table: one Points draw call, positions updated in place. */
function Snow() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(SNOW * 3)
    for (let i = 0; i < SNOW; i++) {
      const a = Math.random() * TAU
      const r = Math.sqrt(Math.random()) * (TABLE_RADIUS + 0.6)
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = Math.random() * 4.5
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const speeds = useMemo(() => Float32Array.from({ length: SNOW }, () => 0.3 + Math.random() * 0.45), [])
  const tex = useMemo(() => radialTexture('#ffffff'), [])
  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const t = state.clock.elapsedTime
    const attr = geo.getAttribute('position') as THREE.BufferAttribute
    const p = attr.array as Float32Array
    for (let i = 0; i < SNOW; i++) {
      const k = i * 3
      p[k + 1] -= speeds[i] * dt
      p[k] += Math.sin(t * 0.8 + i) * 0.12 * dt
      p[k + 2] += Math.cos(t * 0.6 + i * 1.3) * 0.12 * dt
      if (p[k + 1] < 0.03) p[k + 1] = 4.5
    }
    attr.needsUpdate = true
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={tex} size={0.09} sizeAttenuation transparent depthWrite={false} opacity={0.9} toneMapped={false} />
    </points>
  )
}

// ---------------------------------------------------------------- table & seats

function Felt({ seats }: { seats: Seat[] }) {
  const n = seats.length
  const r = TABLE_RADIUS - 0.26
  const map = useMemo(
    () =>
      canvasTexture(1024, 1024, (ctx, w) => {
        const c = w / 2
        const R = w / 2
        const step = TAU / n
        seats.forEach((seat, i) => {
          const a = seatAngle(i, n)
          // canvas y points down, so world angle a maps to canvas angle -a
          ctx.beginPath()
          ctx.moveTo(c, c)
          ctx.arc(c, c, R, -(a + step / 2), -(a - step / 2))
          ctx.closePath()
          const g = ctx.createRadialGradient(c, c, R * 0.2, c, c, R)
          g.addColorStop(0, i % 2 ? '#1c1034' : '#221340')
          g.addColorStop(1, i % 2 ? '#24143f' : '#2b184d')
          ctx.fillStyle = g
          ctx.fill()
          ctx.beginPath()
          ctx.arc(c, c, R * 0.965, -(a + step / 2) + 0.03, -(a - step / 2) - 0.03)
          ctx.strokeStyle = seat.color
          ctx.lineWidth = 14
          ctx.globalAlpha = 0.55
          ctx.stroke()
          ctx.globalAlpha = 1
        })
        ctx.strokeStyle = 'rgba(61,255,139,0.18)'
        ctx.lineWidth = 3
        for (let i = 0; i < n; i++) {
          const a = seatAngle(i, n) + step / 2
          ctx.beginPath()
          ctx.moveTo(c + Math.cos(a) * R * 0.18, c - Math.sin(a) * R * 0.18)
          ctx.lineTo(c + Math.cos(a) * R * 0.93, c - Math.sin(a) * R * 0.93)
          ctx.stroke()
        }
        for (const [rr, alpha] of [
          [0.18, 0.35],
          [0.5, 0.12],
        ] as const) {
          ctx.beginPath()
          ctx.arc(c, c, R * rr, 0, TAU)
          ctx.strokeStyle = `rgba(61,255,139,${alpha})`
          ctx.lineWidth = 4
          ctx.stroke()
        }
      }),
    [seats, n],
  )
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.006} receiveShadow>
      <circleGeometry args={[r, 96]} />
      <meshStandardMaterial map={map} roughness={0.9} />
    </mesh>
  )
}

/** Wedge of light that follows the neck while spinning and pulses on the chosen seat. */
function WedgeGlow({ sim, seats }: { sim: React.RefObject<BottleSim>; seats: Seat[] }) {
  const n = seats.length
  const group = useRef<THREE.Group>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const geo = useMemo(() => new THREE.CircleGeometry(TABLE_RADIUS - 0.3, 32, -Math.PI / n, (TAU / n) * 0.98), [n])
  const color = useMemo(() => new THREE.Color(), [])
  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const s = sim.current
    const i = s.winner >= 0 ? s.winner : s.seat
    if (group.current) group.current.rotation.y = seatAngle(i, n)
    if (mat.current) {
      const target = s.winner >= 0 ? 0.32 + Math.sin(state.clock.elapsedTime * 6) * 0.12 : s.mode === 'idle' ? 0.06 : 0.2
      mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, target, 10, dt)
      mat.current.color.copy(color.set(seats[i]?.color ?? ACCENT))
    }
  })
  return (
    <group ref={group} position-y={0.01}>
      <mesh geometry={geo} rotation-x={-Math.PI / 2}>
        <meshBasicMaterial ref={mat} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  )
}

function SeatTag({ seat, index, n, sim }: { seat: Seat; index: number; n: number; sim: React.RefObject<BottleSim> }) {
  const a = seatAngle(index, n)
  const x = Math.cos(a) * SEAT_RADIUS
  const z = -Math.sin(a) * SEAT_RADIUS
  const emojiOnly = !/[\p{L}\p{N}]/u.test(seat.label)
  // Narrower tags when the table gets crowded.
  const w = Math.min(1.12, ((TAU * SEAT_RADIUS) / n) * 0.92)
  const h = w * 0.4
  const map = useMemo(
    () =>
      canvasTexture(
        512,
        205,
        (ctx, cw, ch) => {
          ctx.shadowColor = seat.color
          ctx.shadowBlur = 26
          roundRect(ctx, 18, 18, cw - 36, ch - 36, (ch - 36) / 2)
          ctx.fillStyle = 'rgba(12,5,24,0.92)'
          ctx.fill()
          ctx.lineWidth = 9
          ctx.strokeStyle = seat.color
          ctx.stroke()
          ctx.shadowBlur = 0
          fitText(ctx, seat.label, cw / 2, ch / 2 + 4, cw - 90, ch - 70, {
            font: DISPLAY_FONT,
            weight: '400',
            maxSize: emojiOnly ? 100 : 84,
            minSize: 24,
            color: '#ffffff',
          })
        },
        { fonts: true },
      ),
    [seat.label, seat.color, emojiOnly],
  )
  const glowTex = useMemo(() => radialTexture(seat.color), [seat.color])
  const tag = useRef<THREE.Group>(null)
  const tagMat = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const kick = useRef(0)
  const wasOn = useRef(false)

  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const s = sim.current
    const t = state.clock.elapsedTime
    const on = s.seat === index && s.mode !== 'idle'
    if (on && !wasOn.current) kick.current = 1
    wasOn.current = on
    kick.current = Math.max(0, kick.current - dt * 5)
    const win = s.winner === index
    const lit = win ? 1 : on ? 0.65 : 0
    const scale = 1 + kick.current * 0.18 + (win ? 0.22 + Math.sin(t * 7) * 0.05 : 0)
    if (tag.current) {
      tag.current.scale.setScalar(THREE.MathUtils.damp(tag.current.scale.x, scale, 16, dt))
      tag.current.position.y = THREE.MathUtils.damp(tag.current.position.y, 0.42 + (win ? 0.18 : 0), 8, dt)
    }
    if (tagMat.current) {
      const b = s.winner >= 0 && !win ? 0.45 : 0.85 + lit * 0.5
      tagMat.current.color.setScalar(THREE.MathUtils.damp(tagMat.current.color.r, b, 10, dt))
    }
    if (glow.current) glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, lit * 0.9, 12, dt)
    if (ring.current) ring.current.opacity = THREE.MathUtils.damp(ring.current.opacity, 0.3 + lit * 0.7, 12, dt)
  })

  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.018}>
        <ringGeometry args={[0.2, 0.27, 40]} />
        <meshBasicMaterial ref={ring} color={seat.color} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={tag} position-y={0.42}>
        <Billboard>
          <mesh position-z={-0.02}>
            <planeGeometry args={[w * 1.9, h * 3]} />
            <meshBasicMaterial ref={glow} map={glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
          <mesh>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial ref={tagMat} map={map} transparent toneMapped={false} depthWrite={false} />
          </mesh>
        </Billboard>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------- input

function DragPlane({ sim, onGrab, onRelease }: { sim: React.RefObject<BottleSim>; onGrab: () => boolean; onRelease: (omega: number | null) => void }) {
  type CaptureTarget = { setPointerCapture?: (id: number) => void; releasePointerCapture?: (id: number) => void }
  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!onGrab()) return
    ;(e.target as unknown as CaptureTarget).setPointerCapture?.(e.pointerId)
    const s = sim.current
    s.mode = 'drag'
    s.omega = 0
    s.winner = -1
    s.dragAngle = planeAngle(e.point.x, e.point.z)
    s.dragMoved = 0
    s.dragStart = performance.now()
    s.samples = [{ a: s.angle, t: s.dragStart }]
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    const s = sim.current
    if (s.mode !== 'drag') return
    // Ignore jittery angles right on top of the pivot.
    if (Math.hypot(e.point.x, e.point.z) < 0.25) return
    const a = planeAngle(e.point.x, e.point.z)
    const d = wrapAngle(a - s.dragAngle)
    s.dragAngle = a
    s.angle += d
    s.dragMoved += Math.abs(d)
    const now = performance.now()
    s.samples.push({ a: s.angle, t: now })
    while (s.samples.length > 2 && now - s.samples[0].t > 110) s.samples.shift()
  }
  const up = (e: ThreeEvent<PointerEvent>) => {
    const s = sim.current
    if (s.mode !== 'drag') return
    ;(e.target as unknown as CaptureTarget).releasePointerCapture?.(e.pointerId)
    const now = performance.now()
    const recent = s.samples.filter((p) => now - p.t < 130)
    let omega = 0
    if (recent.length >= 2) {
      const first = recent[0]
      const last = recent[recent.length - 1]
      const dtS = (last.t - first.t) / 1000
      if (dtS > 0.012) omega = (last.a - first.a) / dtS
    }
    const isTap = s.dragMoved < 0.12 && now - s.dragStart < 350
    s.mode = 'idle'
    s.settle = 0.6
    if (isTap) onRelease(null)
    else {
      const dir = Math.sign(omega) || Math.sign(s.samples[s.samples.length - 1].a - s.samples[0].a) || (Math.random() < 0.5 ? -1 : 1)
      onRelease(dir * THREE.MathUtils.clamp(Math.abs(omega) * 1.1, 9, 32))
    }
  }
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.3} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- composition

export function BottleScene({
  festive = false,
  seats,
  sim,
  onGrab,
  onRelease,
  onTick,
  onStop,
  fire,
  winner,
}: {
  /** Holiday look: santa hat on the bottle + snowfall. */
  festive?: boolean
  seats: Seat[]
  sim: React.RefObject<BottleSim>
  onGrab: () => boolean
  onRelease: (omega: number | null) => void
  onTick: (seat: number, speed: number) => void
  onStop: (seat: number) => void
  fire: number
  winner: number
}) {
  const n = seats.length
  const origin = useMemo(() => {
    const a = seatAngle(Math.max(0, winner), n)
    return new THREE.Vector3(Math.cos(a) * SEAT_RADIUS, 0.6, -Math.sin(a) * SEAT_RADIUS)
  }, [winner, n])
  const colors = useMemo(() => [ACCENT, '#ffffff', '#ffd23d', seats[Math.max(0, winner)]?.color ?? ACCENT], [seats, winner])
  return (
    <>
      <Felt seats={seats} />
      <WedgeGlow sim={sim} seats={seats} />
      {seats.map((seat, i) => (
        <SeatTag key={seat.id} seat={seat} index={i} n={n} sim={sim} />
      ))}
      <Bottle sim={sim} n={n} festive={festive} onTick={onTick} onStop={onStop} />
      {festive && <Snow />}
      <DragPlane sim={sim} onGrab={onGrab} onRelease={onRelease} />
      <Confetti fire={fire} origin={origin} colors={colors} />
    </>
  )
}
