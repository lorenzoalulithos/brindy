import { isNativePlatform } from './native'
import { useApp } from './store'

let ctx: AudioContext | null = null
function audio(): AudioContext | null {
  if (!useApp.getState().sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, slideTo?: number, delay = 0) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur: number, gain = 0.3, lowpass = 1200, delay = 0) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + delay
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = lowpass
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(a.destination)
  src.start(t0)
}

/** Tiny synthesized sound kit: no audio files, works offline. */
export const sfx = {
  tap: () => tone(660, 0.06, 'triangle', 0.12),
  click: () => tone(1200, 0.03, 'square', 0.05),
  tick: () => tone(1800, 0.02, 'square', 0.04),
  whoosh: () => noise(0.35, 0.18, 2500),
  thud: () => {
    tone(120, 0.15, 'sine', 0.3, 50)
    noise(0.08, 0.2, 600)
  },
  flip: () => noise(0.12, 0.15, 4000),
  reveal: () => {
    tone(523, 0.12, 'triangle', 0.12)
    tone(784, 0.2, 'triangle', 0.12, undefined, 0.1)
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, undefined, i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.08, undefined, i * 0.15)),
  boom: () => {
    noise(1.2, 0.6, 400)
    tone(80, 0.8, 'sine', 0.5, 30)
  },
  horn: () => tone(220, 0.5, 'sawtooth', 0.12, 330),
  drumroll: (seconds = 1.5) => {
    for (let t = 0; t < seconds; t += 0.05) noise(0.04, 0.12 + (t / seconds) * 0.1, 900, t)
  },
  /** Four-beat hoof clip-clop. */
  gallop: () =>
    [0, 0.08, 0.19, 0.27].forEach((d, i) => {
      tone(i % 2 ? 260 : 340, 0.05, 'triangle', 0.09, 120, d)
      noise(0.03, 0.1, 1800, d)
    }),
  /** Camera shutter: click, whirr, clack. */
  shutter: () => {
    noise(0.025, 0.35, 7000)
    tone(2600, 0.02, 'square', 0.04)
    noise(0.05, 0.25, 3200, 0.08)
  },
  /** Crowd swell: filtered noise rising and falling, with random whoops. */
  cheer: (seconds = 1.6) => {
    for (let t = 0; t < seconds; t += 0.1) {
      const env = Math.sin((t / seconds) * Math.PI)
      noise(0.35, 0.05 + env * 0.12, 1400 + env * 800, t)
      if (Math.random() < 0.45) {
        const f = 500 + Math.random() * 500
        tone(f, 0.2 + Math.random() * 0.2, 'sine', 0.025 + env * 0.03, f * (1.2 + Math.random() * 0.5), t)
      }
    }
  },
  /** Short burning-fuse hiss with crackles. */
  fuse: (seconds = 0.5) => {
    noise(seconds, 0.12, 8000)
    for (let t = 0; t < seconds; t += 0.06) tone(2800 + Math.random() * 2200, 0.012, 'square', 0.025, undefined, t + Math.random() * 0.03)
  },
}

/** Maps one vibration pulse to the closest native haptic: short taps become impacts, long buzzes real vibration. */
let haptics: Promise<typeof import('@capacitor/haptics')> | null = null
async function nativePulse(ms: number): Promise<void> {
  // Loaded on first use, native only: keeps @capacitor/* out of the web entry chunk.
  haptics ??= import('@capacitor/haptics')
  const { Haptics, ImpactStyle } = await haptics
  if (ms <= 25) return Haptics.impact({ style: ImpactStyle.Light })
  if (ms <= 60) return Haptics.impact({ style: ImpactStyle.Medium })
  if (ms <= 120) return Haptics.impact({ style: ImpactStyle.Heavy })
  return Haptics.vibrate({ duration: ms })
}

/** Same signature as navigator.vibrate: a duration or an on/off/on… pattern in ms. Uses native haptics inside the app. */
export function vibrate(pattern: number | number[]) {
  if (!useApp.getState().vibration) return
  if (isNativePlatform()) {
    let t = 0
    ;(Array.isArray(pattern) ? pattern : [pattern]).forEach((ms, i) => {
      if (i % 2 === 0 && ms > 0) setTimeout(() => void nativePulse(ms).catch(() => {}), t)
      t += ms
    })
    return
  }
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}
