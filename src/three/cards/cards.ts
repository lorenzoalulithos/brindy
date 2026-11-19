import * as THREE from 'three'

/** Shared playing-card data + motion helpers (also used by higherlower). */

export type Suit = 'S' | 'H' | 'D' | 'C'

export interface PlayingCard {
  /** 1 = Ace … 11 = J, 12 = Q, 13 = K */
  rank: number
  suit: Suit
  id: string
}

export const SUITS: Suit[] = ['S', 'H', 'D', 'C']
export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const isRed = (s: Suit) => s === 'H' || s === 'D'

export function rankLabel(rank: number) {
  return rank === 1 ? 'A' : rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : String(rank)
}

export const cardLabel = (c: PlayingCard) => `${rankLabel(c.rank)}${SUIT_SYMBOL[c.suit]}`

export function fullDeck(): PlayingCard[] {
  const out: PlayingCard[] = []
  for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) out.push({ rank, suit, id: `${rank}${suit}` })
  return out
}

// ---------- motion ----------

export interface Pose {
  pos: THREE.Vector3
  quat: THREE.Quaternion
  scale: number
}

export const pose = (pos: [number, number, number], quat: THREE.Quaternion, scale = 1): Pose => ({ pos: new THREE.Vector3(...pos), quat, scale })
export const clonePose = (p: Pose): Pose => ({ pos: p.pos.clone(), quat: p.quat.clone(), scale: p.scale })

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3)
export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export function easeOutBack(x: number, s = 1.7) {
  const c3 = s + 1
  return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2)
}

const Y_AXIS = new THREE.Vector3(0, 1, 0)
const _qa = new THREE.Quaternion()
const _qf = new THREE.Quaternion()
const _ctrl = new THREE.Vector3()

/** Quaternion for a card lying on the table. faceUp shows the front; yaw spins it on the table; tilt rolls it around its long axis. */
export function tableQuat(yaw: number, faceUp: boolean, tilt = 0) {
  const q = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, yaw)
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), faceUp ? -Math.PI / 2 : Math.PI / 2))
  // Face-down: spin half a turn in-plane so the back art reads upright from the player's side.
  if (!faceUp) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI))
  if (tilt) q.multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, tilt))
  return q
}

/**
 * Writes into `out` the pose between a and b at t (0..1): arcs upward by `lift`
 * and spins `flips` half-turns around the card's long axis (1 = face-down → face-up).
 */
export function blendPose(out: Pose, a: Pose, b: Pose, t: number, lift = 1, flips = 0) {
  const e = easeInOutCubic(clamp01(t))
  _ctrl.copy(a.pos).add(b.pos).multiplyScalar(0.5)
  _ctrl.y += lift
  const u = 1 - e
  out.pos.set(
    u * u * a.pos.x + 2 * u * e * _ctrl.x + e * e * b.pos.x,
    u * u * a.pos.y + 2 * u * e * _ctrl.y + e * e * b.pos.y,
    u * u * a.pos.z + 2 * u * e * _ctrl.z + e * e * b.pos.z,
  )
  if (flips) {
    const f = easeOutBack(clamp01(t * 1.15), 1.2)
    _qa.copy(a.quat).multiply(_qf.setFromAxisAngle(Y_AXIS, -Math.PI * flips))
    out.quat.slerpQuaternions(_qa, b.quat, e).multiply(_qf.setFromAxisAngle(Y_AXIS, Math.PI * flips * (1 - f)))
  } else out.quat.slerpQuaternions(a.quat, b.quat, e)
  out.scale = a.scale + (b.scale - a.scale) * easeOutBack(clamp01(t), 1.1)
  return out
}

export function applyPose(obj: THREE.Object3D, p: Pose) {
  obj.position.copy(p.pos)
  obj.quaternion.copy(p.quat)
  obj.scale.setScalar(p.scale)
}
