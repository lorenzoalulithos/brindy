export const ACCENT = '#7b5cff'
export const WHEEL_R = 2
export const WHEEL_Y = 2.75
export const WHEEL_TILT = -0.12
/** Angular half-width of the zone where a peg touches the flapper. */
export const PEG_WINDOW = 0.12
export const POINTER_ANGLE = Math.PI / 2
const TAU = Math.PI * 2

/** Mutable spin state shared between the HUD and the render loop. */
export interface WheelSim {
  angle: number
  omega: number
  mode: 'idle' | 'drag' | 'spin'
  slice: number
  winner: number
  /** Peg that just slipped past the flapper: it no longer pushes until it leaves the contact window. */
  skipPeg: number
  flap: number
  flapV: number
  elapsed: number
  lastTick: number
  dragAngle: number
  dragMoved: number
  dragStart: number
  samples: { a: number; t: number }[]
}

export const newSim = (): WheelSim => ({
  angle: 0.2,
  omega: 0,
  mode: 'idle',
  slice: -1,
  winner: -1,
  skipPeg: -1,
  flap: 0,
  flapV: 0,
  elapsed: 0,
  lastTick: 0,
  dragAngle: 0,
  dragMoved: 0,
  dragStart: 0,
  samples: [],
})

export const wrapAngle = (a: number) => a - TAU * Math.round(a / TAU)
const mod = (a: number, n: number) => ((a % n) + n) % n

/** Slice i spans local angles [i·step, (i+1)·step]; the pointer sits at the top. */
export function sliceAt(angle: number, n: number) {
  const step = TAU / n
  return Math.min(n - 1, Math.floor(mod(POINTER_ANGLE - angle, TAU) / step))
}

/** Nearest peg to the pointer and its signed angular offset (negative = right of the pointer). */
export function nearestPeg(angle: number, n: number) {
  const step = TAU / n
  const k = Math.round((POINTER_ANGLE - angle) / step)
  return { peg: mod(k, n), d: wrapAngle(k * step + angle - POINTER_ANGLE) }
}
