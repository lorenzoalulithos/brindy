import { useRef, useState, type CSSProperties } from 'react'
import { GameShell, ResultCard, TurnPill } from '../../ui/GameShell'
import { PackLockSheet } from '../../ui/PackLock'
import { Stage } from '../../three/Stage'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { useTurn } from '../../core/useTurn'
import { createDeck } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { CARD_CAMERA, PromptCard3D } from '../../three/PromptCard3D'
import { PACKS, STAR_FALLBACK, loc5, packTitle, usePackGate, useSpicy, useUnlocked, withStar, type T5 } from '../../core/kit'
import { Chip, ChipRow, StarPickerSheet } from '../../ui/GameChips'
import { DARES_ALL, TRUTHS_ALL, type TDPrompt } from './prompts'
import { TD_BACHELOR_DARES, TD_COUPLES_DARES, TD_COUPLES_TRUTHS } from './packs'

const ACCENT = '#ff5c5c'
const TRUTH_ACCENT = '#3dd6ff'
const PACK = 'truthdare-spicy'

type Kind = 'truth' | 'dare'
type Mode = 'classic' | 'couples' | 'party-bachelor'

const MODES: Mode[] = ['classic', 'couples', 'party-bachelor']
const CLASSIC: Loc = { it: 'Classico', en: 'Classic', es: 'Clásico', fr: 'Classique', de: 'Klassisch' }
const plain = (list: T5[]): TDPrompt[] => list.map((t) => ({ text: loc5(t) }))
const COUPLES_TRUTHS = plain(TD_COUPLES_TRUTHS)
const COUPLES_DARES = plain(TD_COUPLES_DARES)
const BACHELOR_DARES = plain(TD_BACHELOR_DARES)

const TRUTH: Loc = { it: 'Verità', en: 'Truth', es: 'Verdad', fr: 'Vérité', de: 'Wahrheit' }
const DARE: Loc = { it: 'Obbligo', en: 'Dare', es: 'Reto', fr: 'Action', de: 'Pflicht' }
const DONE: Loc = { it: 'Fatto ✅', en: 'Done ✅', es: 'Hecho ✅', fr: 'Fait ✅', de: 'Erledigt ✅' }
const REFUSE: Loc = { it: 'Rifiuto 🙅', en: 'Refuse 🙅', es: 'Me niego 🙅', fr: 'Je refuse 🙅', de: 'Ablehnen 🙅' }
const REFUSED: Loc = { it: 'si è rifiutato!', en: 'chickened out!', es: '¡se ha rajado!', fr: 's’est dégonflé !', de: 'hat gekniffen!' }
const PICK: Loc = { it: 'Scegli: verità o obbligo?', en: 'Pick: truth or dare?', es: 'Elige: ¿verdad o reto?', fr: 'Choisis : action ou vérité ?', de: 'Wähl: Wahrheit oder Pflicht?' }

/**
 * Hen/stag mode keeps the classic truths and draws dares about the star; the star themselves
 * gets classic dares (`selfDare`) since the pack dares are all aimed at them.
 */
const decks = (mode: Mode, spicy: boolean) => {
  const classicTruths = TRUTHS_ALL.filter((p) => spicy || !p.spicy)
  const classicDares = DARES_ALL.filter((p) => spicy || !p.spicy)
  return {
    key: `${mode}|${spicy}`,
    truth: createDeck(mode === 'couples' ? COUPLES_TRUTHS : classicTruths),
    dare: createDeck(mode === 'couples' ? COUPLES_DARES : mode === 'party-bachelor' ? BACHELOR_DARES : classicDares),
    selfDare: createDeck(classicDares),
  }
}

interface Card {
  id: number
  kind: Kind
  prompt: TDPrompt
  /** Frozen refusal penalty (in "dares" mode drink() picks a random dare each call). */
  refuse: string
}

export default function TruthDareGame({ onExit }: GameProps) {
  const { L } = useT()
  const penalty = usePenalty()
  const turn = useTurn()
  const spicy = useSpicy(PACK)
  const gate = usePackGate()
  const isUnlocked = useUnlocked()
  const [mode, setMode] = useState<Mode>('classic')
  const [starId, setStarId] = useState<string | null>(null)
  const [pickStar, setPickStar] = useState(false)
  const [card, setCard] = useState<Card | null>(null)
  const [refusal, setRefusal] = useState<{ id: number; name: string; color: string; text: string } | null>(null)
  const deck = useRef<ReturnType<typeof decks> | null>(null)
  const nextId = useRef(0)

  const choose = (kind: Kind) => {
    const key = `${mode}|${spicy.active}`
    if (deck.current?.key !== key) deck.current = decks(mode, spicy.active)
    sfx.flip()
    vibrate(25)
    setRefusal(null)
    const fromSelf = kind === 'dare' && mode === 'party-bachelor' && turn.current.id === starId
    setCard({ id: ++nextId.current, kind, prompt: deck.current[fromSelf ? 'selfDare' : kind].draw(), refuse: penalty.drink(2) })
  }

  const selectMode = (m: Mode) => {
    setMode(m)
    setCard(null)
    setRefusal(null)
    if (m === 'party-bachelor' && !starId) setPickStar(true)
  }

  const chooseMode = (m: Mode) => {
    sfx.tap()
    if (m === 'classic') selectMode(m)
    else gate.request(m, () => selectMode(m))
  }

  const star = turn.players.find((p) => p.id === starId)
  const starName = star?.name ?? L(STAR_FALLBACK)

  const done = () => {
    if (!card) return
    sfx.win()
    vibrate(30)
    setCard(null)
    turn.next()
  }

  const refuse = () => {
    if (!card) return
    sfx.lose()
    vibrate([60, 40, 120])
    penalty.apply(turn.current.id, 2)
    setRefusal({ id: card.id, name: turn.current.name, color: turn.current.color, text: card.refuse })
    setCard(null)
    turn.next()
  }

  const huge: CSSProperties = { minHeight: 96, fontSize: 26, padding: '0 10px' }
  const red: CSSProperties = { background: 'linear-gradient(180deg, #ff8f8f, #ff5c5c)', boxShadow: '0 6px 0 #a32626, 0 12px 30px rgba(255, 92, 92, 0.45)' }
  const kind = card?.kind ?? 'truth'

  return (
    <GameShell
      gameId="truthdare"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={CARD_CAMERA}>
          <PromptCard3D
            cardKey={card?.id ?? 0}
            faceDown={!card}
            accent={card?.prompt.spicy ? '#ff3d8b' : kind === 'truth' ? TRUTH_ACCENT : ACCENT}
            header={kind === 'truth' ? `🤔 ${L(TRUTH)}` : `🔥 ${L(DARE)}`}
            text={card ? withStar(L(card.prompt.text), starName) : ''}
            footer={turn.current.name}
            badge={card?.prompt.spicy ? '🌶️' : mode === 'classic' ? undefined : PACKS[mode].emoji}
            backEmoji="😈"
            onTap={card ? undefined : () => choose(Math.random() < 0.5 ? 'truth' : 'dare')}
          />
        </Stage>
      }
      top={
        <>
          <ChipRow>
            {MODES.map((m) => (
              <Chip key={m} accent={ACCENT} active={mode === m} locked={m !== 'classic' && !isUnlocked(m)} onClick={() => chooseMode(m)}>
                {m === 'classic' ? `😈 ${L(CLASSIC)}` : `${PACKS[m].emoji} ${L(PACKS[m].chip)}`}
              </Chip>
            ))}
            {mode === 'party-bachelor' && (
              <Chip accent={ACCENT} onClick={() => setPickStar(true)}>
                ⭐ {star?.name ?? '?'}
              </Chip>
            )}
            {mode !== 'couples' && spicy.enabled && !spicy.unlocked && (
              <Chip accent={ACCENT} locked onClick={() => gate.request(PACK, () => undefined)}>
                🌶️
              </Chip>
            )}
          </ChipRow>
          <TurnPill player={turn.current} />
        </>
      }
      bottom={
        card ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button className="btn yellow" style={{ minHeight: 72, fontSize: 24 }} onClick={done}>
              {L(DONE)}
            </button>
            <button className="btn secondary" style={{ minHeight: 72, fontSize: 24 }} onClick={refuse}>
              {L(REFUSE)}
            </button>
          </div>
        ) : (
          <>
            {refusal ? (
              <ResultCard
                animKey={refusal.id}
                color={refusal.color}
                who={`🙅 ${refusal.name} ${L(REFUSED)}`}
                big={<span style={{ fontSize: refusal.text.length > 24 ? 22 : undefined }}>{refusal.text}</span>}
              />
            ) : (
              <div className="center muted" style={{ fontSize: 17 }}>
                {L(PICK)}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button className="btn cyan" style={huge} onClick={() => choose('truth')}>
                🤔 {L(TRUTH)}
              </button>
              <button className="btn" style={{ ...huge, ...red }} onClick={() => choose('dare')}>
                🔥 {L(DARE)}
              </button>
            </div>
          </>
        )
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
