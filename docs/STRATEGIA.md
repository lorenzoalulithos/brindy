# Brindy — strategia

## 1. Passare la review degli store (questo viene prima di tutto)
- **Mai "bevi" fisso nel codice**: tutte le penalità passano da `usePenalty()`. Ci sono 3 modalità: sorsi, analcolica a punti e penitenze. In review mostriamo che l'app è un *party game* in cui l'alcol è facoltativo.
- **Age gate 18+** al primo avvio, con il messaggio "gioca responsabilmente" sempre visibile in home.
- **Limite di 5 per penalità** (che diventa "SHOT!"). Niente gare a chi beve di più, niente "finisci la bottiglia".
- **I contenuti piccanti sono spenti di default**, si sbloccano solo dalle impostazioni e restano sempre non espliciti.
- **Rating:** Apple 17+ (Alcohol/Tobacco/Drug Use: Frequent, Mature/Suggestive Themes: Infrequent), Google PEGI 18 / Mature 17+.
- **Screenshot e descrizione dello store:** parliamo di "party game" e "serata con gli amici", non di "ubriacarsi". Il bicchiere nell'icona va bene.

## 2. Pubblicità: poca ma mirata
Le regole sono già nel codice (`src/core/ads.ts`):
| Formato | Quando | Perché |
|---|---|---|
| Interstitial | solo all'uscita da un gioco, max 1 ogni 3 partite **e** ogni 6 minuti, mai nei primi 8 minuti | non rovina la serata |
| Rewarded | opt-in: "guarda un video → pacchetto 🌶️ sbloccato fino alle 6 del mattino" | è l'utente che lo vuole, ed è il formato che rende di più |
| Banner | **no** | rende poco e fa sembrare l'app scadente |
| Sponsor nativo | "Ruota della Sfiga powered by <brand di bibite/energy drink/snack>" | l'eCPM più alto; da vendere direttamente quando avremo i numeri |

Nota: AdMob e le altre reti limitano le pubblicità di alcolici sui contenuti 18+, quindi niente sponsor di alcolici sulle reti automatiche. Gli sponsor di alcolici vanno solo con accordi diretti e nei paesi dove sono consentiti.

## 3. Come facciamo soldi
1. **Pacchetti premium** (2,99 €): 🌶️ piccanti, coppie, natale/capodanno, addio al celibato/nubilato.
2. **Brindy Pass** (abbonamento, circa 1,99 €/mese o 9,99 €/anno): tutti i pacchetti, zero pubblicità, giochi nuovi in anteprima.
3. **Rimuovi pubblicità** (3,99 € una tantum).
4. Rewarded + interstitial per chi non paga.
> Per gli acquisti in-app: RevenueCat (un solo SDK per iOS e Android, gratis fino a 2.500 $/mese di ricavi).

## 4. Come diventiamo i primi
- **Multilingua dal primo giorno**: IT, EN, ES, FR, DE (già fatti). Dopo: PT-BR, PL, NL (in Brasile e Polonia questo genere va fortissimo e c'è poca concorrenza).
- **ASO per lingua**: titolo e sottotitolo con le keyword locali ("giochi alcolici", "drinking games", "juegos para beber", "jeux à boire", "Trinkspiele"), con screenshot localizzati.
- **TikTok / Reels**: il 3D è il nostro asso nella manica. Clip verticali di 7 secondi con la corsa dei cavalli al photo-finish, la bomba che esplode, la bottiglia che gira. La caption tipica: "chi perde beve 😭". Ogni gioco nuovo è un'occasione per un contenuto.
- **Uscite periodiche**: un gioco nuovo ogni settimana (`releaseAt` nel registry). La card "Arriva tra X gg" in home crea attesa e ci dà un motivo per mandare le push notification.
- **I giochi proposti dagli utenti** (form già fatto): "il gioco di Marco da Bari è nell'app" → lo condividono loro. È marketing gratis e un motivo per tornare.
- **La web app è la porta d'ingresso**: un link nel gruppo WhatsApp e si gioca subito, senza installare niente. Dopo un po' di partite proponiamo di scaricare l'app per avere i pacchetti offline.
- **Stagionalità**: spingiamo i pacchetti tematici per capodanno, carnevale, estate, Erasmus e lauree.

## 5. Roadmap
- **Ora**: 13 giochi (8 subito al lancio, 5 a uscita settimanale), web app/PWA.
- **Poi**: Capacitor per iOS/Android, AdMob, RevenueCat, push notification per i giochi nuovi.
- **Dopo**: backend leggero (Supabase) per le proposte, i voti della community sui giochi e gli eventi stagionali.
