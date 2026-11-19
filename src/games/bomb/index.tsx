import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { canvasTexture } from '../../three/textures'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { createDeck, rand } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { TOPICS, type Topic } from '../categories/topics'

const ACCENT = '#ff6a00'
const RADIUS = 1
const PENALTY = 2
const FUSE_MIN = 10_000
const FUSE_MAX = 40_000

type Phase = 'idle' | 'ticking' | 'boom'

/** Mutable state shared with the 3D components, so they animate without React re-renders. */
interface BombState {
  phase: Phase
  start: number
  fuse: number
  boomAt: number
}

const TXT = {
  holding: { it: '💣 Ce l’ha', en: '💣 Holding it:', es: '💣 La tiene', fr: '💣 La tient :', de: '💣 Hält sie:' },
  hint: {
    it: 'Di’ una parola della categoria, premi PASSA e dai il telefono al vicino!',
    en: 'Say a word from the category, hit PASS and hand the phone to your neighbour!',
    es: 'Di una palabra de la categoría, pulsa PASA y dale el móvil a tu vecino.',
    fr: 'Dis un mot de la catégorie, appuie sur PASSE et donne le téléphone à ton voisin !',
    de: 'Sag ein Wort aus der Kategorie, drück WEITER und gib das Handy deinem Nachbarn!',
  },
  boom: { it: 'BOOM! 💥', en: 'BOOM! 💥', es: '¡BUM! 💥', fr: 'BOUM ! 💥', de: 'BUMM! 💥' },
  blewUp: { it: 'È esplosa in mano a', en: 'It blew up on', es: 'Le explotó a', fr: 'Elle a explosé dans les mains de', de: 'Explodiert bei' },
} satisfies Record<string, Loc>

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function progress(s: BombState, now: number) {
  return s.phase === 'ticking' ? clamp01((now - s.start) / s.fuse) : 0
}

function useGlowTexture() {
  return useMemo(
    () =>
      canvasTexture(64, 64, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        g.addColorStop(0, 'rgba(255,255,255,1)')
        g.addColorStop(0.3, 'rgba(255,220,120,0.9)')
        g.addColorStop(1, 'rgba(255,120,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }),
    [],
  )
}

const FUSE_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, RADIUS + 0.12, 0),
  new THREE.Vector3(0.08, RADIUS + 0.42, 0.04),
  new THREE.Vector3(0.38, RADIUS + 0.66, 0),
  new THREE.Vector3(0.66, RADIUS + 0.58, -0.04),
  new THREE.Vector3(0.8, RADIUS + 0.4, 0),
])
const TIP = FUSE_CURVE.getPoint(1)
const SPARKS = 70

/** Sparkling particles at the end of the fuse. */
function Sparks({ state }: { state: React.RefObject<BombState> }) {
  const map = useGlowTexture()
  const { geometry, vel, life } = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SPARKS * 3).fill(-100), 3))
    return { geometry: g, vel: new Float32Array(SPARKS * 3), life: new Float32Array(SPARKS) }
  }, [])
  const tip = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)

  useFrame((_, dt) => {
    const s = state.current
    const lit = s.phase === 'ticking'
    const p = progress(s, performance.now())
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const spawn = lit ? Math.ceil(60 * dt * (1 + p * 2)) + 1 : 0
    let spawned = 0
    for (let i = 0; i < SPARKS; i++) {
      life[i] -= dt
      if (life[i] <= 0) {
        if (spawned < spawn) {
          spawned++
          life[i] = rand(0.25, 0.6)
          arr[i * 3] = TIP.x
          arr[i * 3 + 1] = TIP.y
          arr[i * 3 + 2] = TIP.z
          vel[i * 3] = rand(-1.4, 1.4)
          vel[i * 3 + 1] = rand(0.6, 2.4)
          vel[i * 3 + 2] = rand(-1.4, 1.4)
        } else arr[i * 3 + 1] = -100
        continue
      }
      vel[i * 3 + 1] -= 6 * dt
      arr[i * 3] += vel[i * 3] * dt
      arr[i * 3 + 1] += vel[i * 3 + 1] * dt
      arr[i * 3 + 2] += vel[i * 3 + 2] * dt
    }
    pos.needsUpdate = true
    const flick = lit ? 0.7 + Math.random() * 0.6 : 0
    if (tip.current) tip.current.scale.setScalar(flick * (1 + p))
    if (light.current) light.current.intensity = flick * 6
  })

  return (
    <group>
      <points geometry={geometry} frustumCulled={false}>
        <pointsMaterial map={map} size={0.16} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} color="#ffd27a" />
      </points>
      <mesh ref={tip} position={TIP}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#fff2b0" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={TIP} color="#ffa040" distance={4} intensity={0} />
    </group>
  )
}

/** Cartoon bomb: swells, wobbles and pulses red faster and faster. */
function Bomb({ state }: { state: React.RefObject<BombState> }) {
  const group = useRef<THREE.Group>(null)
  const body = useRef<THREE.MeshPhysicalMaterial>(null)
  const scale = useRef(0)
  const scaleVel = useRef(0)
  const pulse = useRef(0)
  const lastTick = useRef(0)
  const dark = useMemo(() => new THREE.Color('#15111c'), [])
  const hot = useMemo(() => new THREE.Color('#7a0a00'), [])
  const fuseGeo = useMemo(() => new THREE.TubeGeometry(FUSE_CURVE, 40, 0.045, 8), [])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = state.current
    const now = performance.now()
    const p = progress(s, now)
    if (s.phase === 'ticking') {
      const interval = 850 - 730 * Math.pow(p, 1.2)
      if (now - lastTick.current > interval) {
        lastTick.current = now
        pulse.current = 1
        sfx.tick()
        if (p > 0.85) sfx.click()
        if (p > 0.7) vibrate(12)
      }
    }
    pulse.current = Math.max(0, pulse.current - dt * 4)

    if (s.phase === 'boom') {
      scale.current = 0
      scaleVel.current = 0
    } else {
      const target = 1 + 0.3 * p + 0.1 * pulse.current * (0.5 + p)
      scaleVel.current += (target - scale.current) * 220 * dt
      scaleVel.current *= Math.exp(-14 * dt)
      scale.current += scaleVel.current * dt
    }
    const g = group.current
    if (g) {
      const squash = 1 + scaleVel.current * 0.01
      g.scale.set(scale.current / Math.sqrt(squash), scale.current * squash, scale.current / Math.sqrt(squash))
      g.visible = scale.current > 0.01
      const t = clock.elapsedTime
      const jitter = p > 0.8 ? (p - 0.8) * 0.25 : 0
      g.rotation.z = Math.sin(t * (2 + p * 10)) * 0.06 * p + (Math.random() - 0.5) * jitter
      g.rotation.y = t * 0.25
      g.position.x = (Math.random() - 0.5) * jitter
    }
    const m = body.current
    if (m) {
      m.color.copy(dark).lerp(hot, p * 0.8)
      m.emissiveIntensity = pulse.current * (0.3 + 2.2 * p) + p * 0.25
    }
  })

  return (
    <group ref={group} position={[0, RADIUS, 0]}>
      <group position={[0, -RADIUS, 0]}>
        <mesh castShadow position={[0, RADIUS, 0]}>
          <sphereGeometry args={[RADIUS, 48, 48]} />
          <meshPhysicalMaterial ref={body} color="#15111c" emissive="#ff1a00" emissiveIntensity={0} roughness={0.25} metalness={0.1} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        {/* cartoon highlight */}
        <mesh position={[-0.42, RADIUS + 0.45, 0.62]} rotation={[0.5, -0.5, 0.6]} scale={[1, 0.55, 0.3]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
        </mesh>
        <mesh castShadow position={[0, RADIUS * 2 - 0.04, 0]}>
          <cylinderGeometry args={[0.26, 0.3, 0.26, 24]} />
          <meshPhysicalMaterial color="#8a8f9c" metalness={0.9} roughness={0.25} clearcoat={1} />
        </mesh>
        <mesh position={[0, RADIUS * 2 + 0.1, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.24, 0.035, 10, 32]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} />
        </mesh>
        <mesh geometry={fuseGeo} position={[0, RADIUS - 0.12, 0]} castShadow>
          <meshStandardMaterial color="#d8b07a" roughness={0.9} />
        </mesh>
        <group position={[0, RADIUS - 0.12, 0]}>
          <Sparks state={state} />
        </group>
      </group>
    </group>
  )
}

const DEBRIS = 90
const DEBRIS_COLORS = ['#ffe066', '#ffa21f', '#ff5a00', '#ff2a00', '#2a2030']

/** Fireball, shockwave ring, flying debris and a light flash, triggered when `boomAt` changes. */
function Explosion({ state }: { state: React.RefObject<BombState> }) {
  const debris = useRef<THREE.InstancedMesh>(null)
  const ball = useRef<THREE.Mesh>(null)
  const ballMat = useRef<THREE.MeshBasicMaterial>(null)
  const ring = useRef<THREE.Mesh>(null)
  const ringMat = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const seen = useRef(0)
  const sim = useMemo(() => ({ pos: new Float32Array(DEBRIS * 3), vel: new Float32Array(DEBRIS * 3), spin: new Float32Array(DEBRIS), size: new Float32Array(DEBRIS) }), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const mesh = debris.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < DEBRIS; i++) mesh.setColorAt(i, c.set(DEBRIS_COLORS[i % DEBRIS_COLORS.length]))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = state.current
    const mesh = debris.current
    if (!mesh) return
    if (s.phase === 'boom' && s.boomAt !== seen.current) {
      seen.current = s.boomAt
      for (let i = 0; i < DEBRIS; i++) {
        dir.set(rand(-1, 1), rand(0.1, 1.2), rand(-1, 1)).normalize()
        const speed = rand(3, 9)
        sim.pos.set([dir.x * 0.5, RADIUS + dir.y * 0.5, dir.z * 0.5], i * 3)
        sim.vel.set([dir.x * speed, dir.y * speed + 2, dir.z * speed], i * 3)
        sim.spin[i] = rand(-10, 10)
        sim.size[i] = rand(0.06, 0.2)
      }
    }
    const age = s.phase === 'boom' ? (performance.now() - s.boomAt) / 1000 : 99
    const alive = age < 2.2
    for (let i = 0; i < DEBRIS; i++) {
      if (alive) {
        sim.vel[i * 3 + 1] -= 14 * dt
        for (let k = 0; k < 3; k++) sim.pos[i * 3 + k] += sim.vel[i * 3 + k] * dt
        if (sim.pos[i * 3 + 1] < 0.05) {
          sim.pos[i * 3 + 1] = 0.05
          sim.vel[i * 3 + 1] *= -0.35
          sim.vel[i * 3] *= 0.7
          sim.vel[i * 3 + 2] *= 0.7
        }
      }
      dummy.position.set(sim.pos[i * 3], sim.pos[i * 3 + 1], sim.pos[i * 3 + 2])
      dummy.rotation.set(age * sim.spin[i], age * sim.spin[i] * 0.7, 0)
      dummy.scale.setScalar(alive ? sim.size[i] * Math.max(0, 1 - age / 2.2) : 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    const fb = clamp01(age / 0.55)
    if (ball.current && ballMat.current) {
      ball.current.visible = age < 0.55
      ball.current.scale.setScalar(0.5 + 3.2 * (1 - Math.pow(1 - fb, 3)))
      ballMat.current.opacity = 1 - fb
    }
    const rw = clamp01(age / 0.8)
    if (ring.current && ringMat.current) {
      ring.current.visible = age < 0.8
      ring.current.scale.setScalar(0.5 + 6 * rw)
      ringMat.current.opacity = 0.9 * (1 - rw)
    }
    if (light.current) light.current.intensity = age < 0.6 ? 120 * (1 - age / 0.6) : 0
  })

  return (
    <group>
      <instancedMesh ref={debris} args={[undefined, undefined, DEBRIS]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial emissive="#ff6a00" emissiveIntensity={0.6} roughness={0.5} />
      </instancedMesh>
      <mesh ref={ball} position={[0, RADIUS, 0]} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial ref={ballMat} color="#ffb347" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0.05, 0]} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.8, 1, 64]} />
        <meshBasicMaterial ref={ringMat} color="#ffd27a" transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 1.5, 0]} color="#ff8a2a" distance={14} intensity={0} />
    </group>
  )
}

/** Keeps the camera aimed at the bomb and shakes it near the end and on the explosion. */
function CameraRig({ state }: { state: React.RefObject<BombState> }) {
  const base = useRef<THREE.Vector3 | null>(null)
  useFrame(({ camera }) => {
    base.current ??= camera.position.clone()
    const s = state.current
    const now = performance.now()
    const p = progress(s, now)
    let amp = p > 0.78 ? ((p - 0.78) / 0.22) * 0.07 : 0
    if (s.phase === 'boom') {
      const age = (now - s.boomAt) / 1000
      amp = age < 0.8 ? 0.45 * (1 - age / 0.8) : 0
    }
    camera.position.set(base.current.x + (Math.random() - 0.5) * amp, base.current.y + (Math.random() - 0.5) * amp, base.current.z + (Math.random() - 0.5) * amp)
    camera.lookAt(0, 1.1, 0)
  })
  return null
}

export default function BombGame({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const deck = useMemo(() => createDeck(TOPICS), [])
  const state = useRef<BombState>({ phase: 'idle', start: 0, fuse: 0, boomAt: 0 })
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flash = useRef<HTMLDivElement>(null)
  const lastPass = useRef(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [topic, setTopic] = useState<Topic>(() => deck.draw())
  const [result, setResult] = useState<{ name: string; color: string; id: number } | null>(null)

  const explode = () => {
    const holder = turn.current
    state.current.phase = 'boom'
    state.current.boomAt = performance.now()
    sfx.boom()
    vibrate(900)
    flash.current?.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' })
    penalty.apply(holder.id, PENALTY)
    setPhase('boom')
    setResult({ name: holder.name, color: holder.color, id: state.current.boomAt })
  }
  // The timeout outlives renders: always call the latest closure (current holder, current penalty mode).
  const explodeRef = useRef(explode)
  explodeRef.current = explode

  useEffect(() => () => clearTimeout(timer.current), [])

  const start = (fresh: boolean) => {
    // Double-tap guard: a second tap would redraw the topic and restart the fuse.
    if (state.current.phase === 'ticking') return
    if (fresh) setTopic(deck.draw())
    const fuse = rand(FUSE_MIN, FUSE_MAX)
    state.current = { ...state.current, phase: 'ticking', start: performance.now(), fuse }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => explodeRef.current(), fuse)
    setResult(null)
    setPhase('ticking')
    sfx.whoosh()
    vibrate(40)
  }

  const pass = () => {
    const now = performance.now()
    if (state.current.phase !== 'ticking' || now - lastPass.current < 350) return
    lastPass.current = now
    sfx.tap()
    vibrate(25)
    turn.next()
  }

  return (
    <GameShell
      gameId="bomb"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 4.2, 10.5], fov: 42 }}>
          <Bomb state={state} />
          <Explosion state={state} />
          <CameraRig state={state} />
        </Stage>
      }
      top={
        <>
          <TurnPill player={turn.current} label={phase === 'idle' ? undefined : L(TXT.holding)} />
          <div className="result" key={L(topic.name)} style={{ marginTop: 12, padding: '10px 16px' }}>
            <div className="who">{t('category')}</div>
            <div className="big" style={{ fontSize: 'clamp(24px, 7.5vw, 34px)' }}>
              {topic.emoji} {L(topic.name)}
            </div>
          </div>
        </>
      }
      bottom={
        <>
          {phase === 'idle' && (
            <>
              <div className="center muted" style={{ fontSize: 16 }}>
                {L(TXT.hint)}
              </div>
              <button className="btn block" onClick={() => start(false)}>
                💣 {t('start')}
              </button>
            </>
          )}
          {phase === 'ticking' && (
            <button
              className="btn block"
              onClick={pass}
              style={{
                minHeight: 128,
                fontSize: 46,
                borderRadius: 36,
                background: 'linear-gradient(180deg, #ffab66, #ff6a00)',
                boxShadow: '0 8px 0 #a33f00, 0 14px 36px rgba(255, 106, 0, 0.55)',
              }}
            >
              {t('pass').toUpperCase()} 👉
            </button>
          )}
          {phase === 'boom' && result && (
            <>
              <ResultCard
                animKey={result.id}
                color={ACCENT}
                who={`${L(TXT.blewUp)} ${result.name}`}
                big={L(TXT.boom)}
                sub={<div style={{ fontSize: 22, color: 'var(--yellow)' }}>{penalty.drink(PENALTY)}</div>}
              />
              <button className="btn block" onClick={() => start(true)}>
                💣 {t('again')}
              </button>
            </>
          )}
        </>
      }
      overlay={
        <div
          ref={flash}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, #fff 0%, #ffd27a 45%, #ff6a00 100%)', opacity: 0, pointerEvents: 'none' }}
        />
      }
    />
  )
}
