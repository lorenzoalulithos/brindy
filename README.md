# Brindy 🍻

Party game 3D per serate epiche. Web app (React 19 + Vite + TypeScript + three.js con @react-three/fiber, drei e rapier, zustand), installabile come PWA offline e pacchettizzabile per iOS/Android con Capacitor.

## Requisiti

- Node.js ≥ 22
- Per le build native: Xcode (iOS) e/o Android Studio (Android)

## Sviluppo

```bash
npm install
npm run dev        # server di sviluppo Vite
npm run lint       # ESLint
npx tsc -b         # type-check
```

## Build e PWA

```bash
npm run build      # tsc -b + vite build → dist/
npm run preview    # serve dist/ in locale (il service worker funziona solo qui, non in dev)
```

La build genera un service worker (vite-plugin-pwa, `registerType: 'autoUpdate'`) che mette in cache l'app shell, tutti i chunk dei giochi caricati in lazy, i font e il motore fisico rapier (wasm incluso nel chunk `rapier`). Dopo la prima apertura online si può giocare senza campo. Le nuove versioni si installano da sole al caricamento successivo.

- Il manifest è definito **solo** in `vite.config.ts` (`VitePWA({ manifest })`); viene generato come `manifest.webmanifest` e collegato automaticamente in `index.html`.
- I font (Lilita One, Nunito 600/800/900) sono self-hosted tramite `@fontsource/*` e importati in `src/main.tsx`: niente Google Fonts, funzionano offline e nell'app nativa.

## App native (Capacitor)

Configurazione in `capacitor.config.ts` (appId `app.brindy`, `webDir: 'dist'`, splash e status bar scuri).

Prima volta (crea le cartelle `ios/` e `android/`):

```bash
npm run build
npm run cap:add:ios        # richiede Xcode
npm run cap:add:android    # richiede Android Studio
```

Poi, a ogni modifica:

```bash
npm run cap:sync      # build + copia dist/ e plugin in entrambi i progetti nativi
npm run cap:ios       # build + sync iOS + apre Xcode
npm run cap:android   # build + sync Android + apre Android Studio
```

**Solo verticale**: Capacitor non blocca l'orientamento dalla config, va impostato nei progetti nativi dopo `cap add`:

- iOS: in `ios/App/App/Info.plist` lascia solo `UIInterfaceOrientationPortrait` in `UISupportedInterfaceOrientations` (e `~ipad`).
- Android: in `android/app/src/main/AndroidManifest.xml` aggiungi `android:screenOrientation="portrait"` all'`<activity>` di `MainActivity`.

Le vibrazioni passano da `vibrate()` in `src/core/feedback.ts`: nell'app nativa usa `@capacitor/haptics`, sul web `navigator.vibrate`.

**Build per gli store**: compila sempre con `VITE_REVIEW_BUILD=1` (tutti i giochi sbloccati, niente countdown; vedi `docs/store/review-notes.md`). Il rilascio settimanale dei giochi vale solo per la web app.

```bash
VITE_REVIEW_BUILD=1 npm run build && npx cap sync
```

## Monetizzazione (solo app native)

Pubblicità e acquisti sono attivi solo dentro Capacitor (`isNativePlatform()`); sul web restano gli annunci "della casa" e gli sblocchi gratuiti di prova. I plugin vengono caricati con `import()` dinamico, quindi non finiscono nel bundle web.

- Pubblicità: `src/core/admob.ts` (`@capacitor-community/admob` **8.2.1**), con la coda di `src/core/ads.ts`.
- Acquisti: `src/core/purchases.ts` (`@revenuecat/purchases-capacitor` **14.0.0**).
- Le versioni sono fissate a release più vecchie di 2 settimane. Dalla 8.3.0 AdMob aggiunge la dipendenza `@webview-native-ui/engine`: valutala prima di aggiornare.

### Variabili d'ambiente (`.env.production.local`, da non committare)

| Variabile | Cosa contiene |
|---|---|
| `VITE_ADMOB_IOS_INTERSTITIAL`, `VITE_ADMOB_IOS_REWARDED` | ID delle unità pubblicitarie iOS (`ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN`) |
| `VITE_ADMOB_ANDROID_INTERSTITIAL`, `VITE_ADMOB_ANDROID_REWARDED` | ID delle unità pubblicitarie Android |
| `VITE_ADMOB_TESTING=1` | facoltativa: invia anche le unità reali come richieste di test (per provare sui dispositivi) |
| `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY` | chiavi API pubbliche di RevenueCat (`appl_…`, `goog_…`) |

Se gli ID AdMob mancano, l'app usa le **unità di test pubbliche di Google** e mostra solo annunci di prova: per lo sviluppo va bene, in produzione no. Senza chiave RevenueCat gli acquisti sono disattivati e i pulsanti rispondono con un errore.

### AdMob: passaggi dopo `cap add`
1. In AdMob crea due app (iOS e Android) e, per ognuna, un'unità **interstitial** e una **rewarded**. Imposta la classificazione massima dei contenuti a **MA**: anche il codice manda `maxAdContentRating: MatureAudience`, `tagForUnderAgeOfConsent: false` e `tagForChildDirectedTreatment: false`. Blocca le categorie di annunci di alcolici e di gioco d'azzardo.
2. In AdMob › Privacy e messaggi crea il messaggio **GDPR (TCF v2.2)** e il messaggio **IDFA** per iOS. La UMP li mostra all'avvio, dopo il controllo dell'età.
3. **iOS** (`ios/App/App/Info.plist`):
   ```xml
   <key>GADApplicationIdentifier</key>
   <string>ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN</string>
   <key>NSUserTrackingUsageDescription</key>
   <string>Usiamo questo identificatore solo per mostrarti annunci più pertinenti. Brindy funziona anche se rifiuti.</string>
   <key>SKAdNetworkItems</key>
   <array><!-- elenco SKAdNetwork di Google: https://developers.google.com/admob/ios/3p-skadnetworks --></array>
   ```
   Localizza `NSUserTrackingUsageDescription` (it/en/es/fr/de) con `InfoPlist.strings`. Per le prove con le unità di test, l'App ID di test iOS è `ca-app-pub-3940256099942544~1458002511`.
4. **Android** (`android/app/src/main/AndroidManifest.xml`, dentro `<application>`):
   ```xml
   <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID"
              android:value="ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN"/>
   ```
   Per le prove usa l'App ID di test Android `ca-app-pub-3940256099942544~3347511713`. Nella Play Console dichiara l'uso dell'ID pubblicità (permesso `AD_ID`, aggiunto dall'SDK).
5. Il flusso all'avvio (`initAds()`) è: età confermata → `initialize` → richiesta ATT (solo iOS) → `requestConsentInfo` → `showConsentForm` se serve → precaricamento dell'interstitial. Impostazioni › "Privacy pubblicità" riapre il modulo delle opzioni privacy (`showPrivacyOptionsForm`).

### RevenueCat: prodotti ed entitlement
1. Crea il progetto RevenueCat e collega App Store Connect (chiave In-App Purchase) e Google Play (service account).
2. **Prodotti** (non consumabili) da creare negli store con questi ID esatti (`productId()` in `purchases.ts`):
   | Prodotto | Entitlement |
   |---|---|
   | `brindy.no_ads` | `no_ads` |
   | `brindy.pack_bottle_spicy` | `pack_bottle-spicy` |
   | `brindy.pack_mostlikely_spicy` | `pack_mostlikely-spicy` |
   | `brindy.pack_neverhave_spicy` | `pack_neverhave-spicy` |
   | `brindy.pack_truthdare_spicy` | `pack_truthdare-spicy` |
   | `brindy.pack_wheel_spicy` | `pack_wheel-spicy` |
   | `brindy.pack_couples` | `pack_couples` |
   | `brindy.pack_party_bachelor` | `pack_party-bachelor` |
   | `brindy.pack_office` | `pack_office` |
   | abbonamenti Brindy Pass `brindy.pass_monthly` (1,99 €/mese) e `brindy.pass_yearly` (9,99 €/anno), stesso gruppo di abbonamenti | `pass` (tutti i pacchetti + niente pubblicità; in vendita in Impostazioni e nella schermata dei pacchetti bloccati) |
3. Un pacchetto nuovo nel codice (`usePack('<id>')`, oppure `PACKS` in `src/core/kit.ts`) va aggiunto a `PACK_IDS` in `purchases.ts` e qui sopra.
4. All'avvio `initPurchases()` sincronizza gli entitlement con lo store locale: `unlock(packId, FOREVER)` e `setAdsRemoved`. Se un acquisto viene rimborsato, revoca solo gli sblocchi "per sempre"; quelli "per stanotte" ottenuti con il video restano. "Ripristina acquisti" in Impostazioni chiama `Purchases.restorePurchases()`.
5. I prezzi mostrati nei pulsanti arrivano dallo store (`usePrice`); i valori "2,99 €" e "3,99 €" servono solo come fallback sul web.

## Struttura del progetto

```
src/
  main.tsx, App.tsx     entry point e routing tra schermate
  screens/              home, giocatori, impostazioni, proponi un gioco…
  ui/                   GameShell (cornice comune dei giochi), PackLock, AdOverlay, Placeholder
  three/                Stage (luci, env map, tavolo da bar), texture disegnate su canvas
  core/                 store (zustand), i18n (5 lingue), penalità, turni, random, suoni/vibrazione, ads
  games/
    registry.ts         elenco giochi: nome, regole, colore, data di uscita, import lazy
    <id>/index.tsx      un gioco = una cartella
docs/
  GAME_GUIDE.md         regole per scrivere un gioco
  STRATEGIA.md          strategia di prodotto
capacitor.config.ts     config app nativa
vite.config.ts          Vite + PWA (manifest e service worker)
```

## Aggiungere un gioco

Leggi **[docs/GAME_GUIDE.md](docs/GAME_GUIDE.md)** e prendi come riferimento `src/games/dice/`. In breve:

1. Aggiungi la voce in `src/games/registry.ts` (id, emoji, colore, regole in 5 lingue, `load: () => import('./<id>')`).
2. Crea `src/games/<id>/index.tsx` con un componente di default `({ onExit }: GameProps)` dentro `<GameShell>` + `<Stage>`.
3. Penalità sempre tramite `usePenalty()`, testi sempre in it/en/es/fr/de, niente asset di rete.
4. Verifica con `npx tsc -b` e `npx eslint src/games/<id>`.

Gioca responsabilmente · Bevi acqua · Non guidare.
