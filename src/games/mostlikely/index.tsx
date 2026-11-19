import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { PackLockSheet } from '../../ui/PackLock'
import { Stage } from '../../three/Stage'
import { DISPLAY_FONT, canvasTexture, fitText } from '../../three/textures'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { createDeck } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { Player } from '../../core/store'
import type { GameProps } from '../../core/types'
import { CARD_CAMERA, PromptCard3D } from '../../three/PromptCard3D'
import { PACKS, STAR_FALLBACK, loc5, packTitle, usePackGate, useSpicy, useUnlocked, withStar } from '../../core/kit'
import { Chip, ChipRow, StarPickerSheet } from '../../ui/GameChips'
import { ML_PROMPTS, type MostLikelyPrompt } from './prompts'
import { ML_BACHELOR, ML_OFFICE } from './packs'

const ACCENT = '#ff3df0'
const SPICY_ACCENT = '#ff5c5c'
const PACK = 'mostlikely-spicy'
const STEP_MS = 750

type Phase = 'read' | 'count' | 'vote' | 'result'
type Mode = 'classic' | 'party-bachelor' | 'office'

const MODES: Mode[] = ['classic', 'party-bachelor', 'office']
const CLASSIC: Loc = { it: 'Classico', en: 'Classic', es: 'Clásico', fr: 'Classique', de: 'Klassisch' }
const PACK_POOLS: Record<Exclude<Mode, 'classic'>, MostLikelyPrompt[]> = {
  'party-bachelor': ML_BACHELOR.map((t) => ({ text: loc5(t) })),
  office: ML_OFFICE.map((t) => ({ text: loc5(t) })),
}

const HEADER: Loc = {
  it: 'Chi è più probabile che…',
  en: 'Who’s most likely to…',
  es: '¿Quién tiene más probabilidades de…',
  fr: 'Qui est le plus susceptible de…',
  de: 'Wer würde am ehesten…',
}
const CARD_FOOTER: Loc = {
  it: 'Al 3 tutti indicano qualcuno 👉',
  en: 'On 3, everyone points at someone 👉',
  es: 'A la de 3, todos señalan a alguien 👉',
  fr: 'À 3, tout le monde pointe quelqu’un 👉',
  de: 'Auf 3 zeigen alle auf jemanden 👉',
}
const START: Loc = { it: '3, 2, 1… puntate! 👉', en: '3, 2, 1… point! 👉', es: '3, 2, 1… ¡señalad! 👉', fr: '3, 2, 1… pointez ! 👉', de: '3, 2, 1… zeigen! 👉' }
const POINT_NOW: Loc = { it: 'Puntate!', en: 'Point!', es: '¡Señalad!', fr: 'Pointez !', de: 'Zeigen!' }
const WHO_MOST: Loc = {
  it: 'Chi ha preso più dita?',
  en: 'Who got the most fingers?',
  es: '¿Quién ha recibido más dedos?',
  fr: 'Qui a reçu le plus de doigts ?',
  de: 'Wer hat die meisten Finger?',
}
const TIE: Loc = { it: '🤝 Pareggio', en: '🤝 It’s a tie', es: '🤝 Empate', fr: '🤝 Égalité', de: '🤝 Unentschieden' }
const TIE_BIG: Loc = { it: 'Pareggio!', en: 'It’s a tie!', es: '¡Empate!', fr: 'Égalité !', de: 'Unentschieden!' }
const TIE_WHO: Loc = {
  it: 'I più indicati, entrambi:',
  en: 'Both top picks:',
  es: 'Los más señalados, los dos:',
  fr: 'Les plus désignés, tous les deux :',
  de: 'Die Meistgezeigten, beide:',
}
const READS: Loc = { it: 'Legge', en: 'Reader:', es: 'Lee', fr: 'Lecteur :', de: 'Es liest' }
const NEXT_CARD: Loc = { it: 'Prossima domanda 👉', en: 'Next question 👉', es: 'Siguiente pregunta 👉', fr: 'Question suivante 👉', de: 'Nächste Frage 👉' }

const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2)

/** Huge neon countdown numbers that pop in front of the card. */
function Countdown3D({ label, hold }: { label: string | null; hold: boolean }) {
  const tex = useMemo(
    () =>
      label === null
        ? null
        : canvasTexture(512, 512, (ctx, w, h) => {
            ctx.shadowColor = ACCENT
            ctx.shadowBlur = 40
            fitText(ctx, label, w / 2, h / 2, w - 40, h - 60, { font: DISPLAY_FONT, weight: '400', maxSize: label.length <= 2 ? 380 : 150, minSize: 40, color: '#fff' })
          }),
    [label],
  )
  useEffect(() => () => tex?.dispose(), [tex])
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const st = useRef({ label, t: 0 })

  useFrame((_, dt) => {
    const s = st.current
    if (s.label !== label) {
      s.label = label
      s.t = 0
    }
    s.t += Math.min(dt, 1 / 20)
    if (!mesh.current || !mat.current) return
    const k = easeOutBack(Math.min(s.t / 0.3, 1))
    const sc = Math.max(0.001, k * (1 + s.t * 0.12))
    mesh.current.scale.setScalar(sc)
    mesh.current.rotation.z = (1 - Math.min(s.t / 0.3, 1)) * 0.5
    mat.current.opacity = hold ? 1 : 1 - THREE.MathUtils.clamp((s.t - 0.5) / 0.25, 0, 1)
  })

  if (!tex) return null
  return (
    <mesh ref={mesh} position={[0, 1.85, 2.6]}>
      <planeGeometry args={[1.6, 1.6]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

interface Card {
  id: number
  prompt: MostLikelyPrompt
}

interface Result {
  id: number
  player?: Player
  penalty: string
}

export default function MostLikelyGame({ onExit }: GameProps) {
  const { t, L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const spicy = useSpicy(PACK)
  const gate = usePackGate()
  const isUnlocked = useUnlocked()
  const [mode, setMode] = useState<Mode>('classic')
  const [starId, setStarId] = useState<string | null>(null)
  const [pickStar, setPickStar] = useState(false)
  const [phase, setPhase] = useState<Phase>('read')
  const [count, setCount] = useState(3)
  const [result, setResult] = useState<Result | null>(null)
  const deck = useRef<{ key: string; deck: ReturnType<typeof createDeck<MostLikelyPrompt>> } | null>(null)
  const nextId = useRef(0)

  const deal = (m: Mode = mode): Card => {
    const key = `${m}|${spicy.active}`
    if (deck.current?.key !== key)
      deck.current = { key, deck: createDeck(m === 'classic' ? ML_PROMPTS.filter((p) => spicy.active || !p.spicy) : PACK_POOLS[m]) }
    return { id: ++nextId.current, prompt: deck.current.deck.draw() }
  }
  const [card, setCard] = useState<Card>(() => deal('classic'))

  const next = (m: Mode = mode) => {
    sfx.flip()
    vibrate(20)
    turn.next()
    setResult(null)
    setPhase('read')
    setCard(deal(m))
  }

  const select = (m: Mode) => {
    setMode(m)
    next(m)
    if (m === 'party-bachelor' && !starId) setPickStar(true)
  }

  const choose = (m: Mode) => {
    sfx.tap()
    if (m === 'classic') select(m)
    else gate.request(m, () => select(m))
  }

  const star = turn.players.find((p) => p.id === starId)
  const starName = star?.name ?? L(STAR_FALLBACK)

  const startCount = () => {
    if (phase !== 'read') return
    sfx.whoosh()
    setCount(3)
    setPhase('count')
  }

  useEffect(() => {
    if (phase !== 'count') return
    if (count > 0) {
      sfx.tick()
      vibrate(25)
      const id = setTimeout(() => setCount((c) => c - 1), STEP_MS)
      return () => clearTimeout(id)
    }
    sfx.horn()
    vibrate([60, 40, 60])
    const id = setTimeout(() => setPhase('vote'), 1000)
    return () => clearTimeout(id)
  }, [phase, count])

  const vote = (p: Player) => {
    penalty.apply(p.id, 2)
    sfx.reveal()
    vibrate([40, 40, 80])
    setResult({ id: card.id, player: p, penalty: penalty.drink(2) })
    setPhase('result')
  }

  const tie = () => {
    sfx.reveal()
    vibrate([40, 40, 80])
    setResult({ id: card.id, penalty: penalty.drink(1) })
    setPhase('result')
  }

  const big: CSSProperties = { minHeight: 52, fontSize: 19 }
  const cols = turn.players.length > 6 ? 3 : 2

  return (
    <GameShell
      gameId="mostlikely"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={CARD_CAMERA}>
          <PromptCard3D
            cardKey={card.id}
            accent={card.prompt.spicy ? SPICY_ACCENT : ACCENT}
            header={L(HEADER)}
            text={withStar(L(card.prompt.text), starName)}
            footer={L(CARD_FOOTER)}
            badge={card.prompt.spicy ? '🌶️' : mode === 'classic' ? undefined : PACKS[mode].emoji}
            backEmoji="👉"
            compact={phase === 'vote' || phase === 'result'}
            onTap={phase === 'read' || phase === 'result' ? () => next() : undefined}
          />
          {phase === 'count' && <Countdown3D label={count > 0 ? String(count) : L(POINT_NOW)} hold={count === 0} />}
        </Stage>
      }
      top={
        <>
          <ChipRow>
            {MODES.map((m) => (
              <Chip key={m} accent={ACCENT} active={mode === m} locked={m !== 'classic' && !isUnlocked(m)} onClick={() => choose(m)}>
                {m === 'classic' ? `🎲 ${L(CLASSIC)}` : `${PACKS[m].emoji} ${L(PACKS[m].chip)}`}
              </Chip>
            ))}
            {mode === 'party-bachelor' && (
              <Chip accent={ACCENT} onClick={() => setPickStar(true)}>
                ⭐ {star?.name ?? '?'}
              </Chip>
            )}
            {mode === 'classic' && spicy.enabled && !spicy.unlocked && (
              <Chip accent={ACCENT} locked onClick={() => gate.request(PACK, () => undefined)}>
                🌶️
              </Chip>
            )}
          </ChipRow>
          <TurnPill player={turn.current} label={L(READS)} />
        </>
      }
      bottom={
        <>
          {phase === 'vote' && (
            <>
              <div className="result" style={{ padding: 14 }}>
                <div className="who" style={{ fontSize: 17, color: 'var(--text)' }}>
                  {L(WHO_MOST)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8, marginTop: 6 }}>
                  {turn.players.map((p) => (
                    <button
                      key={p.id}
                      className="btn secondary small"
                      style={{ ...big, padding: '0 8px', color: p.color, border: `2px solid ${p.color}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onClick={() => vote(p)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn block yellow" onClick={tie}>
                {L(TIE)}
              </button>
            </>
          )}
          {phase === 'result' && result && (
            <ResultCard
              animKey={result.id}
              color={result.player?.color}
              big={result.player ? `👉 ${result.player.name}` : L(TIE_BIG)}
              sub={
                <>
                  {!result.player && <div className="muted">{L(TIE_WHO)}</div>}
                  <div style={{ fontSize: 22, color: 'var(--yellow)' }}>{result.penalty}</div>
                </>
              }
            />
          )}
          {phase === 'result' && (
            <button className="btn block" onClick={() => next()}>
              {L(NEXT_CARD)}
            </button>
          )}
          {(phase === 'read' || phase === 'count') && (
            <button className="btn block" disabled={phase === 'count'} onClick={startCount}>
              {phase === 'count' ? (count > 0 ? `${count}…` : `${L(POINT_NOW)} 👉`) : L(START)}
            </button>
          )}
          {phase === 'read' && (
            <button className="btn block secondary small" onClick={() => next()}>
              {t('next')} ⏭
            </button>
          )}
        </>
      }
      overlay={
        <>
          {gate.locked && <PackLockSheet packId={gate.locked} title={L(packTitle(gate.locked))} onClose={gate.close} />}
          {pickStar && (
            <StarPickerSheet
              players={turn.players}
              current={starId ?? undefined}
              onPick={(id) => {
                setStarId(id)
                setPickStar(false)
              }}
              onClose={() => setPickStar(false)}
            />
          )}
        </>
      }
    />
  )
}
