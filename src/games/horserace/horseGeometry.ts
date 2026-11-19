import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

type V3 = [number, number, number]

const M = (p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s))

/** Bakes `frame * local` into the geometry. */
const at = (g: THREE.BufferGeometry, local: THREE.Matrix4, frame?: THREE.Matrix4) => g.applyMatrix4(frame ? frame.clone().multiply(local) : local)

const BASE_ATTRS = ['position', 'normal', 'uv']

/** Brings geometries to one shape mergeGeometries accepts: all non-indexed, identical attribute sets. */
function normalize(parts: THREE.BufferGeometry[]) {
  const withColor = parts.some((p) => p.getAttribute('color'))
  const keep = withColor ? [...BASE_ATTRS, 'color'] : BASE_ATTRS
  return parts.map((src) => {
    const g = src.index ? src.toNonIndexed() : src
    if (g !== src) src.dispose()
    const n = g.getAttribute('position').count
    if (!g.getAttribute('normal')) g.computeVertexNormals()
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2))
    if (withColor && !g.getAttribute('color')) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3))
    for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name)
    g.morphAttributes = {}
    g.clearGroups()
    return g
  })
}

/**
 * Merges same-material parts into one geometry. Never throws: if merging fails for any reason
 * the (normalized) parts come back unmerged and are simply drawn as separate meshes.
 */
function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry[] {
  const norm = normalize(parts)
  if (norm.length === 1) return norm
  try {
    const g = mergeGeometries(norm)
    if (g) {
      norm.forEach((p) => p.dispose())
      return [g]
    }
  } catch {
    /* fall through to unmerged */
  }
  console.warn('[horserace] geometry merge failed, drawing parts separately')
  return norm
}

const tint = (g: THREE.BufferGeometry, hex: string) => {
  const c = new THREE.Color(hex)
  const n = g.getAttribute('position').count
  const arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) c.toArray(arr, i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}

function build() {
  // Frames of the (animated) groups the static parts hang from, relative to their parent group.
  const head = M([0, 0.42, 0.02], [-0.12, 0, 0])
  const jTorso = M([0, 0.03, -0.02], [0.85, 0, 0])
  const jHead = jTorso.clone().multiply(M([0, 0.27, 0.03], [-0.6, 0, 0]))

  return {
    torso: {
      coat: [at(new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), M([0, 0, 0], [Math.PI / 2, 0, 0], [0.9, 1, 1]))],
      bib: merge([
        at(new THREE.PlaneGeometry(0.3, 0.19), M([0.183, 0, -0.02], [0, Math.PI / 2, 0])),
        at(new THREE.PlaneGeometry(0.3, 0.19), M([-0.183, 0, -0.02], [0, -Math.PI / 2, 0])),
      ]),
      silk: [at(new THREE.BoxGeometry(0.3, 0.03, 0.32), M([0, 0.175, -0.02]))],
    },
    neck: {
      coat: merge([
        at(new THREE.CylinderGeometry(0.085, 0.13, 0.44, 12), M([0, 0.2, 0])),
        at(new RoundedBoxGeometry(0.16, 0.17, 0.34, 3, 0.06), M([0, 0, 0.1]), head),
        at(new THREE.ConeGeometry(0.03, 0.1, 6), M([0.05, 0.12, -0.03], [-0.2, 0, 0]), head),
        at(new THREE.ConeGeometry(0.03, 0.1, 6), M([-0.05, 0.12, -0.03], [-0.2, 0, 0]), head),
      ]),
      mane: merge([
        at(new THREE.BoxGeometry(0.04, 0.42, 0.07), M([0, 0.22, -0.095])),
        at(new RoundedBoxGeometry(0.13, 0.13, 0.12, 3, 0.05), M([0, -0.02, 0.25]), head),
        at(new THREE.BoxGeometry(0.05, 0.05, 0.08), M([0, 0.09, 0.04]), head),
      ]),
      eye: merge([
        at(new THREE.SphereGeometry(0.024, 10, 10), M([0.082, 0.04, 0.05]), head),
        at(new THREE.SphereGeometry(0.024, 10, 10), M([-0.082, 0.04, 0.05]), head),
      ]),
      silk: [at(new THREE.BoxGeometry(0.175, 0.025, 0.025), M([0, 0, 0.17]), head)],
    },
    tail: [at(new THREE.CapsuleGeometry(0.045, 0.26, 4, 8), M([0, -0.17, 0]))],
    upperLeg: [
      [at(new THREE.CylinderGeometry(0.06, 0.042, 0.32, 10), M([0, -0.16, 0]))],
      [at(new THREE.CylinderGeometry(0.085, 0.042, 0.32, 10), M([0, -0.16, 0]))],
    ],
    lowerLeg: [at(new THREE.CylinderGeometry(0.034, 0.03, 0.26, 8), M([0, -0.13, 0]))],
    /** White sock + dark hoof in one mesh, colored per vertex. */
    hoof: merge([
      tint(at(new THREE.CylinderGeometry(0.036, 0.036, 0.06, 8), M([0, -0.21, 0])), '#f4f0ea'),
      tint(at(new THREE.CylinderGeometry(0.036, 0.046, 0.07, 10), M([0, -0.27, 0.01])), '#141018'),
    ]),
    jockey: {
      leather: [new THREE.BoxGeometry(0.2, 0.04, 0.2)],
      white: merge([1, -1].map((s) => at(new THREE.CapsuleGeometry(0.038, 0.11, 4, 8), M([s * 0.13, 0.02, 0.06], [1.25, 0, 0])))),
      boot: merge([1, -1].map((s) => at(new THREE.CapsuleGeometry(0.032, 0.1, 4, 8), M([s * 0.15, -0.06, 0.09], [-0.3, 0, 0])))),
      silk: merge([
        at(new THREE.CapsuleGeometry(0.085, 0.13, 6, 12), M([0, 0.12, 0]), jTorso),
        at(new THREE.SphereGeometry(0.066, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), M([0, 0.012, -0.004]), jHead),
        at(new THREE.BoxGeometry(0.1, 0.012, 0.05), M([0, 0.012, 0.06], [0.2, 0, 0]), jHead),
      ]),
      bib: [at(new THREE.PlaneGeometry(0.13, 0.08), M([0, 0.13, -0.087], [0, Math.PI, 0]), jTorso)],
      skin: [at(new THREE.SphereGeometry(0.058, 14, 12), M(), jHead)],
    },
    /** Arms live in their own animated group (inside the jockey torso frame). */
    arms: merge([1, -1].map((s) => at(new THREE.CapsuleGeometry(0.028, 0.12, 4, 8), M([s * 0.1, 0, 0.07], [1.3, 0, 0])))),
    jockeyTorsoFrame: { position: [0, 0.03, -0.02] as V3, rotationX: 0.85 },
  }
}

let cache: ReturnType<typeof build> | null = null
/** Merged horse + jockey geometry, built once and shared by all four horses. */
export function horseGeometry() {
  cache ??= build()
  return cache
}
