import { Suspense, useLayoutEffect, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { useApp } from '../core/store'

/**
 * Shared 3D stage: neon party lighting, offline environment map (no HDR downloads),
 * soft contact shadows, optional round "bar table".
 */
export function Stage({
  children,
  accent = '#ff3d8b',
  camera = { position: [0, 7, 8] as [number, number, number], fov: 42 },
  table = true,
  shadows = true,
  background = '#0b0614',
  lookAt,
  fog = [14, 30],
  fit,
}: {
  children: ReactNode
  accent?: string
  camera?: { position: [number, number, number]; fov?: number }
  /** Point the camera aims at (default: the origin). Ignored when `fit` is set. */
  lookAt?: [number, number, number]
  table?: boolean
  shadows?: boolean
  background?: string
  /** Fog [near, far] in the background colour, or false to disable. */
  fog?: [number, number] | false
  /** Auto-frame an area on any aspect ratio, between the top and bottom HUD. See `StageFit`. */
  fit?: StageFit
}) {
  const lowPower = useApp((s) => s.lowPower)
  const castShadows = shadows && !lowPower
  // Watchdog: PerformanceMonitor moves `factor` (0..1) down when frames drop and back up when they recover.
  const [perf, setPerf] = useState({ factor: 1, fallback: false })
  const maxDpr = lowPower ? 1 : Math.min(2, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
  const minDpr = Math.min(maxDpr, 0.75)
  const dpr = perf.fallback ? minDpr : Math.round((minDpr + (maxDpr - minDpr) * perf.factor) * 20) / 20

  return (
    <Canvas
      shadows={castShadows}
      dpr={dpr}
      camera={{ position: camera.position, fov: camera.fov ?? 42, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <PerformanceMonitor
        factor={1}
        step={0.25}
        flipflops={4}
        onChange={({ factor }) => setPerf((p) => (p.fallback || p.factor === factor ? p : { ...p, factor }))}
        onFallback={() => setPerf({ factor: 0, fallback: true })}
      />
      {fit ? (
        <CameraFit
          px={camera.position[0]}
          py={camera.position[1]}
          pz={camera.position[2]}
          cx={fit.center?.[0] ?? 0}
          cy={fit.center?.[1] ?? 0}
          cz={fit.center?.[2] ?? 0}
          width={fit.width}
          height={fit.height}
          hudTop={fit.hudTop ?? 0.12}
          hudBottom={fit.hudBottom ?? 0.35}
        />
      ) : (
        lookAt && <CameraTarget x={lookAt[0]} y={lookAt[1]} z={lookAt[2]} />
      )}
      <color attach="background" args={[background]} />
      {fog && <fog attach="fog" args={[background, fog[0], fog[1]]} />}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 10, 5]}
        intensity={1.6}
        castShadow={castShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[-5, 3, -3]} intensity={40} color={accent} distance={18} />
      <pointLight position={[5, 2, 3]} intensity={25} color="#3dd6ff" distance={16} />
      <Environment resolution={lowPower ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={1.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="ring" intensity={4} color={accent} position={[-6, 2, -4]} scale={4} />
        <Lightformer form="rect" intensity={2.5} color="#3dd6ff" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#7b5cff" position={[0, 1, 8]} scale={[10, 2, 1]} />
      </Environment>
      <Suspense fallback={null}>{children}</Suspense>
      {table && <BarTable accent={accent} />}
      {castShadows && <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={14} blur={2.4} far={4} resolution={512} />}
    </Canvas>
  )
}

function CameraTarget({ x, y, z }: { x: number; y: number; z: number }) {
  const camera = useThree((s) => s.camera)
  useLayoutEffect(() => {
    camera.lookAt(x, y, z)
    camera.updateMatrixWorld()
  }, [camera, x, y, z])
  return null
}

export interface StageFit {
  /** Width of the area to keep in frame (world units, across the screen). */
  width: number
  /** Height of the area as seen by the camera (world units, up the screen). */
  height: number
  /** Centre of the area (default: the origin). */
  center?: [number, number, number]
  /** Fraction of the screen height covered by the bottom HUD (default 0.35). */
  hudBottom?: number
  /** Fraction of the screen height covered by the top bar / chips (default 0.12). */
  hudTop?: number
}

/**
 * Keeps the viewing direction given by `camera.position` (relative to the centre) but picks the
 * distance and aim so the area fits between the HUDs on any aspect ratio.
 */
function CameraFit({
  px,
  py,
  pz,
  cx,
  cy,
  cz,
  width,
  height,
  hudTop,
  hudBottom,
}: {
  px: number
  py: number
  pz: number
  cx: number
  cy: number
  cz: number
  width: number
  height: number
  hudTop: number
  hudBottom: number
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  useLayoutEffect(() => {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const aspect = size.width / Math.max(1, size.height)
    // In half-screen-height units: usable band and how far its middle sits above screen centre.
    const band = Math.max(0.2, 1 - hudTop - hudBottom)
    const shift = hudBottom - hudTop
    const d = Math.max(width / 2 / (tan * aspect), height / 2 / (tan * band))
    const center = new THREE.Vector3(cx, cy, cz)
    const dir = new THREE.Vector3(px, py, pz).sub(center).normalize()
    if (dir.lengthSq() === 0) dir.set(0, 0, 1)
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(dir, -dir.y)
    if (up.lengthSq() < 1e-6) up.set(0, 0, -1)
    up.normalize()
    const look = center.addScaledVector(up, -shift * d * tan)
    camera.position.copy(look).addScaledVector(dir, d)
    camera.lookAt(look)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  }, [camera, size, px, py, pz, cx, cy, cz, width, height, hudTop, hudBottom])
  return null
}

/** Round felt table with a glowing neon rim. Top surface sits at y = 0. */
export function BarTable({ accent = '#ff3d8b', radius = 5.2 }: { accent?: string; radius?: number }) {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.5, 64]} />
        <meshStandardMaterial color="#1b0f2e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[radius - 0.25, 64]} />
        <meshStandardMaterial color="#160b2a" roughness={0.95} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[radius - 0.25, radius - 0.12, 96]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -6, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#07030d" roughness={1} />
      </mesh>
    </group>
  )
}
