# Brindy: store listing (App Store + Google Play)

Counts are Unicode characters (each emoji = 1), checked by script against the limits:
name ≤ 30 · subtitle ≤ 30 (iOS) · short description ≤ 80 (Play) · full description ≤ 4000 · iOS keywords ≤ 100 (comma-separated, no spaces, don't repeat words already in the name/subtitle).

Notes for all languages
- Framing stays "party game / night with friends". Drinking is one of three penalty modes, never the goal. Never write "get drunk", "chug" or similar.
- Google Play uses the same app name (limit 30) and the "Full description". The App Store uses name, subtitle, keywords, the description (same text) and the promotional text (optional, can reuse the short description).
- The games list follows `src/games/registry.ts` (14 games, including Cup Pong). Some ship weekly after launch (`releaseAt`). For store review we submit a **review build** (`VITE_REVIEW_BUILD=1`, see `review-notes.md`) where all 14 are playable, so the list matches the binary. If the public build is meant to drip-release, the copy says "new games added regularly" and the screenshots must only show games that are actually in it.
- iOS keywords: Apple already indexes words from the name and subtitle, so they aren't repeated. Never use competitors' brand names.
- The screenshot order matches the captions: 1 home/carousel · 2 Crazy Dice · 3 Ring of Fire · 4 The Bomb · 5 settings with penalty modes · 6 game grid with all games (the review build has no "coming soon" cards).


---

## 🇮🇹 Italiano

**App name** (23/30)

```
Brindy: Giochi Party 3D
```

**Subtitle (iOS)** (30/30)

```
Giochi da festa per serate top
```

**Short description (Google Play)** (73/80)

```
14 party game in 3D per serate tra amici: dadi, carte, bomba e altro. 18+
```

**Keywords (iOS)** (93/100)

```
giochi alcolici,giochi da bere,obbligo verità,non ho mai,festa,amici,carte,dadi,serata,gruppo
```

**Full description** (1729/4000)

```
🍻 Brindy trasforma il telefono nel tavolo da gioco della serata.

14 party game classici, rifatti in 3D con luci neon, animazioni fluide e suoni. Si apre, si passa il telefono e si gioca: niente account, niente registrazione.

🎮 I GIOCHI
🎲 Dadi Pazzi: lancia, leggi la regola, subisci
🍾 Gira la Bottiglia: il destino punta a te
🔥 Anello di Fuoco: il re dei giochi di carte
🏇 Corsa dei Cavalli: punta, tifa, brinda
🎡 Ruota della Sfiga: gira e prega
🙈 Non Ho Mai: confessa tutto
😈 Obbligo o Verità: niente scuse
🃏 Sopra o Sotto: fidati dell'istinto
👉 Chi è Più Probabile: al tre, puntate il dito
🥃 Roulette dei Bicchieri: uno è maledetto
💣 La Bomba: passa il telefono, svelto!
⚡ Riflessi da Bar: il più lento paga
🧠 Categorie Lampo: lettera, categoria, via!
🏓 Pong dei Bicchieri: scorri, tira, centra!

✨ PERCHÉ BRINDY
• Grafica 3D vera, pensata per il telefono in verticale
• Pochi tocchi e pulsanti enormi: si gioca anche a fine serata
• Giocatori con nome e colore, turni automatici
• Regole sempre a portata di mano, in 5 lingue
• Funziona anche offline
• Nuovi giochi in arrivo regolarmente

🥤 GIOCA COME VUOI
Scegli la modalità delle penalità:
• 🍺 Sorsi, per chi brinda
• 🥤 Analcolica a punti, con classifica finale
• 😈 Penitenze divertenti al posto dei sorsi
Ogni penalità ha un tetto massimo: si gioca per ridere, non per esagerare.

🌶️ Vuoi più pepe? Il pacchetto piccante (mai esplicito) è opzionale e spento di default.

💡 Hai un gioco che fate sempre con gli amici? Proponilo dall'app: i migliori diventano giochi 3D, con il tuo nome nei crediti.

⚠️ Brindy è riservata ai maggiorenni (18+). Gioca responsabilmente, bevi acqua e non metterti mai alla guida dopo aver bevuto. La modalità analcolica è sempre disponibile.
```

**Screenshot captions** (6)

1. 14 party game in 3D, in tasca (29)
2. Lancia i dadi e scopri la regola (32)
3. Anello di Fuoco: pesca e brinda (31)
4. La Bomba: passa il telefono, svelto! (36)
5. Sorsi, punti o penitenze: scegli tu (35)
6. Nuovi giochi ogni settimana (27)


---

## 🇬🇧 English

**App name** (22/30)

```
Brindy: Party Games 3D
```

**Subtitle (iOS)** (27/30)

```
Party games for epic nights
```

**Short description (Google Play)** (75/80)

```
14 party games in 3D for nights with friends: dice, cards, bomb & more. 18+
```

**Keywords (iOS)** (87/100)

```
drinking games,truth or dare,never have i ever,kings cup,friends,cards,dice,group,adult
```

**Full description** (1539/4000)

```
🍻 Brindy turns your phone into the game table of the night.

14 classic party games, rebuilt in 3D with neon lights, smooth animations and sound. Open it, pass the phone around and play: no account, no sign-up.

🎮 THE GAMES
🎲 Crazy Dice: roll, read, suffer
🍾 Spin the Bottle: fate points at you
🔥 Ring of Fire: the king of card games
🏇 Horse Race: bet, cheer, cheers
🎡 Wheel of Doom: spin and pray
🙈 Never Have I Ever: confess everything
😈 Truth or Dare: no excuses
🃏 Higher or Lower: trust your gut
👉 Most Likely To: on three, point
🥃 Shot Roulette: one of them is cursed
💣 The Bomb: pass the phone, fast!
⚡ Bar Reflexes: slowest one pays
🧠 Flash Categories: letter, category, go!
🏓 Cup Pong: swipe, throw, sink it!

✨ WHY BRINDY
• Real 3D graphics, built for a phone held upright
• Few taps, huge buttons: playable even late at night
• Named, colour-coded players and automatic turns
• Rules always one tap away, in 5 languages
• Works offline
• New games added regularly

🥤 PLAY YOUR WAY
Pick the penalty mode:
• 🍺 Sips, for those raising a glass
• 🥤 Alcohol-free points, with a final scoreboard
• 😈 Fun dares instead of sips
Every penalty is capped: it's about laughing, not overdoing it.

🌶️ Want more spice? The spicy pack (never explicit) is optional and off by default.

💡 Got a game you always play with friends? Suggest it in the app: the best ones become 3D games, with your name in the credits.

⚠️ Brindy is for adults only (18+). Play responsibly, drink water and never drink and drive. Alcohol-free mode is always available.
```

**Screenshot captions** (6)

1. 14 party games in 3D, in your pocket (36)
2. Roll the dice, get the rule (27)
3. Ring of Fire: draw a card, raise a glass (40)
4. The Bomb: pass the phone, fast! (31)
5. Sips, points or dares: your call (32)
6. A new game every week (21)


---

## 🇪🇸 Español

**App name** (27/30)

```
Brindy: Juegos de Fiesta 3D
```

**Subtitle (iOS)** (25/30)

```
Juegos para noches épicas
```

**Short description (Google Play)** (76/80)

```
14 juegos de fiesta en 3D para quedar con amigos: dados, cartas, bomba y más
```

**Keywords (iOS)** (81/100)

```
juegos para beber,yo nunca,verdad o reto,amigos,cartas,dados,previa,grupo,adultos
```

**Full description** (1715/4000)

```
🍻 Brindy convierte tu móvil en la mesa de juego de la noche.

14 juegos de fiesta de toda la vida, rehechos en 3D con luces de neón, animaciones fluidas y sonido. Lo abres, pasas el móvil y a jugar: sin cuenta y sin registro.

🎮 LOS JUEGOS
🎲 Dados Locos: tira, lee, sufre
🍾 La Botella: el destino te señala
🔥 Anillo de Fuego: el rey de los juegos de cartas
🏇 Carrera de Caballos: apuesta, anima, brinda
🎡 Ruleta de la Mala Suerte: gira y reza
🙈 Yo Nunca: confiésalo todo
😈 Verdad o Reto: sin excusas
🃏 Mayor o Menor: confía en tu instinto
👉 Quién es Más Probable: a la de tres, señalad
🥃 Ruleta de Chupitos: uno está maldito
💣 La Bomba: ¡pasa el móvil, rápido!
⚡ Reflejos de Bar: el más lento paga
🧠 Categorías Relámpago: letra, categoría, ¡ya!
🏓 Pong de Vasos: ¡desliza, tira, encesta!

✨ POR QUÉ BRINDY
• Gráficos 3D de verdad, pensados para el móvil en vertical
• Pocos toques y botones enormes: se juega bien hasta el final de la noche
• Jugadores con nombre y color, turnos automáticos
• Reglas siempre a mano, en 5 idiomas
• Funciona sin conexión
• Nuevos juegos cada poco

🥤 JUEGA A TU MANERA
Elige el tipo de castigo:
• 🍺 Tragos, para los que brindan
• 🥤 Sin alcohol, con puntos y marcador final
• 😈 Retos divertidos en lugar de tragos
Cada castigo tiene un tope: se juega para reír, no para pasarse.

🌶️ ¿Quieres más picante? El pack picante (nunca explícito) es opcional y viene desactivado.

💡 ¿Tenéis un juego que siempre jugáis con los amigos? Propónlo desde la app: los mejores se convierten en juegos 3D, con tu nombre en los créditos.

⚠️ Brindy es solo para mayores de edad (18+). Juega con responsabilidad, bebe agua y no conduzcas nunca si has bebido. El modo sin alcohol está siempre disponible.
```

**Screenshot captions** (6)

1. 14 juegos de fiesta en 3D, en tu bolsillo (41)
2. Tira los dados y descubre la regla (34)
3. Anillo de Fuego: roba una carta y brinda (40)
4. La Bomba: ¡pasa el móvil, rápido! (33)
5. Tragos, puntos o retos: tú eliges (33)
6. Un juego nuevo cada semana (26)


---

## 🇫🇷 Français

**App name** (26/30)

```
Brindy : Jeux de Soirée 3D
```

**Subtitle (iOS)** (26/30)

```
Jeux de soirée entre potes
```

**Short description (Google Play)** (75/80)

```
14 jeux de soirée en 3D entre amis : dés, cartes, bombe et plus encore. 18+
```

**Keywords (iOS)** (80/100)

```
jeux à boire,action ou vérité,je n’ai jamais,amis,cartes,dés,apéro,groupe,adulte
```

**Full description** (1802/4000)

```
🍻 Brindy transforme ton téléphone en table de jeu de la soirée.

14 grands classiques des jeux de soirée, refaits en 3D avec néons, animations fluides et sons. On l'ouvre, on fait tourner le téléphone et on joue : pas de compte, pas d'inscription.

🎮 LES JEUX
🎲 Dés Fous : lance, lis, subis
🍾 La Bouteille : le destin te désigne
🔥 Anneau de Feu : le roi des jeux de cartes
🏇 Course de Chevaux : parie, crie, trinque
🎡 Roue de la Poisse : tourne et prie
🙈 Je n'ai jamais : avoue tout
😈 Action ou Vérité : pas d'excuses
🃏 Plus ou Moins : fie-toi à ton instinct
👉 Qui est le plus susceptible : à trois, on pointe
🥃 Roulette des Verres : l'un d'eux est maudit
💣 La Bombe : passe le téléphone, vite !
⚡ Réflexes de Bar : le plus lent paie
🧠 Catégories Éclair : lettre, catégorie, go !
🏓 Pong des Verres : glisse, lance, marque !

✨ POURQUOI BRINDY
• De la vraie 3D, pensée pour le téléphone tenu à la verticale
• Peu de gestes et des boutons énormes : jouable même en fin de soirée
• Joueurs avec prénom et couleur, tours automatiques
• Règles toujours à portée de main, en 5 langues
• Fonctionne hors ligne
• De nouveaux jeux régulièrement

🥤 JOUE COMME TU VEUX
Choisis le type de pénalité :
• 🍺 Gorgées, pour ceux qui trinquent
• 🥤 Sans alcool, avec points et classement final
• 😈 Gages rigolos à la place des gorgées
Chaque pénalité est plafonnée : on joue pour rire, pas pour abuser.

🌶️ Envie de piment ? Le pack épicé (jamais explicite) est optionnel et désactivé par défaut.

💡 Vous avez un jeu que vous faites toujours entre amis ? Propose-le dans l'app : les meilleurs deviennent des jeux 3D, avec ton nom dans les crédits.

⚠️ Brindy est réservée aux adultes (18+). Joue de façon responsable, bois de l'eau et ne prends jamais le volant après avoir bu. Le mode sans alcool est toujours disponible.
```

**Screenshot captions** (6)

1. 14 jeux de soirée en 3D dans ta poche (37)
2. Lance les dés, découvre la règle (32)
3. Anneau de Feu : pioche et trinque (33)
4. La Bombe : passe le téléphone, vite ! (37)
5. Gorgées, points ou gages : à toi de voir (40)
6. Un nouveau jeu chaque semaine (29)


---

## 🇩🇪 Deutsch

**App name** (22/30)

```
Brindy: Partyspiele 3D
```

**Subtitle (iOS)** (28/30)

```
Partyspiele für Spieleabende
```

**Short description (Google Play)** (76/80)

```
14 Partyspiele in 3D für Abende mit Freunden: Würfel, Karten, Bombe und mehr
```

**Keywords (iOS)** (89/100)

```
trinkspiele,wahrheit oder pflicht,ich hab noch nie,freunde,karten,würfel,vorglühen,gruppe
```

**Full description** (1695/4000)

```
🍻 Brindy macht dein Handy zum Spieltisch des Abends.

14 Partyspiel-Klassiker, neu gebaut in 3D mit Neonlicht, flüssigen Animationen und Sound. App öffnen, Handy weitergeben, losspielen: kein Konto, keine Anmeldung.

🎮 DIE SPIELE
🎲 Verrückte Würfel: werfen, lesen, leiden
🍾 Flaschendrehen: das Schicksal zeigt auf dich
🔥 Feuerring: der König der Kartenspiele
🏇 Pferderennen: wetten, jubeln, anstoßen
🎡 Pechrad: drehen und beten
🙈 Ich hab noch nie: gib alles zu
😈 Wahrheit oder Pflicht: keine Ausreden
🃏 Höher oder Tiefer: vertrau deinem Bauch
👉 Wer würde am ehesten: auf drei zeigen
🥃 Shot-Roulette: eines ist verflucht
💣 Die Bombe: gib das Handy weiter, schnell!
⚡ Kneipenreflexe: der Langsamste zahlt
🧠 Blitz-Kategorien: Buchstabe, Kategorie, los!
🏓 Becher-Pong: wischen, werfen, versenken!

✨ WARUM BRINDY
• Echte 3D-Grafik, gemacht fürs Handy im Hochformat
• Wenige Taps, riesige Buttons: klappt auch spät am Abend
• Spieler mit Namen und Farbe, automatische Züge
• Regeln immer griffbereit, in 5 Sprachen
• Funktioniert offline
• Regelmäßig neue Spiele

🥤 SPIEL, WIE DU WILLST
Wähl die Art der Strafe:
• 🍺 Schlucke, für alle, die anstoßen
• 🥤 Alkoholfrei mit Punkten und Endstand
• 😈 Lustige Mutproben statt Schlucken
Jede Strafe hat eine Obergrenze: Es geht ums Lachen, nicht ums Übertreiben.

🌶️ Lust auf mehr Würze? Das scharfe Paket (nie explizit) ist optional und standardmäßig aus.

💡 Ihr habt ein Spiel, das ihr immer spielt? Schlag es in der App vor: Die besten werden zu 3D-Spielen, mit deinem Namen in den Credits.

⚠️ Brindy ist nur für Erwachsene (18+). Spiel verantwortungsvoll, trink Wasser und fahr nie, wenn du getrunken hast. Der alkoholfreie Modus ist jederzeit verfügbar.
```

**Screenshot captions** (6)

1. 14 Partyspiele in 3D für die Hosentasche (40)
2. Würfeln und die Regel entdecken (31)
3. Feuerring: Karte ziehen, anstoßen (33)
4. Die Bombe: Handy weitergeben, schnell! (38)
5. Schlucke, Punkte oder Mutproben (31)
6. Jede Woche ein neues Spiel (26)

