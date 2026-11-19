import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { Stage } from '../../three/Stage'
import { canvasTexture, DISPLAY_FONT, fitText, roundRect } from '../../three/textures'
import { fmt, useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { createDeck, pick } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { LETTERS, TOPICS, type Topic } from './topics'

const ACCENT = '#3dffd6'
const PANELS = 8
const STEP = (Math.PI * 2) / PANELS
const REEL_R = 0.7
const PANEL_H = 2 * REEL_R * Math.tan(Math.PI / PANELS)
const LETTER_W = 1.25
const TOPIC_W = 2.45
const LETTER_Y = 3.2
const TOPIC_Y = 1.62
const START_TIME = 5
const MIN_TIME = 3

type Phase = 'idle' | 'spinning' | 'turn' | 'result'

interface Spin {
  id: number
  label: string
  pool: string[]
  duration: number
  turns: number
}

const TXT = {
  spin: { it: '🎰 Gira!', en: '🎰 Spin!', es: '🎰 ¡Gira!', fr: '🎰 Tourne !', de: '🎰 Drehen!' },
  newSpin: { it: '🎰 Nuovo giro', en: '🎰 New spin', es: '🎰 Nueva tirada', fr: '🎰 Nouveau tour', de: '🎰 Neu drehen' },
  said: { it: '✅ Detta!', en: '✅ Said it!', es: '✅ ¡Dicha!', fr: '✅ Dit !', de: '✅ Gesagt!' },
  stuck: { it: '❌ Bloccato', en: '❌ Stuck', es: '❌ Bloqueado', fr: '❌ Bloqué', de: '❌ Hänger' },
  froze: { it: 'Bloccato! 🧊', en: 'Frozen! 🧊', es: '¡Bloqueado! 🧊', fr: 'Bloqué ! 🧊', de: 'Eingefroren! 🧊' },
  words: { it: 'Parole dette: {n}', en: 'Words said: {n}', es: 'Palabras dichas: {n}', fr: 'Mots dits : {n}', de: 'Gesagte Wörter: {n}' },
  hint: {
    it: 'Gira la slot: a turno dite una parola con quella lettera e categoria. Niente ripetizioni!',
    en: 'Spin the slot: take turns saying a word with that letter and category. No repeats!',
    es: 'Gira la tragaperras: por turnos decid una palabra con esa letra y categoría. ¡Sin repetir!',
    fr: 'Lance la machine : à tour de rôle, dites un mot avec cette lettre et cette catégorie. Pas de répétition !',
    de: 'Dreh den Automaten: Reihum ein Wort mit diesem Buchstaben und dieser Kategorie. Keine Wiederholungen!',
  },
} satisfies Record<string, Loc>

const mod = (a: number, n: number) => ((a % n) + n) % n
const easeOutBack = (t: number) => {
  const s = 1.15
  return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
}

function letterTexture(label: string) {
  return canvasTexture(512, Math.round((512 * PANEL_H) / LETTER_W), (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#c9fff3')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.font = `400 ${Math.round(h * 0.82)}px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#12082a'
    ctx.fillText(label, w / 2, h / 2 + h * 0.05)
  }, { fonts: true })
}

function topicTexture(label: string) {
  return canvasTexture(1024, Math.round((1024 * PANEL_H) / TOPIC_W), (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(1, '#ffe9fb')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(18,8,42,0.12)'
    ctx.lineWidth = 6
    roundRect(ctx, 10, 10, w - 20, h - 20, 22)
    ctx.stroke()
    fitText(ctx, label, w / 2, h / 2, w - 70, h - 30, { maxSize: Math.round(h * 0.5), minSize: 26, color: '#12082a' })
  }, { fonts: true })
}

/** One slot-machine drum with PANELS faces. Before each spin the hidden faces are relabelled and the target face lands in front. */
function Reel({ y, width, spin, makeTexture, initial, onDone, onStop }: { y: number; width: number; spin: Spin | null; makeTexture: (label: string) => THREE.Texture; initial: string[]; onDone?: () => void; onStop?: () => void }) {
  const drum = useRef<THREE.Group>(null)
  const cache = useRef(new Map<string, THREE.Texture>())
  const tex = (label: string) => {
    let t = cache.current.get(label)
    if (!t) {
      t = makeTexture(label)
      cache.current.set(label, t)
    }
    return t
  }
  const materials = useMemo(
    () => Array.from({ length: PANELS }, (_, i) => new THREE.MeshStandardMaterial({ map: tex(initial[i % initial.length]), roughness: 0.35, metalness: 0.05 })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  useEffect(() => {
    const textures = cache.current
    return () => {
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
    }
  }, [materials])
  const phi = useRef(0)
  const anim = useRef<{ from: number; to: number; start: number; dur: number } | null>(null)
  const lastIdx = useRef(0)
  const done = useRef(onDone)
  const stop = useRef(onStop)
  useEffect(() => {
    done.current = onDone
    stop.current = onStop
  })

  useEffect(() => {
    if (!spin) return
    const front = mod(Math.round(phi.current / STEP), PANELS)
    const target = mod(front + PANELS / 2, PANELS)
    materials.forEach((m, i) => {
      if (i === front) return
      m.map = tex(i === target ? spin.label : pick(spin.pool))
      m.needsUpdate = true
    })
    // Free textures no panel shows any more, so the cache never grows past PANELS entries.
    const used = new Set(materials.map((m) => m.map))
    cache.current.forEach((t, key) => {
      if (used.has(t)) return
      t.dispose()
      cache.current.delete(key)
    })
    const from = phi.current
    const base = target * STEP
    const k = Math.ceil((from + Math.PI * 2 * spin.turns - base) / (Math.PI * 2))
    anim.current = { from, to: base + Math.PI * 2 * k, start: performance.now(), dur: spin.duration }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin?.id])

  useFrame(() => {
    const a = anim.current
    if (a) {
      const t = Math.min(1, (performance.now() - a.start) / a.dur)
      phi.current = a.from + (a.to - a.from) * easeOutBack(t)
      const idx = Math.round(phi.current / STEP)
      if (idx !== lastIdx.current) {
        lastIdx.current = idx
        sfx.tick()
      }
      if (t >= 1) {
        phi.current = a.to
        anim.current = null
        stop.current?.()
        done.current?.()
      }
    }
    if (drum.current) drum.current.rotation.x = phi.current
  })

  return (
    <group position={[0, y, 0]}>
      <group ref={drum}>
        {materials.map((m, i) => (
          <mesh key={i} material={m} position={[0, REEL_R * Math.sin(i * STEP), REEL_R * Math.cos(i * STEP)]} rotation-x={-i * STEP}>
            <planeGeometry args={[width, PANEL_H * 1.01]} />
          </mesh>
        ))}
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[REEL_R * 0.9, REEL_R * 0.9, width - 0.02, PANELS]} />
          <meshStandardMaterial color="#12082a" />
        </mesh>
      </group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (width / 2 + 0.07), 0, 0]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[REEL_R + 0.08, REEL_R + 0.08, 0.14, 40]} />
            <meshPhysicalMaterial color="#b8c2d9" metalness={0.9} roughness={0.2} clearcoat={1} />
          </mesh>
          <mesh position={[side * (width / 2 + 0.24), 0, REEL_R * 0.75]} rotation-z={(side * Math.PI) / 2}>
            <coneGeometry args={[0.1, 0.26, 16]} />
            <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={'bar' + side} position={[0, side * (PANEL_H / 2 + 0.03), REEL_R + 0.06]}>
          <boxGeometry args={[width + 0.3, 0.04, 0.04]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

/** Slot-machine cabinet behind the two reels, with blinking marquee bulbs. */
function Cabinet({ spinning }: { spinning: boolean }) {
  const bulbs = useRef<THREE.Group>(null)
  const positions = useMemo(() => {
    const out: [number, number, number][] = []
    for (let i = 0; i < 8; i++) out.push([-1.4 + i * 0.4, 4.12, -0.72])
    return out
  }, [])
  useFrame(({ clock }) => {
    const g = bulbs.current
    if (!g) return
    const speed = spinning ? 14 : 3
    g.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
      m.emissiveIntensity = Math.sin(clock.elapsedTime * speed + i * 1.3) > 0 ? 3 : 0.3
    })
  })
  return (
    <group>
      <RoundedBox args={[3.4, 3.8, 0.7]} radius={0.22} smoothness={4} position={[0, 2.45, -1.15]} castShadow>
        <meshPhysicalMaterial color="#2a1450" roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
      </RoundedBox>
      <RoundedBox args={[3.6, 0.5, 1.6]} radius={0.15} smoothness={4} position={[0, 0.25, -0.2]} castShadow>
        <meshPhysicalMaterial color="#3a1c6a" roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <mesh position={[0, 2.45, -0.79]}>
        <planeGeometry args={[3.2, 3.6]} />
        <meshStandardMaterial color="#0b0614" emissive={ACCENT} emissiveIntensity={0.08} />
      </mesh>
      <group ref={bulbs}>
        {positions.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={i % 2 ? '#ff3d8b' : '#ffd23d'} emissive={i % 2 ? '#ff3d8b' : '#ffd23d'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Circular countdown. Updates the DOM directly every frame; calls onExpire once. */
function RingTimer({ duration, runKey, onExpire }: { duration: number; runKey: number; onExpire: () => void }) {
  const circle = useRef<SVGCircleElement>(null)
  const label = useRef<HTMLDivElement>(null)
  const expire = useRef(onExpire)
  useEffect(() => {
    expire.current = onExpire
  })
  const R = 46
  const C = 2 * Math.PI * R

  useEffect(() => {
    const start = performance.now()
    let lastSec = Math.ceil(duration)
    let raf = 0
    const loop = () => {
      const elapsed = (performance.now() - start) / 1000
      const left = Math.max(0, duration - elapsed)
      const frac = left / duration
      if (circle.current) {
        circle.current.style.strokeDashoffset = String(C * (1 - frac))
        circle.current.style.stroke = frac > 0.5 ? ACCENT : frac > 0.25 ? '#ffd23d' : '#ff5c5c'
      }
      const sec = Math.ceil(left)
      if (label.current) label.current.textContent = String(sec)
      if (sec < lastSec) {
        lastSec = sec
        if (sec > 0) {
          sfx.tick()
          if (sec <= 2) vibrate(15)
        }
      }
      if (left <= 0) {
        expire.current()
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [duration, runKey, C])

  return (
    <div style={{ position: 'relative', width: 112, height: 112, alignSelf: 'center' }}>
      <svg width={112} height={112} viewBox="0 0 112 112" style={{ transform: 'rotate(-90deg)', filter: 'drop-shadow(0 0 10px rgba(61,255,214,0.5))' }}>
        <circle cx={56} cy={56} r={R} fill="rgba(14,6,26,0.82)" stroke="rgba(255,255,255,0.12)" strokeWidth={10} />
        <circle ref={circle} cx={56} cy={56} r={R} fill="none" stroke={ACCENT} strokeWidth={10} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={0} />
      </svg>
      <div ref={label} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontSize: 44 }}>
        {Math.ceil(duration)}
      </div>
    </div>
  )
}

export default function CategoriesGame({ onExit }: GameProps) {
  const { t, L, lang } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const deck = useMemo(() => createDeck(TOPICS), [])
  const letters = LETTERS[lang].split('')
  const topicLabel = (tp: Topic) => `${tp.emoji} ${L(tp.name)}`
  const [initialLetters] = useState(() => letters)
  const [initialTopics] = useState(() => TOPICS.slice(0, PANELS).map(topicLabel))
  const [phase, setPhase] = useState<Phase>('idle')
  const [letter, setLetter] = useState('')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [spins, setSpins] = useState<{ letter: Spin; topic: Spin } | null>(null)
  const [says, setSays] = useState(0)
  const [runKey, setRunKey] = useState(0)
  const [result, setResult] = useState<{ name: string; reason: 'time' | 'stuck'; words: number; id: number } | null>(null)
  const spinCount = useRef(0)
  // Each timer run accepts one answer: blocks double taps and a tap racing the timeout (double turn.next / double penalty).
  const handledRun = useRef(-1)

  const duration = Math.max(MIN_TIME, START_TIME - 0.5 * Math.floor(says / turn.players.length))

  const spin = () => {
    if (phase === 'spinning' || phase === 'turn') return
    const l = pick(letters)
    const tp = deck.draw()
    const id = ++spinCount.current
    setLetter(l)
    setTopic(tp)
    setSpins({
      letter: { id, label: l, pool: letters, duration: 1700, turns: 3 },
      topic: { id, label: topicLabel(tp), pool: TOPICS.map(topicLabel), duration: 2600, turns: 4 },
    })
    setResult(null)
    setPhase('spinning')
    sfx.whoosh()
    vibrate(30)
  }

  const landed = () => {
    setSays(0)
    setRunKey((k) => k + 1)
    setPhase('turn')
    sfx.reveal()
    vibrate([40, 40, 80])
  }

  const said = () => {
    if (phase !== 'turn' || handledRun.current === runKey) return
    handledRun.current = runKey
    sfx.tap()
    vibrate(20)
    setSays((n) => n + 1)
    setRunKey((k) => k + 1)
    turn.next()
  }

  const fail = (reason: 'time' | 'stuck') => {
    if (phase !== 'turn' || handledRun.current === runKey) return
    handledRun.current = runKey
    const p = turn.current
    penalty.apply(p.id, 1)
    sfx.lose()
    vibrate([80, 40, 160])
    setResult({ name: p.name, reason, words: says, id: Date.now() })
    setPhase('result')
  }

  return (
    <GameShell
      gameId="categories"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={{ position: [0, 2.7, 10], fov: 40 }} lookAt={[0, 1.95, 0]}>
          <group
            onClick={(e) => {
              e.stopPropagation()
              spin()
            }}
          >
            <Cabinet spinning={phase === 'spinning'} />
            <Reel y={LETTER_Y} width={LETTER_W} spin={spins?.letter ?? null} makeTexture={letterTexture} initial={initialLetters} onStop={() => sfx.thud()} />
            <Reel y={TOPIC_Y} width={TOPIC_W} spin={spins?.topic ?? null} makeTexture={topicTexture} initial={initialTopics} onStop={() => sfx.thud()} onDone={landed} />
          </group>
        </Stage>
      }
      top={
        <>
          {(phase === 'turn' || phase === 'result') && <TurnPill player={turn.current} />}
          {topic && phase !== 'spinning' && (
            <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              <span className="chip" style={{ fontSize: 17 }}>
                {t('startsWith')} <b style={{ color: ACCENT, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400 }}>{letter}</b>
              </span>
              <span className="chip" style={{ fontSize: 17 }}>
                {topicLabel(topic)}
              </span>
            </div>
          )}
        </>
      }
      bottom={
        <>
          {phase === 'idle' && (
            <div className="center muted" style={{ fontSize: 16 }}>
              {L(TXT.hint)}
            </div>
          )}
          {phase === 'turn' && (
            <>
              <RingTimer duration={duration} runKey={runKey} onExpire={() => fail('time')} />
              <div className="row">
                <button className="btn" style={{ flex: 2, minHeight: 84, fontSize: 28, background: 'linear-gradient(180deg, #9dffe9, #3dffd6)', boxShadow: '0 6px 0 #0f9c80, 0 12px 30px rgba(61,255,214,0.4)' }} onClick={said}>
                  {L(TXT.said)}
                </button>
                <button className="btn secondary" style={{ flex: 1, minHeight: 84, fontSize: 18, padding: '0 10px' }} onClick={() => fail('stuck')}>
                  {L(TXT.stuck)}
                </button>
              </div>
            </>
          )}
          {phase === 'result' && result && (
            <ResultCard
              animKey={result.id}
              color="#ff5c5c"
              who={result.name}
              big={result.reason === 'time' ? t('timeUp') : L(TXT.froze)}
              sub={
                <>
                  <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{penalty.drink(1)}</div>
                  <div className="muted">{fmt(L(TXT.words), { n: result.words })}</div>
                </>
              }
            />
          )}
          {(phase === 'idle' || phase === 'spinning' || phase === 'result') && (
            <button className="btn block" disabled={phase === 'spinning'} onClick={spin}>
              {phase === 'spinning' ? '🎰 …' : phase === 'result' ? L(TXT.newSpin) : L(TXT.spin)}
            </button>
          )}
        </>
      }
    />
  )
}
