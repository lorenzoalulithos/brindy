import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GameShell } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { canvasTexture } from '../../three/textures'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { usePlayers, PLAYER_COLORS } from '../../core/store'
import { rand, randInt } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'

const ACCENT = '#3d7bff'
const GREEN = '#3dff8b'
const GO_TIMEOUT = 3000

type Phase = 'ready' | 'wait' | 'go' | 'result'
type SignMode = 'off' | 'flicker' | 'go' | 'false'

interface Zone {
  id: string
  name: string
  color: string
  real: boolean
}

interface Outcome {
  falseStart: number | null
  losers: number[]
  fastest: number | null
}

const TXT = {
  fingerReady: { it: '👆 Dito pronto', en: '👆 Finger ready', es: '👆 Dedo listo', fr: '👆 Doigt prêt', de: '👆 Finger bereit' },
  wait: { it: 'Aspetta il verde…', en: 'Wait for green…', es: 'Espera al verde…', fr: 'Attends le vert…', de: 'Warte auf Grün…' },
  now: { it: 'ORA!', en: 'NOW!', es: '¡YA!', fr: 'MAINTENANT !', de: 'JETZT!' },
  falseStart: { it: 'Falsa partenza!', en: 'False start!', es: '¡Salida en falso!', fr: 'Faux départ !', de: 'Fehlstart!' },
  tooSlow: { it: 'Non pervenuto 💤', en: 'No show 💤', es: 'Ni se movió 💤', fr: 'Aux abonnés absents 💤', de: 'Eingeschlafen 💤' },
} satisfies Record<string, Loc>

function zoneLayout(n: number): { cols: string; rows: string; areas: string[]; flipped: boolean[] } {
  if (n === 2) return { cols: '1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '2 / 1 / 3 / 2'], flipped: [true, false] }
  if (n === 3) return { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 3'], flipped: [true, true, false] }
  return { cols: '1fr 1fr', rows: '1fr 1fr', areas: ['1 / 1 / 2 / 2', '1 / 2 / 2 / 3', '2 / 1 / 3 / 2', '2 / 2 / 3 / 3'], flipped: [true, true, false, false] }
}

const GLASS_PROFILE = [
  [0, 0],
  [0.52, 0],
  [0.56, 0.06],
  [0.72, 2.1],
  [0.68, 2.1],
  [0.52, 0.16],
  [0, 0.16],
].map(([x, y]) => new THREE.Vector2(x, y))
const LIQUID_PROFILE = [
  [0, 0.17],
  [0.5, 0.17],
  [0.64, 1.75],
  [0, 1.75],
].map(([x, y]) => new THREE.Vector2(x, y))

/** Neon pint glass: dark while waiting, amber on fake-outs, blazing green on GO, red on a false start. */
function NeonGlass({ sign }: { sign: React.RefObject<{ mode: SignMode; at: number }> }) {
  const group = useRef<THREE.Group>(null)
  const liquid = useRef<THREE.MeshStandardMaterial>(null)
  const rims = useRef<THREE.MeshStandardMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const scale = useRef(1)
  const vel = useRef(0)
  const last = useRef<SignMode>('off')
  const colors = useMemo(() => ({ off: new THREE.Color('#1a2440'), flicker: new THREE.Color('#ffae2a'), go: new THREE.Color(GREEN), false: new THREE.Color('#ff3b3b') }), [])
  const tint = useMemo(() => new THREE.Color(), [])
  const glow = useMemo(
    () =>
      canvasTexture(128, 128, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
        g.addColorStop(0, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.4, 'rgba(255,255,255,0.35)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }),
    [],
  )

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const { mode } = sign.current
    if (mode !== last.current) {
      if (mode === 'go' || mode === 'false') vel.current += 6
      if (mode === 'flicker') vel.current += 2
      last.current = mode
    }
    vel.current += (1 - scale.current) * 260 * dt
    vel.current *= Math.exp(-12 * dt)
    scale.current += vel.current * dt
    const g = group.current
    if (g) {
      g.scale.set(1 / Math.sqrt(scale.current), scale.current, 1 / Math.sqrt(scale.current))
      g.rotation.y = Math.sin(clock.elapsedTime * 0.6) * 0.25
    }
    const on = mode === 'off' ? 0.12 + 0.05 * Math.sin(clock.elapsedTime * 3) : mode === 'flicker' ? 0.6 + Math.random() * 0.6 : 1
    tint.copy(colors[mode])
    if (liquid.current) {
      liquid.current.emissive.copy(tint)
      liquid.current.emissiveIntensity = mode === 'off' ? 0.15 : on * 2.6
      liquid.current.color.copy(mode === 'off' ? colors.off : tint)
    }
    if (rims.current) {
      rims.current.emissive.copy(mode === 'off' ? colors.off : tint)
      rims.current.emissiveIntensity = mode === 'off' ? 0.6 : on * 4
    }
    if (halo.current) {
      halo.current.color.copy(tint)
      halo.current.opacity = mode === 'off' ? 0 : on * 0.9
    }
    if (light.current) {
      light.current.color.copy(tint)
      light.current.intensity = mode === 'off' ? 0 : on * 40
    }
  })

  return (
    <group>
      <mesh position={[0, 1.2, -1.2]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial ref={halo} map={glow} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <group ref={group}>
        <mesh castShadow>
          <latheGeometry args={[GLASS_PROFILE, 48]} />
          <meshPhysicalMaterial color="#dfe8ff" transparent opacity={0.28} roughness={0.04} metalness={0} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh>
          <latheGeometry args={[LIQUID_PROFILE, 48]} />
          <meshStandardMaterial ref={liquid} color="#1a2440" emissive="#1a2440" roughness={0.3} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.1, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.72, 0.035, 12, 64]} />
          <meshStandardMaterial ref={rims} color="#0b0f1e" emissive="#1a2440" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.56, 0.035, 12, 64]} />
          <meshStandardMaterial color="#0b0f1e" emissive={ACCENT} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight ref={light} position={[0, 1, 0]} distance={9} intensity={0} />
      </group>
    </group>
  )
}

export default function ReflexGame({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const players = usePlayers()
  const [guestCount, setGuestCount] = useState(2)
  const [offset, setOffset] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState<(number | null)[]>([])
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const phaseRef = useRef<Phase>('ready')
  const timesRef = useRef<(number | null)[]>([])
  const goAt = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const sign = useRef<{ mode: SignMode; at: number }>({ mode: 'off', at: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  const zones: Zone[] = useMemo(() => {
    const n = players.length ? Math.min(4, Math.max(2, players.length)) : guestCount
    return Array.from({ length: n }, (_, i) => {
      if (players.length >= 2) {
        const p = players[(offset + i) % players.length]
        return { id: p.id, name: p.name, color: p.color, real: true }
      }
      if (players.length === 1 && i === 0) return { ...players[0], real: true }
      return { id: `p${i + 1}`, name: `P${i + 1}`, color: PLAYER_COLORS[i], real: false }
    })
  }, [players, offset, guestCount])
  const layout = zoneLayout(zones.length)

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))
  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p
    setPhase(p)
  }
  const setSign = (mode: SignMode) => (sign.current = { mode, at: performance.now() })

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Block scrolling, pinch-zoom, double-tap zoom and long-press menus over the play area (buttons still get clicks).
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const block = (e: Event) => {
      if (!(e.target as HTMLElement).closest('button')) e.preventDefault()
    }
    const opts = { passive: false }
    const events = ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'contextmenu', 'dblclick'] as const
    events.forEach((ev) => el.addEventListener(ev, block, opts))
    return () => events.forEach((ev) => el.removeEventListener(ev, block))
  }, [])

  const finish = (falseStart: number | null) => {
    clearTimers()
    const tms = timesRef.current
    let losers: number[]
    let fastest: number | null = null
    if (falseStart !== null) {
      losers = [falseStart]
      setSign('false')
      sfx.thud()
      sfx.lose()
      vibrate(350)
    } else {
      const missing = tms.flatMap((v, i) => (v === null ? [i] : []))
      if (missing.length) losers = missing.length === tms.length ? [] : missing
      else {
        const max = Math.max(...(tms as number[]))
        losers = tms.flatMap((v, i) => (v === max ? [i] : []))
      }
      const valid = tms.flatMap((v, i) => (v === null ? [] : [{ v, i }]))
      if (valid.length) fastest = valid.reduce((a, b) => (b.v < a.v ? b : a)).i
      sfx.lose()
      vibrate([60, 40, 140])
      later(900, () => setSign('off'))
    }
    const amount = falseStart !== null ? 2 : 1
    // One apply per loser: records points for real players and rolls the dare for everyone.
    losers.forEach((i) => penalty.apply(zones[i]?.real ? zones[i].id : undefined, amount))
    setOutcome({ falseStart, losers, fastest })
    setPhaseBoth('result')
  }
  const finishRef = useRef(finish)
  finishRef.current = finish

  const startRound = () => {
    // Double-tap guard: phaseRef updates synchronously, unlike `phase`.
    if (phaseRef.current === 'wait' || phaseRef.current === 'go') return
    clearTimers()
    sfx.tap()
    if (round > 0 && players.length > 4) setOffset((o) => (o + 4) % players.length)
    const next = round + 1
    setRound(next)
    timesRef.current = Array(zones.length).fill(null)
    setTimes(timesRef.current)
    setOutcome(null)
    setSign('off')
    setPhaseBoth('wait')
    const delay = rand(2000, 6000)
    const flickers = next >= 3 ? randInt(1, 2) : next === 2 && Math.random() < 0.5 ? 1 : 0
    for (let f = 0; f < flickers; f++) {
      const at = rand(700, delay - 500)
      later(at, () => {
        if (phaseRef.current !== 'wait') return
        setSign('flicker')
        sfx.click()
        later(rand(110, 200), () => phaseRef.current === 'wait' && setSign('off'))
      })
    }
    later(delay, () => {
      goAt.current = performance.now()
      setSign('go')
      setPhaseBoth('go')
      sfx.horn()
      later(GO_TIMEOUT, () => finishRef.current(null))
    })
  }

  const onZoneDown = (i: number, e: ReactPointerEvent) => {
    e.preventDefault()
    const p = phaseRef.current
    if (p === 'wait') return finish(i)
    if (p !== 'go' || timesRef.current[i] !== null) return
    const now = performance.now()
    let ms = e.nativeEvent.timeStamp - goAt.current
    if (!(ms >= 0 && ms < 10_000)) ms = now - goAt.current
    timesRef.current = timesRef.current.map((v, k) => (k === i ? Math.round(ms) : v))
    setTimes(timesRef.current)
    sfx.tap()
    vibrate(20)
    if (timesRef.current.every((v) => v !== null)) finish(null)
  }

  const zoneStatus = (i: number) => {
    const ms = times[i]
    if (phase === 'ready') return L(TXT.fingerReady)
    if (phase === 'wait') return '…'
    if (phase === 'go') return ms !== null && ms !== undefined ? `${ms} ms` : ''
    if (outcome?.falseStart === i) return L(TXT.falseStart)
    if (ms === null || ms === undefined) return outcome?.falseStart !== null ? '' : L(TXT.tooSlow)
    return `${ms} ms`
  }

  const amount = outcome?.falseStart !== null && outcome?.falseStart !== undefined ? 2 : 1

  return (
    <GameShell
      gameId="reflex"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 2.4, 6.2], fov: 40 }} lookAt={[0, 1.15, 0]}>
          <NeonGlass sign={sign} />
        </Stage>
      }
      overlay={
        <div
          ref={overlayRef}
          style={{
            position: 'absolute',
            top: 'calc(var(--safe-top) + 66px)',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'grid',
            gridTemplateColumns: layout.cols,
            gridTemplateRows: layout.rows,
            gap: 10,
            padding: '0 10px calc(var(--safe-bottom) + 10px)',
            touchAction: 'none',
          }}
        >
          {zones.map((z, i) => {
            const tapped = times[i] !== null && times[i] !== undefined
            const loser = phase === 'result' && !!outcome?.losers.includes(i)
            const winner = phase === 'result' && outcome?.fastest === i && !loser
            const flipped = layout.flipped[i]
            const lit = tapped || loser
            return (
              <div
                key={z.id + i}
                onPointerDown={(e) => onZoneDown(i, e)}
                style={{
                  gridArea: layout.areas[i],
                  borderRadius: 28,
                  border: `3px solid color-mix(in srgb, ${z.color} ${lit ? 90 : 45}%, transparent)`,
                  background: `linear-gradient(${flipped ? '0deg' : '180deg'}, transparent 10%, color-mix(in srgb, ${loser ? '#ff3b3b' : z.color} ${lit ? 55 : 28}%, transparent))`,
                  boxShadow: lit ? `0 0 30px color-mix(in srgb, ${loser ? '#ff3b3b' : z.color} 50%, transparent) inset` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: flipped ? 'flex-start' : 'flex-end',
                  flexDirection: 'column',
                  padding: '18px 10px',
                  transition: 'background 0.15s, box-shadow 0.15s',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  minWidth: 0,
                }}
              >
                <div style={{ transform: flipped ? 'rotate(180deg)' : undefined, textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: z.color, textShadow: `0 0 14px ${z.color}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {winner ? '👑 ' : loser ? '💀 ' : ''}
                    {z.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: tapped || phase === 'result' ? 34 : 18, minHeight: 40, color: loser ? '#ff6b6b' : 'var(--text)' }}>{zoneStatus(i)}</div>
                  {loser && <div style={{ fontSize: 18, color: 'var(--yellow)' }}>{penalty.drink(amount)}</div>}
                </div>
              </div>
            )
          })}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              pointerEvents: 'none',
              width: 'min(78vw, 320px)',
            }}
          >
            <div
              className="chip"
              style={{
                background: 'rgba(0,0,0,0.6)',
                fontSize: phase === 'go' ? 22 : 15,
                color: phase === 'go' ? GREEN : undefined,
                borderColor: phase === 'go' ? GREEN : undefined,
              }}
            >
              {round > 0 && `${t('round', { n: round })} · `}
              {phase === 'go' ? L(TXT.now) : phase === 'wait' ? L(TXT.wait) : `⚡ ${zones.length}`}
            </div>
            {phase === 'ready' && !players.length && (
              <div className="row" style={{ pointerEvents: 'auto' }}>
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    className={'chip' + (guestCount === n ? ' active' : '')}
                    style={{ minWidth: 56, minHeight: 48, justifyContent: 'center', fontSize: 20 }}
                    onClick={() => {
                      sfx.tap()
                      setGuestCount(n)
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
            {(phase === 'ready' || phase === 'result') && (
              <button className="btn block" style={{ pointerEvents: 'auto', background: 'linear-gradient(180deg, #8ab0ff, #3d7bff)', boxShadow: '0 6px 0 #1b3f99, 0 12px 30px rgba(61,123,255,0.45)' }} onClick={startRound}>
                ⚡ {phase === 'ready' ? t('start') : t('again')}
              </button>
            )}
          </div>
        </div>
      }
    />
  )
}
