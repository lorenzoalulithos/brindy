import type { Loc } from '../../core/i18n'

export type PromptKind = 'truth' | 'dare' | 'penalty'
export type PenaltyTarget = 'self' | 'give' | 'all'

export interface BottlePrompt {
  kind: PromptKind
  /** May contain {other}: replaced with another player's name (or "your right neighbour"). */
  text: Loc
  /** Penalty amount: for truth/dare it's the price for refusing. */
  n: number
  target: PenaltyTarget
  spicy?: boolean
  /** Holiday-season prompt (see holiday.ts). */
  seasonal?: boolean
}

const T = (text: Loc, n = 2): BottlePrompt => ({ kind: 'truth', text, n, target: 'self' })
const D = (text: Loc, n = 2): BottlePrompt => ({ kind: 'dare', text, n, target: 'self' })
const P = (text: Loc, target: PenaltyTarget, n: number): BottlePrompt => ({ kind: 'penalty', text, n, target })
const S = (p: BottlePrompt): BottlePrompt => ({ ...p, spicy: true })

export const KIND_LABEL: Record<PromptKind, Loc> = {
  truth: { it: 'Domanda ❓', en: 'Question ❓', es: 'Pregunta ❓', fr: 'Question ❓', de: 'Frage ❓' },
  dare: { it: 'Sfida 🔥', en: 'Challenge 🔥', es: 'Reto 🔥', fr: 'Défi 🔥', de: 'Aufgabe 🔥' },
  penalty: { it: 'Penalità 🍾', en: 'Penalty 🍾', es: 'Castigo 🍾', fr: 'Pénalité 🍾', de: 'Strafe 🍾' },
}

export const REFUSE: Loc = { it: 'Ti rifiuti?', en: 'Refuse?', es: '¿Te niegas?', fr: 'Tu refuses ?', de: 'Kneifen?' }

export const NEIGHBOUR: Loc = {
  it: 'chi ti siede a destra',
  en: 'the person on your right',
  es: 'quien está a tu derecha',
  fr: 'la personne à ta droite',
  de: 'die Person rechts von dir',
}

export const PROMPTS: BottlePrompt[] = [
  // ---------- questions ----------
  T({
    it: 'Qual è la bugia più grossa che hai detto a qualcuno in questa stanza?',
    en: "What's the biggest lie you've told someone in this room?",
    es: '¿Cuál es la mentira más gorda que le has dicho a alguien de aquí?',
    fr: "Quel est le plus gros mensonge que tu as dit à quelqu'un ici ?",
    de: 'Was ist die größte Lüge, die du jemandem hier erzählt hast?',
  }),
  T({
    it: 'Chi qui chiameresti alle 3 di notte per un’emergenza? E chi mai?',
    en: 'Who here would you call at 3 a.m. in an emergency? And who never?',
    es: '¿A quién de aquí llamarías a las 3 de la mañana por una emergencia? ¿Y a quién nunca?',
    fr: 'Qui ici appellerais-tu à 3 h du matin en cas d’urgence ? Et qui jamais ?',
    de: 'Wen hier würdest du um 3 Uhr nachts im Notfall anrufen? Und wen nie?',
  }),
  T({
    it: 'Qual è la ricerca più imbarazzante nella tua cronologia?',
    en: "What's the most embarrassing thing in your search history?",
    es: '¿Qué es lo más vergonzoso de tu historial de búsqueda?',
    fr: 'Quelle est la recherche la plus gênante de ton historique ?',
    de: 'Was ist die peinlichste Suche in deinem Verlauf?',
  }),
  T({
    it: 'Qual è il messaggio che ti sei più pentito di aver mandato?',
    en: "What's the text you most regret sending?",
    es: '¿Cuál es el mensaje del que más te arrepientes de haber enviado?',
    fr: 'Quel est le message que tu regrettes le plus d’avoir envoyé ?',
    de: 'Welche Nachricht bereust du am meisten, abgeschickt zu haben?',
  }),
  T({
    it: 'Se potessi scambiarti la vita con qualcuno qui per un giorno, chi sceglieresti?',
    en: 'If you could swap lives with someone here for a day, who would it be?',
    es: 'Si pudieras cambiarte la vida con alguien de aquí por un día, ¿con quién?',
    fr: 'Si tu pouvais échanger ta vie avec quelqu’un ici pour une journée, qui choisirais-tu ?',
    de: 'Mit wem hier würdest du für einen Tag das Leben tauschen?',
  }),
  T({
    it: 'Qual è la tua abitudine più strana che nessuno conosce?',
    en: "What's your weirdest habit nobody knows about?",
    es: '¿Cuál es tu manía más rara que nadie conoce?',
    fr: 'Quelle est ta manie la plus bizarre que personne ne connaît ?',
    de: 'Was ist deine schrägste Angewohnheit, von der keiner weiß?',
  }),
  T({
    it: 'Hai mai fatto finta di non vedere qualcuno per strada? Racconta.',
    en: 'Ever pretended not to see someone in the street? Spill it.',
    es: '¿Alguna vez has fingido no ver a alguien por la calle? Cuenta.',
    fr: 'As-tu déjà fait semblant de ne pas voir quelqu’un dans la rue ? Raconte.',
    de: 'Hast du schon mal so getan, als würdest du jemanden auf der Straße nicht sehen? Erzähl.',
  }),
  T({
    it: 'Qual è la cosa più infantile che fai ancora?',
    en: "What's the most childish thing you still do?",
    es: '¿Qué es lo más infantil que todavía haces?',
    fr: 'Quel est le truc le plus enfantin que tu fais encore ?',
    de: 'Was ist das Kindischste, das du immer noch tust?',
  }),
  T({
    it: 'La tua figuraccia peggiore a scuola o al lavoro?',
    en: 'Your worst cringe moment at school or work?',
    es: '¿Tu peor ridículo en el cole o en el trabajo?',
    fr: 'Ta pire honte à l’école ou au boulot ?',
    de: 'Dein peinlichster Moment in der Schule oder bei der Arbeit?',
  }),
  T({
    it: 'Cosa hai pensato di {other} la prima volta che vi siete visti?',
    en: 'What did you think of {other} the first time you met?',
    es: '¿Qué pensaste de {other} la primera vez que os visteis?',
    fr: 'Qu’as-tu pensé de {other} la première fois que vous vous êtes vus ?',
    de: 'Was hast du über {other} gedacht, als ihr euch zum ersten Mal gesehen habt?',
  }),
  T({
    it: 'Qual è il talento inutile di cui vai più fiero?',
    en: "What's the useless talent you're proudest of?",
    es: '¿De qué talento inútil estás más orgulloso?',
    fr: 'Quel est le talent inutile dont tu es le plus fier ?',
    de: 'Auf welches nutzlose Talent bist du am stolzesten?',
  }),
  T({
    it: 'Quale canzone imbarazzante ascolti di nascosto?',
    en: 'Which embarrassing song do you secretly love?',
    es: '¿Qué canción vergonzosa escuchas a escondidas?',
    fr: 'Quelle chanson honteuse écoutes-tu en cachette ?',
    de: 'Welchen peinlichen Song hörst du heimlich?',
  }),
  T({
    it: 'Il regalo più brutto che hai mai ricevuto? E da chi?',
    en: 'The worst gift you ever got? And who from?',
    es: '¿El peor regalo que te han hecho? ¿Y de quién?',
    fr: 'Le pire cadeau que tu aies reçu ? Et de qui ?',
    de: 'Das schlimmste Geschenk, das du je bekommen hast? Und von wem?',
  }),
  T({
    it: 'Chi qui ha più probabilità di diventare famoso? E per cosa?',
    en: 'Who here is most likely to get famous? And for what?',
    es: '¿Quién de aquí tiene más papeletas para hacerse famoso? ¿Y por qué?',
    fr: 'Qui ici a le plus de chances de devenir célèbre ? Et pour quoi ?',
    de: 'Wer hier wird am ehesten berühmt? Und wofür?',
  }),
  T({
    it: 'Qual è l’ultima cosa che hai cercato su Google? Leggila.',
    en: 'What was the last thing you googled? Read it out.',
    es: '¿Qué fue lo último que buscaste en Google? Léelo.',
    fr: 'Quelle est ta dernière recherche Google ? Lis-la.',
    de: 'Was hast du zuletzt gegoogelt? Lies es vor.',
  }),
  T({
    it: 'Che voto dai a {other} come compagno di viaggio, da 1 a 10?',
    en: 'Rate {other} as a travel buddy, 1 to 10.',
    es: 'Puntúa a {other} como compañero de viaje, del 1 al 10.',
    fr: 'Note {other} comme partenaire de voyage, de 1 à 10.',
    de: 'Bewerte {other} als Reisebegleitung von 1 bis 10.',
  }),
  // ---------- challenges ----------
  D({
    it: 'Imita qualcuno del gruppo finché gli altri non indovinano chi è.',
    en: 'Impersonate someone in the group until the others guess who.',
    es: 'Imita a alguien del grupo hasta que los demás adivinen quién es.',
    fr: 'Imite quelqu’un du groupe jusqu’à ce que les autres devinent qui.',
    de: 'Imitiere jemanden aus der Runde, bis die anderen erraten, wen.',
  }),
  D({
    it: 'Parla come un telecronista sportivo fino al prossimo giro.',
    en: 'Talk like a sports commentator until the next spin.',
    es: 'Habla como un comentarista deportivo hasta el próximo giro.',
    fr: 'Parle comme un commentateur sportif jusqu’au prochain tour.',
    de: 'Sprich bis zum nächsten Dreh wie ein Sportkommentator.',
  }),
  D({
    it: 'Esci dalla stanza e rientra come una star sul red carpet.',
    en: 'Leave the room and make a red-carpet celebrity entrance.',
    es: 'Sal de la habitación y vuelve a entrar como una estrella en la alfombra roja.',
    fr: 'Sors de la pièce et refais une entrée de star sur le tapis rouge.',
    de: 'Verlass den Raum und komm wie ein Star über den roten Teppich zurück.',
  }),
  D({
    it: 'Lascia che {other} ti sistemi i capelli come vuole.',
    en: 'Let {other} style your hair however they like.',
    es: 'Deja que {other} te peine como quiera.',
    fr: 'Laisse {other} te coiffer comme il le veut.',
    de: 'Lass {other} dir die Haare stylen, wie er oder sie will.',
  }),
  D({
    it: 'Fai una dichiarazione d’amore drammatica al tuo bicchiere.',
    en: 'Make a dramatic declaration of love to your glass.',
    es: 'Hazle una declaración de amor dramática a tu vaso.',
    fr: 'Fais une déclaration d’amour dramatique à ton verre.',
    de: 'Mach deinem Glas eine dramatische Liebeserklärung.',
  }),
  D({
    it: 'Mostra l’ultima foto della tua galleria (ne puoi saltare solo una).',
    en: 'Show the last photo in your gallery (you may skip just one).',
    es: 'Enseña la última foto de tu galería (solo puedes saltarte una).',
    fr: 'Montre la dernière photo de ta galerie (tu peux en passer une seule).',
    de: 'Zeig das letzte Foto in deiner Galerie (eins darfst du überspringen).',
  }),
  D({
    it: 'Tieni la posizione dell’albero (yoga) per 20 secondi.',
    en: 'Hold the yoga tree pose for 20 seconds.',
    es: 'Aguanta la postura del árbol (yoga) 20 segundos.',
    fr: 'Tiens la posture de l’arbre (yoga) pendant 20 secondes.',
    de: 'Halte 20 Sekunden die Baum-Pose aus dem Yoga.',
  }),
  D({
    it: 'Rispondi solo con domande fino al tuo prossimo turno.',
    en: 'Answer only with questions until your next turn.',
    es: 'Responde solo con preguntas hasta tu próximo turno.',
    fr: 'Ne réponds que par des questions jusqu’à ton prochain tour.',
    de: 'Antworte bis zu deinem nächsten Zug nur mit Gegenfragen.',
  }),
  D({
    it: 'Fai un comizio da sindaco: perché questa festa è la migliore della città.',
    en: 'Give a mayor’s speech on why this is the best party in town.',
    es: 'Da un discurso de alcalde: por qué esta es la mejor fiesta de la ciudad.',
    fr: 'Fais un discours de maire : pourquoi cette soirée est la meilleure de la ville.',
    de: 'Halte eine Bürgermeisterrede, warum das hier die beste Party der Stadt ist.',
  }),
  D({
    it: '10 secondi di beatbox. Ora.',
    en: '10 seconds of beatbox. Now.',
    es: '10 segundos de beatbox. Ya.',
    fr: '10 secondes de beatbox. Maintenant.',
    de: '10 Sekunden Beatbox. Jetzt.',
  }),
  D(
    {
      it: 'Racconta una barzelletta: se nessuno ride, paghi.',
      en: 'Tell a joke: if nobody laughs, you pay.',
      es: 'Cuenta un chiste: si nadie se ríe, pagas.',
      fr: 'Raconte une blague : si personne ne rit, tu paies.',
      de: 'Erzähl einen Witz: Lacht keiner, zahlst du.',
    },
    1,
  ),
  D({
    it: 'Scambia un accessorio (giacca, cappello, orologio) con {other} fino al prossimo giro.',
    en: 'Swap an accessory (jacket, hat, watch) with {other} until the next spin.',
    es: 'Intercambia un accesorio (chaqueta, gorra, reloj) con {other} hasta el próximo giro.',
    fr: 'Échange un accessoire (veste, chapeau, montre) avec {other} jusqu’au prochain tour.',
    de: 'Tausch ein Accessoire (Jacke, Mütze, Uhr) mit {other} bis zum nächsten Dreh.',
  }),
  D({
    it: 'Fai un complimento esagerato a {other} guardandolo negli occhi.',
    en: 'Give {other} an over-the-top compliment while holding eye contact.',
    es: 'Hazle a {other} un cumplido exagerado mirándole a los ojos.',
    fr: 'Fais un compliment exagéré à {other} en le regardant dans les yeux.',
    de: 'Mach {other} ein übertriebenes Kompliment und halte dabei Blickkontakt.',
  }),
  D({
    it: 'Mima un film: gli altri hanno 30 secondi per indovinare.',
    en: 'Act out a movie: the others get 30 seconds to guess.',
    es: 'Representa una peli con mímica: los demás tienen 30 segundos.',
    fr: 'Mime un film : les autres ont 30 secondes pour deviner.',
    de: 'Stell einen Film pantomimisch dar: Die anderen haben 30 Sekunden.',
  }),
  D({
    it: 'Sfila come in passerella fino alla porta e ritorno.',
    en: 'Strut like a catwalk model to the door and back.',
    es: 'Desfila como en una pasarela hasta la puerta y vuelve.',
    fr: 'Défile comme un mannequin jusqu’à la porte et retour.',
    de: 'Lauf wie auf dem Catwalk zur Tür und zurück.',
  }),
  D({
    it: 'La tua migliore risata da cattivo dei cartoni.',
    en: 'Do your best cartoon-villain laugh.',
    es: 'Tu mejor risa de villano de dibujos animados.',
    fr: 'Ton meilleur rire de méchant de dessin animé.',
    de: 'Dein bestes Zeichentrick-Bösewicht-Lachen.',
  }),
  D({
    it: 'Manda un vocale a un amico cantando “tanti auguri”, anche se non è il suo compleanno.',
    en: 'Send a friend a voice note singing “Happy Birthday”, even if it isn’t their birthday.',
    es: 'Mándale a un amigo un audio cantando “Cumpleaños feliz”, aunque no sea su cumple.',
    fr: 'Envoie à un ami un vocal où tu chantes « Joyeux anniversaire », même si ce n’est pas le jour.',
    de: 'Schick einem Freund eine Sprachnachricht mit „Happy Birthday“, auch wenn er keinen Geburtstag hat.',
  }),
  // ---------- penalties ----------
  P(
    {
      it: 'La bottiglia ha parlato. Niente ricorsi.',
      en: 'The bottle has spoken. No appeals.',
      es: 'La botella ha hablado. Sin recursos.',
      fr: 'La bouteille a parlé. Pas de recours.',
      de: 'Die Flasche hat gesprochen. Kein Einspruch.',
    },
    'self',
    2,
  ),
  P(
    {
      it: 'Colpo di fortuna! Scegli chi paga al posto tuo.',
      en: 'Lucky break! Pick someone to pay instead of you.',
      es: '¡Golpe de suerte! Elige quién paga en tu lugar.',
      fr: 'Coup de chance ! Choisis qui paie à ta place.',
      de: 'Glück gehabt! Such dir aus, wer für dich zahlt.',
    },
    'give',
    2,
  ),
  P(
    {
      it: 'Brindisi in tuo onore! Tutto il tavolo alza il bicchiere.',
      en: 'A toast in your honour! The whole table raises a glass.',
      es: '¡Un brindis en tu honor! Toda la mesa levanta la copa.',
      fr: 'Un toast en ton honneur ! Toute la table lève son verre.',
      de: 'Ein Toast auf dich! Der ganze Tisch hebt das Glas.',
    },
    'all',
    1,
  ),
  P(
    {
      it: 'Hai la faccia di chi ha appena barato.',
      en: 'You have the face of someone who just cheated.',
      es: 'Tienes cara de haber hecho trampa.',
      fr: 'Tu as une tête de tricheur.',
      de: 'Du guckst, als hättest du gerade geschummelt.',
    },
    'self',
    1,
  ),
  P(
    {
      it: 'Generosità obbligatoria: distribuisci come vuoi.',
      en: 'Mandatory generosity: hand them out however you like.',
      es: 'Generosidad obligatoria: repártelos como quieras.',
      fr: 'Générosité obligatoire : distribue comme tu veux.',
      de: 'Pflicht-Großzügigkeit: Verteil sie, wie du willst.',
    },
    'give',
    3,
  ),
  P(
    {
      it: 'Il destino stasera è crudele.',
      en: 'Fate is cruel tonight.',
      es: 'El destino está cruel esta noche.',
      fr: 'Le destin est cruel ce soir.',
      de: 'Das Schicksal ist heute grausam.',
    },
    'self',
    3,
  ),
  P(
    {
      it: 'Graziato! Ma qualcuno deve pagare: scegli tu.',
      en: 'Pardoned! But someone has to pay: you choose.',
      es: '¡Indultado! Pero alguien tiene que pagar: eliges tú.',
      fr: 'Gracié ! Mais quelqu’un doit payer : à toi de choisir.',
      de: 'Begnadigt! Aber einer muss zahlen: Du entscheidest.',
    },
    'give',
    1,
  ),
  P(
    {
      it: 'Tu e {other} pagate insieme. Cin cin!',
      en: 'You and {other} pay together. Cheers!',
      es: 'Tú y {other} pagáis juntos. ¡Chin chin!',
      fr: 'Toi et {other} payez ensemble. Santé !',
      de: 'Du und {other} zahlt zusammen. Prost!',
    },
    'self',
    2,
  ),
  P(
    {
      it: 'Salute! Giro per tutti.',
      en: 'Cheers! A round for everyone.',
      es: '¡Salud! Ronda para todos.',
      fr: 'Santé ! Tournée générale.',
      de: 'Prost! Eine Runde für alle.',
    },
    'all',
    2,
  ),
  P(
    {
      it: 'Il collo della bottiglia non sbaglia mai.',
      en: 'The bottle neck never misses.',
      es: 'El cuello de la botella nunca falla.',
      fr: 'Le goulot ne se trompe jamais.',
      de: 'Der Flaschenhals irrt sich nie.',
    },
    'self',
    1,
  ),
]

/** Flirty but non-explicit; only with spicy mode on AND the 'bottle-spicy' pack unlocked. */
export const SPICY_PROMPTS: BottlePrompt[] = [
  S(
    T({
      it: 'Chi in questa stanza trovi più attraente (escluso te)?',
      en: 'Who in this room do you find most attractive (besides yourself)?',
      es: '¿Quién de esta habitación te parece más atractivo (aparte de ti)?',
      fr: 'Qui dans cette pièce trouves-tu le plus attirant (à part toi) ?',
      de: 'Wen hier im Raum findest du am attraktivsten (außer dich selbst)?',
    }),
  ),
  S(
    T({
      it: 'Racconta il tuo primo bacio: dove, quando, voto.',
      en: 'Tell us about your first kiss: where, when, rating.',
      es: 'Cuenta tu primer beso: dónde, cuándo y nota.',
      fr: 'Raconte ton premier baiser : où, quand, note.',
      de: 'Erzähl von deinem ersten Kuss: wo, wann, Bewertung.',
    }),
  ),
  S(
    T({
      it: 'Il tuo peggior appuntamento di sempre?',
      en: 'Your worst date ever?',
      es: '¿Tu peor cita de la historia?',
      fr: 'Ton pire rencard de tous les temps ?',
      de: 'Dein schlimmstes Date aller Zeiten?',
    }),
  ),
  S(
    T(
      {
        it: 'Hai mai avuto una cotta per qualcuno qui? Sì o no, niente nomi.',
        en: 'Ever had a crush on someone here? Yes or no, no names.',
        es: '¿Alguna vez te ha gustado alguien de aquí? Sí o no, sin nombres.',
        fr: 'As-tu déjà craqué pour quelqu’un ici ? Oui ou non, sans nom.',
        de: 'Warst du schon mal in jemanden hier verknallt? Ja oder nein, keine Namen.',
      },
      3,
    ),
  ),
  S(
    T({
      it: 'La frase da rimorchio più brutta che hai usato (o subìto)?',
      en: 'The worst pick-up line you’ve used (or heard)?',
      es: '¿La peor frase para ligar que has usado (o sufrido)?',
      fr: 'La pire phrase de drague que tu as utilisée (ou subie) ?',
      de: 'Der schlimmste Anmachspruch, den du benutzt (oder abbekommen) hast?',
    }),
  ),
  S(
    T({
      it: 'Cosa ti fa perdere la testa in una persona?',
      en: 'What makes you lose your head over someone?',
      es: '¿Qué te hace perder la cabeza por alguien?',
      fr: 'Qu’est-ce qui te fait craquer chez quelqu’un ?',
      de: 'Was bringt dich bei jemandem um den Verstand?',
    }),
  ),
  S(
    T({
      it: 'Hai mai scritto a un ex dopo mezzanotte? Cosa diceva il messaggio?',
      en: 'Ever texted an ex after midnight? What did it say?',
      es: '¿Alguna vez le has escrito a un ex después de medianoche? ¿Qué decía?',
      fr: 'As-tu déjà écrit à un ex après minuit ? Ça disait quoi ?',
      de: 'Schon mal nach Mitternacht dem Ex geschrieben? Was stand drin?',
    }),
  ),
  S(
    T({
      it: 'Il posto più strano dove hai baciato qualcuno?',
      en: 'The weirdest place you’ve kissed someone?',
      es: '¿El sitio más raro donde has besado a alguien?',
      fr: 'L’endroit le plus bizarre où tu as embrassé quelqu’un ?',
      de: 'Der seltsamste Ort, an dem du jemanden geküsst hast?',
    }),
  ),
  S(
    T({
      it: 'Da 1 a 10, quanto sei bravo a flirtare? Dimostralo su {other}.',
      en: 'From 1 to 10, how good are you at flirting? Prove it on {other}.',
      es: 'Del 1 al 10, ¿cuánto sabes ligar? Demuéstralo con {other}.',
      fr: 'De 1 à 10, tu dragues bien ? Prouve-le sur {other}.',
      de: 'Von 1 bis 10: Wie gut kannst du flirten? Beweis es bei {other}.',
    }),
  ),
  S(
    T({
      it: 'Chi qui porteresti a un appuntamento al buio con un tuo amico?',
      en: 'Who here would you set up on a blind date with a friend of yours?',
      es: '¿A quién de aquí le prepararías una cita a ciegas con un amigo tuyo?',
      fr: 'Qui ici enverrais-tu à un rencard à l’aveugle avec un de tes amis ?',
      de: 'Wen hier würdest du mit einem Freund zu einem Blind Date schicken?',
    }),
  ),
  S(
    T(
      {
        it: 'Il segreto più piccante che puoi raccontare senza arrossire?',
        en: 'The spiciest secret you can share without blushing?',
        es: '¿El secreto más picante que puedes contar sin ponerte rojo?',
        fr: 'Le secret le plus épicé que tu peux raconter sans rougir ?',
        de: 'Das pikanteste Geheimnis, das du ohne Rotwerden erzählen kannst?',
      },
      3,
    ),
  ),
  S(
    T({
      it: 'Hai mai finto di essere single (o fidanzato) per convenienza?',
      en: 'Ever pretended to be single (or taken) because it suited you?',
      es: '¿Alguna vez has fingido estar soltero (o con pareja) por conveniencia?',
      fr: 'As-tu déjà fait semblant d’être célibataire (ou en couple) par intérêt ?',
      de: 'Hast du schon mal aus Bequemlichkeit so getan, als wärst du single (oder vergeben)?',
    }),
  ),
  S(
    D({
      it: 'Fai il tuo occhiolino più seducente a {other}.',
      en: 'Give {other} your most seductive wink.',
      es: 'Guíñale el ojo a {other} de la forma más seductora.',
      fr: 'Fais ton clin d’œil le plus séducteur à {other}.',
      de: 'Zwinker {other} so verführerisch zu, wie du kannst.',
    }),
  ),
  S(
    D({
      it: 'Massaggio alle spalle di 15 secondi a {other} (se è d’accordo).',
      en: 'A 15-second shoulder massage for {other} (if they’re up for it).',
      es: 'Masaje de hombros de 15 segundos a {other} (si le apetece).',
      fr: 'Massage des épaules de 15 secondes pour {other} (s’il est d’accord).',
      de: '15 Sekunden Schultermassage für {other} (wenn er oder sie mag).',
    }),
  ),
  S(
    D(
      {
        it: 'Leggi ad alta voce l’ultimo messaggio che hai mandato alla tua cotta.',
        en: 'Read out the last message you sent your crush.',
        es: 'Lee en voz alta el último mensaje que le mandaste a quien te gusta.',
        fr: 'Lis à voix haute le dernier message envoyé à ton crush.',
        de: 'Lies die letzte Nachricht an deinen Schwarm laut vor.',
      },
      3,
    ),
  ),
  S(
    D({
      it: 'Bacio sulla guancia a chi vuoi (se è d’accordo).',
      en: 'A kiss on the cheek for whoever you choose (if they agree).',
      es: 'Un beso en la mejilla a quien quieras (si le parece bien).',
      fr: 'Un bisou sur la joue à qui tu veux (s’il est d’accord).',
      de: 'Ein Kuss auf die Wange für jemanden deiner Wahl (wenn er oder sie einverstanden ist).',
    }),
  ),
  S(
    D({
      it: 'Usa la tua miglior frase da rimorchio su {other}.',
      en: 'Try your best pick-up line on {other}.',
      es: 'Prueba tu mejor frase para ligar con {other}.',
      fr: 'Teste ta meilleure phrase de drague sur {other}.',
      de: 'Probier deinen besten Anmachspruch an {other} aus.',
    }),
  ),
  S(
    D({
      it: 'Balla un lento di 15 secondi con {other}.',
      en: 'Slow-dance with {other} for 15 seconds.',
      es: 'Baila una lenta de 15 segundos con {other}.',
      fr: 'Danse un slow de 15 secondes avec {other}.',
      de: 'Tanz 15 Sekunden lang Klammerblues mit {other}.',
    }),
  ),
  S(
    D({
      it: 'Descrivi {other} con tre aggettivi piccanti (ma gentili).',
      en: 'Describe {other} with three spicy (but kind) adjectives.',
      es: 'Describe a {other} con tres adjetivos picantes (pero amables).',
      fr: 'Décris {other} avec trois adjectifs épicés (mais gentils).',
      de: 'Beschreib {other} mit drei heißen (aber netten) Adjektiven.',
    }),
  ),
  S(
    D({
      it: 'Sussurra un complimento all’orecchio di {other}.',
      en: 'Whisper a compliment in {other}’s ear.',
      es: 'Susúrrale un cumplido al oído a {other}.',
      fr: 'Murmure un compliment à l’oreille de {other}.',
      de: 'Flüster {other} ein Kompliment ins Ohr.',
    }),
  ),
  S(
    D({
      it: 'La tua faccia più sexy per 5 secondi, senza ridere.',
      en: 'Your sexiest face for 5 seconds, without laughing.',
      es: 'Tu cara más sexy durante 5 segundos, sin reírte.',
      fr: 'Ta tête la plus sexy pendant 5 secondes, sans rire.',
      de: 'Dein sexiest Gesicht für 5 Sekunden, ohne zu lachen.',
    }),
  ),
  S(
    D(
      {
        it: 'Il gruppo sceglie una tua foto da mettere come profilo per 10 minuti.',
        en: 'The group picks a photo of you to use as your profile picture for 10 minutes.',
        es: 'El grupo elige una foto tuya para ponerla de perfil 10 minutos.',
        fr: 'Le groupe choisit une photo de toi à mettre en photo de profil pendant 10 minutes.',
        de: 'Die Gruppe wählt ein Foto von dir als Profilbild für 10 Minuten.',
      },
      3,
    ),
  ),
]
