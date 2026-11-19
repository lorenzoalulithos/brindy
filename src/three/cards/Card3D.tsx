import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { canvasTexture, DISPLAY_FONT, roundRect } from '../textures'
import { isRed, rankLabel, type PlayingCard, type Suit } from './cards'

/** Card size in world units (poker ratio). Scale the group to resize. */
export const CARD_W = 1
export const CARD_H = 1.4
const CARD_T = 0.014
const CORNER = 0.075

const TW = 360
const TH = 504
const RED = '#c8102e'
const BLACK = '#17131f'
const SERIF = "Georgia, 'Times New Roman', serif"

// ---------- geometry (shared by every card) ----------

function cardShape() {
  const s = new THREE.Shape()
  const w = CARD_W / 2
  const h = CARD_H / 2
  const r = CORNER
  s.moveTo(-w + r, -h)
  s.lineTo(w - r, -h)
  s.quadraticCurveTo(w, -h, w, -h + r)
  s.lineTo(w, h - r)
  s.quadraticCurveTo(w, h, w - r, h)
  s.lineTo(-w + r, h)
  s.quadraticCurveTo(-w, h, -w, h - r)
  s.lineTo(-w, -h + r)
  s.quadraticCurveTo(-w, -h, -w + r, -h)
  return s
}

let geos: { body: THREE.BufferGeometry; face: THREE.BufferGeometry; glow: THREE.PlaneGeometry } | null = null
function geometries() {
  if (geos) return geos
  const shape = cardShape()
  const body = new THREE.ExtrudeGeometry(shape, { depth: CARD_T, bevelEnabled: false, curveSegments: 5 })
  body.translate(0, 0, -CARD_T / 2)
  const face = new THREE.ShapeGeometry(shape, 5)
  const pos = face.attributes.position
  const uv = face.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / CARD_W + 0.5, pos.getY(i) / CARD_H + 0.5)
  uv.needsUpdate = true
  geos = { body, face, glow: new THREE.PlaneGeometry(CARD_W * 1.9, CARD_H * 1.65) }
  return geos
}

// ---------- canvas drawing ----------

function drawSuit(ctx: CanvasRenderingContext2D, suit: Suit, x: number, y: number, s: number, flip = false) {
  ctx.save()
  ctx.translate(x, y)
  if (flip) ctx.rotate(Math.PI)
  ctx.fillStyle = isRed(suit) ? RED : BLACK
  ctx.beginPath()
  if (suit === 'D') {
    ctx.moveTo(0, -0.5 * s)
    ctx.quadraticCurveTo(0.18 * s, -0.2 * s, 0.38 * s, 0)
    ctx.quadraticCurveTo(0.18 * s, 0.2 * s, 0, 0.5 * s)
    ctx.quadraticCurveTo(-0.18 * s, 0.2 * s, -0.38 * s, 0)
    ctx.quadraticCurveTo(-0.18 * s, -0.2 * s, 0, -0.5 * s)
  } else if (suit === 'H') {
    ctx.moveTo(0, 0.48 * s)
    ctx.bezierCurveTo(-0.2 * s, 0.28 * s, -0.5 * s, 0.08 * s, -0.5 * s, -0.16 * s)
    ctx.bezierCurveTo(-0.5 * s, -0.4 * s, -0.3 * s, -0.5 * s, -0.24 * s, -0.5 * s)
    ctx.bezierCurveTo(-0.1 * s, -0.5 * s, -0.02 * s, -0.42 * s, 0, -0.3 * s)
    ctx.bezierCurveTo(0.02 * s, -0.42 * s, 0.1 * s, -0.5 * s, 0.24 * s, -0.5 * s)
    ctx.bezierCurveTo(0.3 * s, -0.5 * s, 0.5 * s, -0.4 * s, 0.5 * s, -0.16 * s)
    ctx.bezierCurveTo(0.5 * s, 0.08 * s, 0.2 * s, 0.28 * s, 0, 0.48 * s)
  } else if (suit === 'S') {
    ctx.moveTo(0, -0.5 * s)
    ctx.bezierCurveTo(-0.18 * s, -0.28 * s, -0.5 * s, -0.12 * s, -0.5 * s, 0.1 * s)
    ctx.bezierCurveTo(-0.5 * s, 0.3 * s, -0.34 * s, 0.38 * s, -0.24 * s, 0.38 * s)
    ctx.bezierCurveTo(-0.12 * s, 0.38 * s, -0.05 * s, 0.32 * s, -0.03 * s, 0.26 * s)
    ctx.quadraticCurveTo(-0.06 * s, 0.42 * s, -0.18 * s, 0.5 * s)
    ctx.lineTo(0.18 * s, 0.5 * s)
    ctx.quadraticCurveTo(0.06 * s, 0.42 * s, 0.03 * s, 0.26 * s)
    ctx.bezierCurveTo(0.05 * s, 0.32 * s, 0.12 * s, 0.38 * s, 0.24 * s, 0.38 * s)
    ctx.bezierCurveTo(0.34 * s, 0.38 * s, 0.5 * s, 0.3 * s, 0.5 * s, 0.1 * s)
    ctx.bezierCurveTo(0.5 * s, -0.12 * s, 0.18 * s, -0.28 * s, 0, -0.5 * s)
  } else {
    const r = 0.21 * s
    ctx.arc(0, -0.25 * s, r, 0, Math.PI * 2)
    ctx.moveTo(-0.25 * s + r, 0.08 * s)
    ctx.arc(-0.25 * s, 0.08 * s, r, 0, Math.PI * 2)
    ctx.moveTo(0.25 * s + r, 0.08 * s)
    ctx.arc(0.25 * s, 0.08 * s, r, 0, Math.PI * 2)
    ctx.moveTo(0.12 * s, 0)
    ctx.arc(0, 0, 0.12 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(-0.04 * s, 0.05 * s)
    ctx.quadraticCurveTo(-0.06 * s, 0.38 * s, -0.18 * s, 0.5 * s)
    ctx.lineTo(0.18 * s, 0.5 * s)
    ctx.quadraticCurveTo(0.06 * s, 0.38 * s, 0.04 * s, 0.05 * s)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

/** Classic pip positions (fractions of the face), lower half drawn upside-down. */
const L = 0.3
const C = 0.5
const R = 0.7
const PIPS: Record<number, [number, number][]> = {
  2: [[C, 0.2], [C, 0.8]],
  3: [[C, 0.2], [C, 0.5], [C, 0.8]],
  4: [[L, 0.2], [R, 0.2], [L, 0.8], [R, 0.8]],
  5: [[L, 0.2], [R, 0.2], [C, 0.5], [L, 0.8], [R, 0.8]],
  6: [[L, 0.2], [R, 0.2], [L, 0.5], [R, 0.5], [L, 0.8], [R, 0.8]],
  7: [[L, 0.2], [R, 0.2], [C, 0.35], [L, 0.5], [R, 0.5], [L, 0.8], [R, 0.8]],
  8: [[L, 0.2], [R, 0.2], [C, 0.35], [L, 0.5], [R, 0.5], [C, 0.65], [L, 0.8], [R, 0.8]],
  9: [[L, 0.2], [R, 0.2], [L, 0.4], [R, 0.4], [C, 0.5], [L, 0.6], [R, 0.6], [L, 0.8], [R, 0.8]],
  10: [[L, 0.2], [R, 0.2], [C, 0.3], [L, 0.4], [R, 0.4], [L, 0.6], [R, 0.6], [C, 0.7], [L, 0.8], [R, 0.8]],
}

function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, kind: number, ink: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.lineWidth = 3
  ctx.strokeStyle = ink
  const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2)
  g.addColorStop(0, '#ffe58a')
  g.addColorStop(1, '#e0a21c')
  ctx.fillStyle = g
  ctx.beginPath()
  if (kind === 13) {
    // king: five-point crown
    ctx.moveTo(-0.5 * s, 0.3 * s)
    ctx.lineTo(-0.5 * s, -0.3 * s)
    ctx.lineTo(-0.25 * s, 0)
    ctx.lineTo(-0.12 * s, -0.42 * s)
    ctx.lineTo(0, -0.05 * s)
    ctx.lineTo(0.12 * s, -0.42 * s)
    ctx.lineTo(0.25 * s, 0)
    ctx.lineTo(0.5 * s, -0.3 * s)
    ctx.lineTo(0.5 * s, 0.3 * s)
  } else if (kind === 12) {
    // queen: rounded tiara
    ctx.moveTo(-0.45 * s, 0.3 * s)
    ctx.quadraticCurveTo(-0.5 * s, -0.1 * s, -0.3 * s, -0.15 * s)
    ctx.quadraticCurveTo(-0.15 * s, 0.05 * s, 0, -0.38 * s)
    ctx.quadraticCurveTo(0.15 * s, 0.05 * s, 0.3 * s, -0.15 * s)
    ctx.quadraticCurveTo(0.5 * s, -0.1 * s, 0.45 * s, 0.3 * s)
  } else {
    // jack: plumed cap
    ctx.moveTo(-0.45 * s, 0.3 * s)
    ctx.quadraticCurveTo(-0.4 * s, -0.25 * s, 0.05 * s, -0.2 * s)
    ctx.quadraticCurveTo(0.35 * s, -0.55 * s, 0.5 * s, -0.35 * s)
    ctx.quadraticCurveTo(0.3 * s, -0.25 * s, 0.4 * s, 0.3 * s)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.fillRect(-0.48 * s, 0.22 * s, 0.96 * s, 0.1 * s)
  if (kind !== 11)
    for (const px of [-0.25, 0, 0.25]) {
      ctx.beginPath()
      ctx.arc(px * s, 0.1 * s, 0.05 * s, 0, Math.PI * 2)
      ctx.fill()
    }
  ctx.restore()
}

function drawIndex(ctx: CanvasRenderingContext2D, card: PlayingCard, ink: string) {
  const label = rankLabel(card.rank)
  ctx.fillStyle = ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 60px ${SERIF}`
  ctx.save()
  ctx.translate(42, 52)
  if (label.length > 1) ctx.scale(0.72, 1)
  ctx.fillText(label, 0, 0)
  ctx.restore()
  drawSuit(ctx, card.suit, 42, 104, 38)
}

function drawFront(card: PlayingCard) {
  return canvasTexture(TW, TH, (ctx, w, h) => {
    const ink = isRed(card.suit) ? RED : BLACK
    const bg = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, h * 0.7)
    bg.addColorStop(0, '#fffdf8')
    bg.addColorStop(1, '#efe7d6')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(30, 20, 40, 0.14)'
    ctx.lineWidth = 2
    roundRect(ctx, 12, 12, w - 24, h - 24, 22)
    ctx.stroke()

    drawIndex(ctx, card, ink)
    ctx.save()
    ctx.translate(w, h)
    ctx.rotate(Math.PI)
    drawIndex(ctx, card, ink)
    ctx.restore()

    if (card.rank === 1) {
      if (card.suit === 'S') {
        ctx.strokeStyle = 'rgba(23, 19, 31, 0.25)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, 108, 0, Math.PI * 2)
        ctx.stroke()
        drawSuit(ctx, 'S', w / 2, h / 2 - 6, 170)
        ctx.font = `400 22px ${DISPLAY_FONT}`
        ctx.fillStyle = BLACK
        ctx.textAlign = 'center'
        ctx.fillText('BRINDY', w / 2, h / 2 + 128)
      } else drawSuit(ctx, card.suit, w / 2, h / 2, 140)
    } else if (card.rank <= 10) {
      const size = card.rank >= 9 ? 58 : 64
      for (const [px, py] of PIPS[card.rank]) drawSuit(ctx, card.suit, px * w, py * h, size, py > 0.5)
    } else {
      // court card: double-headed frame, like the classic French deck
      const x0 = 76
      const y0 = 64
      const fw = w - x0 * 2
      const fh = h - y0 * 2
      const fill = ctx.createLinearGradient(0, y0, 0, y0 + fh)
      fill.addColorStop(0, isRed(card.suit) ? '#ffe9e0' : '#e9e6f5')
      fill.addColorStop(0.5, '#fff6dc')
      fill.addColorStop(1, isRed(card.suit) ? '#ffe9e0' : '#e9e6f5')
      ctx.fillStyle = fill
      roundRect(ctx, x0, y0, fw, fh, 14)
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = ink
      ctx.stroke()
      ctx.save()
      roundRect(ctx, x0, y0, fw, fh, 14)
      ctx.clip()
      ctx.strokeStyle = '#e0a21c'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x0, y0 + fh * 0.56)
      ctx.lineTo(x0 + fw, y0 + fh * 0.44)
      ctx.stroke()
      const half = () => {
        drawCrown(ctx, w / 2, y0 + 62, 92, card.rank, ink)
        ctx.fillStyle = ink
        ctx.font = `bold 104px ${SERIF}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(rankLabel(card.rank), w / 2, y0 + 160)
        drawSuit(ctx, card.suit, x0 + 30, y0 + 34, 32)
      }
      half()
      ctx.translate(w, h)
      ctx.rotate(Math.PI)
      half()
      ctx.restore()
    }
  }, { fonts: true })
}

function drawBack(accent: string) {
  return canvasTexture(TW, TH, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#1d0b38')
    bg.addColorStop(1, '#0d0619')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    // diamond lattice
    ctx.save()
    roundRect(ctx, 26, 26, w - 52, h - 52, 18)
    ctx.clip()
    ctx.strokeStyle = accent
    ctx.globalAlpha = 0.22
    ctx.lineWidth = 2
    for (let i = -h; i < w + h; i += 26) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + h, h)
      ctx.moveTo(i, h)
      ctx.lineTo(i + h, 0)
      ctx.stroke()
    }
    ctx.restore()
    // neon frame
    ctx.shadowColor = accent
    ctx.shadowBlur = 18
    ctx.strokeStyle = accent
    ctx.lineWidth = 6
    roundRect(ctx, 18, 18, w - 36, h - 36, 24)
    ctx.stroke()
    ctx.shadowColor = '#3dd6ff'
    ctx.strokeStyle = '#3dd6ff'
    ctx.lineWidth = 2
    roundRect(ctx, 32, 32, w - 64, h - 64, 16)
    ctx.stroke()
    // badge
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(11, 6, 20, 0.92)'
    roundRect(ctx, 44, h / 2 - 56, w - 88, 112, 56)
    ctx.fill()
    ctx.shadowColor = accent
    ctx.shadowBlur = 14
    ctx.strokeStyle = accent
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.font = `400 66px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowBlur = 22
    ctx.fillStyle = '#fff7fb'
    ctx.fillText('Brindy', w / 2, h / 2 + 4)
    ctx.shadowBlur = 10
    ctx.fillStyle = accent
    for (const [sx, sy] of [[w / 2, 80], [w / 2, h - 80]]) {
      ctx.beginPath()
      ctx.arc(sx, sy, 7, 0, Math.PI * 2)
      ctx.fill()
    }
  }, { fonts: true })
}

function drawGlow() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

// ---------- material caches ----------

const material = (map: THREE.Texture) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.22 })

/**
 * Card faces: part of the colour comes from an emissive copy of the face so inks stay
 * crisp and saturated under the coloured neon lights; low env reflections keep the
 * clearcoat sheen without washing the print out.
 */
const faceMaterial = (map: THREE.Texture) =>
  new THREE.MeshPhysicalMaterial({
    map,
    color: '#cfcfcf',
    emissiveMap: map,
    emissive: '#ffffff',
    emissiveIntensity: 0.42,
    roughness: 0.55,
    envMapIntensity: 0.25,
    clearcoat: 0.45,
    clearcoatRoughness: 0.32,
  })

/** Small LRU so a whole deck never sits in GPU memory at once. */
const FRONT_CACHE = new Map<string, THREE.MeshPhysicalMaterial>()
const FRONT_MAX = 14
function frontMaterial(card: PlayingCard) {
  let m = FRONT_CACHE.get(card.id)
  if (m) {
    FRONT_CACHE.delete(card.id)
    FRONT_CACHE.set(card.id, m)
    return m
  }
  m = faceMaterial(drawFront(card))
  FRONT_CACHE.set(card.id, m)
  if (FRONT_CACHE.size > FRONT_MAX) {
    const [oldId, old] = FRONT_CACHE.entries().next().value!
    FRONT_CACHE.delete(oldId)
    // Disposed GPU resources are re-uploaded automatically if still in use.
    old.map?.dispose()
    old.dispose()
  }
  return m
}

const BACK_CACHE = new Map<string, THREE.MeshPhysicalMaterial>()
function backMaterial(accent: string) {
  let m = BACK_CACHE.get(accent)
  if (!m) BACK_CACHE.set(accent, (m = material(drawBack(accent))))
  return m
}

let blank: THREE.MeshStandardMaterial | null = null
let edge: THREE.MeshStandardMaterial | null = null
let glowTex: THREE.Texture | null = null

// ---------- components ----------

type CardProps = Omit<ThreeElements['group'], 'children'> & {
  /** Face to show. Omit for a face-down card that never shows its front (cheap: no texture). */
  card?: PlayingCard | null
  /** Neon color of the card back. */
  accent?: string
  /** Halo color behind the card (visible when it faces the camera). */
  glow?: string
  /** 0..1 halo intensity; it pulses gently. */
  glowStrength?: number
}

/**
 * A playing card in the XY plane: front faces +Z, back faces −Z, long side along Y.
 * Size CARD_W × CARD_H; scale the group to resize.
 */
export function Card3D({ card, accent = '#ff3d8b', glow, glowStrength = 0, ...props }: CardProps) {
  const g = geometries()
  const front = useMemo(() => (card ? frontMaterial(card) : (blank ??= new THREE.MeshStandardMaterial({ color: '#f4efe4', roughness: 0.6 }))), [card])
  const back = useMemo(() => backMaterial(accent), [accent])
  edge ??= new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.5 })
  const glowMat = useMemo(() => {
    if (!glow) return null
    glowTex ??= drawGlow()
    return new THREE.MeshBasicMaterial({ map: glowTex, color: glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  }, [glow])
  useEffect(() => () => glowMat?.dispose(), [glowMat])
  const strength = useRef(glowStrength)
  strength.current = glowStrength

  useFrame((state) => {
    if (glowMat) glowMat.opacity = strength.current * (0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 6))
  })

  return (
    <group {...props}>
      <mesh geometry={g.body} material={edge} castShadow />
      <mesh geometry={g.face} material={front} position-z={CARD_T / 2 + 0.0005} />
      <mesh geometry={g.face} material={back} position-z={-CARD_T / 2 - 0.0005} rotation-y={Math.PI} />
      {glowMat && <mesh geometry={g.glow} material={glowMat} position-z={-0.03} renderOrder={-1} />}
    </group>
  )
}
