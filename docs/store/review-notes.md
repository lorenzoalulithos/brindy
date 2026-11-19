# Brindy: Notes for App Review

Paste the text below into **App Store Connect → App Review Information → Notes** (and, shortened, into **Play Console → App access** if asked). No demo account is needed.

> ✅ **Scheduled games: native binaries are built with `VITE_REVIEW_BUILD=1`.**
> With the flag, `daysUntilRelease()` returns 0 for every game, so all **14 games** are playable, and the Home "Next game" countdown is hidden. Nothing is dormant or hidden (guideline 2.3.1).
> ⚠️ **Important:** Apple and Google publish *the exact binary they review*, so the review build **is** the public store build. **Every App Store / Play release is built with the flag.** In the native apps, new games arrive through app **updates** (each one reviewed). The weekly drip release (`releaseAt` → "Coming in N days") applies only to the **web/PWA** build, which is built without the flag.
> Store binaries: `VITE_REVIEW_BUILD=1 npm run build`, then `npx cap sync`.
> Purchases (RevenueCat), AdMob, UMP consent and ATT are wired in code (see README → "Monetizzazione"). Still to do before submitting: create the store products and entitlements, set the real ad unit IDs and RevenueCat keys in the env, add the Info.plist / AndroidManifest entries, and test sandbox purchases and restore on a real device.

---

## Text to paste (EN)

```
Brindy is a party game app for groups of adults (18+) playing together on one phone: 14 classic social games (dice, cards, spin the bottle, truth or dare, horse race, cup pong, quick-reflex and word games) rebuilt in 3D. No account, no chat, no online play, no user content shared between users.

AGE GATE
On first launch the app asks "Are you 18 or older?". Answering "No" blocks the app. The line "Play responsibly · Drink water · Never drink & drive" is always visible on the Home screen.

ALCOHOL IS OPTIONAL: THREE PENALTY MODES
Settings (gear icon, top right of Home) → "Penalty":
• Sips: penalties are shown as sips, e.g. "Drink 2 sips".
• Alcohol-free (points): the same penalties become penalty points, with a scoreboard. No drinking at all.
• Dares: penalties become light, harmless dares (e.g. "do 10 squats", "sing a chorus").
All game text goes through this setting, so no screen requires drinking.

NO ENCOURAGEMENT OF EXCESSIVE DRINKING
• Every penalty is capped at 5 sips per event (shown as a single "SHOT!"). There are no speed-drinking or quantity contests and nothing like "finish your drink/the bottle".
• Rules explicitly say nobody has to drink, and the Terms include responsible-drinking guidance.
• Optional "spicy" prompts are non-explicit, OFF by default (Settings → Spicy content) and require unlocking a pack.
• The Horse Race game uses sips/points as stakes only: no money, no virtual currency, no prizes.

HOW TO REACH EVERY GAME
1. Confirm age → Home shows the game grid (filters: All / Classics / Party / Skill).
2. Tap any game card to open it. Games that need named players (e.g. Ring of Fire, Truth or Dare, Most Likely To, The Bomb, Cup Pong) first open the Players screen: add 2–3 names (any text) and tap "Let's go!". You can also add players at any time from the players bar on Home.
3. In each game the main action is the big button at the bottom (or tapping/swiping the 3D scene). The "?" button at the top right shows the rules; "←" goes back to Home.
All 14 games in this build are available immediately; there is no locked or time-gated content.

PURCHASES AND ADS
• In-app purchases: optional content packs (e.g. spicy pack) and "Remove ads" (Settings). Packs can also be unlocked for one night by watching an optional rewarded video. "Restore purchases" is in Settings → Privacy & legal.
• Ads: Google AdMob interstitials only when leaving a game (max one every few games and several minutes, never in the first minutes), plus optional rewarded videos. Consent is requested via Google's UMP (IAB TCF v2.2) in the EEA/UK and via App Tracking Transparency on iOS; users can change it anytime in Settings → Privacy & legal → Ad privacy. No alcohol advertising is served through ad networks.

PRIVACY
Player names, settings and scores are stored only on the device. The optional "Suggest a game" form sends the idea (and an optional email) privately to the developer; it is never shown to other users. The privacy policy and terms are available in the app (Settings → Privacy & legal, and under the suggestion form) and at [URL] / [URL].

Contact for review questions: [NAME], [EMAIL], [PHONE].
```

---

## Short version for Google Play (App access / Notes, max ~500 chars)

```
Party game for adults (18+, age gate on first launch). No login: all 14 games and features are available without an account. Drinking is optional: Settings → Penalty switches between sips, alcohol-free points and dares; each penalty is capped (max 5). Spicy (non-explicit) prompts are off by default. Games needing names open the Players screen: add 2–3 names and start. Contact: [EMAIL].
```

---

## Checklist before pressing "Submit"
- [ ] Store binary built with `VITE_REVIEW_BUILD=1` (all 14 games playable, no countdown on Home).
- [ ] IAP products created (pack, remove ads) and wired; sandbox purchase tested; `restorePurchases()` implemented (the Settings row already exists).
- [ ] `openAdConsent()` wired to UMP; consent form shown at first launch (native builds). The Settings "Ad privacy" row already exists.
- [ ] Placeholders ([RAGIONE SOCIALE], emails…) filled in `privacy-policy.md` / `terms.md`: they are **bundled into the app as-is** (Settings → Privacy & legal). Same for `CONTACT_EMAIL` in `src/core/appInfo.ts`. URLs live and added to the store listings.
- [ ] Screenshots only show what's in the build.
- [ ] Age rating set per `rating.md` (Apple 18+, Play 18+ target audience).
