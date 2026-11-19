import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Additive spark burst. Change `trigger` (non-zero) to fire it again. */
export function Sparks({
  trigger,
  position = [0, 0, 0],
  colors = ['#ffffff'],
  count = 40,
  speed = 3.2,
  size = 0.05,
  gravity = 5,
}: {
  trigger: number
  position?: [number, number, number] | THREE.Vector3
  colors?: string[]
  count?: number
  speed?: number
  size?: number
  gravity?: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(() => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, max: 1 })), [count])
  const palette = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors])
  const last = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    if (trigger !== last.current) {
      last.current = trigger
      if (trigger)
        parts.forEach((d, i) => {
          d.p.set(0, 0, 0)
          d.v.set(Math.random() * 2 - 1, Math.random() * 1.6 - 0.3, Math.random() * 2 - 1).normalize().multiplyScalar(speed * (0.35 + Math.random() * 0.75))
          d.life = d.max = 0.5 + Math.random() * 0.7
          m.setColorAt(i, palette[i % palette.length])
        })
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    let alive = false
    parts.forEach((d, i) => {
      if (d.life > 0) {
        d.life -= dt
        d.v.y -= gravity * dt
        d.v.multiplyScalar(1 - 1.2 * dt)
        d.p.addScaledVector(d.v, dt)
        alive = true
      }
      dummy.position.copy(d.p)
      dummy.scale.setScalar(d.life > 0 ? size * (0.3 + 0.7 * (d.life / d.max)) : 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.visible = alive
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} position={position} frustumCulled={false} visible={false}>
      <sphereGeometry args={[1, 8, 6]} />
      <meshBasicMaterial toneMapped={false} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}
