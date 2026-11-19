import { useApp } from './store'

export const LANGS = ['it', 'en', 'es', 'fr', 'de'] as const
export type Lang = (typeof LANGS)[number]

export const LANG_LABELS: Record<Lang, string> = {
  it: '🇮🇹 Italiano',
  en: '🇬🇧 English',
  es: '🇪🇸 Español',
  fr: '🇫🇷 Français',
  de: '🇩🇪 Deutsch',
}

/** A value translated per language. `en` is mandatory and used as fallback. */
export type Loc<T = string> = { en: T } & Partial<Record<Lang, T>>

export function loc<T>(value: Loc<T>, lang: Lang): T {
  return value[lang] ?? value.en
}

export function detectLang(): Lang {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'it').slice(0, 2)
  return (LANGS as readonly string[]).includes(nav) ? (nav as Lang) : 'en'
}

/** Replaces {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`))
}

const UI = {
  appTagline: {
    it: 'Party game 3D per serate epiche',
    en: '3D party games for legendary nights',
    es: 'Juegos de fiesta 3D para noches épicas',
    fr: 'Jeux de soirée 3D pour des nuits épiques',
    de: '3D-Partyspiele für legendäre Nächte',
  },
  play: { it: 'Gioca', en: 'Play', es: 'Jugar', fr: 'Jouer', de: 'Spielen' },
  back: { it: 'Indietro', en: 'Back', es: 'Atrás', fr: 'Retour', de: 'Zurück' },
  rules: { it: 'Regole', en: 'Rules', es: 'Reglas', fr: 'Règles', de: 'Regeln' },
  next: { it: 'Avanti', en: 'Next', es: 'Siguiente', fr: 'Suivant', de: 'Weiter' },
  again: { it: 'Ancora!', en: 'Again!', es: '¡Otra vez!', fr: 'Encore !', de: 'Nochmal!' },
  start: { it: 'Inizia', en: 'Start', es: 'Empezar', fr: 'Commencer', de: 'Start' },
  close: { it: 'Chiudi', en: 'Close', es: 'Cerrar', fr: 'Fermer', de: 'Schließen' },
  players: { it: 'Giocatori', en: 'Players', es: 'Jugadores', fr: 'Joueurs', de: 'Spieler' },
  addPlayer: { it: 'Aggiungi giocatore', en: 'Add player', es: 'Añadir jugador', fr: 'Ajouter un joueur', de: 'Spieler hinzufügen' },
  playerName: { it: 'Nome', en: 'Name', es: 'Nombre', fr: 'Nom', de: 'Name' },
  needPlayers: {
    it: 'Servono almeno {n} giocatori',
    en: 'You need at least {n} players',
    es: 'Se necesitan al menos {n} jugadores',
    fr: 'Il faut au moins {n} joueurs',
    de: 'Mindestens {n} Spieler nötig',
  },
  letsGo: { it: 'Si parte! 🚀', en: "Let's go! 🚀", es: '¡Vamos! 🚀', fr: "C'est parti ! 🚀", de: "Los geht's! 🚀" },
  settings: { it: 'Impostazioni', en: 'Settings', es: 'Ajustes', fr: 'Réglages', de: 'Einstellungen' },
  language: { it: 'Lingua', en: 'Language', es: 'Idioma', fr: 'Langue', de: 'Sprache' },
  penaltyMode: { it: 'Penalità', en: 'Penalty', es: 'Castigo', fr: 'Pénalité', de: 'Strafe' },
  modeSips: { it: '🍺 Sorsi', en: '🍺 Sips', es: '🍺 Tragos', fr: '🍺 Gorgées', de: '🍺 Schlucke' },
  modePoints: { it: '🥤 Analcolico (punti)', en: '🥤 Alcohol-free (points)', es: '🥤 Sin alcohol (puntos)', fr: '🥤 Sans alcool (points)', de: '🥤 Alkoholfrei (Punkte)' },
  modeDares: { it: '😈 Penitenze', en: '😈 Dares', es: '😈 Retos', fr: '😈 Gages', de: '😈 Mutproben' },
  spicy: { it: 'Contenuti piccanti 🌶️', en: 'Spicy content 🌶️', es: 'Contenido picante 🌶️', fr: 'Contenu épicé 🌶️', de: 'Scharfe Inhalte 🌶️' },
  sound: { it: 'Suoni', en: 'Sound', es: 'Sonido', fr: 'Son', de: 'Ton' },
  vibration: { it: 'Vibrazione', en: 'Vibration', es: 'Vibración', fr: 'Vibration', de: 'Vibration' },
  lowPower: { it: 'Modalità risparmio', en: 'Battery saver', es: 'Modo ahorro', fr: 'Mode économie', de: 'Energiesparmodus' },
  lowPowerSub: {
    it: 'Grafica più leggera per telefoni lenti',
    en: 'Lighter graphics for slower phones',
    es: 'Gráficos más ligeros para móviles lentos',
    fr: 'Graphismes allégés pour les téléphones lents',
    de: 'Leichtere Grafik für langsamere Handys',
  },
  on: { it: 'Sì', en: 'On', es: 'Sí', fr: 'Oui', de: 'An' },
  off: { it: 'No', en: 'Off', es: 'No', fr: 'Non', de: 'Aus' },
  allGames: { it: 'Tutti i giochi', en: 'All games', es: 'Todos los juegos', fr: 'Tous les jeux', de: 'Alle Spiele' },
  classic: { it: 'Classici', en: 'Classics', es: 'Clásicos', fr: 'Classiques', de: 'Klassiker' },
  party: { it: 'Party', en: 'Party', es: 'Fiesta', fr: 'Soirée', de: 'Party' },
  skill: { it: 'Sfida', en: 'Skill', es: 'Habilidad', fr: 'Défi', de: 'Geschick' },
  newBadge: { it: 'NUOVO', en: 'NEW', es: 'NUEVO', fr: 'NOUVEAU', de: 'NEU' },
  comingIn: { it: 'Arriva tra {n} gg', en: 'Out in {n}d', es: 'Llega en {n} d', fr: 'Dans {n} j', de: 'In {n} T.' },
  comingSoon: { it: 'In arrivo', en: 'Coming soon', es: 'Muy pronto', fr: 'Bientôt', de: 'Bald' },
  suggestGame: { it: 'Proponi un gioco', en: 'Suggest a game', es: 'Propón un juego', fr: 'Propose un jeu', de: 'Spiel vorschlagen' },
  suggestSub: {
    it: 'Spiega le regole, noi lo trasformiamo in 3D',
    en: 'Explain the rules, we turn it into 3D',
    es: 'Explica las reglas, nosotros lo hacemos 3D',
    fr: 'Explique les règles, on le fait en 3D',
    de: 'Erklär die Regeln, wir machen es 3D',
  },
  ageTitle: { it: 'Hai almeno 18 anni?', en: 'Are you 18 or older?', es: '¿Tienes 18 años o más?', fr: 'As-tu 18 ans ou plus ?', de: 'Bist du mindestens 18?' },
  ageBody: {
    it: 'Brindy è un party game per adulti. Gioca responsabilmente: puoi sempre usare la modalità analcolica. Non guidare se hai bevuto.',
    en: 'Brindy is a party game for adults. Play responsibly: you can always switch to alcohol-free mode. Never drink and drive.',
    es: 'Brindy es un juego de fiesta para adultos. Juega con responsabilidad: siempre puedes usar el modo sin alcohol. No conduzcas si has bebido.',
    fr: "Brindy est un jeu de soirée pour adultes. Joue de façon responsable : tu peux toujours passer en mode sans alcool. Ne conduis jamais après avoir bu.",
    de: 'Brindy ist ein Partyspiel für Erwachsene. Spiel verantwortungsvoll: Du kannst jederzeit den alkoholfreien Modus nutzen. Nie betrunken fahren.',
  },
  ageYes: { it: 'Sì, ho 18+ anni', en: "Yes, I'm 18+", es: 'Sí, tengo 18+', fr: "Oui, j'ai 18+", de: 'Ja, ich bin 18+' },
  ageNo: { it: 'No', en: 'No', es: 'No', fr: 'Non', de: 'Nein' },
  ageDenied: {
    it: 'Torna quando sarai maggiorenne! 👋',
    en: 'Come back when you are 18! 👋',
    es: '¡Vuelve cuando tengas 18! 👋',
    fr: 'Reviens quand tu auras 18 ans ! 👋',
    de: 'Komm wieder, wenn du 18 bist! 👋',
  },
  responsible: {
    it: 'Gioca responsabilmente · Bevi acqua · Non guidare',
    en: 'Play responsibly · Drink water · Never drink & drive',
    es: 'Juega con responsabilidad · Bebe agua · No conduzcas',
    fr: "Joue responsable · Bois de l'eau · Ne conduis pas",
    de: 'Verantwortungsvoll spielen · Wasser trinken · Nicht fahren',
  },
  adTitle: { it: 'Pubblicità', en: 'Advertisement', es: 'Publicidad', fr: 'Publicité', de: 'Werbung' },
  adSkip: { it: 'Salta', en: 'Skip', es: 'Saltar', fr: 'Passer', de: 'Überspringen' },
  adSkipIn: { it: 'Salta tra {n}', en: 'Skip in {n}', es: 'Saltar en {n}', fr: 'Passer dans {n}', de: 'Überspringen in {n}' },
  locked: { it: 'Pacchetto bloccato', en: 'Pack locked', es: 'Pack bloqueado', fr: 'Pack verrouillé', de: 'Paket gesperrt' },
  unlockTonight: {
    it: '🎬 Guarda un video: sbloccato per stanotte',
    en: '🎬 Watch a video: unlocked for tonight',
    es: '🎬 Mira un vídeo: desbloqueado esta noche',
    fr: '🎬 Regarde une vidéo : débloqué ce soir',
    de: '🎬 Video ansehen: heute Nacht freigeschaltet',
  },
  unlockForever: { it: '💎 Sblocca per sempre', en: '💎 Unlock forever', es: '💎 Desbloquear siempre', fr: '💎 Débloquer pour toujours', de: '💎 Für immer freischalten' },
  removeAds: { it: 'Rimuovi pubblicità', en: 'Remove ads', es: 'Quitar anuncios', fr: 'Retirer les pubs', de: 'Werbung entfernen' },
  turnOf: { it: 'Tocca a', en: "It's", es: 'Le toca a', fr: "C'est à", de: 'Dran ist' },
  tapToContinue: { it: 'Tocca per continuare', en: 'Tap to continue', es: 'Toca para continuar', fr: 'Touche pour continuer', de: 'Tippen zum Fortfahren' },
  everyone: { it: 'Tutti', en: 'Everyone', es: 'Todos', fr: 'Tout le monde', de: 'Alle' },
  // common game words
  round: { it: 'Round {n}', en: 'Round {n}', es: 'Ronda {n}', fr: 'Manche {n}', de: 'Runde {n}' },
  newRound: { it: 'Nuovo round', en: 'New round', es: 'Nueva ronda', fr: 'Nouvelle manche', de: 'Neue Runde' },
  pass: { it: 'Passa', en: 'Pass', es: 'Pasa', fr: 'Passe', de: 'Weiter' },
  category: { it: 'Categoria', en: 'Category', es: 'Categoría', fr: 'Catégorie', de: 'Kategorie' },
  startsWith: { it: 'Inizia per', en: 'Starts with', es: 'Empieza por', fr: 'Commence par', de: 'Beginnt mit' },
  timeUp: { it: 'Tempo scaduto! ⏰', en: "Time's up! ⏰", es: '¡Se acabó el tiempo! ⏰', fr: 'Temps écoulé ! ⏰', de: 'Zeit um! ⏰' },
  loser: { it: 'Chi perde', en: 'Loser', es: 'Quien pierda', fr: 'Le perdant', de: 'Verlierer' },
  winner: { it: 'Vincitore', en: 'Winner', es: 'Ganador', fr: 'Gagnant', de: 'Gewinner' },
  tie: { it: 'Pareggio', en: 'Tie', es: 'Empate', fr: 'Égalité', de: 'Gleichstand' },
  // penalties
  drinkSip: { it: 'Bevi 1 sorso', en: 'Drink 1 sip', es: 'Bebe 1 trago', fr: 'Bois 1 gorgée', de: 'Trink 1 Schluck' },
  drinkSips: { it: 'Bevi {n} sorsi', en: 'Drink {n} sips', es: 'Bebe {n} tragos', fr: 'Bois {n} gorgées', de: 'Trink {n} Schlucke' },
  giveSip: { it: 'Dai 1 sorso', en: 'Give 1 sip', es: 'Reparte 1 trago', fr: 'Distribue 1 gorgée', de: 'Verteil 1 Schluck' },
  giveSips: { it: 'Dai {n} sorsi', en: 'Give {n} sips', es: 'Reparte {n} tragos', fr: 'Distribue {n} gorgées', de: 'Verteil {n} Schlucke' },
  allDrink: { it: 'Tutti bevono {n}', en: 'Everyone drinks {n}', es: 'Todos beben {n}', fr: 'Tout le monde boit {n}', de: 'Alle trinken {n}' },
  shot: { it: 'SHOT! 🥃', en: 'SHOT! 🥃', es: '¡CHUPITO! 🥃', fr: 'SHOT ! 🥃', de: 'SHOT! 🥃' },
  takePoint: { it: '+1 punto penalità', en: '+1 penalty point', es: '+1 punto de castigo', fr: '+1 point de pénalité', de: '+1 Strafpunkt' },
  takePoints: { it: '+{n} punti penalità', en: '+{n} penalty points', es: '+{n} puntos de castigo', fr: '+{n} points de pénalité', de: '+{n} Strafpunkte' },
  givePoints: { it: 'Assegna {n} punti', en: 'Assign {n} points', es: 'Asigna {n} puntos', fr: 'Donne {n} points', de: 'Vergib {n} Punkte' },
  allPoints: { it: 'Tutti +{n} punti', en: 'Everyone +{n} points', es: 'Todos +{n} puntos', fr: 'Tout le monde +{n} points', de: 'Alle +{n} Punkte' },
  doDare: { it: 'Penitenza: {d}', en: 'Dare: {d}', es: 'Reto: {d}', fr: 'Gage : {d}', de: 'Mutprobe: {d}' },
  giveDare: { it: 'Scegli chi fa una penitenza', en: 'Pick someone for a dare', es: 'Elige a quien hace un reto', fr: 'Choisis qui fait un gage', de: 'Wähle wer eine Mutprobe macht' },
  allDare: { it: 'Tutti fanno: {d}', en: 'Everyone: {d}', es: 'Todos: {d}', fr: 'Tout le monde : {d}', de: 'Alle: {d}' },
  // submit form
  submitTitle: { it: 'Proponi il tuo gioco', en: 'Suggest your game', es: 'Propón tu juego', fr: 'Propose ton jeu', de: 'Schlag dein Spiel vor' },
  submitIntro: {
    it: 'Hai un gioco che fate sempre con gli amici? Raccontacelo. I più votati diventano giochi 3D nell’app, con il tuo nome nei crediti!',
    en: 'Got a game you always play with friends? Tell us. The best ones become 3D games in the app, with your name in the credits!',
    es: '¿Tienes un juego que siempre jugáis con amigos? Cuéntanoslo. Los mejores se convierten en juegos 3D, ¡con tu nombre en los créditos!',
    fr: 'Tu as un jeu que vous faites toujours entre amis ? Raconte-le. Les meilleurs deviennent des jeux 3D, avec ton nom dans les crédits !',
    de: 'Ihr habt ein Spiel, das ihr immer spielt? Erzähl es uns. Die besten werden 3D-Spiele in der App – mit deinem Namen in den Credits!',
  },
  fGameName: { it: 'Nome del gioco', en: 'Game name', es: 'Nombre del juego', fr: 'Nom du jeu', de: 'Name des Spiels' },
  fRules: { it: 'Regole (spiega come a un amico)', en: 'Rules (explain like to a friend)', es: 'Reglas (explícalas como a un amigo)', fr: 'Règles (explique comme à un ami)', de: 'Regeln (erklär es wie einem Freund)' },
  fPlayers: { it: 'Quanti giocatori?', en: 'How many players?', es: '¿Cuántos jugadores?', fr: 'Combien de joueurs ?', de: 'Wie viele Spieler?' },
  fNeeds: { it: 'Cosa serve? (carte, dadi, niente…)', en: 'What do you need? (cards, dice, nothing…)', es: '¿Qué se necesita? (cartas, dados, nada…)', fr: 'Il faut quoi ? (cartes, dés, rien…)', de: 'Was braucht man? (Karten, Würfel, nichts…)' },
  fCountry: { it: 'Da dove viene il gioco?', en: 'Where is the game from?', es: '¿De dónde es el juego?', fr: "D'où vient le jeu ?", de: 'Woher kommt das Spiel?' },
  fNick: { it: 'Il tuo nickname (per i crediti)', en: 'Your nickname (for credits)', es: 'Tu apodo (para los créditos)', fr: 'Ton pseudo (pour les crédits)', de: 'Dein Nickname (für die Credits)' },
  fEmail: { it: 'Email (facoltativa, ti avvisiamo quando esce)', en: 'Email (optional, we tell you when it ships)', es: 'Email (opcional, te avisamos cuando salga)', fr: 'Email (facultatif, on te prévient à la sortie)', de: 'E-Mail (optional, wir sagen Bescheid)' },
  fConsent: {
    it: 'Confermo di avere 18+ anni e cedo a Brindy il diritto di usare l’idea nell’app.',
    en: 'I confirm I am 18+ and allow Brindy to use the idea in the app.',
    es: 'Confirmo que tengo 18+ y permito a Brindy usar la idea en la app.',
    fr: "Je confirme avoir 18+ et autorise Brindy à utiliser l'idée dans l'app.",
    de: 'Ich bestätige, 18+ zu sein, und erlaube Brindy, die Idee zu nutzen.',
  },
  fSend: { it: 'Invia proposta 🚀', en: 'Send idea 🚀', es: 'Enviar idea 🚀', fr: "Envoyer l'idée 🚀", de: 'Idee senden 🚀' },
  fThanks: {
    it: 'Grazie! 🍻 La tua proposta è arrivata. Se la facciamo, ti mettiamo nei crediti.',
    en: 'Thanks! 🍻 Your idea is in. If we build it, you go in the credits.',
    es: '¡Gracias! 🍻 Tu idea ha llegado. Si la hacemos, sales en los créditos.',
    fr: 'Merci ! 🍻 Ton idée est arrivée. Si on la fait, tu seras dans les crédits.',
    de: 'Danke! 🍻 Deine Idee ist da. Wenn wir sie bauen, kommst du in die Credits.',
  },
  fRequired: { it: 'Compila nome e regole', en: 'Fill in name and rules', es: 'Rellena nombre y reglas', fr: 'Remplis le nom et les règles', de: 'Name und Regeln ausfüllen' },
  credits: { it: 'Crediti', en: 'Credits', es: 'Créditos', fr: 'Crédits', de: 'Credits' },
} satisfies Record<string, Loc>

export type UIKey = keyof typeof UI

export function tr(key: UIKey, lang: Lang, vars?: Record<string, string | number>): string {
  return fmt(loc(UI[key] as Loc, lang), vars)
}

/** Hook: returns `t(key, vars)` for UI strings and `L(locValue)` for game content. */
export function useT() {
  const lang = useApp((s) => s.lang)
  return {
    lang,
    t: (key: UIKey, vars?: Record<string, string | number>) => tr(key, lang, vars),
    L: <T,>(value: Loc<T>) => loc(value, lang),
  }
}
