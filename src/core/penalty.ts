import { useRef } from 'react'
import { useApp } from './store'
import { pick } from './random'
import { loc, tr, type Loc } from './i18n'

/** Light, store-safe dares used when penalty mode is "dares". */
const DARES: Loc[] = [
  { it: 'imita un animale per 10 secondi', en: 'imitate an animal for 10 seconds', es: 'imita a un animal 10 segundos', fr: 'imite un animal pendant 10 secondes', de: 'imitiere 10 Sekunden ein Tier' },
  { it: 'parla con accento straniero fino al tuo prossimo turno', en: 'speak in a foreign accent until your next turn', es: 'habla con acento extranjero hasta tu próximo turno', fr: "parle avec un accent étranger jusqu'à ton prochain tour", de: 'sprich bis zu deinem nächsten Zug mit Akzent' },
  { it: '10 squat adesso', en: '10 squats right now', es: '10 sentadillas ahora', fr: '10 squats maintenant', de: '10 Kniebeugen sofort' },
  { it: 'canta il ritornello di una canzone a scelta del gruppo', en: 'sing a chorus picked by the group', es: 'canta un estribillo elegido por el grupo', fr: 'chante un refrain choisi par le groupe', de: 'sing einen Refrain, den die Gruppe wählt' },
  { it: 'fai un complimento sincero a ognuno', en: 'give everyone a sincere compliment', es: 'haz un cumplido sincero a cada uno', fr: 'fais un compliment sincère à chacun', de: 'mach jedem ein ehrliches Kompliment' },
  { it: 'balla senza musica per 15 secondi', en: 'dance with no music for 15 seconds', es: 'baila sin música 15 segundos', fr: 'danse sans musique pendant 15 secondes', de: 'tanz 15 Sekunden ohne Musik' },
  { it: 'racconta la tua figuraccia più grande', en: 'tell your most embarrassing moment', es: 'cuenta tu momento más vergonzoso', fr: 'raconte ta plus grosse honte', de: 'erzähl deinen peinlichsten Moment' },
  { it: 'fai la tua miglior faccia da selfie e tienila 10 secondi', en: 'hold your best selfie face for 10 seconds', es: 'pon tu mejor cara de selfie 10 segundos', fr: 'garde ta meilleure tête de selfie 10 secondes', de: 'halte 10 Sekunden dein bestes Selfie-Gesicht' },
  { it: 'parla in rima fino al prossimo turno', en: 'speak only in rhymes until next turn', es: 'habla en rima hasta el próximo turno', fr: "parle en rimes jusqu'au prochain tour", de: 'sprich bis zum nächsten Zug nur in Reimen' },
  { it: 'fai 5 flessioni', en: 'do 5 push-ups', es: 'haz 5 flexiones', fr: 'fais 5 pompes', de: 'mach 5 Liegestütze' },
]

/**
 * Turns a penalty amount into text according to the chosen mode
 * (sips / alcohol-free points / dares). Games must use this instead of
 * hard-coding "drink", so every game respects the store-safe settings.
 */
export function usePenalty() {
  const mode = useApp((s) => s.penaltyMode)
  const lang = useApp((s) => s.lang)
  const addPoints = useApp((s) => s.addPoints)
  // The dare stays the same across re-renders; it changes only when a new penalty is applied.
  const dareRef = useRef(pick(DARES))
  const dare = () => loc(dareRef.current, lang)

  return {
    mode,
    /** "Drink n sips" / "+n points" / "Dare: …" */
    drink(n = 1): string {
      if (mode === 'points') return n === 1 ? tr('takePoint', lang) : tr('takePoints', lang, { n })
      if (mode === 'dares') return tr('doDare', lang, { d: dare() })
      if (n >= 5) return tr('shot', lang)
      return n === 1 ? tr('drinkSip', lang) : tr('drinkSips', lang, { n })
    },
    /** "Give n sips" to someone else. */
    give(n = 1): string {
      if (mode === 'points') return tr('givePoints', lang, { n })
      if (mode === 'dares') return tr('giveDare', lang)
      return n === 1 ? tr('giveSip', lang) : tr('giveSips', lang, { n })
    },
    /** Everybody takes n. */
    all(n = 1): string {
      if (mode === 'points') return tr('allPoints', lang, { n })
      if (mode === 'dares') return tr('allDare', lang, { d: dare() })
      return tr('allDrink', lang, { n })
    },
    /**
     * Call once per penalty event: records points (points mode) and rolls the next dare (dares mode).
     * Pass no player for group penalties.
     */
    apply(playerId?: string, n = 1) {
      dareRef.current = pick(DARES)
      if (playerId && mode === 'points') addPoints(playerId, n)
    },
  }
}
