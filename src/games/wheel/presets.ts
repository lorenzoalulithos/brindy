import type { Loc } from '../../core/i18n'

/**
 * drink/give/all: penalty via usePenalty (n sips/points/dares)
 * dare: personal task (n = price for refusing, optional)
 * game: group mini-game, the loser pays n (optional)
 * challenge: random mini-challenge from MINI_CHALLENGES
 * double: next penalty counts double · respin: spin again · safe/rule/swap: just text
 */
export type SliceKind = 'drink' | 'give' | 'all' | 'safe' | 'rule' | 'swap' | 'challenge' | 'double' | 'respin' | 'dare' | 'game'

export interface Slice {
  kind: SliceKind
  n?: number
  color: string
  icon: string
  /** Short text printed on the wheel. Penalty slices generate theirs from the penalty mode. */
  label?: Loc
  title: Loc
  /** May contain {name}: another player (or "whoever you want"). */
  desc: Loc
}

export interface Preset {
  id: string
  emoji: string
  name: Loc
  spicy?: boolean
  /** Holiday preset: only listed while `showHolidayContent()` (Dec 1 – Jan 6, always in dev). Free. */
  seasonal?: boolean
  slices: Slice[]
}

export const ANYONE: Loc = { it: 'chi vuoi tu', en: 'anyone you like', es: 'quien tú quieras', fr: 'qui tu veux', de: 'wen du willst' }
export const GIVE_SHORT: Loc = { it: 'Dai', en: 'Give', es: 'Da', fr: 'Donne', de: 'Gib' }
export const ALL_SHORT: Loc = { it: 'Tutti', en: 'All', es: 'Todos', fr: 'Tous', de: 'Alle' }
export const REFUSE: Loc = { it: 'Ti rifiuti?', en: 'Refuse?', es: '¿Te niegas?', fr: 'Tu refuses ?', de: 'Kneifen?' }
export const LOSER: Loc = { it: 'Chi perde:', en: 'Loser:', es: 'Quien pierda:', fr: 'Le perdant :', de: 'Verlierer:' }
export const DOUBLE_ON: Loc = {
  it: '🎲 ×2 attivo: la prossima penalità vale doppio',
  en: '🎲 ×2 active: the next penalty counts double',
  es: '🎲 ×2 activo: el próximo castigo vale doble',
  fr: '🎲 ×2 actif : la prochaine pénalité compte double',
  de: '🎲 ×2 aktiv: Die nächste Strafe zählt doppelt',
}
export const SPIN: Loc = { it: 'Gira la ruota', en: 'Spin the wheel', es: 'Gira la ruleta', fr: 'Tourne la roue', de: 'Rad drehen' }
export const RESPIN: Loc = { it: 'Rigira', en: 'Spin again', es: 'Vuelve a girar', fr: 'Relance', de: 'Nochmal drehen' }
export const SWIPE_HINT: Loc = {
  it: '👆 Trascina la ruota o tocca per girare',
  en: '👆 Drag the wheel or tap to spin',
  es: '👆 Arrastra la ruleta o toca para girar',
  fr: '👆 Fais glisser la roue ou touche pour la lancer',
  de: '👆 Zieh am Rad oder tippe zum Drehen',
}
export const SPICY_PACK_TITLE: Loc = {
  it: 'Ruota piccante 🌶️',
  en: 'Spicy wheel 🌶️',
  es: 'Ruleta picante 🌶️',
  fr: 'Roue épicée 🌶️',
  de: 'Scharfes Rad 🌶️',
}

// ---------------------------------------------------------------- shared slices

const SAFE = (color: string, title?: Loc): Slice => ({
  kind: 'safe',
  color,
  icon: '😎',
  label: { it: 'Salvo', en: 'Safe', es: 'Salvado', fr: 'Sauvé', de: 'Sicher' },
  title: title ?? { it: 'Salvo!', en: 'Safe!', es: '¡Salvado!', fr: 'Sauvé !', de: 'Sicher!' },
  desc: {
    it: 'La ruota ti risparmia. Per stavolta.',
    en: 'The wheel spares you. This time.',
    es: 'La ruleta te perdona. Por esta vez.',
    fr: 'La roue t’épargne. Pour cette fois.',
    de: 'Das Rad verschont dich. Dieses Mal.',
  },
})

const RULE = (color: string): Slice => ({
  kind: 'rule',
  color,
  icon: '📜',
  label: { it: 'Regola', en: 'Rule', es: 'Regla', fr: 'Règle', de: 'Regel' },
  title: { it: 'Nuova regola!', en: 'New rule!', es: '¡Nueva regla!', fr: 'Nouvelle règle !', de: 'Neue Regel!' },
  desc: {
    it: 'Inventa una regola valida fino alla prossima “Nuova regola”. Chi la infrange paga.',
    en: 'Make up a rule that lasts until the next “New rule”. Break it and pay.',
    es: 'Inventa una regla que dura hasta la próxima “Nueva regla”. Quien la rompa paga.',
    fr: 'Invente une règle valable jusqu’à la prochaine « Nouvelle règle ». Qui l’enfreint paie.',
    de: 'Erfinde eine Regel, die bis zur nächsten „Neuen Regel“ gilt. Wer sie bricht, zahlt.',
  },
})

const SWAP = (color: string): Slice => ({
  kind: 'swap',
  color,
  icon: '🔄',
  label: { it: 'Cambio', en: 'Swap', es: 'Cambio', fr: 'Échange', de: 'Tausch' },
  title: { it: 'Cambio posto!', en: 'Swap seats!', es: '¡Cambio de sitio!', fr: 'Change de place !', de: 'Platztausch!' },
  desc: {
    it: 'Scambia il posto con {name}.',
    en: 'Swap seats with {name}.',
    es: 'Cámbiate de sitio con {name}.',
    fr: 'Échange ta place avec {name}.',
    de: 'Tausch den Platz mit {name}.',
  },
})

const CHALLENGE = (color: string): Slice => ({
  kind: 'challenge',
  n: 2,
  color,
  icon: '🎯',
  label: { it: 'Sfida', en: 'Challenge', es: 'Reto', fr: 'Défi', de: 'Aufgabe' },
  title: { it: 'Mini-sfida!', en: 'Mini-challenge!', es: '¡Mini-reto!', fr: 'Mini-défi !', de: 'Mini-Challenge!' },
  desc: { en: '' },
})

const DOUBLE = (color: string): Slice => ({
  kind: 'double',
  color,
  icon: '🎲',
  label: { it: 'Doppio?', en: 'Double?', es: '¿Doble?', fr: 'Double ?', de: 'Doppelt?' },
  title: { it: 'Doppio o niente', en: 'Double or nothing', es: 'Doble o nada', fr: 'Quitte ou double', de: 'Doppelt oder nichts' },
  desc: {
    it: 'Rigira: se esce una penalità vale doppio. Se ti va bene, sei libero.',
    en: 'Spin again: if you land a penalty it counts double. If you’re lucky, you walk free.',
    es: 'Vuelve a girar: si sale un castigo, vale doble. Si tienes suerte, te libras.',
    fr: 'Relance : si tu tombes sur une pénalité, elle compte double. Sinon, tu es libre.',
    de: 'Nochmal drehen: Landest du auf einer Strafe, zählt sie doppelt. Mit Glück kommst du davon.',
  },
})

const RESPIN_SLICE = (color: string): Slice => ({
  kind: 'respin',
  color,
  icon: '🔁',
  label: { it: 'Rigira', en: 'Respin', es: 'Otra', fr: 'Relance', de: 'Nochmal' },
  title: { it: 'Rigira!', en: 'Spin again!', es: '¡Otra vez!', fr: 'Relance !', de: 'Nochmal!' },
  desc: {
    it: 'La ruota vuole un altro giro.',
    en: 'The wheel wants another go.',
    es: 'La ruleta quiere otra vuelta.',
    fr: 'La roue en redemande.',
    de: 'Das Rad will noch eine Runde.',
  },
})

// ---------------------------------------------------------------- presets

const CLASSIC: Preset = {
  id: 'classic',
  emoji: '🎡',
  name: { it: 'Classica', en: 'Classic', es: 'Clásica', fr: 'Classique', de: 'Klassisch' },
  slices: [
    {
      kind: 'drink',
      n: 1,
      color: '#ff3d8b',
      icon: '',
      title: { it: 'Riscaldamento', en: 'Warm-up', es: 'Calentamiento', fr: 'Échauffement', de: 'Aufwärmen' },
      desc: { it: 'Si comincia piano.', en: 'Easy does it.', es: 'Empezamos suave.', fr: 'On commence doucement.', de: 'Wir fangen langsam an.' },
    },
    {
      kind: 'give',
      n: 2,
      color: '#7b5cff',
      icon: '👉',
      title: { it: 'Regalo avvelenato', en: 'Poisoned gift', es: 'Regalo envenenado', fr: 'Cadeau empoisonné', de: 'Vergiftetes Geschenk' },
      desc: { it: 'Scegli tu a chi.', en: 'You pick who.', es: 'Tú eliges a quién.', fr: 'Tu choisis qui.', de: 'Du suchst aus, wen.' },
    },
    SAFE('#3dd6ff'),
    {
      kind: 'drink',
      n: 2,
      color: '#ff8a3d',
      icon: '',
      title: { it: 'Sfiga classica', en: 'Classic bad luck', es: 'Mala suerte clásica', fr: 'Poisse classique', de: 'Klassisches Pech' },
      desc: { it: 'Non è la tua serata.', en: 'Not your night.', es: 'No es tu noche.', fr: 'Ce n’est pas ta soirée.', de: 'Nicht dein Abend.' },
    },
    RULE('#3dff8b'),
    {
      kind: 'all',
      n: 1,
      color: '#ffd23d',
      icon: '👥',
      title: { it: 'Brindisi! 🍻', en: 'Cheers! 🍻', es: '¡Brindis! 🍻', fr: 'Santé ! 🍻', de: 'Prost! 🍻' },
      desc: {
        it: 'Tutto il tavolo, insieme.',
        en: 'The whole table, together.',
        es: 'Toda la mesa, a la vez.',
        fr: 'Toute la table, ensemble.',
        de: 'Der ganze Tisch, zusammen.',
      },
    },
    SWAP('#ff3df0'),
    CHALLENGE('#3d7bff'),
    {
      kind: 'give',
      n: 3,
      color: '#ff5c5c',
      icon: '👉',
      title: { it: 'Vendetta', en: 'Revenge', es: 'Venganza', fr: 'Vengeance', de: 'Rache' },
      desc: {
        it: 'Distribuisci come vuoi.',
        en: 'Split them however you like.',
        es: 'Repártelos como quieras.',
        fr: 'Répartis comme tu veux.',
        de: 'Verteil sie, wie du willst.',
      },
    },
    DOUBLE('#c6ff3d'),
    {
      kind: 'drink',
      n: 3,
      color: '#9b3dff',
      icon: '',
      title: { it: 'Sfiga nera 🖤', en: 'Pitch-black luck 🖤', es: 'Mala suerte negra 🖤', fr: 'Poisse noire 🖤', de: 'Rabenschwarzes Pech 🖤' },
      desc: {
        it: 'La ruota ce l’ha con te.',
        en: 'The wheel has it in for you.',
        es: 'La ruleta la tiene tomada contigo.',
        fr: 'La roue t’en veut.',
        de: 'Das Rad hat es auf dich abgesehen.',
      },
    },
    RESPIN_SLICE('#3dffd6'),
  ],
}

const CHAOS: Preset = {
  id: 'chaos',
  emoji: '🌪️',
  name: { it: 'Caos', en: 'Chaos', es: 'Caos', fr: 'Chaos', de: 'Chaos' },
  slices: [
    {
      kind: 'drink',
      n: 5,
      color: '#ff2d55',
      icon: '',
      title: { it: 'Colpo di grazia 💀', en: 'Finishing blow 💀', es: 'Golpe de gracia 💀', fr: 'Coup de grâce 💀', de: 'Gnadenstoß 💀' },
      desc: {
        it: 'Il massimo della sfiga.',
        en: 'Peak bad luck.',
        es: 'El colmo de la mala suerte.',
        fr: 'Le summum de la poisse.',
        de: 'Pech in Höchstform.',
      },
    },
    {
      kind: 'all',
      n: 2,
      color: '#ffb000',
      icon: '👥',
      title: { it: 'Giro per tutti', en: 'Round for everyone', es: 'Ronda para todos', fr: 'Tournée générale', de: 'Runde für alle' },
      desc: { it: 'Nessuno è al sicuro.', en: 'Nobody is safe.', es: 'Nadie está a salvo.', fr: 'Personne n’est à l’abri.', de: 'Niemand ist sicher.' },
    },
    {
      kind: 'game',
      n: 2,
      color: '#7b5cff',
      icon: '🌀',
      label: { it: 'Rimescola', en: 'Shuffle', es: 'Revuelo', fr: 'Mélange', de: 'Mischen' },
      title: { it: 'Rimescolata!', en: 'Seat shuffle!', es: '¡Todos a moverse!', fr: 'Grand chamboule !', de: 'Bäumchen wechsel dich!' },
      desc: {
        it: 'Tutti in piedi e cambiate posto. L’ultimo a sedersi paga.',
        en: 'Everyone up and change seats. Last one sitting down pays.',
        es: 'Todos de pie y a cambiar de sitio. El último en sentarse paga.',
        fr: 'Tout le monde debout et change de place. Le dernier assis paie.',
        de: 'Alle aufstehen und Plätze tauschen. Wer zuletzt sitzt, zahlt.',
      },
    },
    {
      kind: 'give',
      n: 5,
      color: '#1f1b3a',
      icon: '💣',
      title: { it: 'Bomba!', en: 'Bomb!', es: '¡Bomba!', fr: 'Bombe !', de: 'Bombe!' },
      desc: {
        it: 'Scegli una vittima e sgancia tutto.',
        en: 'Pick one victim and drop it all.',
        es: 'Elige una víctima y suéltalo todo.',
        fr: 'Choisis une victime et lâche tout.',
        de: 'Such dir ein Opfer und lass alles fallen.',
      },
    },
    {
      kind: 'game',
      n: 1,
      color: '#ff8a3d',
      icon: '🙌',
      label: { it: 'Mani su', en: 'Hands up', es: 'Manos', fr: 'Mains', de: 'Hände' },
      title: { it: 'Mani in alto!', en: 'Hands up!', es: '¡Manos arriba!', fr: 'Mains en l’air !', de: 'Hände hoch!' },
      desc: {
        it: 'L’ultimo ad alzare le mani paga.',
        en: 'Last to raise their hands pays.',
        es: 'El último en levantar las manos paga.',
        fr: 'Le dernier à lever les mains paie.',
        de: 'Wer zuletzt die Hände hebt, zahlt.',
      },
    },
    {
      kind: 'rule',
      color: '#ffd23d',
      icon: '👑',
      label: { it: 'Tiranno', en: 'Tyrant', es: 'Tirano', fr: 'Tyran', de: 'Tyrann' },
      title: { it: 'Il Tiranno 👑', en: 'The Tyrant 👑', es: 'El Tirano 👑', fr: 'Le Tyran 👑', de: 'Der Tyrann 👑' },
      desc: {
        it: 'Inventa una regola che vale per tutto il resto della partita.',
        en: 'Make up a rule that lasts for the rest of the game.',
        es: 'Inventa una regla que vale para el resto de la partida.',
        fr: 'Invente une règle valable jusqu’à la fin de la partie.',
        de: 'Erfinde eine Regel, die für den Rest des Spiels gilt.',
      },
    },
    {
      kind: 'game',
      n: 2,
      color: '#3dd6ff',
      icon: '🧠',
      label: { it: 'Categoria', en: 'Category', es: 'Categoría', fr: 'Catégorie', de: 'Kategorie' },
      title: { it: 'Categoria!', en: 'Category!', es: '¡Categoría!', fr: 'Catégorie !', de: 'Kategorie!' },
      desc: {
        it: 'Scegli una categoria, a giro si dice una parola. Chi si blocca paga.',
        en: 'Pick a category, go around saying one word each. Whoever freezes pays.',
        es: 'Elige una categoría, por turnos se dice una palabra. Quien se bloquee paga.',
        fr: 'Choisis une catégorie, chacun dit un mot. Qui bloque paie.',
        de: 'Wähl eine Kategorie, reihum ein Wort. Wer hängt, zahlt.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#ff3df0',
      icon: '🗣️',
      label: { it: 'Accento', en: 'Accent', es: 'Acento', fr: 'Accent', de: 'Akzent' },
      title: { it: 'Accento straniero', en: 'Foreign accent', es: 'Acento extranjero', fr: 'Accent étranger', de: 'Fremder Akzent' },
      desc: {
        it: 'Parla con un accento straniero fino al tuo prossimo giro.',
        en: 'Speak with a foreign accent until your next spin.',
        es: 'Habla con acento extranjero hasta tu próximo giro.',
        fr: 'Parle avec un accent étranger jusqu’à ton prochain tour.',
        de: 'Sprich bis zu deinem nächsten Dreh mit fremdem Akzent.',
      },
    },
    {
      kind: 'game',
      n: 2,
      color: '#3dff8b',
      icon: '🪞',
      label: { it: 'Specchio', en: 'Mirror', es: 'Espejo', fr: 'Miroir', de: 'Spiegel' },
      title: { it: 'Specchio!', en: 'Mirror!', es: '¡Espejo!', fr: 'Miroir !', de: 'Spiegel!' },
      desc: {
        it: 'Fino al prossimo giro tutti copiano ogni tuo gesto. Chi sbaglia paga.',
        en: 'Until the next spin everyone copies your every move. Miss one and pay.',
        es: 'Hasta el próximo giro todos copian cada gesto tuyo. Quien falle paga.',
        fr: 'Jusqu’au prochain tour, tous imitent chacun de tes gestes. Qui rate paie.',
        de: 'Bis zum nächsten Dreh machen alle jede deiner Bewegungen nach. Wer patzt, zahlt.',
      },
    },
    DOUBLE('#c6ff3d'),
    {
      kind: 'drink',
      n: 2,
      color: '#9b3dff',
      icon: '',
      title: { it: 'Ops!', en: 'Oops!', es: '¡Ups!', fr: 'Oups !', de: 'Hoppla!' },
      desc: {
        it: 'Capita. Soprattutto a te.',
        en: 'It happens. Mostly to you.',
        es: 'Pasa. Sobre todo a ti.',
        fr: 'Ça arrive. Surtout à toi.',
        de: 'Passiert. Vor allem dir.',
      },
    },
    SWAP('#ff5c5c'),
  ],
}

const SOFT: Preset = {
  id: 'soft',
  emoji: '🧃',
  name: { it: 'Soft', en: 'Soft', es: 'Soft', fr: 'Soft', de: 'Soft' },
  slices: [
    {
      kind: 'dare',
      color: '#7fd8ff',
      icon: '💐',
      label: { it: 'Complimento', en: 'Compliment', es: 'Cumplido', fr: 'Compliment', de: 'Kompliment' },
      title: { it: 'Complimento', en: 'Compliment', es: 'Cumplido', fr: 'Compliment', de: 'Kompliment' },
      desc: {
        it: 'Fai un complimento sincero a {name}.',
        en: 'Give {name} a sincere compliment.',
        es: 'Hazle un cumplido sincero a {name}.',
        fr: 'Fais un compliment sincère à {name}.',
        de: 'Mach {name} ein ehrliches Kompliment.',
      },
    },
    {
      kind: 'dare',
      color: '#b59cff',
      icon: '🐒',
      label: { it: 'Imita', en: 'Impression', es: 'Imita', fr: 'Imite', de: 'Imitieren' },
      title: { it: 'Imitazione', en: 'Impression', es: 'Imitación', fr: 'Imitation', de: 'Imitation' },
      desc: {
        it: 'Imita un animale scelto dal gruppo per 10 secondi.',
        en: 'Impersonate an animal picked by the group for 10 seconds.',
        es: 'Imita a un animal elegido por el grupo durante 10 segundos.',
        fr: 'Imite un animal choisi par le groupe pendant 10 secondes.',
        de: 'Imitiere 10 Sekunden lang ein Tier, das die Gruppe aussucht.',
      },
    },
    {
      kind: 'dare',
      color: '#ffa8d0',
      icon: '🎤',
      label: { it: 'Karaoke', en: 'Karaoke', es: 'Karaoke', fr: 'Karaoké', de: 'Karaoke' },
      title: { it: 'Karaoke!', en: 'Karaoke!', es: '¡Karaoke!', fr: 'Karaoké !', de: 'Karaoke!' },
      desc: {
        it: 'Canta il ritornello di una canzone scelta dal gruppo.',
        en: 'Sing the chorus of a song the group picks.',
        es: 'Canta el estribillo de una canción que elija el grupo.',
        fr: 'Chante le refrain d’une chanson choisie par le groupe.',
        de: 'Sing den Refrain eines Songs, den die Gruppe aussucht.',
      },
    },
    {
      kind: 'dare',
      color: '#8dffbb',
      icon: '💃',
      label: { it: 'Balla', en: 'Dance', es: 'Baila', fr: 'Danse', de: 'Tanzen' },
      title: { it: 'Balla!', en: 'Dance!', es: '¡Baila!', fr: 'Danse !', de: 'Tanz!' },
      desc: {
        it: '15 secondi di ballo, senza musica.',
        en: '15 seconds of dancing, no music.',
        es: '15 segundos bailando, sin música.',
        fr: '15 secondes de danse, sans musique.',
        de: '15 Sekunden tanzen, ohne Musik.',
      },
    },
    SAFE('#ffe27a'),
    {
      kind: 'dare',
      color: '#7fb2ff',
      icon: '😂',
      label: { it: 'Barzelletta', en: 'Joke', es: 'Chiste', fr: 'Blague', de: 'Witz' },
      title: { it: 'Barzelletta', en: 'Tell a joke', es: 'Cuenta un chiste', fr: 'Une blague', de: 'Erzähl einen Witz' },
      desc: {
        it: 'Racconta una barzelletta. Se nessuno ride, rigira.',
        en: 'Tell a joke. If nobody laughs, spin again.',
        es: 'Cuenta un chiste. Si nadie se ríe, vuelve a girar.',
        fr: 'Raconte une blague. Si personne ne rit, relance.',
        de: 'Erzähl einen Witz. Lacht keiner, drehst du nochmal.',
      },
    },
    {
      kind: 'game',
      color: '#c9b3ff',
      icon: '🗿',
      label: { it: 'Statue', en: 'Statues', es: 'Estatuas', fr: 'Statues', de: 'Statuen' },
      title: { it: 'Statue!', en: 'Statues!', es: '¡Estatuas!', fr: 'Statues !', de: 'Statuen!' },
      desc: {
        it: 'Tutti immobili! Il primo che si muove o ride fa una penitenza scelta dal gruppo.',
        en: 'Everyone freeze! First to move or laugh does a dare chosen by the group.',
        es: '¡Todos quietos! El primero que se mueva o se ría hace un reto elegido por el grupo.',
        fr: 'Tout le monde fige ! Le premier qui bouge ou rit fait un gage choisi par le groupe.',
        de: 'Alle erstarren! Wer sich zuerst bewegt oder lacht, macht eine Aufgabe nach Wahl der Gruppe.',
      },
    },
    SWAP('#7fe6ff'),
    RULE('#a8ffd0'),
    RESPIN_SLICE('#ffc27a'),
    {
      kind: 'dare',
      color: '#ff9ec7',
      icon: '🎭',
      label: { it: 'Mimo', en: 'Charades', es: 'Mímica', fr: 'Mime', de: 'Pantomime' },
      title: { it: 'Mimo', en: 'Charades', es: 'Mímica', fr: 'Mime', de: 'Pantomime' },
      desc: {
        it: 'Mima un film: gli altri hanno 30 secondi per indovinare.',
        en: 'Act out a movie: the others get 30 seconds to guess.',
        es: 'Representa una peli: los demás tienen 30 segundos para adivinarla.',
        fr: 'Mime un film : les autres ont 30 secondes pour deviner.',
        de: 'Stell einen Film dar: Die anderen haben 30 Sekunden zum Raten.',
      },
    },
    {
      kind: 'game',
      color: '#9fe3a8',
      icon: '👀',
      label: { it: 'Sguardi', en: 'Stare-off', es: 'Miradas', fr: 'Regards', de: 'Anstarren' },
      title: { it: 'Sfida di sguardi', en: 'Staring contest', es: 'Duelo de miradas', fr: 'Duel de regards', de: 'Anstarr-Duell' },
      desc: {
        it: 'Guarda {name} negli occhi: chi ride per primo perde e fa una penitenza.',
        en: 'Stare into {name}’s eyes: first to laugh loses and does a dare.',
        es: 'Mira a {name} a los ojos: el primero que se ría pierde y hace un reto.',
        fr: 'Regarde {name} dans les yeux : le premier qui rit perd et fait un gage.',
        de: 'Schau {name} in die Augen: Wer zuerst lacht, verliert und macht eine Aufgabe.',
      },
    },
  ],
}

const SPICY: Preset = {
  id: 'spicy',
  emoji: '🌶️',
  spicy: true,
  name: { it: 'Piccante', en: 'Spicy', es: 'Picante', fr: 'Épicée', de: 'Scharf' },
  slices: [
    {
      kind: 'dare',
      n: 2,
      color: '#ff3d6e',
      icon: '😉',
      label: { it: 'Occhiolino', en: 'Wink', es: 'Guiño', fr: 'Clin d’œil', de: 'Zwinkern' },
      title: { it: 'Occhiolino', en: 'Wink', es: 'Guiño', fr: 'Clin d’œil', de: 'Zwinkern' },
      desc: {
        it: 'Fai il tuo occhiolino più seducente a {name}.',
        en: 'Give {name} your most seductive wink.',
        es: 'Guíñale el ojo a {name} lo más seductor que puedas.',
        fr: 'Fais ton clin d’œil le plus séducteur à {name}.',
        de: 'Zwinker {name} so verführerisch wie möglich zu.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#8a1c4a',
      icon: '🤫',
      label: { it: 'Sussurro', en: 'Whisper', es: 'Susurro', fr: 'Murmure', de: 'Flüstern' },
      title: { it: 'Sussurro', en: 'Whisper', es: 'Susurro', fr: 'Murmure', de: 'Flüstern' },
      desc: {
        it: 'Sussurra un complimento all’orecchio di {name}.',
        en: 'Whisper a compliment in {name}’s ear.',
        es: 'Susúrrale un cumplido al oído a {name}.',
        fr: 'Murmure un compliment à l’oreille de {name}.',
        de: 'Flüster {name} ein Kompliment ins Ohr.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#ff7aa8',
      icon: '🔥',
      label: { it: 'Verità', en: 'Truth', es: 'Verdad', fr: 'Vérité', de: 'Wahrheit' },
      title: { it: 'Verità piccante', en: 'Spicy truth', es: 'Verdad picante', fr: 'Vérité épicée', de: 'Heiße Wahrheit' },
      desc: {
        it: 'Racconta il tuo primo bacio con tutti i dettagli (decenti).',
        en: 'Tell the story of your first kiss with all the (decent) details.',
        es: 'Cuenta tu primer beso con todos los detalles (decentes).',
        fr: 'Raconte ton premier baiser avec tous les détails (décents).',
        de: 'Erzähl von deinem ersten Kuss mit allen (anständigen) Details.',
      },
    },
    {
      kind: 'drink',
      n: 2,
      color: '#c2185b',
      icon: '',
      title: { it: 'Caliente 🌶️', en: 'Caliente 🌶️', es: 'Caliente 🌶️', fr: 'Caliente 🌶️', de: 'Caliente 🌶️' },
      desc: {
        it: 'Fa caldo qui, eh?',
        en: 'Getting hot in here, huh?',
        es: 'Hace calor aquí, ¿eh?',
        fr: 'Il fait chaud ici, non ?',
        de: 'Ganz schön heiß hier, was?',
      },
    },
    {
      kind: 'dare',
      n: 3,
      color: '#ff3d8b',
      icon: '🕺',
      label: { it: 'Lento', en: 'Slow dance', es: 'Lenta', fr: 'Slow', de: 'Blues' },
      title: { it: 'Un lento', en: 'Slow dance', es: 'Una lenta', fr: 'Un slow', de: 'Klammerblues' },
      desc: {
        it: 'Balla un lento di 15 secondi con {name} (se è d’accordo).',
        en: 'Slow-dance with {name} for 15 seconds (if they’re up for it).',
        es: 'Baila una lenta de 15 segundos con {name} (si le apetece).',
        fr: 'Danse un slow de 15 secondes avec {name} (s’il est d’accord).',
        de: 'Tanz 15 Sekunden Klammerblues mit {name} (wenn er oder sie mag).',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#6a1040',
      icon: '😏',
      label: { it: 'Rimorchio', en: 'Pick-up', es: 'Ligoteo', fr: 'Drague', de: 'Anmache' },
      title: { it: 'Frase da rimorchio', en: 'Pick-up line', es: 'Frase para ligar', fr: 'Phrase de drague', de: 'Anmachspruch' },
      desc: {
        it: 'Usa la tua miglior frase da rimorchio su {name}.',
        en: 'Try your best pick-up line on {name}.',
        es: 'Prueba tu mejor frase para ligar con {name}.',
        fr: 'Teste ta meilleure phrase de drague sur {name}.',
        de: 'Probier deinen besten Anmachspruch an {name} aus.',
      },
    },
    {
      kind: 'give',
      n: 2,
      color: '#ff5c8a',
      icon: '💘',
      title: { it: 'Cupido', en: 'Cupid', es: 'Cupido', fr: 'Cupidon', de: 'Amor' },
      desc: {
        it: 'A chi ti fa battere il cuore.',
        en: 'To whoever makes your heart beat faster.',
        es: 'A quien te acelera el corazón.',
        fr: 'À qui fait battre ton cœur.',
        de: 'An die Person, die dein Herz schneller schlagen lässt.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#b3125a',
      icon: '💭',
      label: { it: 'Il tuo tipo', en: 'Your type', es: 'Tu tipo', fr: 'Ton type', de: 'Dein Typ' },
      title: { it: 'Il tuo tipo', en: 'Your type', es: 'Tu tipo', fr: 'Ton type', de: 'Dein Typ' },
      desc: {
        it: 'Descrivi la tua persona ideale in tre parole.',
        en: 'Describe your ideal person in three words.',
        es: 'Describe a tu persona ideal en tres palabras.',
        fr: 'Décris ta personne idéale en trois mots.',
        de: 'Beschreib deine Traumperson in drei Worten.',
      },
    },
    SAFE('#ffb3cf', { it: 'Salvo… per ora 😇', en: 'Safe… for now 😇', es: 'A salvo… por ahora 😇', fr: 'Sauvé… pour l’instant 😇', de: 'Sicher… vorerst 😇' }),
    {
      kind: 'dare',
      n: 3,
      color: '#e0115f',
      icon: '💋',
      label: { it: 'Bacetto', en: 'Peck', es: 'Besito', fr: 'Bisou', de: 'Küsschen' },
      title: { it: 'Bacio sulla guancia', en: 'Kiss on the cheek', es: 'Beso en la mejilla', fr: 'Bisou sur la joue', de: 'Kuss auf die Wange' },
      desc: {
        it: 'A chi vuoi tu (se è d’accordo).',
        en: 'To anyone you like (if they agree).',
        es: 'A quien tú quieras (si le parece bien).',
        fr: 'À qui tu veux (s’il est d’accord).',
        de: 'Für jemanden deiner Wahl (wenn er oder sie einverstanden ist).',
      },
    },
    DOUBLE('#ff9a3d'),
    {
      kind: 'dare',
      n: 2,
      color: '#7a0f3a',
      icon: '😎',
      label: { it: 'Sexy', en: 'Sexy', es: 'Sexy', fr: 'Sexy', de: 'Sexy' },
      title: { it: 'Faccia sexy', en: 'Sexy face', es: 'Cara sexy', fr: 'Tête sexy', de: 'Sexy Blick' },
      desc: {
        it: 'La tua faccia più sexy per 5 secondi, senza ridere.',
        en: 'Your sexiest face for 5 seconds, no laughing.',
        es: 'Tu cara más sexy durante 5 segundos, sin reírte.',
        fr: 'Ta tête la plus sexy pendant 5 secondes, sans rire.',
        de: 'Dein sexiest Blick für 5 Sekunden, ohne zu lachen.',
      },
    },
  ],
}

// ---------------------------------------------------------------- seasonal presets

const XMAS: Preset = {
  id: 'xmas',
  emoji: '🎄',
  seasonal: true,
  name: { it: 'Natale', en: 'Christmas', es: 'Navidad', fr: 'Noël', de: 'Weihnachten' },
  slices: [
    {
      kind: 'drink',
      n: 1,
      color: '#e8283c',
      icon: '',
      title: { it: 'Carbone! 🪨', en: 'Lump of coal! 🪨', es: '¡Carbón! 🪨', fr: 'Du charbon ! 🪨', de: 'Kohle! 🪨' },
      desc: {
        it: 'Quest’anno sei stato cattivo.',
        en: 'You’ve been naughty this year.',
        es: 'Este año te has portado mal.',
        fr: 'Tu as été vilain cette année.',
        de: 'Du warst dieses Jahr unartig.',
      },
    },
    {
      kind: 'give',
      n: 2,
      color: '#1fa34a',
      icon: '🎁',
      title: { it: 'Regalo sotto l’albero', en: 'Gift under the tree', es: 'Regalo bajo el árbol', fr: 'Cadeau sous le sapin', de: 'Geschenk unterm Baum' },
      desc: {
        it: 'Scartalo e consegnalo a chi vuoi.',
        en: 'Unwrap it and hand it to anyone you like.',
        es: 'Desenvuélvelo y dáselo a quien quieras.',
        fr: 'Déballe-le et offre-le à qui tu veux.',
        de: 'Pack es aus und schenk es, wem du willst.',
      },
    },
    SAFE('#e9f4ff', { it: 'Bravo bambino! 😇', en: 'Nice list! 😇', es: '¡Lista de los buenos! 😇', fr: 'Liste des sages ! 😇', de: 'Brav gewesen! 😇' }),
    {
      kind: 'dare',
      n: 2,
      color: '#ff3d3d',
      icon: '🎅',
      label: { it: 'Babbo', en: 'Santa', es: 'Papá Noel', fr: 'Père Noël', de: 'Santa' },
      title: { it: 'Oh oh oh!', en: 'Ho ho ho!', es: '¡Jo jo jo!', fr: 'Oh oh oh !', de: 'Ho ho ho!' },
      desc: {
        it: 'Fai il Babbo Natale più convincente che puoi: risata, pancia e tutto.',
        en: 'Do your most convincing Santa: laugh, belly and all.',
        es: 'Haz el Papá Noel más convincente que puedas: risa, barriga y todo.',
        fr: 'Fais le Père Noël le plus crédible possible : rire, bedaine et tout.',
        de: 'Gib den überzeugendsten Weihnachtsmann: Lachen, Bauch, alles.',
      },
    },
    {
      kind: 'game',
      n: 2,
      color: '#ffd23d',
      icon: '🎶',
      label: { it: 'Canto', en: 'Carol', es: 'Villancico', fr: 'Chant', de: 'Lied' },
      title: { it: 'Canto di Natale', en: 'Christmas carol', es: 'Villancico', fr: 'Chant de Noël', de: 'Weihnachtslied' },
      desc: {
        it: 'Attacca una canzone di Natale, a giro ognuno continua con una riga. Chi sbaglia paga.',
        en: 'Start a Christmas song, everyone adds a line in turn. Whoever flubs it pays.',
        es: 'Empieza un villancico y cada uno sigue con una frase. Quien falle paga.',
        fr: 'Lance un chant de Noël, chacun enchaîne une phrase. Qui se trompe paie.',
        de: 'Stimm ein Weihnachtslied an, reihum kommt je eine Zeile. Wer patzt, zahlt.',
      },
    },
    {
      kind: 'all',
      n: 1,
      color: '#c9a227',
      icon: '🥂',
      title: { it: 'Brindisi di Natale', en: 'Christmas toast', es: 'Brindis navideño', fr: 'Toast de Noël', de: 'Weihnachtstoast' },
      desc: {
        it: 'Tutti insieme: auguri!',
        en: 'All together: Merry Christmas!',
        es: 'Todos juntos: ¡Feliz Navidad!',
        fr: 'Tous ensemble : Joyeux Noël !',
        de: 'Alle zusammen: Frohe Weihnachten!',
      },
    },
    {
      kind: 'rule',
      color: '#2e8b57',
      icon: '🦌',
      label: { it: 'Renna', en: 'Reindeer', es: 'Reno', fr: 'Renne', de: 'Rentier' },
      title: { it: 'Regola della renna', en: 'Reindeer rule', es: 'Regla del reno', fr: 'Règle du renne', de: 'Rentier-Regel' },
      desc: {
        it: 'Fino al prossimo giro chi dice “Natale” deve fare le corna da renna. Chi se ne dimentica paga.',
        en: 'Until the next spin, anyone who says “Christmas” must do reindeer antlers. Forget and pay.',
        es: 'Hasta el próximo giro, quien diga “Navidad” tiene que hacer cuernos de reno. Quien se olvide paga.',
        fr: 'Jusqu’au prochain tour, qui dit « Noël » doit faire des bois de renne. Qui oublie paie.',
        de: 'Bis zum nächsten Dreh: Wer „Weihnachten“ sagt, macht ein Rentiergeweih. Wer’s vergisst, zahlt.',
      },
    },
    {
      kind: 'swap',
      color: '#7fd8ff',
      icon: '🎁',
      label: { it: 'Scambio', en: 'Swap', es: 'Intercambio', fr: 'Échange', de: 'Wichteln' },
      title: { it: 'Babbo Natale segreto', en: 'Secret Santa', es: 'Amigo invisible', fr: 'Père Noël secret', de: 'Wichteln' },
      desc: {
        it: 'Scambia il posto con {name}: è il tuo regalo.',
        en: 'Swap seats with {name}: that’s your present.',
        es: 'Cámbiate de sitio con {name}: es tu regalo.',
        fr: 'Échange ta place avec {name} : c’est ton cadeau.',
        de: 'Tausch den Platz mit {name}: Das ist dein Geschenk.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#3dff8b',
      icon: '🎄',
      label: { it: 'Albero', en: 'Tree', es: 'Árbol', fr: 'Sapin', de: 'Baum' },
      title: { it: 'Fai l’albero!', en: 'Be the tree!', es: '¡Sé el árbol!', fr: 'Fais le sapin !', de: 'Sei der Baum!' },
      desc: {
        it: 'Posa da albero di Natale per 20 secondi: braccia a punta e sorriso luminoso.',
        en: 'Strike a Christmas tree pose for 20 seconds: pointy arms, glowing smile.',
        es: 'Posa de árbol de Navidad 20 segundos: brazos en punta y sonrisa brillante.',
        fr: 'Prends la pose du sapin 20 secondes : bras en pointe, sourire lumineux.',
        de: '20 Sekunden Weihnachtsbaum-Pose: spitze Arme, strahlendes Lächeln.',
      },
    },
    {
      kind: 'drink',
      n: 3,
      color: '#8b1020',
      icon: '',
      title: { it: 'Abbuffata di Natale 🍗', en: 'Feast overload 🍗', es: 'Atracón navideño 🍗', fr: 'Indigestion de Noël 🍗', de: 'Festessen-Koma 🍗' },
      desc: {
        it: 'Hai esagerato col cenone.',
        en: 'You overdid the Christmas dinner.',
        es: 'Te pasaste con la cena de Nochebuena.',
        fr: 'Tu as abusé du réveillon.',
        de: 'Du hast es beim Festessen übertrieben.',
      },
    },
    {
      kind: 'game',
      n: 1,
      color: '#b5e3ff',
      icon: '❄️',
      label: { it: 'Ghiaccio', en: 'Freeze', es: 'Hielo', fr: 'Glace', de: 'Eis' },
      title: { it: 'Statue di ghiaccio', en: 'Freeze!', es: '¡Congelados!', fr: 'Statues de glace', de: 'Eisstatuen' },
      desc: {
        it: 'Tutti immobili come statue di ghiaccio: il primo che si muove o ride paga.',
        en: 'Everyone freeze like ice statues: first to move or laugh pays.',
        es: 'Todos quietos como estatuas de hielo: el primero que se mueva o se ría paga.',
        fr: 'Tout le monde se fige en statue de glace : le premier qui bouge ou rit paie.',
        de: 'Alle erstarren zu Eisstatuen: Wer sich zuerst bewegt oder lacht, zahlt.',
      },
    },
    {
      kind: 'give',
      n: 1,
      color: '#ff8fb1',
      icon: '🧝',
      title: { it: 'Elfo aiutante', en: 'Elf helper', es: 'Elfo ayudante', fr: 'Lutin assistant', de: 'Wichtelhelfer' },
      desc: {
        it: 'Il tuo elfo lavora per te: scegli chi paga.',
        en: 'Your elf does the work: pick who pays.',
        es: 'Tu elfo trabaja por ti: elige quién paga.',
        fr: 'Ton lutin bosse pour toi : choisis qui paie.',
        de: 'Dein Wichtel erledigt das: Such aus, wer zahlt.',
      },
    },
  ],
}

const NYE: Preset = {
  id: 'nye',
  emoji: '🎆',
  seasonal: true,
  name: { it: 'Capodanno', en: 'New Year', es: 'Nochevieja', fr: 'Nouvel An', de: 'Silvester' },
  slices: [
    {
      kind: 'all',
      n: 1,
      color: '#ffd23d',
      icon: '🥂',
      title: { it: 'Mezzanotte! 🎆', en: 'Midnight! 🎆', es: '¡Medianoche! 🎆', fr: 'Minuit ! 🎆', de: 'Mitternacht! 🎆' },
      desc: {
        it: 'Conto alla rovescia da 10 tutti insieme, poi brindisi.',
        en: 'Count down from 10 together, then toast.',
        es: 'Cuenta atrás desde 10 todos juntos y brindis.',
        fr: 'Compte à rebours de 10 tous ensemble, puis on trinque.',
        de: 'Gemeinsam von 10 runterzählen, dann anstoßen.',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#7b5cff',
      icon: '📜',
      label: { it: 'Propositi', en: 'Resolution', es: 'Propósito', fr: 'Résolution', de: 'Vorsatz' },
      title: { it: 'Buoni propositi', en: 'New Year’s resolution', es: 'Propósito de año nuevo', fr: 'Bonne résolution', de: 'Neujahrsvorsatz' },
      desc: {
        it: 'Annuncia solennemente il tuo proposito per l’anno nuovo. Il tavolo è testimone.',
        en: 'Solemnly announce your New Year’s resolution. The table is your witness.',
        es: 'Anuncia solemnemente tu propósito de año nuevo. La mesa es testigo.',
        fr: 'Annonce solennellement ta bonne résolution. La table est témoin.',
        de: 'Verkünde feierlich deinen Neujahrsvorsatz. Der Tisch ist Zeuge.',
      },
    },
    {
      kind: 'drink',
      n: 2,
      color: '#ff3d8b',
      icon: '',
      title: { it: 'Bilancio dell’anno', en: 'Year in review', es: 'Balance del año', fr: 'Bilan de l’année', de: 'Jahresrückblick' },
      desc: {
        it: 'Ripensa alla tua figuraccia peggiore dell’anno.',
        en: 'Think back on your most embarrassing moment of the year.',
        es: 'Recuerda tu momento más vergonzoso del año.',
        fr: 'Repense à ta pire honte de l’année.',
        de: 'Denk an deinen peinlichsten Moment des Jahres.',
      },
    },
    SAFE('#3dd6ff', { it: 'Anno fortunato! 🍀', en: 'Lucky year! 🍀', es: '¡Año de suerte! 🍀', fr: 'Année chanceuse ! 🍀', de: 'Glücksjahr! 🍀' }),
    {
      kind: 'give',
      n: 2,
      color: '#ff8a3d',
      icon: '🧨',
      title: { it: 'Botto!', en: 'Firecracker!', es: '¡Petardo!', fr: 'Pétard !', de: 'Böller!' },
      desc: {
        it: 'Lancia il petardo verso chi vuoi.',
        en: 'Toss the firecracker at anyone you like.',
        es: 'Lánzale el petardo a quien quieras.',
        fr: 'Lance le pétard sur qui tu veux.',
        de: 'Wirf den Böller, auf wen du willst.',
      },
    },
    {
      kind: 'game',
      n: 2,
      color: '#3dff8b',
      icon: '🍇',
      label: { it: '12 cose', en: '12 things', es: '12 uvas', fr: '12 choses', de: '12 Dinge' },
      title: { it: 'I 12 chicchi', en: 'The 12 grapes', es: 'Las 12 uvas', fr: 'Les 12 raisins', de: 'Die 12 Trauben' },
      desc: {
        it: 'Come i 12 chicchi d’uva spagnoli: a giro dite una cosa bella dell’anno, fino a 12. Chi si blocca paga.',
        en: 'Like Spain’s 12 grapes: go around naming one good thing from this year, up to 12. Whoever freezes pays.',
        es: 'Como las 12 uvas: por turnos decid una cosa buena del año, hasta 12. Quien se bloquee paga.',
        fr: 'Comme les 12 raisins espagnols : chacun cite une bonne chose de l’année, jusqu’à 12. Qui bloque paie.',
        de: 'Wie die 12 Trauben in Spanien: Reihum je eine schöne Sache des Jahres, bis 12. Wer hängt, zahlt.',
      },
    },
    {
      kind: 'rule',
      color: '#c6ff3d',
      icon: '📅',
      label: { it: 'Regola', en: 'Rule', es: 'Regla', fr: 'Règle', de: 'Regel' },
      title: { it: 'Regola dell’anno nuovo', en: 'New Year rule', es: 'Regla de año nuevo', fr: 'Règle du Nouvel An', de: 'Neujahrsregel' },
      desc: {
        it: 'Inventa una regola che vale fino a mezzanotte (o fino alla prossima regola).',
        en: 'Make up a rule that lasts until midnight (or the next rule).',
        es: 'Inventa una regla que dura hasta medianoche (o hasta la próxima regla).',
        fr: 'Invente une règle valable jusqu’à minuit (ou jusqu’à la prochaine règle).',
        de: 'Erfinde eine Regel, die bis Mitternacht gilt (oder bis zur nächsten Regel).',
      },
    },
    {
      kind: 'dare',
      n: 2,
      color: '#ff3df0',
      icon: '💃',
      label: { it: 'Balla', en: 'Dance', es: 'Baila', fr: 'Danse', de: 'Tanz' },
      title: { it: 'Primo ballo dell’anno', en: 'First dance of the year', es: 'Primer baile del año', fr: 'Première danse de l’année', de: 'Erster Tanz des Jahres' },
      desc: {
        it: 'Balla 15 secondi con {name}, la musica la sceglie il tavolo.',
        en: 'Dance for 15 seconds with {name}; the table picks the music.',
        es: 'Baila 15 segundos con {name}; la música la elige la mesa.',
        fr: 'Danse 15 secondes avec {name} ; la table choisit la musique.',
        de: 'Tanz 15 Sekunden mit {name}; die Musik sucht der Tisch aus.',
      },
    },
    {
      kind: 'drink',
      n: 3,
      color: '#3a2a6a',
      icon: '',
      title: { it: 'Modalità 1° gennaio', en: 'January 1st mode', es: 'Modo 1 de enero', fr: 'Mode 1er janvier', de: 'Neujahrsmodus' },
      desc: {
        it: 'Sei già in modalità divano e pigiama.',
        en: 'You’re already in sofa-and-pyjamas mode.',
        es: 'Ya estás en modo sofá y pijama.',
        fr: 'Tu es déjà en mode canapé-pyjama.',
        de: 'Du bist schon im Sofa-und-Schlafanzug-Modus.',
      },
    },
    {
      kind: 'swap',
      color: '#ff5c5c',
      icon: '🎊',
      label: { it: 'Cambio', en: 'Swap', es: 'Cambio', fr: 'Échange', de: 'Tausch' },
      title: { it: 'Anno nuovo, posto nuovo', en: 'New year, new seat', es: 'Año nuevo, sitio nuevo', fr: 'Nouvel an, nouvelle place', de: 'Neues Jahr, neuer Platz' },
      desc: {
        it: 'Scambia il posto con {name}.',
        en: 'Swap seats with {name}.',
        es: 'Cámbiate de sitio con {name}.',
        fr: 'Échange ta place avec {name}.',
        de: 'Tausch den Platz mit {name}.',
      },
    },
    DOUBLE('#ffb000'),
    {
      kind: 'game',
      n: 1,
      color: '#3d7bff',
      icon: '🔮',
      label: { it: 'Oroscopo', en: 'Horoscope', es: 'Horóscopo', fr: 'Horoscope', de: 'Horoskop' },
      title: { it: 'Oroscopo del tavolo', en: 'Table horoscope', es: 'Horóscopo de la mesa', fr: 'Horoscope de la table', de: 'Tisch-Horoskop' },
      desc: {
        it: 'Fai una previsione sull’anno di {name}: se ride paga lui, altrimenti paghi tu.',
        en: 'Predict {name}’s year: if they laugh they pay, otherwise you do.',
        es: 'Predice el año de {name}: si se ríe paga, si no pagas tú.',
        fr: 'Prédis l’année de {name} : s’il rit il paie, sinon c’est toi.',
        de: 'Sag {name} das neue Jahr voraus: Lacht die Person, zahlt sie, sonst du.',
      },
    },
  ],
}

export const PRESETS: Preset[] = [CLASSIC, XMAS, NYE, CHAOS, SOFT, SPICY]

export const MINI_CHALLENGES: Loc[] = [
  {
    it: 'Ripeti 3 volte veloce: “Trentatré trentini entrarono a Trento tutti e trentatré trotterellando”.',
    en: 'Say it 3 times fast: “Red lorry, yellow lorry”.',
    es: 'Dilo 3 veces rápido: “Tres tristes tigres tragaban trigo en un trigal”.',
    fr: 'Dis-le 3 fois vite : « Les chaussettes de l’archiduchesse sont-elles sèches ? »',
    de: 'Sag es 3-mal schnell: „Fischers Fritz fischt frische Fische“.',
  },
  {
    it: 'Stai su un piede a occhi chiusi per 15 secondi.',
    en: 'Stand on one foot with your eyes closed for 15 seconds.',
    es: 'Aguanta a la pata coja con los ojos cerrados 15 segundos.',
    fr: 'Tiens sur un pied les yeux fermés pendant 15 secondes.',
    de: 'Steh 15 Sekunden mit geschlossenen Augen auf einem Bein.',
  },
  {
    it: 'Fai ridere {name} in 30 secondi, senza toccarlo.',
    en: 'Make {name} laugh within 30 seconds, no touching.',
    es: 'Haz reír a {name} en 30 segundos, sin tocar.',
    fr: 'Fais rire {name} en 30 secondes, sans le toucher.',
    de: 'Bring {name} in 30 Sekunden zum Lachen, ohne Berührung.',
  },
  {
    it: 'Elenca 5 capitali europee in 10 secondi.',
    en: 'Name 5 European capitals in 10 seconds.',
    es: 'Di 5 capitales europeas en 10 segundos.',
    fr: 'Cite 5 capitales européennes en 10 secondes.',
    de: 'Nenne 5 europäische Hauptstädte in 10 Sekunden.',
  },
  {
    it: 'Parla in rima fino al prossimo giro.',
    en: 'Speak only in rhymes until the next spin.',
    es: 'Habla en rima hasta el próximo giro.',
    fr: 'Parle en rimes jusqu’au prochain tour.',
    de: 'Sprich bis zum nächsten Dreh nur in Reimen.',
  },
  {
    it: 'Dì 3 cose belle di chi ti siede a sinistra.',
    en: 'Say 3 nice things about the person on your left.',
    es: 'Di 3 cosas bonitas de quien está a tu izquierda.',
    fr: 'Dis 3 choses gentilles sur la personne à ta gauche.',
    de: 'Sag 3 nette Dinge über die Person links von dir.',
  },
  {
    it: 'Fai la faccia più buffa che puoi e tienila 10 secondi.',
    en: 'Pull your funniest face and hold it for 10 seconds.',
    es: 'Pon la cara más graciosa que puedas y aguántala 10 segundos.',
    fr: 'Fais la grimace la plus drôle possible et tiens-la 10 secondes.',
    de: 'Zieh die lustigste Grimasse und halte sie 10 Sekunden.',
  },
  {
    it: 'Imita una celebrità finché qualcuno non indovina.',
    en: 'Impersonate a celebrity until someone guesses.',
    es: 'Imita a un famoso hasta que alguien lo adivine.',
    fr: 'Imite une célébrité jusqu’à ce que quelqu’un devine.',
    de: 'Imitiere einen Promi, bis jemand ihn errät.',
  },
  {
    it: '10 secondi di beatbox senza fermarti.',
    en: '10 seconds of non-stop beatbox.',
    es: '10 segundos de beatbox sin parar.',
    fr: '10 secondes de beatbox sans t’arrêter.',
    de: '10 Sekunden Beatbox ohne Pause.',
  },
  {
    it: 'Fai 10 squat cantando una canzone a scelta.',
    en: 'Do 10 squats while singing a song of your choice.',
    es: 'Haz 10 sentadillas cantando la canción que quieras.',
    fr: 'Fais 10 squats en chantant une chanson de ton choix.',
    de: 'Mach 10 Kniebeugen und sing dabei einen Song deiner Wahl.',
  },
]
