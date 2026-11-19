import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { PackLockSheet, usePack } from '../../ui/PackLock'
import { Stage } from '../../three/Stage'
import { fmt, loc, useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { useApp, usePlayers } from '../../core/store'
import { pick, rand } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import { showHolidayContent } from '../../core/season'
import type { GameProps } from '../../core/types'
import { WheelScene, type FaceSlice } from './scene'
import { ACCENT, newSim, type WheelSim } from './sim'
import {
  ALL_SHORT,
  ANYONE,
  DOUBLE_ON,
  GIVE_SHORT,
  LOSER,
  MINI_CHALLENGES,
  PRESETS,
  REFUSE,
  RESPIN,
  SPICY_PACK_TITLE,
  SPIN,
  SWIPE_HINT,
  type Preset,
  type Slice,
} from './presets'

const DARE_WORD: Loc = { it: 'Penitenza', en: 'Dare', es: 'Reto', fr: 'Gage', de: 'Mutprobe' }
const MODE_ICON = { sips: '🍺', points: '⭐', dares: '😈' } as const
const FADE = 'linear-gradient(90deg, transparent 0, #000 22px, #000 calc(100% - 22px), transparent 100%)'
/** One swipeable line of preset chips: never wraps, so the turn pill below never gets pushed onto the wheel. */
const CHIP_ROW: CSSProperties = {
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 8,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollSnapType: 'x mandatory',
  scrollbarWidth: 'none',
  WebkitOverflowScrolling: 'touch',
  margin: '10px -16px 0',
  padding: '2px 22px 4px',
  maskImage: FADE,
  WebkitMaskImage: FADE,
}

interface Result {
  id: number
  slice: Slice
  desc: string
  line: string
  doubled: boolean
}

const keepsTurn = (r: Result | null) => !!r && (r.slice.kind === 'double' || r.slice.kind === 'respin')

export default function WheelGame({ onExit }: GameProps) {
  const { t, L, lang } = useT()
  const penalty = usePenalty()
  const mode = penalty.mode
  const turn = useTurn()
  const players = usePlayers()
  const spicyOn = useApp((s) => s.spicy)
  const pack = usePack('wheel-spicy')
  const spicyActive = spicyOn && pack.unlocked
  const [presetId, setPresetId] = useState('classic')
  const [showLock, setShowLock] = useState(false)

  const holiday = useMemo(() => showHolidayContent(), [])
  const available = (p: Preset) => !p.seasonal || holiday
  const visiblePresets = PRESETS.filter((p) => available(p) && (!p.spicy || spicyOn))
  const preset = PRESETS.find((p) => p.id === presetId && available(p) && (!p.spicy || spicyActive)) ?? PRESETS[0]

  const faceSlices = useMemo<FaceSlice[]>(
    () =>
      preset.slices.map((s) => {
        const n = s.n ?? 1
        if (s.kind === 'drink') {
          const label = mode === 'dares' ? loc(DARE_WORD, lang) : mode === 'sips' && n >= 5 ? 'SHOT' : `×${n}`
          return { color: s.color, icon: MODE_ICON[mode], label }
        }
        if (s.kind === 'give') return { color: s.color, icon: s.icon || '👉', label: mode === 'dares' ? loc(DARE_WORD, lang) : `${loc(GIVE_SHORT, lang)} ${n}` }
        if (s.kind === 'all') return { color: s.color, icon: '👥', label: `${loc(ALL_SHORT, lang)} ${mode === 'dares' ? '😈' : n}` }
        return { color: s.color, icon: s.icon, label: s.label ? loc(s.label, lang) : '' }
      }),
    [preset, mode, lang],
  )

  const chipRow = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  // Keep the active preset centred in the scrollable chip line.
  useEffect(() => {
    const row = chipRow.current
    const chip = chipRefs.current[preset.id]
    if (!row || !chip) return
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
    row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [preset.id])

  const sim = useRef<WheelSim>(newSim())
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [winner, setWinner] = useState(-1)
  const [fire, setFire] = useState(0)
  const [hint, setHint] = useState(true)
  const [double, setDouble] = useState(false)
  const count = useRef(0)

  const clearResult = () => {
    sim.current.winner = -1
    setWinner(-1)
    setResult(null)
  }

  const spin = (omega: number) => {
    const s = sim.current
    if (s.mode === 'spin') return
    s.omega = omega
    s.mode = 'spin'
    s.elapsed = 0
    clearResult()
    setSpinning(true)
    setHint(false)
    sfx.whoosh()
    vibrate(25)
  }
  // Prize wheels spin clockwise (negative angle).
  const spinRandom = () => spin(-rand(13, 20))

  const onGrab = () => {
    if (sim.current.mode === 'spin') return false
    if (result && !keepsTurn(result)) turn.next()
    clearResult()
    sfx.tap()
    vibrate(10)
    return true
  }
  const onRelease = (omega: number | null) => (omega === null ? spinRandom() : spin(omega))

  const onTick = (speed: number) => {
    const s = sim.current
    const now = performance.now()
    if (now - s.lastTick < 30) return
    s.lastTick = now
    sfx.tick()
    if (speed < 4) {
      sfx.click()
      vibrate(8)
    }
  }

  const onStop = (index: number) => {
    const slice = preset.slices[index]
    if (!slice) return
    const others = players.filter((p) => p.id !== turn.current.id)
    const name = others.length ? pick(others).name : L(ANYONE)
    const mult = double ? 2 : 1
    const amount = Math.min(5, (slice.n ?? 1) * mult)
    let desc = fmt(L(slice.desc), { name })
    let line = ''
    let doubled = false
    switch (slice.kind) {
      case 'drink':
        line = penalty.drink(amount)
        penalty.apply(turn.current.id, amount)
        doubled = mult > 1
        break
      case 'give':
        line = penalty.give(amount)
        doubled = mult > 1
        break
      case 'all':
        line = penalty.all(amount)
        doubled = mult > 1
        break
      case 'challenge':
        desc = fmt(L(pick(MINI_CHALLENGES)), { name })
        line = `${L(REFUSE)} ${penalty.drink(slice.n ?? 2)}`
        break
      case 'dare':
        if (slice.n) line = `${L(REFUSE)} ${penalty.drink(slice.n)}`
        break
      case 'game':
        if (slice.n) line = `${L(LOSER)} ${penalty.drink(slice.n)}`
        break
    }
    if (slice.kind === 'double') setDouble(true)
    else if (slice.kind !== 'respin') setDouble(false)
    setWinner(index)
    setFire((f) => f + 1)
    setSpinning(false)
    setResult({ id: ++count.current, slice, desc, line, doubled })
    if (slice.kind === 'safe') sfx.win()
    else if (slice.kind === 'drink' && amount >= 4) sfx.lose()
    else sfx.reveal()
    vibrate([40, 40, 90])
  }

  const choosePreset = (p: Preset) => {
    sfx.tap()
    if (p.spicy && !pack.unlocked) {
      setShowLock(true)
      return
    }
    setPresetId(p.id)
    setDouble(false)
    clearResult()
  }

  const next = () => {
    if (!keepsTurn(result)) turn.next()
    spinRandom()
  }

  return (
    <GameShell
      gameId="wheel"
      onExit={onExit}
      scene={
        <Stage
          accent={ACCENT}
          camera={{ position: [0, 3.75, 10], fov: 45 }}
          fog={[22, 50]}
          fit={{ width: 5.02, height: 5.4, center: [0, 2.55, 0], hudTop: 0.19, hudBottom: 0.375 }}
        >
          <WheelScene
            key={preset.id}
            slices={faceSlices}
            sim={sim}
            onGrab={onGrab}
            onRelease={onRelease}
            onTick={onTick}
            onStop={onStop}
            fire={fire}
            winner={winner}
          />
        </Stage>
      }
      top={
        <>
          <style>{'.wheel-chips::-webkit-scrollbar{display:none}'}</style>
          <div ref={chipRow} className="wheel-chips" style={CHIP_ROW}>
            {visiblePresets.map((p, i) => {
              const active = p.id === preset.id
              return (
                <button
                  key={p.id}
                  ref={(el) => void (chipRefs.current[p.id] = el)}
                  className={'chip big' + (active ? ' active' : '')}
                  style={{
                    flex: 'none',
                    scrollSnapAlign: 'center',
                    // auto margins centre the line when it fits, without clipping it when it overflows
                    marginLeft: i === 0 ? 'auto' : undefined,
                    marginRight: i === visiblePresets.length - 1 ? 'auto' : undefined,
                    ...(active ? { background: ACCENT, color: '#fff' } : null),
                  }}
                  disabled={spinning}
                  onClick={() => choosePreset(p)}
                >
                  {p.emoji} {L(p.name)}
                  {p.spicy && !pack.unlocked ? ' 🔒' : ''}
                </button>
              )
            })}
          </div>
          {players.length > 0 && <TurnPill player={turn.current} />}
          {double && !result?.doubled && (
            <div className="center" style={{ marginTop: 8, fontWeight: 900, color: 'var(--yellow)', textShadow: '0 0 12px rgba(255,210,61,0.6)' }}>
              {L(DOUBLE_ON)}
            </div>
          )}
        </>
      }
      bottom={
        <>
          {result && (
            <ResultCard
              animKey={result.id}
              color={result.slice.color}
              who={players.length > 0 ? `🎡 ${turn.current.name}` : undefined}
              big={
                <>
                  {faceSlices[winner]?.icon} {L(result.slice.title)}
                  {result.doubled ? ' ×2' : ''}
                </>
              }
              sub={
                <>
                  {result.desc && <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>{result.desc}</div>}
                  {result.line && <div style={{ fontSize: 21, color: 'var(--yellow)', marginTop: 8 }}>{result.line}</div>}
                </>
              }
            />
          )}
          {hint && !spinning && !result && (
            <div className="muted center" style={{ fontWeight: 800 }}>
              {L(SWIPE_HINT)}
            </div>
          )}
          <button
            className="btn block"
            style={{ background: 'linear-gradient(180deg, #a58cff, #7b5cff)', color: '#fff', boxShadow: '0 6px 0 #3f22a8, 0 12px 30px rgba(123,92,255,0.45)' }}
            disabled={spinning}
            onClick={result ? next : spinRandom}
          >
            {spinning ? '🎡 …' : keepsTurn(result) ? `🔁 ${L(RESPIN)}` : result ? `${t('next')} 👉` : `🎡 ${L(SPIN)}`}
          </button>
        </>
      }
      overlay={
        showLock && (
          <PackLockSheet
            packId="wheel-spicy"
            title={L(SPICY_PACK_TITLE)}
            onClose={() => {
              setShowLock(false)
              if (useApp.getState().isUnlocked('wheel-spicy')) {
                setPresetId('spicy')
                setDouble(false)
                clearResult()
              }
            }}
          />
        )
      }
    />
  )
}
