import type { Loc } from '../../core/i18n'
import { pick } from '../../core/random'

export const ACCENT = '#ffd23d'
/** Steps needed to win. */
export const GOAL = 7
export const STEP = 1.4
export const START_Z = -5
export const FINISH_Z = START_Z + GOAL * STEP
export const PODIUM_Z = FINISH_Z + 2.6
export const LANE_X = [-1.2, -0.4, 0.4, 1.2]
export const LANE_W = 0.8
export const TRACK_HALF = 1.6
/** Block tops for 1st/2nd/3rd: horses walk behind the podium, then hop up from the back. */
export const PODIUM_SPOTS = [
  { x: 0, y: 0.9, z: PODIUM_Z, yaw: 0, via: [0, PODIUM_Z - 1.2] as const, hop: true },
  { x: -0.95, y: 0.6, z: PODIUM_Z + 0.05, yaw: 0.12, via: [-0.95, PODIUM_Z - 1.2] as const, hop: true },
  { x: 0.95, y: 0.38, z: PODIUM_Z + 0.1, yaw: -0.12, via: [0.95, PODIUM_Z - 1.2] as const, hop: true },
]
/** Fourth place sulks on the ground beside the podium. */
export const LOSER_SPOT = { x: 1.66, y: 0, z: PODIUM_Z + 0.35, yaw: -0.4, via: [1.66, PODIUM_Z - 1.2] as const }
/** Classic "side cards": one per step before the finish. */
export const SIDE_COUNT = GOAL - 1

export interface SuitDef {
  sym: string
  /** Neon silk color. */
  color: string
  /** Darker ink for card faces on white. */
  ink: string
  coat: string
  mane: string
  name: Loc
}

export const SUITS: SuitDef[] = [
  {
    sym: '♠',
    color: '#3dd6ff',
    ink: '#0b6f8a',
    coat: '#26232c',
    mane: '#0d0c10',
    name: { it: 'Saetta', en: 'Lightning', es: 'Relámpago', fr: 'Éclair', de: 'Blitz' },
  },
  {
    sym: '♥',
    color: '#ff3d6e',
    ink: '#d81646',
    coat: '#ece6dc',
    mane: '#bdb3a6',
    name: { it: 'Rubacuori', en: 'Heartbreaker', es: 'Rompecorazones', fr: 'Tombeur', de: 'Herzensbrecher' },
  },
  {
    sym: '♦',
    color: '#ff9a2e',
    ink: '#d4600a',
    coat: '#a4532a',
    mane: '#5a2410',
    name: { it: 'Brillante', en: 'Bling', es: 'Brillante', fr: 'Bling-Bling', de: 'Glitzer' },
  },
  {
    sym: '♣',
    color: '#3dff8b',
    ink: '#11934a',
    coat: '#6e4528',
    mane: '#1c110a',
    name: { it: 'Quadrifoglio', en: 'Lucky Clover', es: 'Trébol', fr: 'Trèfle', de: 'Glücksklee' },
  },
]

export interface Card {
  suit: number
  rank: string
}

/** Aces are the horses, so the deck has 2..K of each suit. */
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const ALL_CARDS: Card[] = SUITS.flatMap((_, suit) => RANKS.map((rank) => ({ suit, rank })))

export const T = {
  betsTitle: { it: 'Fate il vostro gioco!', en: 'Place your bets!', es: '¡Hagan sus apuestas!', fr: 'Faites vos jeux !', de: 'Macht eure Einsätze!' },
  betsHint: {
    it: 'Tocca un cavallo e scegli la puntata (1-5)',
    en: 'Tap a horse and pick your bet (1-5)',
    es: 'Toca un caballo y elige tu apuesta (1-5)',
    fr: 'Touche un cheval et choisis ta mise (1-5)',
    de: 'Tipp ein Pferd an und wähl deinen Einsatz (1-5)',
  },
  go: { it: 'Via! 🏁', en: 'Go! 🏁', es: '¡Ya! 🏁', fr: 'Partez ! 🏁', de: 'Los! 🏁' },
  goShort: { it: 'VIA!', en: 'GO!', es: '¡YA!', fr: 'PARTEZ !', de: 'LOS!' },
  flip: { it: 'Gira carta', en: 'Flip a card', es: 'Gira carta', fr: 'Retourne', de: 'Karte ziehen' },
  auto: { it: 'Auto', en: 'Auto', es: 'Auto', fr: 'Auto', de: 'Auto' },
  tapHint: { it: 'o tocca la pista', en: 'or tap the track', es: 'o toca la pista', fr: 'ou touche la piste', de: 'oder tipp auf die Bahn' },
  photo: { it: 'FOTOFINISH 📸', en: 'PHOTO FINISH 📸', es: 'FOTO FINISH 📸', fr: 'PHOTO-FINISH 📸', de: 'FOTOFINISH 📸' },
  wins: { it: 'vince!', en: 'wins!', es: '¡gana!', fr: 'gagne !', de: 'gewinnt!' },
  rematch: { it: 'Rivincita 🔁', en: 'Rematch 🔁', es: 'Revancha 🔁', fr: 'Revanche 🔁', de: 'Revanche 🔁' },
  newBets: { it: 'Nuove puntate', en: 'New bets', es: 'Nuevas apuestas', fr: 'Nouvelles mises', de: 'Neue Einsätze' },
  bet: { it: 'Puntata', en: 'Bet', es: 'Apuesta', fr: 'Mise', de: 'Einsatz' },
  finish: { it: 'TRAGUARDO', en: 'FINISH', es: 'META', fr: 'ARRIVÉE', de: 'ZIEL' },
  hurdles: { it: 'Ostacoli', en: 'Hurdles', es: 'Obstáculos', fr: 'Obstacles', de: 'Hürden' },
  nobody: {
    it: 'Nessuno ha puntato su di lui… il banco ringrazia!',
    en: 'Nobody bet on this one… the house says thanks!',
    es: 'Nadie apostó por él… ¡la banca lo agradece!',
    fr: 'Personne n’a misé dessus… la banque dit merci !',
    de: 'Keiner hat auf ihn gesetzt… die Bank sagt danke!',
  },
} satisfies Record<string, Loc>

type Lines = Loc[]

const START: Lines = [
  { it: 'E sono partiti! 🏇', en: "And they're off! 🏇", es: '¡Y salen! 🏇', fr: 'Et c’est parti ! 🏇', de: 'Und sie sind gestartet! 🏇' },
  {
    it: 'Cancelli aperti, cuori a mille!',
    en: 'Gates open, hearts racing!',
    es: '¡Puertas abiertas, corazones a mil!',
    fr: 'Les stalles s’ouvrent, les cœurs s’emballent !',
    de: 'Boxen auf, Puls auf 180!',
  },
  {
    it: 'Partenza! Che vinca il più fortunato 🍀',
    en: 'Off they go! May the luckiest win 🍀',
    es: '¡Salida! Que gane el más suertudo 🍀',
    fr: 'Départ ! Que le plus chanceux gagne 🍀',
    de: 'Start! Möge der Glücklichste gewinnen 🍀',
  },
]

const OVERTAKE: Lines = [
  {
    it: '{h} passa in testa! Che sorpasso! 🔥',
    en: '{h} takes the lead! What a move! 🔥',
    es: '¡{h} se pone en cabeza! ¡Qué adelantamiento! 🔥',
    fr: '{h} prend la tête ! Quel dépassement ! 🔥',
    de: '{h} übernimmt die Führung! Was für ein Manöver! 🔥',
  },
  {
    it: 'Signore e signori, {h} vola!',
    en: 'Ladies and gentlemen, {h} is flying!',
    es: '¡Damas y caballeros, {h} vuela!',
    fr: 'Mesdames et messieurs, {h} s’envole !',
    de: 'Meine Damen und Herren, {h} fliegt!',
  },
  {
    it: '{h} davanti a tutti… qualcuno inizia a sudare 😅',
    en: '{h} storms ahead… someone’s starting to sweat 😅',
    es: '{h} adelanta a todos… alguien empieza a sudar 😅',
    fr: '{h} double tout le monde… certains transpirent 😅',
    de: '{h} zieht vorbei… da schwitzt schon jemand 😅',
  },
  {
    it: 'Colpo di scena! {h} al comando!',
    en: 'Plot twist! {h} out in front!',
    es: '¡Giro inesperado! ¡{h} al mando!',
    fr: 'Coup de théâtre ! {h} aux commandes !',
    de: 'Wendung! {h} jetzt vorne!',
  },
  {
    it: 'Ma che cavallo è?! {h} si prende la testa!',
    en: 'What a horse! {h} grabs the lead!',
    es: '¡Menudo caballo! ¡{h} toma la delantera!',
    fr: 'Quel cheval ! {h} s’empare de la tête !',
    de: 'Was für ein Gaul! {h} schnappt sich die Spitze!',
  },
]

const SETBACK: Lines = [
  {
    it: 'Ahi! {h} inciampa e torna indietro 🙈',
    en: 'Ouch! {h} trips and drops back 🙈',
    es: '¡Ay! {h} tropieza y retrocede 🙈',
    fr: 'Aïe ! {h} trébuche et recule 🙈',
    de: 'Autsch! {h} stolpert zurück 🙈',
  },
  {
    it: '{h} si ferma a brucare l’erba… un passo indietro!',
    en: '{h} stops for a grass snack… one step back!',
    es: '{h} se para a comer hierba… ¡un paso atrás!',
    fr: '{h} s’arrête pour brouter… un pas en arrière !',
    de: '{h} macht Grasspause… ein Schritt zurück!',
  },
  {
    it: 'Ostacolo! {h} fa retromarcia 🚧',
    en: 'Hurdle! {h} goes into reverse 🚧',
    es: '¡Obstáculo! {h} da marcha atrás 🚧',
    fr: 'Obstacle ! {h} fait marche arrière 🚧',
    de: 'Hürde! {h} legt den Rückwärtsgang ein 🚧',
  },
]

const STRETCH: Lines = [
  {
    it: '{h} è in dirittura d’arrivo! 😱',
    en: '{h} hits the home stretch! 😱',
    es: '¡{h} entra en la recta final! 😱',
    fr: '{h} attaque la dernière ligne droite ! 😱',
    de: '{h} biegt auf die Zielgerade! 😱',
  },
  {
    it: 'Manca un passo per {h}! Tenete i bicchieri!',
    en: 'One step left for {h}! Hold your glasses!',
    es: '¡A {h} le falta un paso! ¡Agarrad los vasos!',
    fr: 'Plus qu’un pas pour {h} ! Tenez vos verres !',
    de: 'Nur noch ein Schritt für {h}! Gläser festhalten!',
  },
]

const ADVANCE: Lines = [
  { it: '{h} avanza deciso!', en: '{h} pushes on!', es: '¡{h} avanza decidido!', fr: '{h} avance d’un bon pas !', de: '{h} legt zu!' },
  { it: 'Bel galoppo di {h}', en: 'Lovely gallop from {h}', es: 'Bonito galope de {h}', fr: 'Joli galop de {h}', de: 'Schöner Galopp von {h}' },
  { it: '{h} non molla!', en: '{h} won’t give up!', es: '¡{h} no se rinde!', fr: '{h} ne lâche rien !', de: '{h} gibt nicht auf!' },
  {
    it: 'La folla impazzisce per {h}!',
    en: 'The crowd goes wild for {h}!',
    es: '¡El público enloquece con {h}!',
    fr: 'La foule est en délire pour {h} !',
    de: 'Die Menge tobt für {h}!',
  },
]

const FINISH: Lines = [
  {
    it: '{h} taglia il traguardo! 🏆',
    en: '{h} crosses the line! 🏆',
    es: '¡{h} cruza la meta! 🏆',
    fr: '{h} franchit la ligne ! 🏆',
    de: '{h} ist im Ziel! 🏆',
  },
  {
    it: 'Vittoria per {h}! Si brinda! 🥂',
    en: 'Victory for {h}! Cheers! 🥂',
    es: '¡Victoria para {h}! ¡A brindar! 🥂',
    fr: 'Victoire pour {h} ! On trinque ! 🥂',
    de: 'Sieg für {h}! Prost! 🥂',
  },
]

const PHOTO: Lines = [
  {
    it: 'Testa a testa! Serve il fotofinish! 📸',
    en: 'Neck and neck! We need the photo! 📸',
    es: '¡Cabeza a cabeza! ¡Hace falta la foto! 📸',
    fr: 'Coude à coude ! Il faut la photo ! 📸',
    de: 'Kopf an Kopf! Das Zielfoto entscheidet! 📸',
  },
]

export const LINES = { start: START, overtake: OVERTAKE, setback: SETBACK, stretch: STRETCH, advance: ADVANCE, finish: FINISH, photo: PHOTO }
export type LineKind = keyof typeof LINES

export const randomLine = (kind: LineKind) => pick(LINES[kind])
