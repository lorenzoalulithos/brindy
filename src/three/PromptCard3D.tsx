import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { BODY_FONT, DISPLAY_FONT, canvasTexture, fitText, roundRect } from './textures'
import { rand } from '../core/random'
import { hexA } from '../core/kit'

export { CARD_CAMERA } from '../core/kit'

const LOOK_AT = new THREE.Vector3(0, 1.3, 0)
const BASE = new THREE.Vector3(0, 1.75, 0.3)
const W = 1.7
const H = 2.3
const D = 0.07
const FACE_W = W - 0.07
const FACE_H = H - 0.07
/** Logical canvas size used by the draw code; the real canvas is SCALE× bigger for crisp text. */
const CW = 720
const CH = Math.round((CW * FACE_H) / FACE_W)
const SCALE = 1.5

/** Canvas text drawn before the web fonts load uses fallbacks; redraw once they're in. */
function useFontsReady() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    const done = () => alive && setReady(true)
    if (!fonts) done()
    else Promise.all([fonts.load(`400 64px 'Lilita One'`), fonts.load('900 64px Nunito')]).then(done, done)
    return () => {
      alive = false
    }
  }, [])
  return ready
}

interface FaceProps {
  header?: string
  text: string
  footer?: string
  badge?: string
  accent: string
}

/** White bold text with a dark outline + drop shadow so it stays readable under coloured lights. */
function crispText(ctx: CanvasRenderingContext2D, draw: () => void) {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3
  draw()
  ctx.restore()
}

function drawFront(ctx: CanvasRenderingContext2D, w: number, h: number, { header, text, footer, badge, accent }: FaceProps) {
  ctx.clearRect(0, 0, w, h)
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1c0b38')
  bg.addColorStop(1, '#0a0418')
  roundRect(ctx, 0, 0, w, h, 46)
  ctx.fillStyle = bg
  ctx.fill()
  const glow = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, w)
  glow.addColorStop(0, hexA(accent, 0.28))
  glow.addColorStop(1, hexA(accent, 0))
  ctx.fillStyle = glow
  ctx.fill()

  ctx.save()
  ctx.shadowColor = accent
  ctx.shadowBlur = 30
  ctx.strokeStyle = accent
  ctx.lineWidth = 8
  roundRect(ctx, 22, 22, w - 44, h - 44, 32)
  ctx.stroke()
  ctx.restore()

  if (badge) {
    ctx.font = `56px ${BODY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badge, w - 86, 88)
  }
  if (header) {
    crispText(ctx, () => fitText(ctx, header, w / 2, 145, w - 250, 110, { font: DISPLAY_FONT, weight: '400', maxSize: 70, minSize: 30, color: '#ffffff' }))
    ctx.fillStyle = accent
    roundRect(ctx, w / 2 - 70, 215, 140, 8, 4)
    ctx.fill()
  }

  const top = header ? 250 : 80
  const bottom = footer ? h - 215 : h - 110
  crispText(ctx, () => fitText(ctx, text, w / 2, (top + bottom) / 2, w - 120, bottom - top, { weight: '900', maxSize: 80, minSize: 26, lineHeight: 1.16, color: '#ffffff' }))

  if (footer) {
    ctx.fillStyle = 'rgba(255, 210, 61, 0.16)'
    roundRect(ctx, 60, h - 195, w - 120, 110, 55)
    ctx.fill()
    crispText(ctx, () => fitText(ctx, footer, w / 2, h - 140, w - 170, 96, { maxSize: 40, minSize: 18, color: '#ffd23d', weight: '900' }))
  }
  ctx.font = `400 26px ${DISPLAY_FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.textAlign = 'center'
  ctx.fillText('BRINDY', w / 2, h - 52)
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string, emoji: string) {
  ctx.clearRect(0, 0, w, h)
  const bg = ctx.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, accent)
  bg.addColorStop(1, '#1a0b2e')
  roundRect(ctx, 0, 0, w, h, 46)
  ctx.fillStyle = bg
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'
  ctx.lineWidth = 14
  for (let x = -h; x < w + h; x += 56) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + h, h)
    ctx.stroke()
  }
  ctx.restore()
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 7
  roundRect(ctx, 24, 24, w - 48, h - 48, 32)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w / 2, h / 2 - 30, 175, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(10, 4, 20, 0.45)'
  ctx.fill()
  ctx.stroke()
  ctx.font = `190px ${BODY_FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, w / 2, h / 2 - 20)
  ctx.font = `400 72px ${DISPLAY_FONT}`
  ctx.fillStyle = '#fff'
  ctx.fillText('BRINDY', w / 2, h - 130)
}

function hiRes(anisotropy: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const tex = canvasTexture(Math.round(CW * SCALE), Math.round(CH * SCALE), (ctx) => {
    ctx.scale(SCALE, SCALE)
    draw(ctx, CW, CH)
  })
  tex.anisotropy = anisotropy
  return tex
}

const SPARKS = 28
const SPARK_COLORS = ['#ffd23d', '#ffffff', '#3dd6ff']

/** Confetti burst that fires shortly after a new card is dealt. */
function Sparks({ burstKey, accent }: { burstKey: string | number; accent: string }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(() => Array.from({ length: SPARKS }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, spin: rand(4, 12) })), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const st = useRef({ key: burstKey, delay: 0.3, t: 0 })

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const c = new THREE.Color()
    for (let i = 0; i < SPARKS; i++) m.setColorAt(i, c.set(i % 2 ? accent : SPARK_COLORS[i % SPARK_COLORS.length]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [accent])

  useFrame((_, rawDt) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(rawDt, 1 / 20)
    const s = st.current
    s.t += dt
    if (s.key !== burstKey) {
      s.key = burstKey
      s.delay = 0.3
    }
    if (s.delay > 0) {
      s.delay -= dt
      if (s.delay <= 0)
        for (const q of parts) {
          q.p.set(rand(-0.8, 0.8), rand(-1, 1), 0.1)
          q.v.set(q.p.x * 2.5 + rand(-0.8, 0.8), rand(1.5, 4), rand(0.5, 2.2))
          q.life = rand(0.7, 1.3)
        }
    }
    parts.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= dt
        q.v.y -= 7 * dt
        q.p.addScaledVector(q.v, dt)
      }
      dummy.position.copy(q.p)
      dummy.rotation.set(s.t * q.spin, s.t * q.spin * 0.7, 0)
      dummy.scale.setScalar(q.life > 0 ? Math.min(1, q.life * 2) * 0.055 : 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPARKS]} position={BASE} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export interface PromptCard3DProps extends FaceProps {
  /** Change it to deal a new card (flip + fly-in + confetti). */
  cardKey: string | number
  /** Emoji on the card back. */
  backEmoji?: string
  /** Show the back (e.g. before Truth/Dare is chosen). */
  faceDown?: boolean
  /** Shrink and lift the card to make room for a bigger HUD panel. */
  compact?: boolean
  onTap?: () => void
}

/** Big glossy prompt card floating above the bar table. Use inside <Stage camera={CARD_CAMERA}>. */
export function PromptCard3D({ cardKey, header, text, footer, badge, accent, backEmoji = '🍻', faceDown = false, compact = false, onTap }: PromptCard3DProps) {
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    camera.lookAt(LOOK_AT)
  }, [camera])

  const fonts = useFontsReady()
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy())
  const front = useMemo(
    () => hiRes(maxAniso, (ctx, w, h) => drawFront(ctx, w, h, { header, text, footer, badge, accent })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fonts` only triggers a redraw
    [header, text, footer, badge, accent, fonts, maxAniso],
  )
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `fonts` only triggers a redraw
  const back = useMemo(() => hiRes(maxAniso, (ctx, w, h) => drawBack(ctx, w, h, accent, backEmoji)), [accent, backEmoji, fonts, maxAniso])
  useEffect(() => () => front.dispose(), [front])
  useEffect(() => () => back.dispose(), [back])

  const group = useRef<THREE.Group>(null)
  const st = useRef({ key: cardKey, rotY: Math.PI, fly: 1, flyV: 0, compact: 0, press: 0, t: 0 })

  useFrame((_, rawDt) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(rawDt, 1 / 20)
    const s = st.current
    const targetY = faceDown ? Math.PI : 0
    if (s.key !== cardKey) {
      s.key = cardKey
      s.fly = 1
      s.flyV = 0
      s.rotY = targetY + Math.PI
    }
    s.t += dt
    // Underdamped spring: the card overshoots a touch before settling.
    s.flyV += (-90 * s.fly - 13 * s.flyV) * dt
    s.fly += s.flyV * dt
    s.rotY = THREE.MathUtils.damp(s.rotY, targetY, 6, dt)
    s.compact = THREE.MathUtils.damp(s.compact, compact ? 1 : 0, 7, dt)
    s.press = THREE.MathUtils.damp(s.press, 0, 10, dt)

    const f = s.fly
    const bob = Math.sin(s.t * 1.7) * 0.05
    g.position.set(BASE.x + f * 0.5, BASE.y - f * 2.2 + bob + s.compact * 0.45, BASE.z + f * 1.6)
    g.rotation.set(-0.08 + f * 1.1 + Math.sin(s.t * 1.3) * 0.03, s.rotY + Math.sin(s.t * 0.9) * 0.05, Math.sin(s.t * 1.1) * 0.025 - f * 0.5)
    const sc = (1 - 0.22 * s.compact) * (1 - THREE.MathUtils.clamp(f, 0, 1) * 0.35)
    g.scale.set(sc * (1 + 0.05 * s.press), sc * (1 - 0.07 * s.press), sc)
  })

  return (
    <>
      <group
        ref={group}
        onPointerDown={(e) => {
          e.stopPropagation()
          st.current.press = 1
        }}
        onClick={(e) => {
          e.stopPropagation()
          onTap?.()
        }}
      >
        <RoundedBox args={[W, H, D]} radius={0.05} smoothness={4} castShadow>
          <meshPhysicalMaterial color="#1a0d30" emissive={accent} emissiveIntensity={0.3} roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
        </RoundedBox>
        <mesh position={[0, 0, D / 2 + 0.002]}>
          <planeGeometry args={[FACE_W, FACE_H]} />
          <meshPhysicalMaterial
            map={front}
            emissiveMap={front}
            emissive="#ffffff"
            emissiveIntensity={0.6}
            color="#d6d6d6"
            transparent
            roughness={0.5}
            envMapIntensity={0.2}
            clearcoat={0.35}
            clearcoatRoughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, -D / 2 - 0.002]} rotation-y={Math.PI}>
          <planeGeometry args={[FACE_W, FACE_H]} />
          <meshPhysicalMaterial
            map={back}
            emissiveMap={back}
            emissive="#ffffff"
            emissiveIntensity={0.35}
            transparent
            roughness={0.4}
            envMapIntensity={0.4}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
          />
        </mesh>
      </group>
      <pointLight position={[0, 2.4, -1.2]} color={accent} intensity={10} distance={6} />
      <Sparks burstKey={cardKey} accent={accent} />
    </>
  )
}
