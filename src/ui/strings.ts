import type { Loc } from '../core/i18n'

/** Strings for the scoreboard, Party Mix, install prompt and next-game teaser. Use with `L()` from `useT()`. */
export const S = {
  scoreboard: { it: 'Classifica', en: 'Scoreboard', es: 'Clasificación', fr: 'Classement', de: 'Rangliste' },
  scoreSub: {
    it: 'Punti penalità della serata: chi è in cima ha perso di più 😅',
    en: "Tonight's penalty points: whoever's on top lost the most 😅",
    es: 'Puntos de castigo de la noche: quien va primero ha perdido más 😅',
    fr: 'Points de pénalité de la soirée : le premier a le plus perdu 😅',
    de: 'Strafpunkte des Abends: Wer oben steht, hat am meisten verloren 😅',
  },
  scoreEmpty: { it: 'Ancora nessun punto. Giocate!', en: 'No points yet. Go play!', es: 'Aún no hay puntos. ¡A jugar!', fr: 'Pas encore de points. Jouez !', de: 'Noch keine Punkte. Los, spielt!' },
  reset: { it: 'Azzera', en: 'Reset', es: 'Reiniciar', fr: 'Remettre à zéro', de: 'Zurücksetzen' },
  pts: { it: 'pt', en: 'pts', es: 'pts', fr: 'pts', de: 'Pkt' },
  partyMix: { it: 'Party Mix', en: 'Party Mix', es: 'Party Mix', fr: 'Party Mix', de: 'Party Mix' },
  partyMixSub: { it: 'Un gioco a caso, subito', en: 'A random game, right now', es: 'Un juego al azar, ya', fr: 'Un jeu au hasard, tout de suite', de: 'Ein Zufallsspiel, sofort' },
  installTitle: { it: 'Aggiungi Brindy alla home', en: 'Add Brindy to your home screen', es: 'Añade Brindy a tu pantalla de inicio', fr: "Ajoute Brindy à l'écran d'accueil", de: 'Brindy zum Homescreen hinzufügen' },
  installSub: {
    it: 'Funziona anche senza internet: perfetto per le feste senza campo.',
    en: 'Works without internet too: perfect for parties with no signal.',
    es: 'Funciona también sin internet: perfecto para fiestas sin cobertura.',
    fr: 'Marche aussi sans internet : parfait pour les soirées sans réseau.',
    de: 'Funktioniert auch ohne Internet: perfekt für Partys ohne Empfang.',
  },
  installBtn: { it: '📲 Installa', en: '📲 Install', es: '📲 Instalar', fr: '📲 Installer', de: '📲 Installieren' },
  iosHint: {
    it: 'Tocca Condividi ⬆️ e poi “Aggiungi a Home”.',
    en: 'Tap Share ⬆️ then “Add to Home Screen”.',
    es: 'Toca Compartir ⬆️ y luego “Añadir a pantalla de inicio”.',
    fr: 'Touche Partager ⬆️ puis « Sur l’écran d’accueil ».',
    de: 'Tippe auf Teilen ⬆️ und dann „Zum Home-Bildschirm“.',
  },
  notNow: { it: 'Non ora', en: 'Not now', es: 'Ahora no', fr: 'Pas maintenant', de: 'Nicht jetzt' },
  nextGame: { it: 'Prossimo gioco', en: 'Next game', es: 'Próximo juego', fr: 'Prochain jeu', de: 'Nächstes Spiel' },
  countdown: { it: 'tra {d}g {h}h {m}m', en: 'in {d}d {h}h {m}m', es: 'en {d}d {h}h {m}m', fr: 'dans {d}j {h}h {m}m', de: 'in {d}T {h}Std {m}Min' },
  countdownHours: { it: 'tra {h}h {m}m', en: 'in {h}h {m}m', es: 'en {h}h {m}m', fr: 'dans {h}h {m}m', de: 'in {h}Std {m}Min' },
} satisfies Record<string, Loc>
