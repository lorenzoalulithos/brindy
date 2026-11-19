import { useRef, useState } from 'react'
import type { Loc } from './i18n'
import { useApp } from './store'
import { usePack } from '../ui/PackLock'

/** Compact authoring format for card content: [it, en, es, fr, de]. */
export type T5 = readonly [it: string, en: string, es: string, fr: string, de: string]

export const loc5 = ([it, en, es, fr, de]: T5): Loc => ({ it, en, es, fr, de })

/** Spicy cards need both the global setting and the unlocked pack. */
export function useSpicy(packId: string) {
  const enabled = useApp((s) => s.spicy)
  const pack = usePack(packId)
  return { enabled, unlocked: pack.unlocked, active: enabled && pack.unlocked }
}

export const SPICY_PACK_TITLE: Loc = {
  it: 'Carte piccanti 🌶️',
  en: 'Spicy cards 🌶️',
  es: 'Cartas picantes 🌶️',
  fr: 'Cartes épicées 🌶️',
  de: 'Scharfe Karten 🌶️',
}

/** '#rrggbb' -> 'rgba(r,g,b,a)' for canvas gradients. */
export function hexA(hex: string, a: number) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

/** Pass to <Stage camera> together with <PromptCard3D>, which aims the camera at the card. */
export const CARD_CAMERA = { position: [0, 2.3, 7.4] as [number, number, number], fov: 42 }

/** Premium content packs shared by several prompt games. */
export type PackId = 'couples' | 'party-bachelor' | 'office'

export const PACKS: Record<PackId, { emoji: string; chip: Loc; title: Loc }> = {
  couples: {
    emoji: '💑',
    chip: { it: 'Coppie', en: 'Couples', es: 'Parejas', fr: 'Couples', de: 'Paare' },
    title: { it: 'Pacchetto Coppie 💑', en: 'Couples pack 💑', es: 'Pack Parejas 💑', fr: 'Pack Couples 💑', de: 'Paare-Paket 💑' },
  },
  'party-bachelor': {
    emoji: '🎉',
    chip: { it: 'Addio', en: 'Hen & stag', es: 'Despedida', fr: 'EVG/EVJF', de: 'JGA' },
    title: {
      it: 'Addio al celibato/nubilato 🎉',
      en: 'Hen & stag party 🎉',
      es: 'Despedida de soltero/a 🎉',
      fr: 'EVG / EVJF 🎉',
      de: 'Junggesellenabschied 🎉',
    },
  },
  office: {
    emoji: '🏢',
    chip: { it: 'Colleghi', en: 'After-work', es: 'Compañeros', fr: 'Collègues', de: 'Kollegen' },
    title: { it: 'Colleghi / After-work 🏢', en: 'Coworkers / After-work 🏢', es: 'Compañeros / Afterwork 🏢', fr: 'Collègues / Afterwork 🏢', de: 'Kollegen / Feierabend 🏢' },
  },
}

export const isPackId = (id: string): id is PackId => id in PACKS

/** Lock-sheet title for any pack id (premium packs or a game's "-spicy" pack). */
export const packTitle = (id: string): Loc => (isPackId(id) ? PACKS[id].title : SPICY_PACK_TITLE)

/** Reactive "is this pack unlocked?" lookup for chip badges. */
export function useUnlocked() {
  const unlocks = useApp((s) => s.unlocks)
  return (id: string) => (unlocks[id] ?? 0) > Date.now()
}

/**
 * Runs `then` right away when the pack is unlocked, otherwise opens the lock sheet and
 * runs it after the sheet closes if the pack got unlocked there. Render
 * `<PackLockSheet packId={gate.locked} onClose={gate.close} …/>` while `gate.locked` is set.
 */
export function usePackGate() {
  const [locked, setLocked] = useState<string | null>(null)
  const pending = useRef<(() => void) | null>(null)
  return {
    locked,
    request(packId: string, then: () => void) {
      if (useApp.getState().isUnlocked(packId)) then()
      else {
        pending.current = then
        setLocked(packId)
      }
    },
    close() {
      const id = locked
      const then = pending.current
      pending.current = null
      setLocked(null)
      if (id && useApp.getState().isUnlocked(id)) then?.()
    },
  }
}

/** `{star}` placeholder used by the hen/stag pack. */
export const STAR_FALLBACK: Loc = { it: 'la star', en: 'the star', es: 'la estrella', fr: 'la star', de: 'der Star' }
export const withStar = (text: string, star: string) => text.split('{star}').join(star)
