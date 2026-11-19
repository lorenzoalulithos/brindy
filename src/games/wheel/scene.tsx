import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { canvasTexture, DISPLAY_FONT, fitText } from '../../three/textures'
import { Confetti } from '../../three/Confetti'
import { ACCENT, nearestPeg, PEG_WINDOW, sliceAt, WHEEL_R, WHEEL_TILT, WHEEL_Y, wrapAngle, type WheelSim } from './sim'

const TAU = Math.PI * 2
const R = WHEEL_R
const FRAME_R = R + 0.21
const BULBS = 28
const FACE_Z = 0.081
/** Wheel friction: Coulomb + viscous. Most braking comes from the pegs hitting the flapper. */
const MU = 0.8
const VISCOUS = 0.2
/** Angular acceleration (rad/s²) applied while a peg pushes against the flapper. */
const PEG_PUSH = 9
const FLAP_MAX = 0.62
const FLAP_K = 900
const FLAP_DAMP = 13
/** Physics timestep and the most steps simulated per rendered frame. */
const STEP = 1 / 120
const MAX_STEPS = 12

export interface FaceSlice {
  color: string
  icon: string
  label: string
}

function shade(hex: string, amount: number) {
  const c = new THREE.Color(hex)
  c.lerp(new THREE.Color(amount > 0 ? '#ffffff' : '#000000'), Math.abs(amount))
  return '#' + c.getHexString()
}

function useFaceTexture(slices: FaceSlice[]) {
  return useMemo(() => {
    const n = slices.length
    const step = TAU / n
    return canvasTexture(
      1024,
      1024,
      (ctx, w) => {
        const c = w / 2
        const rr = w / 2 - 2
        ctx.fillStyle = '#140a26'
        ctx.beginPath()
        ctx.arc(c, c, rr, 0, TAU)
        ctx.fill()
        // canvas y points down: a world angle a is drawn at canvas angle -a
        slices.forEach((s, i) => {
          ctx.beginPath()
          ctx.moveTo(c, c)
          ctx.arc(c, c, rr, -(i + 1) * step, -i * step)
          ctx.closePath()
          const g = ctx.createRadialGradient(c, c, rr * 0.12, c, c, rr)
          g.addColorStop(0, shade(s.color, -0.45))
          g.addColorStop(0.55, s.color)
          g.addColorStop(0.93, shade(s.color, 0.18))
          g.addColorStop(1, shade(s.color, -0.25))
          ctx.fillStyle = g
          ctx.fill()
        })
        // gold separators
        for (let i = 0; i < n; i++) {
          const a = -i * step
          ctx.beginPath()
          ctx.moveTo(c + Math.cos(a) * rr * 0.2, c + Math.sin(a) * rr * 0.2)
          ctx.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr)
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'
          ctx.lineWidth = 14
          ctx.stroke()
          ctx.strokeStyle = '#ffd86b'
          ctx.lineWidth = 6
          ctx.stroke()
        }
        slices.forEach((s, i) => {
          const mid = (i + 0.5) * step
          const chord = 2 * Math.sin(step / 2) * rr * 0.47
          ctx.save()
          ctx.translate(c, c)
          ctx.rotate(-mid)
          ctx.shadowColor = 'rgba(0,0,0,0.65)'
          ctx.shadowBlur = 10
          if (s.icon) {
            ctx.save()
            ctx.translate(rr * 0.8, 0)
            // upright when the slice is under the pointer
            ctx.rotate(Math.PI / 2)
            ctx.font = `${Math.round(Math.min(84, chord * 0.75))}px ${DISPLAY_FONT}`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#fff'
            ctx.fillText(s.icon, 0, 0)
            ctx.restore()
          }
          fitText(ctx, s.label, rr * 0.47, 2, rr * 0.38, Math.min(110, chord * 0.82), {
            font: DISPLAY_FONT,
            weight: '400',
            maxSize: 60,
            minSize: 18,
            color: '#ffffff',
            lineHeight: 1.05,
          })
          ctx.restore()
        })
        // hub plate
        ctx.shadowBlur = 0
        const hub = ctx.createRadialGradient(c, c, 0, c, c, rr * 0.22)
        hub.addColorStop(0, '#2b1856')
        hub.addColorStop(1, '#0e0620')
        ctx.fillStyle = hub
        ctx.beginPath()
        ctx.arc(c, c, rr * 0.22, 0, TAU)
        ctx.fill()
        ctx.strokeStyle = ACCENT
        ctx.lineWidth = 8
        ctx.stroke()
        // outer lip
        ctx.beginPath()
        ctx.arc(c, c, rr - 6, 0, TAU)
        ctx.strokeStyle = '#ffd86b'
        ctx.lineWidth = 10
        ctx.stroke()
      },
      { fonts: true },
    )
  }, [slices])
}

function useFlapperGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, -0.52)
    s.quadraticCurveTo(0.17, -0.17, 0.13, 0)
    s.absarc(0, 0, 0.13, 0, Math.PI, false)
    s.quadraticCurveTo(-0.17, -0.17, 0, -0.52)
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 24 })
    g.translate(0, 0, -0.025)
    return g
  }, [])
}

export function WheelScene({
  slices,
  sim,
  onGrab,
  onRelease,
  onTick,
  onStop,
  fire,
  winner,
}: {
  slices: FaceSlice[]
  sim: React.RefObject<WheelSim>
  onGrab: () => boolean
  onRelease: (omega: number | null) => void
  onTick: (speed: number) => void
  onStop: (slice: number) => void
  fire: number
  winner: number
}) {
  const n = slices.length
  const step = TAU / n
  const face = useFaceTexture(slices)
  const flapGeo = useFlapperGeometry()

  const rotor = useRef<THREE.Group>(null)
  const flapper = useRef<THREE.Group>(null)
  const highlight = useRef<THREE.Group>(null)
  const highlightMat = useRef<THREE.MeshBasicMaterial>(null)
  const bulbMats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const chase = useRef(0)
  const tmpColor = useMemo(() => new THREE.Color(), [])
  const warm = useMemo(() => new THREE.Color('#ffc86a'), [])

  const chrome = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f0ff', metalness: 1, roughness: 0.12 }), [])
  const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1650', metalness: 0.7, roughness: 0.28 }), [])
  const wedgeGeo = useMemo(() => new THREE.CircleGeometry(R * 0.97, 32, 0, step), [step])
  const pegs = useMemo(() => Array.from({ length: n }, (_, i) => i * step), [n, step])
  const bulbs = useMemo(() => Array.from({ length: BULBS }, (_, i) => ((i + 0.5) / BULBS) * TAU), [])

  // A fresh preset starts from a clean state (slice count may have changed).
  useEffect(() => {
    const s = sim.current
    s.slice = sliceAt(s.angle, n)
    s.skipPeg = -1
  }, [n, sim])

  const acc = useRef(0)
  /** One fixed step, subdivided further at high speed so no peg contact window is skipped. */
  const physicsStep = (s: WheelSim) => {
    const spinning = s.mode === 'spin'
    if (spinning) s.elapsed += STEP
    const subs = Math.min(24, Math.max(2, Math.ceil((Math.abs(s.omega) * STEP) / 0.02)))
    const h = STEP / subs
    for (let k = 0; k < subs; k++) {
      const peg = nearestPeg(s.angle, n)
      const inWindow = Math.abs(peg.d) < PEG_WINDOW
      if (!inWindow && peg.peg === s.skipPeg) s.skipPeg = -1
      const contact = inWindow && peg.peg !== s.skipPeg
      if (spinning) {
        const w = Math.abs(s.omega)
        const dec = (MU + VISCOUS * w) * h
        s.omega = w <= dec ? 0 : s.omega - Math.sign(s.omega) * dec
        // The flapper pushes the peg back out of the contact zone: slows it on approach, bounces it back when slow.
        if (contact) s.omega += (peg.d < 0 ? -1 : 1) * PEG_PUSH * h
        s.angle += s.omega * h
      }
      // Flapper: damped spring, kept clear of the touching peg (tip deflects away from it).
      s.flapV += (-FLAP_K * s.flap - FLAP_DAMP * s.flapV) * h
      s.flap += s.flapV * h
      if (contact) {
        const target = (peg.d < 0 ? -1 : 1) * (1 - Math.abs(peg.d) / PEG_WINDOW) * FLAP_MAX
        if (target < 0 ? s.flap > target : s.flap < target) {
          s.flap = target
          s.flapV = 0
        }
      }
      const slice = sliceAt(s.angle, n)
      if (slice !== s.slice) {
        if (s.slice >= 0 && s.mode !== 'idle') {
          s.skipPeg = nearestPeg(s.angle, n).peg
          onTick(Math.abs(s.omega))
        }
        s.slice = slice
      }
    }
    if (spinning) {
      const peg = nearestPeg(s.angle, n)
      const touching = Math.abs(peg.d) < PEG_WINDOW && peg.peg !== s.skipPeg
      if ((Math.abs(s.omega) < 0.03 && !touching) || s.elapsed > 25) {
        s.omega = 0
        s.mode = 'idle'
        s.winner = sliceAt(s.angle, n)
        onStop(s.winner)
      }
    }
  }

  useFrame((state, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const s = sim.current
    const t = state.clock.elapsedTime
    // Fixed-timestep physics: real-time correct at any frame rate (down to ~10 fps), remainder carried over.
    acc.current = Math.min(acc.current + raw, STEP * MAX_STEPS)
    while (acc.current >= STEP) {
      acc.current -= STEP
      physicsStep(s)
    }
    if (rotor.current) rotor.current.rotation.z = s.angle
    if (flapper.current) flapper.current.rotation.z = s.flap

    if (highlight.current) highlight.current.rotation.z = Math.max(0, s.winner) * step
    if (highlightMat.current) {
      const target = s.winner >= 0 ? 0.28 + Math.sin(t * 7) * 0.14 : 0
      highlightMat.current.opacity = THREE.MathUtils.damp(highlightMat.current.opacity, target, 10, dt)
    }

    // Chasing bulbs: speed follows the wheel; on a result they flash in the slice colour.
    chase.current += dt * (1.6 + Math.abs(s.omega) * 2.2)
    const head = Math.floor(chase.current)
    const winColor = s.winner >= 0 ? tmpColor.set(slices[s.winner]?.color ?? ACCENT) : warm
    bulbMats.current.forEach((m, i) => {
      if (!m) return
      let on: number
      if (s.winner >= 0) on = (Math.floor(t * 8) + i) % 2 === 0 ? 1 : 0.15
      else if (s.mode === 'idle') on = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 - i * 0.45)) ** 3
      else on = (i + head) % 4 === 0 ? 1 : (i + head) % 4 === 1 ? 0.45 : 0.1
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, on * 3.4, 22, dt)
      m.emissive.lerp(winColor, 1 - Math.exp(-10 * dt))
    })
  })

  type CaptureTarget = { setPointerCapture?: (id: number) => void; releasePointerCapture?: (id: number) => void }
  const localAngle = (e: ThreeEvent<PointerEvent>) => {
    const p = e.object.worldToLocal(e.point.clone())
    return { a: Math.atan2(p.y, p.x), r: Math.hypot(p.x, p.y) }
  }
  const down = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!onGrab()) return
    ;(e.target as unknown as CaptureTarget).setPointerCapture?.(e.pointerId)
    const s = sim.current
    s.mode = 'drag'
    s.omega = 0
    s.winner = -1
    s.dragAngle = localAngle(e).a
    s.dragMoved = 0
    s.dragStart = performance.now()
    s.samples = [{ a: s.angle, t: s.dragStart }]
  }
  const move = (e: ThreeEvent<PointerEvent>) => {
    const s = sim.current
    if (s.mode !== 'drag') return
    const { a, r } = localAngle(e)
    if (r < 0.3) return
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
      const dtS = (recent[recent.length - 1].t - recent[0].t) / 1000
      if (dtS > 0.012) omega = (recent[recent.length - 1].a - recent[0].a) / dtS
    }
    const isTap = s.dragMoved < 0.1 && now - s.dragStart < 350
    s.mode = 'idle'
    if (isTap) onRelease(null)
    else {
      const dir = Math.sign(omega) || Math.sign(s.samples[s.samples.length - 1].a - s.samples[0].a) || 1
      onRelease(dir * THREE.MathUtils.clamp(Math.abs(omega) * 1.1, 9, 24))
    }
  }

  const origin = useMemo(() => new THREE.Vector3(0, WHEEL_Y + R + 0.2, 0.4), [])
  const colors = useMemo(() => [ACCENT, '#ffd23d', '#ffffff', slices[Math.max(0, winner)]?.color ?? '#ff3d8b'], [slices, winner])

  return (
    <>
      {/* stand */}
      <mesh position={[0, 0.11, -0.25]} castShadow receiveShadow material={darkMetal}>
        <cylinderGeometry args={[0.85, 1.05, 0.22, 48]} />
      </mesh>
      <mesh position={[0, 0.225, -0.25]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.7, 0.8, 48]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
      <mesh position={[0, WHEEL_Y / 2 + 0.1, -0.3]} castShadow material={chrome}>
        <cylinderGeometry args={[0.1, 0.14, WHEEL_Y - 0.1, 24]} />
      </mesh>

      <group position={[0, WHEEL_Y, 0]} rotation-x={WHEEL_TILT}>
        {/* axle */}
        <mesh position-z={-0.18} rotation-x={Math.PI / 2} material={chrome}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 20]} />
        </mesh>

        {/* static frame with bulbs */}
        <mesh material={darkMetal} castShadow>
          <torusGeometry args={[FRAME_R, 0.13, 20, 96]} />
        </mesh>
        <mesh position-z={0.02}>
          <torusGeometry args={[FRAME_R, 0.135, 8, 96]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
        </mesh>
        {bulbs.map((a, i) => (
          <group key={i} position={[Math.cos(a) * FRAME_R, Math.sin(a) * FRAME_R, 0.12]}>
            <mesh>
              <sphereGeometry args={[0.062, 14, 10]} />
              <meshStandardMaterial
                ref={(m) => {
                  bulbMats.current[i] = m
                }}
                color="#fff4d6"
                emissive="#ffc86a"
                emissiveIntensity={1}
                roughness={0.2}
                toneMapped={false}
              />
            </mesh>
            <mesh position-z={-0.04}>
              <cylinderGeometry args={[0.07, 0.07, 0.05, 12]} />
              <meshStandardMaterial color="#c9c2dd" metalness={1} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* rotor */}
        <group ref={rotor}>
          <mesh rotation-x={Math.PI / 2} material={darkMetal} castShadow>
            <cylinderGeometry args={[R, R, 0.16, 96]} />
          </mesh>
          <mesh position-z={FACE_Z}>
            <circleGeometry args={[R * 0.985, 128]} />
            <meshPhysicalMaterial map={face} roughness={0.32} clearcoat={1} clearcoatRoughness={0.08} />
          </mesh>
          <group ref={highlight} position-z={FACE_Z + 0.004}>
            <mesh geometry={wedgeGeo}>
              <meshBasicMaterial
                ref={highlightMat}
                color="#ffffff"
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
          <mesh material={chrome}>
            <torusGeometry args={[R, 0.075, 16, 128]} />
          </mesh>
          {pegs.map((a, i) => (
            <group key={i} position={[Math.cos(a) * R * 0.93, Math.sin(a) * R * 0.93, FACE_Z]}>
              <mesh position-z={0.07} rotation-x={Math.PI / 2} material={chrome} castShadow>
                <cylinderGeometry args={[0.034, 0.034, 0.14, 12]} />
              </mesh>
              <mesh position-z={0.145} material={chrome}>
                <sphereGeometry args={[0.045, 12, 10]} />
              </mesh>
            </group>
          ))}
          {/* hub */}
          <mesh position-z={FACE_Z} scale={[1, 1, 0.45]} material={chrome}>
            <sphereGeometry args={[0.36, 32, 20, 0, TAU, 0, Math.PI / 2]} />
          </mesh>
          <mesh position-z={FACE_Z + 0.01}>
            <torusGeometry args={[0.4, 0.03, 10, 48]} />
            <meshBasicMaterial color={ACCENT} toneMapped={false} />
          </mesh>
        </group>

        {/* flapper: bracket on the frame + pivoting pointer */}
        <mesh position={[0, FRAME_R + 0.05, 0.12]} material={darkMetal}>
          <boxGeometry args={[0.26, 0.26, 0.2]} />
        </mesh>
        <group ref={flapper} position={[0, R + 0.3, 0.2]}>
          <mesh geometry={flapGeo} castShadow>
            <meshPhysicalMaterial color="#ff2d6a" roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} emissive="#ff2d6a" emissiveIntensity={0.25} />
          </mesh>
          <mesh position-z={0.05} material={chrome}>
            <sphereGeometry args={[0.065, 16, 12]} />
          </mesh>
        </group>

        {/* invisible grab surface in the wheel plane */}
        <mesh position-z={0.3} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <planeGeometry args={[16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <Confetti fire={fire} origin={origin} colors={colors} count={90} forward />
    </>
  )
}
