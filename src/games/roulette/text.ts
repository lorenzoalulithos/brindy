import type { Loc } from '../../core/i18n'

export const T = {
  pick: { it: 'Scegli un bicchiere 👆', en: 'Pick a glass 👆', es: 'Elige un vaso 👆', fr: 'Choisis un verre 👆', de: 'Wähl ein Glas 👆' },
  random: { it: '🎲 A caso', en: '🎲 Random', es: '🎲 Al azar', fr: '🎲 Au hasard', de: '🎲 Zufall' },
  shuffling: {
    it: 'Mescolo i bicchieri… occhio! 👀',
    en: 'Shuffling the glasses… watch closely! 👀',
    es: 'Mezclando los vasos… ¡atento! 👀',
    fr: 'Je mélange les verres… ouvre l’œil ! 👀',
    de: 'Gläser werden gemischt… gut aufpassen! 👀',
  },
  risk: { it: 'Rischio', en: 'Risk', es: 'Riesgo', fr: 'Risque', de: 'Risiko' },
  newRound: { it: 'Nuovo round 🔄', en: 'New round 🔄', es: 'Nueva ronda 🔄', fr: 'Nouvelle manche 🔄', de: 'Neue Runde 🔄' },
  safeSub: {
    it: 'Il rischio sale per il prossimo…',
    en: 'The odds get worse for the next one…',
    es: 'El riesgo sube para el siguiente…',
    fr: 'Le risque grimpe pour le suivant…',
    de: 'Das Risiko steigt für den Nächsten…',
  },
  nextUp: { it: 'Prossimo: {name}', en: 'Next up: {name}', es: 'Siguiente: {name}', fr: 'Au suivant : {name}', de: 'Als Nächstes: {name}' },
  lastGlass: {
    it: 'Ultimo bicchiere… niente scampo! 😈',
    en: 'Last glass… no escape! 😈',
    es: 'Último vaso… ¡no hay escapatoria! 😈',
    fr: 'Dernier verre… aucune échappatoire ! 😈',
    de: 'Letztes Glas… kein Entkommen! 😈',
  },
} satisfies Record<string, Loc>

export const SUSPENSE: Loc[] = [
  { it: 'Rullo di tamburi… 🥁', en: 'Drumroll… 🥁', es: 'Redoble de tambores… 🥁', fr: 'Roulement de tambour… 🥁', de: 'Trommelwirbel… 🥁' },
  { it: 'Il tavolo trattiene il fiato…', en: 'The table holds its breath…', es: 'La mesa contiene la respiración…', fr: 'La table retient son souffle…', de: 'Der Tisch hält den Atem an…' },
  { it: 'Sarà quello giusto? 😬', en: 'Is it the one? 😬', es: '¿Será ese? 😬', fr: 'Est-ce le bon ? 😬', de: 'Ist es das eine? 😬' },
  { it: 'Preghiera veloce… 🙏', en: 'Quick prayer… 🙏', es: 'Oración rápida… 🙏', fr: 'Petite prière… 🙏', de: 'Schnelles Stoßgebet… 🙏' },
]

export const SAFE: Loc[] = [
  { it: 'Salvo! 😅', en: 'Safe! 😅', es: '¡A salvo! 😅', fr: 'Sauvé ! 😅', de: 'Glück gehabt! 😅' },
  { it: 'Ti è andata bene! 🍀', en: 'Lucky you! 🍀', es: '¡Qué suerte! 🍀', fr: 'Quelle chance ! 🍀', de: 'Schwein gehabt! 🍀' },
  { it: 'Respira, sei salvo 😮‍💨', en: 'Breathe, you’re safe 😮‍💨', es: 'Respira, te libraste 😮‍💨', fr: 'Respire, tu t’en sors 😮‍💨', de: 'Durchatmen, du bist sicher 😮‍💨' },
  { it: 'Scampata! ✨', en: 'Dodged it! ✨', es: '¡Por los pelos! ✨', fr: 'Ouf, esquivé ! ✨', de: 'Ausgewichen! ✨' },
]

export const CURSED_TITLE: Loc = { it: 'MALEDETTO! 💀', en: 'CURSED! 💀', es: '¡MALDITO! 💀', fr: 'MAUDIT ! 💀', de: 'VERFLUCHT! 💀' }

export const CURSED_SUB: Loc[] = [
  { it: 'La maledizione ha scelto te', en: 'The curse has chosen you', es: 'La maldición te ha elegido', fr: 'La malédiction t’a choisi', de: 'Der Fluch hat dich erwählt' },
  { it: 'Il bicchiere non perdona', en: 'The glass shows no mercy', es: 'El vaso no perdona', fr: 'Le verre ne pardonne pas', de: 'Das Glas kennt keine Gnade' },
  { it: 'Sapevamo che saresti stato tu 😈', en: 'We all knew it would be you 😈', es: 'Todos sabíamos que serías tú 😈', fr: 'On savait tous que ce serait toi 😈', de: 'Wir wussten alle, dass du es bist 😈' },
]
