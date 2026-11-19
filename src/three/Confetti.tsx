import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const TAU = Math.PI * 2
const rand = (min: number, max: number) => Math.random() * (max - min) + min

/**
 * Instanced confetti burst (one draw call). Bursts every time `fire` changes to a new non-zero value,
 * e.g. `fire={count}` with `setCount((c) => c + 1)` on a win.
 */
export function Confetti({
  fire,
  origin = [0, 1, 0],
  colors = ['#ff3d8b', '#ffd23d', '#3dd6ff', '#3dff8b', '#ffffff'],
  count = 80,
  floor = 0.03,
  power = 1,
  /** Bias the sideways spread toward the camera (+z) instead of all around. */
  forward = false,
}: {
  fire: number
  origin?: [number, number, number] | THREE.Vector3
  colors?: readonly string[]
  count?: number
  /** Height where pieces land and stop. */
  floor?: number
  /** Scales launch speed. */
  power?: number
  forward?: boolean
}) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(
    () => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 })),
    [count],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  // Latest burst settings without re-triggering the burst when they change identity.
  const settings = useRef({ origin, colors, power, forward })
  settings.current = { origin, colors, power, forward }

  // Create instanceColor before the first render so the shader compiles with per-instance colours.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const c = new THREE.Color('#ffffff')
    for (let i = 0; i < count; i++) m.setColorAt(i, c)
  }, [count])

  useEffect(() => {
    const m = mesh.current
    if (!fire || !m) return
    const { origin: o, colors: cols, power: pw, forward: fwd } = settings.current
    const c = new THREE.Color()
    parts.forEach((q, i) => {
      if (Array.isArray(o)) q.p.set(o[0], o[1], o[2])
      else q.p.copy(o as THREE.Vector3)
      const a = rand(0, TAU)
      const sp = rand(1.2, 3.6) * pw
      q.v.set(Math.cos(a) * sp, rand(3, 6.5) * pw, fwd ? Math.abs(Math.sin(a)) * sp * 0.8 + 0.5 : Math.sin(a) * sp)
      q.r.set(rand(0, TAU), rand(0, TAU), rand(0, TAU))
      q.w.set(rand(-14, 14), rand(-14, 14), rand(-14, 14))
      q.life = rand(1.5, 2.7)
      m.setColorAt(i, c.set(cols[i % cols.length]))
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [fire, parts])

  useFrame((_, raw) => {
    const dt = Math.min(raw, 1 / 30)
    const m = mesh.current
    if (!m) return
    parts.forEach((q, i) => {
      if (q.life > 0) {
        q.life -= dt
        q.v.y -= 8.5 * dt
        q.v.multiplyScalar(1 - 1.4 * dt)
        q.p.addScaledVector(q.v, dt)
        if (q.p.y < floor) {
          q.p.y = floor
          q.v.set(0, 0, 0)
          q.w.multiplyScalar(0.85)
        }
        q.r.x += q.w.x * dt
        q.r.y += q.w.y * dt
        q.r.z += q.w.z * dt
      }
      dummy.position.copy(q.p)
      dummy.rotation.copy(q.r)
      dummy.scale.setScalar(q.life > 0 ? Math.min(1, q.life * 2) : 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh key={count} ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[0.075, 0.125]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}
