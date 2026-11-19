import type { Loc } from '../../core/i18n'
import type { BottlePrompt, PenaltyTarget } from './prompts'

/** Christmas / New Year prompts, mixed into the deck while `showHolidayContent()`. */
const T = (text: Loc, n = 2): BottlePrompt => ({ kind: 'truth', text, n, target: 'self', seasonal: true })
const D = (text: Loc, n = 2): BottlePrompt => ({ kind: 'dare', text, n, target: 'self', seasonal: true })
const P = (text: Loc, target: PenaltyTarget, n: number): BottlePrompt => ({ kind: 'penalty', text, n, target, seasonal: true })

export const HOLIDAY_PROMPTS: BottlePrompt[] = [
  // ---------- questions ----------
  T({
    it: 'Qual è il regalo più brutto che hai ricevuto (e che fine ha fatto)?',
    en: "What's the worst present you've ever received (and what happened to it)?",
    es: '¿Cuál es el peor regalo que te han hecho (y qué fue de él)?',
    fr: 'Quel est le pire cadeau que tu aies reçu (et qu’est-il devenu) ?',
    de: 'Was war das schlimmste Geschenk, das du je bekommen hast (und was ist daraus geworden)?',
  }),
  T({
    it: 'Hai mai riciclato un regalo? A chi l’hai rifilato?',
    en: 'Have you ever regifted something? Who got stuck with it?',
    es: '¿Alguna vez has reciclado un regalo? ¿A quién se lo colocaste?',
    fr: 'As-tu déjà recyclé un cadeau ? À qui l’as-tu refourgué ?',
    de: 'Hast du schon mal ein Geschenk weiterverschenkt? Wer hat es abbekommen?',
  }),
  T({
    it: 'A che età hai scoperto la verità su Babbo Natale, e come?',
    en: 'How old were you when you found out the truth about Santa, and how?',
    es: '¿Con cuántos años descubriste la verdad sobre Papá Noel o los Reyes, y cómo?',
    fr: 'À quel âge as-tu découvert la vérité sur le Père Noël, et comment ?',
    de: 'Wie alt warst du, als du die Wahrheit über den Weihnachtsmann erfahren hast, und wie?',
  }),
  T({
    it: 'Quale proposito dell’anno scorso hai abbandonato più in fretta?',
    en: "Which of last year's resolutions did you drop the fastest?",
    es: '¿Qué propósito del año pasado abandonaste más rápido?',
    fr: 'Quelle résolution de l’an dernier as-tu abandonnée le plus vite ?',
    de: 'Welchen Vorsatz vom letzten Jahr hast du am schnellsten aufgegeben?',
  }),
  T({
    it: 'Racconta il Capodanno peggiore della tua vita.',
    en: 'Tell us about the worst New Year’s Eve of your life.',
    es: 'Cuenta la peor Nochevieja de tu vida.',
    fr: 'Raconte le pire réveillon du Nouvel An de ta vie.',
    de: 'Erzähl vom schlimmsten Silvester deines Lebens.',
  }),
  T({
    it: 'Cosa vorresti trovare sotto l’albero da parte di {other}?',
    en: 'What would you like to find under the tree from {other}?',
    es: '¿Qué te gustaría encontrar bajo el árbol de parte de {other}?',
    fr: 'Qu’aimerais-tu trouver sous le sapin de la part de {other} ?',
    de: 'Was hättest du gern von {other} unterm Weihnachtsbaum?',
  }),
  T({
    it: 'Quale parente eviti ai pranzi delle feste, e perché?',
    en: 'Which relative do you dodge at holiday dinners, and why?',
    es: '¿A qué familiar evitas en las comidas de fiestas, y por qué?',
    fr: 'Quel membre de ta famille évites-tu aux repas de fêtes, et pourquoi ?',
    de: 'Welchem Verwandten gehst du beim Festessen aus dem Weg, und warum?',
  }),
  T({
    it: 'Il momento più bello del tuo anno, in una frase?',
    en: 'The best moment of your year, in one sentence?',
    es: '¿El mejor momento de tu año, en una frase?',
    fr: 'Le meilleur moment de ton année, en une phrase ?',
    de: 'Der schönste Moment deines Jahres, in einem Satz?',
  }),
  // ---------- challenges ----------
  D({
    it: 'Canta “Jingle Bells” come un cantante lirico.',
    en: 'Sing “Jingle Bells” like an opera singer.',
    es: 'Canta “Jingle Bells” como un cantante de ópera.',
    fr: 'Chante « Vive le vent » comme un chanteur d’opéra.',
    de: 'Sing „Jingle Bells“ wie ein Opernsänger.',
  }),
  D({
    it: 'Fai un brindisi di auguri per {other}: almeno 3 frasi e tanta emozione.',
    en: 'Give a holiday toast to {other}: at least 3 sentences, full emotion.',
    es: 'Haz un brindis de felicitación para {other}: mínimo 3 frases y mucha emoción.',
    fr: 'Porte un toast de fête à {other} : au moins 3 phrases, avec émotion.',
    de: 'Halte einen Festtagstoast auf {other}: mindestens 3 Sätze, voller Gefühl.',
  }),
  D({
    it: 'Imita una renna che tira la slitta per 10 secondi.',
    en: 'Be a reindeer pulling the sleigh for 10 seconds.',
    es: 'Imita a un reno tirando del trineo durante 10 segundos.',
    fr: 'Imite un renne qui tire le traîneau pendant 10 secondes.',
    de: 'Spiel 10 Sekunden ein Rentier, das den Schlitten zieht.',
  }),
  D({
    it: 'Impacchetta un oggetto del tavolo con quello che trovi e regalalo a {other}.',
    en: 'Gift-wrap something from the table with whatever you can find and give it to {other}.',
    es: 'Envuelve algo de la mesa con lo que encuentres y regálaselo a {other}.',
    fr: 'Emballe un objet de la table avec ce que tu trouves et offre-le à {other}.',
    de: 'Verpack etwas vom Tisch mit allem, was du findest, und schenk es {other}.',
  }),
  D({
    it: 'Fai il conto alla rovescia di Capodanno più drammatico della storia, da 10.',
    en: 'Do the most dramatic New Year countdown in history, from 10.',
    es: 'Haz la cuenta atrás de Nochevieja más dramática de la historia, desde 10.',
    fr: 'Fais le compte à rebours du Nouvel An le plus dramatique de l’histoire, depuis 10.',
    de: 'Mach den dramatischsten Silvester-Countdown aller Zeiten, ab 10.',
  }),
  D({
    it: 'Parla come Babbo Natale: chi al tavolo è nella lista dei cattivi, e perché?',
    en: 'Speak as Santa: who at this table is on the naughty list, and why?',
    es: 'Habla como Papá Noel: ¿quién de la mesa está en la lista de los malos, y por qué?',
    fr: 'Parle comme le Père Noël : qui à table est sur la liste des vilains, et pourquoi ?',
    de: 'Sprich als Weihnachtsmann: Wer am Tisch steht auf der Liste der Unartigen, und warum?',
  }),
  D({
    it: 'Mima un film di Natale: il tavolo ha 30 secondi per indovinarlo.',
    en: 'Act out a Christmas movie: the table has 30 seconds to guess it.',
    es: 'Representa con mímica una peli de Navidad: la mesa tiene 30 segundos para adivinarla.',
    fr: 'Mime un film de Noël : la table a 30 secondes pour deviner.',
    de: 'Stell einen Weihnachtsfilm pantomimisch dar: Der Tisch hat 30 Sekunden zum Raten.',
  }),
  D({
    it: 'Fai una promessa per l’anno nuovo a {other} e suggellatela con una stretta di mano davanti a tutti.',
    en: 'Make a New Year’s promise to {other} and shake on it in front of everyone.',
    es: 'Hazle una promesa de año nuevo a {other} y selladla con un apretón de manos delante de todos.',
    fr: 'Fais une promesse de Nouvel An à {other} et topez-là devant tout le monde.',
    de: 'Gib {other} ein Neujahrsversprechen und besiegelt es per Handschlag vor allen.',
  }),
  // ---------- penalties ----------
  P(
    {
      it: 'Hai aperto un regalo prima di Natale. Colpevole.',
      en: 'You opened a present before Christmas. Guilty.',
      es: 'Abriste un regalo antes de Navidad. Culpable.',
      fr: 'Tu as ouvert un cadeau avant Noël. Coupable.',
      de: 'Du hast ein Geschenk vor Weihnachten aufgemacht. Schuldig.',
    },
    'self',
    2,
  ),
  P(
    {
      it: 'Il tuo sacco di Babbo Natale è pieno: distribuiscilo.',
      en: 'Your Santa sack is full: hand it out.',
      es: 'Tu saco de Papá Noel está lleno: repártelo.',
      fr: 'Ta hotte du Père Noël est pleine : distribue-la.',
      de: 'Dein Weihnachtssack ist voll: Verteil ihn.',
    },
    'give',
    2,
  ),
  P(
    {
      it: 'Auguri a tutti! Brindisi collettivo.',
      en: 'Season’s greetings! Group toast.',
      es: '¡Felices fiestas! Brindis colectivo.',
      fr: 'Joyeuses fêtes ! Toast collectif.',
      de: 'Frohe Feiertage! Gruppentoast.',
    },
    'all',
    1,
  ),
  P(
    {
      it: 'Lista dei cattivi: primo posto.',
      en: 'Naughty list: number one.',
      es: 'Lista de los malos: primer puesto.',
      fr: 'Liste des vilains : première place.',
      de: 'Liste der Unartigen: Platz eins.',
    },
    'self',
    3,
  ),
  P(
    {
      it: 'Fuochi d’artificio! Puntali su chi vuoi.',
      en: 'Fireworks! Aim them at anyone you like.',
      es: '¡Fuegos artificiales! Apúntalos a quien quieras.',
      fr: 'Feu d’artifice ! Vise qui tu veux.',
      de: 'Feuerwerk! Ziel damit, auf wen du willst.',
    },
    'give',
    3,
  ),
  P(
    {
      it: 'Hai dimenticato il regalo per {other}.',
      en: 'You forgot {other}’s present.',
      es: 'Te olvidaste del regalo de {other}.',
      fr: 'Tu as oublié le cadeau de {other}.',
      de: 'Du hast das Geschenk für {other} vergessen.',
    },
    'self',
    1,
  ),
]
