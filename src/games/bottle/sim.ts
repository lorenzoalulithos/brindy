import type { Loc } from '../../core/i18n'

export const ACCENT = '#3dff8b'
export const TABLE_RADIUS = 2.6
export const SEAT_RADIUS = 1.95
/** Seat 0 sits at the far side of the table (top of the screen). */
export const SEAT_OFFSET = Math.PI / 2
const TAU = Math.PI * 2

export interface Seat {
  id: string
  label: string
  color: string
  /** Real player id (undefined for generic seats). */
  playerId?: string
}

export const GENERIC_SEATS: Seat[] = [
  { id: 's0', label: '🦊', color: '#ff8a3d' },
  { id: 's1', label: '🐸', color: '#3dff8b' },
  { id: 's2', label: '🦄', color: '#ff3df0' },
  { id: 's3', label: '🐙', color: '#7b5cff' },
  { id: 's4', label: '🐯', color: '#ffd23d' },
  { id: 's5', label: '🐼', color: '#3dd6ff' },
]

export const SPICY_LABEL: Loc = { it: 'Piccante', en: 'Spicy', es: 'Picante', fr: 'Épicé', de: 'Scharf' }
export const SPICY_PACK_TITLE: Loc = {
  it: 'Bottiglia piccante 🌶️',
  en: 'Spicy bottle 🌶️',
  es: 'Botella picante 🌶️',
  fr: 'Bouteille épicée 🌶️',
  de: 'Scharfe Flasche 🌶️',
}
export const SWIPE_HINT: Loc = {
  it: '👆 Trascina la bottiglia per farla girare',
  en: '👆 Drag the bottle to spin it',
  es: '👆 Arrastra la botella para girarla',
  fr: '👆 Fais glisser la bouteille pour la lancer',
  de: '👆 Zieh an der Flasche, um sie zu drehen',
}
export const SPIN: Loc = { it: 'Gira!', en: 'Spin!', es: '¡Gira!', fr: 'Tourne !', de: 'Drehen!' }
export const SPIN_AGAIN: Loc = { it: 'Gira ancora', en: 'Spin again', es: 'Gira otra vez', fr: 'Relance', de: 'Nochmal drehen' }

/** Mutable spin state shared between the HUD and the render loop (no re-renders per frame). */
export interface BottleSim {
  angle: number
  omega: number
  mode: 'idle' | 'drag' | 'spin'
  /** Seat currently under the bottle neck. */
  seat: number
  /** Seat lit up as the result, -1 when none. */
  winner: number
  /** Decaying wobble energy after the bottle stops or is released. */
  settle: number
  dragAngle: number
  dragMoved: number
  dragStart: number
  samples: { a: number; t: number }[]
  lastTick: number
}

export const newSim = (): BottleSim => ({
  angle: SEAT_OFFSET - 0.35,
  omega: 0,
  mode: 'idle',
  seat: 0,
  winner: -1,
  settle: 0,
  dragAngle: 0,
  dragMoved: 0,
  dragStart: 0,
  samples: [],
  lastTick: 0,
})

export const seatAngle = (i: number, n: number) => SEAT_OFFSET + (i * TAU) / n

export function nearestSeat(angle: number, n: number) {
  const step = TAU / n
  const k = Math.round((angle - SEAT_OFFSET) / step)
  return ((k % n) + n) % n
}

/** Wraps an angle difference into [-π, π]. */
export function wrapAngle(a: number) {
  return a - TAU * Math.round(a / TAU)
}

/** Angle on the table plane, matching a group's rotation.y (x = cos, z = -sin). */
export const planeAngle = (x: number, z: number) => Math.atan2(-z, x)
