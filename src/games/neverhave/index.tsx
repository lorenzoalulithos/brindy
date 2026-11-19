import { useEffect, useRef, useState } from 'react'
import { GameShell } from '../../ui/GameShell'
import { PackLockSheet } from '../../ui/PackLock'
import { Stage } from '../../three/Stage'
import { useT, type Loc } from '../../core/i18n'
import { usePenalty } from '../../core/penalty'
import { usePlayers } from '../../core/store'
import { createDeck } from '../../core/random'
import { sfx, vibrate } from '../../core/feedback'
import type { GameProps } from '../../core/types'
import { CARD_CAMERA, PromptCard3D } from '../../three/PromptCard3D'
import { NEVER_PROMPTS, type NeverCat, type NeverPrompt } from './prompts'
import { PACKS, packTitle, usePackGate, useSpicy, useUnlocked, type PackId } from '../../core/kit'
import { Chip, ChipRow } from '../../ui/GameChips'

const ACCENT = '#3dd6ff'
const PACK = 'neverhave-spicy'
const PACK_CHIPS = ['couples', 'office'] as const satisfies readonly PackId[]

type Filter = 'all' | Exclude<NeverCat, 'life'>

const FILTERS: { id: Filter; emoji: string; label: Loc }[] = [
  { id: 'all', emoji: '🎲', label: { it: 'Tutto', en: 'All', es: 'Todo', fr: 'Tout', de: 'Alles' } },
  { id: 'travel', emoji: '✈️', label: { it: 'Viaggi', en: 'Travel', es: 'Viajes', fr: 'Voyages', de: 'Reisen' } },
  { id: 'fails', emoji: '🙈', label: { it: 'Figuracce', en: 'Fails', es: 'Ridículos', fr: 'Hontes', de: 'Peinlich' } },
  { id: 'work', emoji: '💼', label: { it: 'Lavoro & scuola', en: 'Work & school', es: 'Curro y clase', fr: 'Boulot & école', de: 'Job & Schule' } },
]

const BADGE: Record<NeverCat, string> = { travel: '✈️', fails: '🙈', work: '💼', life: '🍻', spicy: '🌶️', couples: '💑', office: '🏢' }

const HEADER: Loc = { it: 'Non ho mai…', en: 'Never have I ever…', es: 'Yo nunca…', fr: 'Je n’ai jamais…', de: 'Ich hab noch nie…' }
const WHO_DID: Loc = { it: 'chi l’ha fatto', en: 'whoever did it', es: 'quien lo haya hecho', fr: 'ceux qui l’ont fait', de: 'wer es getan hat' }
const NEXT_CARD: Loc = { it: 'Prossima carta 👉', en: 'Next card 👉', es: 'Siguiente carta 👉', fr: 'Carte suivante 👉', de: 'Nächste Karte 👉' }
const MARK_HINT: Loc = {
  it: 'Chi l’ha fatto? Tocca il nome',
  en: 'Who did it? Tap their name',
  es: '¿Quién lo ha hecho? Toca su nombre',
  fr: 'Qui l’a fait ? Touche son nom',
  de: 'Wer hat’s getan? Namen antippen',
}

function poolFor(filter: Filter, spicy: boolean): NeverPrompt[] {
  if (filter === 'spicy') return NEVER_PROMPTS.filter((p) => p.spicy)
  if (filter === 'all') return NEVER_PROMPTS.filter((p) => !p.pack && (spicy || !p.spicy))
  return NEVER_PROMPTS.filter((p) => p.cat === filter)
}

interface Card {
  id: number
  prompt: NeverPrompt
  footer: string
}

export default function NeverHaveGame({ onExit }: GameProps) {
  const { L } = useT()
  const penalty = usePenalty()
  const players = usePlayers()
  const spicy = useSpicy(PACK)
  const [filter, setFilter] = useState<Filter>('all')
  const gate = usePackGate()
  const isUnlocked = useUnlocked()
  const [marked, setMarked] = useState<string[]>([])
  const deck = useRef<{ key: string; deck: ReturnType<typeof createDeck<NeverPrompt>> } | null>(null)
  const nextId = useRef(0)

  const deal = (f: Filter, spicyOn = spicy.active): Card => {
    const key = `${f}|${spicyOn}`
    if (deck.current?.key !== key) deck.current = { key, deck: createDeck(poolFor(f, spicyOn)) }
    // Penalty text is frozen per card: in "dares" mode drink() picks a random dare each call.
    return { id: ++nextId.current, prompt: deck.current.deck.draw(), footer: penalty.drink(1) }
  }
  const [card, setCard] = useState<Card>(() => deal('all'))

  const next = (f = filter, spicyOn = spicy.active) => {
    sfx.flip()
    vibrate(20)
    setMarked([])
    setCard(deal(f, spicyOn))
  }

  const select = (f: Filter) => {
    setFilter(f)
    next(f)
  }

  /** Locked packs open the lock sheet first and switch over once unlocked. */
  const choose = (f: Filter) => {
    sfx.tap()
    if (f === 'spicy') gate.request(PACK, () => select('spicy'))
    else if (f === 'couples' || f === 'office') gate.request(f, () => select(f))
    else select(f)
  }

  const chooseRef = useRef(choose)
  chooseRef.current = choose
  // Spicy setting switched off mid-game: fall back to everything.
  useEffect(() => {
    if (filter === 'spicy' && !spicy.active) chooseRef.current('all')
  }, [filter, spicy.active])

  const toggleMark = (id: string) => {
    sfx.tap()
    const on = marked.includes(id)
    penalty.apply(id, on ? -1 : 1)
    setMarked(on ? marked.filter((m) => m !== id) : [...marked, id])
  }

  return (
    <GameShell
      gameId="neverhave"
      onExit={onExit}
      scene={
        <Stage accent={ACCENT} camera={CARD_CAMERA}>
          <PromptCard3D
            cardKey={card.id}
            accent={card.prompt.spicy || card.prompt.cat === 'couples' ? '#ff5c8a' : ACCENT}
            header={L(HEADER)}
            text={L(card.prompt.text)}
            footer={`${card.footer} · ${L(WHO_DID)}`}
            badge={BADGE[card.prompt.cat]}
            backEmoji="🙈"
            onTap={() => next()}
          />
        </Stage>
      }
      top={
        <ChipRow>
          {FILTERS.map((f) => (
            <Chip key={f.id} accent={ACCENT} active={filter === f.id} onClick={() => choose(f.id)}>
              {f.emoji} {L(f.label)}
            </Chip>
          ))}
          {spicy.enabled && (
            <Chip accent={ACCENT} active={filter === 'spicy'} locked={!spicy.unlocked} onClick={() => choose('spicy')}>
              🌶️
            </Chip>
          )}
          {PACK_CHIPS.map((id) => (
            <Chip key={id} accent={ACCENT} active={filter === id} locked={!isUnlocked(id)} onClick={() => choose(id)}>
              {PACKS[id].emoji} {L(PACKS[id].chip)}
            </Chip>
          ))}
        </ChipRow>
      }
      bottom={
        <>
          {penalty.mode === 'points' && players.length > 0 && (
            <div className="result" style={{ padding: 12, animation: 'none' }}>
              <div className="who">{L(MARK_HINT)}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {players.map((p) => {
                  const on = marked.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      className="chip"
                      style={{ fontSize: 16, padding: '10px 14px', borderColor: p.color, ...(on ? { background: p.color, color: '#140818' } : { color: p.color }) }}
                      onClick={() => toggleMark(p.id)}
                    >
                      {on ? '✓ ' : ''}
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <button className="btn block cyan" onClick={() => next()}>
            {L(NEXT_CARD)}
          </button>
        </>
      }
      overlay={gate.locked && <PackLockSheet packId={gate.locked} title={L(packTitle(gate.locked))} onClose={gate.close} />}
    />
  )
}
