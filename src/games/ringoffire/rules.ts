import type { Loc } from '../../core/i18n'

/** Who the penalty line refers to. `loser` = whoever loses the mini-game. */
export type RulePenalty = { kind: 'drink' | 'give' | 'all' | 'loser'; amount: number } | null

export interface RankRule {
  emoji: string
  title: Loc
  desc: Loc
  penalty: RulePenalty
}

const LOSER = { kind: 'loser', amount: 1 } as const

export const RULES: Record<number, RankRule> = {
  1: {
    emoji: '🌊',
    title: { it: 'Cascata!', en: 'Waterfall!', es: '¡Cascada!', fr: 'Cascade !', de: 'Wasserfall!' },
    desc: {
      it: 'Parti tu, tutti a catena dopo di te: nessuno può fermarsi prima di chi ha alla sua destra.',
      en: 'You start, everyone follows in a chain: nobody can stop before the person on their right.',
      es: 'Empiezas tú y todos te siguen en cadena: nadie para antes que quien tiene a su derecha.',
      fr: 'Tu commences, tout le monde enchaîne : personne ne s’arrête avant son voisin de droite.',
      de: 'Du fängst an, alle machen in Kette mit: Keiner hört vor seinem rechten Nachbarn auf.',
    },
    penalty: { kind: 'all', amount: 1 },
  },
  2: {
    emoji: '👉',
    title: { it: 'Tu!', en: 'You!', es: '¡Tú!', fr: 'Toi !', de: 'Du!' },
    desc: { it: 'Scegli una vittima.', en: 'Pick a victim.', es: 'Elige una víctima.', fr: 'Choisis une victime.', de: 'Wähl ein Opfer.' },
    penalty: { kind: 'give', amount: 2 },
  },
  3: {
    emoji: '🙋',
    title: { it: 'Io!', en: 'Me!', es: '¡Yo!', fr: 'Moi !', de: 'Ich!' },
    desc: { it: 'Stavolta tocca a te, niente scuse.', en: 'This one’s on you, no excuses.', es: 'Esta te toca a ti, sin excusas.', fr: 'C’est pour toi, pas d’excuses.', de: 'Die geht auf dich, keine Ausreden.' },
    penalty: { kind: 'drink', amount: 2 },
  },
  4: {
    emoji: '👇',
    title: { it: 'Pavimento!', en: 'Floor!', es: '¡Suelo!', fr: 'Par terre !', de: 'Boden!' },
    desc: { it: 'Tutti toccano il pavimento. L’ultimo paga.', en: 'Everyone touch the floor. Last one pays.', es: 'Todos tocan el suelo. El último paga.', fr: 'Tout le monde touche le sol. Le dernier paie.', de: 'Alle berühren den Boden. Der Letzte zahlt.' },
    penalty: LOSER,
  },
  5: {
    emoji: '👍',
    title: { it: 'Guerra dei pollici!', en: 'Thumb war!', es: '¡Guerra de pulgares!', fr: 'Guerre des pouces !', de: 'Daumencatchen!' },
    desc: { it: 'Sfida chi vuoi a braccio di ferro coi pollici. Chi perde paga.', en: 'Challenge anyone to a thumb war. Loser pays.', es: 'Reta a quien quieras a una guerra de pulgares. Quien pierda paga.', fr: 'Défie qui tu veux à la guerre des pouces. Le perdant paie.', de: 'Fordere jemanden zum Daumencatchen heraus. Wer verliert, zahlt.' },
    penalty: LOSER,
  },
  6: {
    emoji: '🙌',
    title: { it: 'Mani in alto!', en: 'Hands up!', es: '¡Manos arriba!', fr: 'Mains en l’air !', de: 'Hände hoch!' },
    desc: { it: 'Tutti alzano le mani. L’ultimo paga.', en: 'Everyone raise your hands. Last one pays.', es: 'Todos levantan las manos. El último paga.', fr: 'Tout le monde lève les mains. Le dernier paie.', de: 'Alle Hände hoch. Der Letzte zahlt.' },
    penalty: LOSER,
  },
  7: {
    emoji: '☝️',
    title: { it: 'Paradiso!', en: 'Heaven!', es: '¡Cielo!', fr: 'Paradis !', de: 'Himmel!' },
    desc: { it: 'Tutti indicano il cielo. L’ultimo paga.', en: 'Everyone point to the sky. Last one pays.', es: 'Todos señalan al cielo. El último paga.', fr: 'Tout le monde pointe le ciel. Le dernier paie.', de: 'Alle zeigen zum Himmel. Der Letzte zahlt.' },
    penalty: LOSER,
  },
  8: {
    emoji: '🤝',
    title: { it: 'Compagno!', en: 'Mate!', es: '¡Compañero!', fr: 'Binôme !', de: 'Kumpel!' },
    desc: {
      it: 'Scegli un compagno: fino al prossimo 8 paga ogni volta che paghi tu.',
      en: 'Pick a mate: until the next 8, they pay every time you do.',
      es: 'Elige compañero: hasta el próximo 8, paga cada vez que pagues tú.',
      fr: 'Choisis un binôme : jusqu’au prochain 8, il paie à chaque fois que tu paies.',
      de: 'Wähl einen Kumpel: Bis zur nächsten 8 zahlt er jedes Mal mit dir.',
    },
    penalty: null,
  },
  9: {
    emoji: '🎤',
    title: { it: 'Rima!', en: 'Rhyme!', es: '¡Rima!', fr: 'Rime !', de: 'Reim!' },
    desc: { it: 'Di’ una parola, a giro si fa rima. Chi si blocca paga.', en: 'Say a word, go around rhyming. Whoever freezes pays.', es: 'Di una palabra y por turnos se rima. Quien se atasque paga.', fr: 'Dis un mot, chacun fait une rime. Qui bloque paie.', de: 'Sag ein Wort, reihum reimen. Wer hängt, zahlt.' },
    penalty: LOSER,
  },
  10: {
    emoji: '🧠',
    title: { it: 'Categorie!', en: 'Categories!', es: '¡Categorías!', fr: 'Catégories !', de: 'Kategorien!' },
    desc: { it: 'Scegli una categoria, a giro si dice una parola. Chi ripete o si blocca paga.', en: 'Pick a category, go around naming things. Repeat or freeze and pay.', es: 'Elige una categoría y por turnos se dice algo. Quien repita o se atasque paga.', fr: 'Choisis une catégorie, chacun dit un mot. Qui répète ou bloque paie.', de: 'Wähl eine Kategorie, reihum etwas nennen. Wer wiederholt oder hängt, zahlt.' },
    penalty: LOSER,
  },
  11: {
    emoji: '📜',
    title: { it: 'Nuova regola!', en: 'Make a rule!', es: '¡Nueva regla!', fr: 'Nouvelle règle !', de: 'Neue Regel!' },
    desc: { it: 'Inventa una regola per tutta la partita. Chi la infrange paga.', en: 'Invent a rule for the rest of the game. Break it and pay.', es: 'Inventa una regla para toda la partida. Quien la rompa paga.', fr: 'Invente une règle pour toute la partie. Qui l’enfreint paie.', de: 'Erfinde eine Regel fürs ganze Spiel. Wer sie bricht, zahlt.' },
    penalty: null,
  },
  12: {
    emoji: '❓',
    title: { it: 'Maestro delle domande', en: 'Question master', es: 'Maestro de preguntas', fr: 'Maître des questions', de: 'Fragenmeister' },
    desc: {
      it: 'Fino alla prossima Q, chi risponde a una tua domanda paga.',
      en: 'Until the next Q, anyone who answers your question pays.',
      es: 'Hasta la próxima Q, quien responda a tu pregunta paga.',
      fr: 'Jusqu’à la prochaine Q, qui répond à ta question paie.',
      de: 'Bis zur nächsten Q zahlt jeder, der deine Frage beantwortet.',
    },
    penalty: null,
  },
  13: {
    emoji: '👑',
    title: { it: 'Re!', en: 'King!', es: '¡Rey!', fr: 'Roi !', de: 'König!' },
    desc: {
      it: 'Rendi omaggio alla coppa del re. Chi pesca il 4° Re se la prende tutta!',
      en: 'Pay tribute to the King’s cup. Whoever draws the 4th King takes it all!',
      es: 'Rinde tributo a la copa del rey. ¡Quien saque el 4º Rey se la lleva entera!',
      fr: 'Rends hommage à la coupe du roi. Qui pioche le 4e Roi la prend toute !',
      de: 'Huldige dem Königsbecher. Wer den 4. König zieht, bekommt ihn ganz!',
    },
    penalty: null,
  },
}

export const KING_CUP: RankRule = {
  emoji: '🏆',
  title: { it: 'Coppa del Re! 👑', en: 'King’s Cup! 👑', es: '¡Copa del Rey! 👑', fr: 'Coupe du Roi ! 👑', de: 'Königsbecher! 👑' },
  desc: { it: 'Quarto Re: la coppa è tua!', en: 'Fourth King: the cup is yours!', es: 'Cuarto Rey: ¡la copa es tuya!', fr: 'Quatrième Roi : la coupe est à toi !', de: 'Vierter König: Der Becher gehört dir!' },
  penalty: { kind: 'drink', amount: 5 },
}

export const TXT = {
  draw: { it: 'Pesca', en: 'Draw', es: 'Robar', fr: 'Piocher', de: 'Ziehen' },
  kingN: { it: 'Re n° {n} di 4', en: 'King {n} of 4', es: 'Rey {n} de 4', fr: 'Roi {n} sur 4', de: 'König {n} von 4' },
  finish: { it: 'Fine mazzo', en: 'End of deck', es: 'Fin del mazo', fr: 'Fin du paquet', de: 'Stapel leer' },
  doneTitle: { it: 'Anello completato! 🔥', en: 'Ring complete! 🔥', es: '¡Anillo completo! 🔥', fr: 'Anneau terminé ! 🔥', de: 'Ring geschafft! 🔥' },
  doneSub: {
    it: '52 carte, {k} Re pescati. Si rimescola?',
    en: '52 cards, {k} Kings drawn. Shuffle again?',
    es: '52 cartas y {k} Reyes sacados. ¿Barajamos otra vez?',
    fr: '52 cartes, {k} Rois piochés. On remélange ?',
    de: '52 Karten, {k} Könige gezogen. Neu mischen?',
  },
  tapCard: { it: 'Tocca una carta o il pulsante', en: 'Tap a card or the button', es: 'Toca una carta o el botón', fr: 'Touche une carte ou le bouton', de: 'Tippe eine Karte oder den Button' },
} satisfies Record<string, Loc>
