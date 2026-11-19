import type { Loc } from '../../core/i18n'

export type PenaltyKind = 'drink' | 'give' | 'all' | 'none'

export interface DiceRule {
  title: Loc
  desc: Loc
  kind: PenaltyKind
  amount: number
}

const R = (title: Loc, desc: Loc, kind: PenaltyKind, amount = 1): DiceRule => ({ title, desc, kind, amount })

export function ruleFor(a: number, b: number): DiceRule {
  const sum = a + b
  if (a === 1 && b === 1)
    return R(
      { it: 'Occhi di serpente! 🐍', en: 'Snake eyes! 🐍', es: '¡Ojos de serpiente! 🐍', fr: 'Yeux de serpent ! 🐍', de: 'Schlangenaugen! 🐍' },
      { it: 'Tutto il tavolo paga', en: 'The whole table pays', es: 'Toda la mesa paga', fr: 'Toute la table paie', de: 'Der ganze Tisch zahlt' },
      'all',
      2,
    )
  if (a === 6 && b === 6)
    return R(
      { it: 'Doppio sei: inventa una regola! 👑', en: 'Double six: make a rule! 👑', es: 'Doble seis: ¡inventa una regla! 👑', fr: 'Double six : invente une règle ! 👑', de: 'Doppelsechs: Erfinde eine Regel! 👑' },
      {
        it: 'Vale fino al prossimo doppio sei. Chi la infrange paga.',
        en: 'It lasts until the next double six. Break it and pay.',
        es: 'Dura hasta el próximo doble seis. Quien la rompa paga.',
        fr: "Elle dure jusqu'au prochain double six. Qui l'enfreint paie.",
        de: 'Gilt bis zur nächsten Doppelsechs. Wer sie bricht, zahlt.',
      },
      'give',
      3,
    )
  if (a === b)
    return R(
      { it: `Doppio ${a}!`, en: `Double ${a}!`, es: `¡Doble ${a}!`, fr: `Double ${a} !`, de: `Pasch ${a}!` },
      { it: 'Scegli chi colpire', en: 'Pick your victim', es: 'Elige a tu víctima', fr: 'Choisis ta victime', de: 'Wähl dein Opfer' },
      'give',
      a,
    )
  switch (sum) {
    case 3:
      return R(
        { it: 'Uno-due… tocca a te! 😬', en: 'One-two… your turn! 😬', es: 'Uno-dos… ¡te toca! 😬', fr: 'Un-deux… pour toi ! 😬', de: 'Eins-zwei… du bist dran! 😬' },
        { it: 'Il dado non perdona', en: 'The dice show no mercy', es: 'Los dados no perdonan', fr: 'Les dés ne pardonnent pas', de: 'Die Würfel kennen keine Gnade' },
        'drink',
        2,
      )
    case 4:
      return R(
        { it: 'Mani al cielo! 🙌', en: 'Hands up! 🙌', es: '¡Manos arriba! 🙌', fr: 'Mains en l’air ! 🙌', de: 'Hände hoch! 🙌' },
        { it: 'L’ultimo ad alzare le mani paga', en: 'Last one to raise their hands pays', es: 'El último en levantar las manos paga', fr: 'Le dernier à lever les mains paie', de: 'Wer zuletzt die Hände hebt, zahlt' },
        'none',
      )
    case 5:
      return R(
        { it: 'Maestro delle domande ❓', en: 'Question master ❓', es: 'Maestro de preguntas ❓', fr: 'Maître des questions ❓', de: 'Fragenmeister ❓' },
        {
          it: 'Fino al prossimo 5, chi risponde a una tua domanda paga',
          en: 'Until the next 5, anyone who answers your question pays',
          es: 'Hasta el próximo 5, quien responda a tu pregunta paga',
          fr: "Jusqu'au prochain 5, qui répond à ta question paie",
          de: 'Bis zur nächsten 5 zahlt jeder, der deine Frage beantwortet',
        },
        'none',
      )
    case 6:
      return R(
        { it: 'Categoria! 🧠', en: 'Category! 🧠', es: '¡Categoría! 🧠', fr: 'Catégorie ! 🧠', de: 'Kategorie! 🧠' },
        {
          it: 'Scegli una categoria, a giro si dice una parola. Chi si blocca paga',
          en: 'Pick a category, go around saying words. Whoever freezes pays',
          es: 'Elige una categoría, por turnos se dice una palabra. Quien se bloquee paga',
          fr: 'Choisis une catégorie, chacun dit un mot. Qui bloque paie',
          de: 'Wähl eine Kategorie, reihum ein Wort. Wer hängt, zahlt',
        },
        'none',
      )
    case 7:
      return R(
        { it: 'Sette! Dito sul naso 👃', en: 'Seven! Finger on nose 👃', es: '¡Siete! Dedo en la nariz 👃', fr: 'Sept ! Doigt sur le nez 👃', de: 'Sieben! Finger auf die Nase 👃' },
        { it: 'L’ultimo a toccarsi il naso paga', en: 'Last to touch their nose pays', es: 'El último en tocarse la nariz paga', fr: 'Le dernier à toucher son nez paie', de: 'Wer zuletzt die Nase berührt, zahlt' },
        'none',
      )
    case 8:
      return R(
        { it: 'Rima! 🎤', en: 'Rhyme! 🎤', es: '¡Rima! 🎤', fr: 'Rime ! 🎤', de: 'Reim! 🎤' },
        { it: 'Di’ una parola, a giro si fa rima. Chi sbaglia paga', en: 'Say a word, go around rhyming. Miss and pay', es: 'Di una palabra, por turnos se rima. Quien falle paga', fr: 'Dis un mot, chacun fait une rime. Qui rate paie', de: 'Sag ein Wort, reihum reimen. Wer patzt, zahlt' },
        'none',
      )
    case 9:
      return R(
        { it: 'Pollice magico 👍', en: 'Thumb master 👍', es: 'Pulgar mágico 👍', fr: 'Pouce magique 👍', de: 'Daumenmeister 👍' },
        {
          it: 'Quando appoggi il pollice sul tavolo, tutti devono copiarti. L’ultimo paga',
          en: 'When you put your thumb on the table everyone must copy. Last one pays',
          es: 'Cuando pongas el pulgar en la mesa, todos te copian. El último paga',
          fr: 'Quand tu poses ton pouce sur la table, tous t’imitent. Le dernier paie',
          de: 'Legst du den Daumen auf den Tisch, müssen alle nachmachen. Der Letzte zahlt',
        },
        'none',
      )
    case 10:
      return R(
        { it: 'Social! 🍻', en: 'Social! 🍻', es: '¡Social! 🍻', fr: 'Social ! 🍻', de: 'Social! 🍻' },
        { it: 'Brindisi di gruppo', en: 'Group toast', es: 'Brindis de grupo', fr: 'Toast collectif', de: 'Gruppentoast' },
        'all',
        1,
      )
    case 11:
      return R(
        { it: 'Alla tua destra! 👉', en: 'To your right! 👉', es: '¡A tu derecha! 👉', fr: 'À ta droite ! 👉', de: 'Rechts von dir! 👉' },
        { it: 'Il vicino a destra paga', en: 'Your right neighbour pays', es: 'Tu vecino de la derecha paga', fr: 'Ton voisin de droite paie', de: 'Dein rechter Nachbar zahlt' },
        'give',
        2,
      )
    default:
      return R(
        { it: 'Salvo! 😎', en: 'Safe! 😎', es: '¡A salvo! 😎', fr: 'Sauvé ! 😎', de: 'Sicher! 😎' },
        { it: 'Passa i dadi', en: 'Pass the dice', es: 'Pasa los dados', fr: 'Passe les dés', de: 'Gib die Würfel weiter' },
        'none',
      )
  }
}
