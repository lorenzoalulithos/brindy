import * as THREE from 'three'
import { canvasTexture, DISPLAY_FONT, fitText, roundRect } from '../../three/textures'
import { ACCENT, SUITS, type Card } from './data'

export function cardFaceTexture(card: Card) {
  const s = SUITS[card.suit]
  return canvasTexture(256, 358, (ctx, w, h) => {
    ctx.fillStyle = '#fffaf0'
    roundRect(ctx, 4, 4, w - 8, h - 8, 26)
    ctx.fill()
    ctx.strokeStyle = s.color
    ctx.lineWidth = 8
    roundRect(ctx, 14, 14, w - 28, h - 28, 20)
    ctx.stroke()
    ctx.fillStyle = s.ink
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `64px ${DISPLAY_FONT}`
    ctx.fillText(card.rank, 52, 58)
    ctx.font = `44px ${DISPLAY_FONT}`
    ctx.fillText(s.sym, 52, 110)
    ctx.font = `170px ${DISPLAY_FONT}`
    ctx.fillText(s.sym, w / 2, h / 2 + 30)
  })
}

export function cardBackTexture() {
  return canvasTexture(256, 358, (ctx, w, h) => {
    ctx.fillStyle = '#1a0b2e'
    roundRect(ctx, 4, 4, w - 8, h - 8, 26)
    ctx.fill()
    ctx.strokeStyle = ACCENT
    ctx.lineWidth = 10
    roundRect(ctx, 18, 18, w - 36, h - 36, 18)
    ctx.stroke()
    ctx.save()
    ctx.globalAlpha = 0.25
    ctx.strokeStyle = '#ff3d8b'
    ctx.lineWidth = 4
    for (let i = -h; i < w + h; i += 26) {
      ctx.beginPath()
      ctx.moveTo(i, 24)
      ctx.lineTo(i + h, h - 24)
      ctx.stroke()
    }
    ctx.restore()
    ctx.font = `120px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏇', w / 2, h / 2)
  })
}

/** Saddle cloth / jockey bib: suit color with the horse number. */
export function bibTexture(suit: number) {
  const s = SUITS[suit]
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = s.color
    roundRect(ctx, 0, 0, w, h, 24)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillRect(0, h - 18, w, 8)
    ctx.beginPath()
    ctx.arc(w / 2, h / 2 - 4, 58, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.fillStyle = '#14081f'
    ctx.font = `76px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(suit + 1), w / 2, h / 2)
    ctx.font = `54px ${DISPLAY_FONT}`
    ctx.fillStyle = '#fff'
    ctx.fillText(s.sym, 34, h / 2)
    ctx.fillText(s.sym, w - 34, h / 2)
  })
}

export function checkerTexture() {
  const tex = canvasTexture(256, 32, (ctx, w, h) => {
    const n = 32
    const size = w / n
    for (let x = 0; x < n; x++)
      for (let y = 0; y < 4; y++) {
        ctx.fillStyle = (x + y) % 2 ? '#111' : '#fff'
        ctx.fillRect(x * size, y * (h / 4), size, h / 4)
      }
  })
  tex.magFilter = THREE.NearestFilter
  return tex
}

export function bannerTexture(text: string) {
  return canvasTexture(1024, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0)
    g.addColorStop(0, '#ff3d8b')
    g.addColorStop(0.5, ACCENT)
    g.addColorStop(1, '#3dd6ff')
    ctx.fillStyle = '#12061f'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, 10)
    ctx.fillRect(0, h - 10, w, 10)
    fitText(ctx, `🏁 ${text} 🏁`, w / 2, h / 2 + 4, w - 60, h - 30, { font: DISPLAY_FONT, weight: '400', maxSize: 86, color: '#fff' })
  })
}

export function podiumTexture(n: number) {
  const colors = ['#ffd23d', '#d7dbe6', '#ff9a5c']
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1a0b2e'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = colors[n - 1]
    ctx.font = `190px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), w / 2, h / 2 + 14)
  })
}

/** Little numbered distance marker. */
export function markerTexture(n: number) {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#14081f'
    ctx.font = `80px ${DISPLAY_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), w / 2, h / 2 + 4)
  })
}
