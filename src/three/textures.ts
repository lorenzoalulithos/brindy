import * as THREE from 'three'

/**
 * Canvas-drawn textures: offline, any language, emoji-friendly.
 * Prefer these over drei <Text> (which downloads fonts from a CDN).
 */
export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  /** `fonts: true` repaints once the app's web fonts are loaded (use when drawing text; `draw` must be repeatable). */
  { fonts = false }: { fonts?: boolean } = {},
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx, width, height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  if (fonts && !fontsAreReady)
    void whenFontsReady().then(() => {
      ctx.reset?.()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, width, height)
      draw(ctx, width, height)
      tex.needsUpdate = true
    })
  return tex
}

export const DISPLAY_FONT = "'Lilita One', 'Arial Rounded MT Bold', system-ui, sans-serif"
export const BODY_FONT = "'Nunito', system-ui, sans-serif"

let fontsAreReady = false
let fontsPromise: Promise<void> | null = null

/**
 * Resolves once the display + body web fonts are loaded (or failed / unsupported),
 * so canvas text doesn't get stuck with a fallback font. Never rejects.
 */
export function whenFontsReady(): Promise<void> {
  fontsPromise ??= (async () => {
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await Promise.all([document.fonts.load(`400 64px ${DISPLAY_FONT}`), document.fonts.load(`900 64px ${BODY_FONT}`)])
        await document.fonts.ready
      }
    } catch {
      /* fonts unavailable: fallbacks are fine */
    }
    fontsAreReady = true
  })()
  return fontsPromise
}

/** Wraps text into lines that fit maxWidth with the current ctx.font. */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

/** Draws multi-line centered text, auto-shrinking the font until it fits the box. */
export function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxW: number,
  maxH: number,
  { font = BODY_FONT, weight = '900', maxSize = 72, minSize = 18, color = '#fff', lineHeight = 1.18 } = {},
) {
  let size = maxSize
  let lines: string[] = []
  for (; size >= minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${font}`
    lines = wrapText(ctx, text, maxW)
    if (lines.length * size * lineHeight <= maxH && lines.every((l) => ctx.measureText(l).width <= maxW)) break
  }
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const total = lines.length * size * lineHeight
  lines.forEach((l, i) => ctx.fillText(l, cx, cy - total / 2 + size * lineHeight * (i + 0.5)))
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
