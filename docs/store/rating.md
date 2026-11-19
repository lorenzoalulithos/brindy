# Brindy: age-rating questionnaires

Target result: **Apple 18+** (17+ on the old scale) · **Google Play / IARC: PEGI 18, ESRB Mature 17+, USK 18**. Target audience in Play Console: **18+ only**.

Facts these answers rely on (keep them true in every build):
- **Age gate** on first launch ("Are you 18 or older?"). Answering No blocks the app. The "Play responsibly · Drink water · Never drink & drive" line is always visible on Home.
- **Alcohol is one of three penalty modes** (sips / alcohol-free points / dares), chosen in Settings. Every penalty is capped at 5 per event (shown as "SHOT!" in sips mode). There are no chugging contests and nothing like "finish the bottle".
- **Spicy cards** (Never Have I Ever, Truth or Dare, Most Likely To, Spin the Bottle, Wheel of Doom presets) are **non-explicit**, flagged `spicy: true`, **off by default**, and shown only when the toggle is on and the pack is unlocked.
- **Cup Pong** is a virtual ball-toss skill game. A hit triggers a normal (capped) penalty in the chosen mode, and there are no real drinks to "finish".
- **Horse Race** bets are **sips or points only**. There is no money, no purchasable currency and no prize. Shot Roulette is a chance game about picking a glass, not a casino game.
- **No user-generated content is shown to other users.** Player names stay on the device. The "Suggest a game" form sends the idea **only to us**; nothing is published in the app.
- No chat, no accounts, no location, no unrestricted web browsing, no links to social networks inside gameplay.
- **Ads:** AdMob interstitials when leaving a game (frequency-capped) and opt-in rewarded videos. Ads are requested with the 18+ / mature setting and with **no alcohol-ad categories** on automatic networks (see `docs/STRATEGIA.md`).
- **In-app purchases:** content packs, "Remove ads" (and later the Brindy Pass subscription). There are no loot boxes or random paid rewards.

---

## Apple: App Store Connect → App Information → Age Rating

### Content descriptors (frequency)

| Question | Answer | Note |
|---|---|---|
| Cartoon or Fantasy Violence | **Infrequent/Mild** | Cartoon bomb explodes in "The Bomb" (an object, no characters hurt). Choosing "None" is also defensible; "Infrequent" is the safe choice. |
| Realistic Violence | None | |
| Prolonged Graphic or Sadistic Realistic Violence | None | |
| Profanity or Crude Humor | **Infrequent/Mild** | Cheeky party humour in prompts; no slurs. |
| Mature or Suggestive Themes | **Infrequent/Mild** | Optional spicy pack, non-explicit. |
| Horror/Fear Themes | None | |
| Medical/Treatment Information | None | |
| Alcohol, Tobacco, or Drug Use or References | **Frequent/Intense** | Drinking-game theme (sips mode, glasses, "shot"). No tobacco or drugs. |
| Simulated Gambling | **Infrequent/Mild** | Horse Race asks players to bet sips/points on a horse. There is no money or currency. We declare it to be safe. |
| Sexual Content or Nudity | None | |
| Graphic Sexual Content and Nudity | None | |
| Contests | None | |

### Yes/No questions
| Question | Answer |
|---|---|
| Unrestricted Web Access | **No** |
| Gambling (real money) | **No** |
| Loot boxes / paid random items | **No** |
| User-generated content (visible to other users) | **No**. Player names stay local; the suggestion form goes privately to the developer. |
| Messaging and chat | **No** |
| Advertising | **Yes** (interstitial + rewarded, AdMob) |
| Parental controls | No (adults only) |
| Age assurance | **Yes, self-declaration age gate (18+)** at first launch |
| Made for Kids | **No** |

Also set **"Age Rating Override → 18+"** if the questionnaire comes out lower. Guideline 1.4.3 forbids encouraging *excessive* alcohol consumption: our cap of 5, the responsible-drinking banner and the alcohol-free/dares modes are the mitigation (also explained in `review-notes.md`).

---

## Google Play: Policy → App content

### IARC content rating questionnaire (category: **Game**)

| Section | Question (summary) | Answer |
|---|---|---|
| Violence | Violence towards characters (realistic/fantasy)? | **No**. The only explosion is a cartoon bomb object, no characters hurt or killed. |
| | Blood, gore? | No |
| Fear | Scary content? | No |
| Sexuality | Nudity? | No |
| | Sexual content / innuendo? | **Yes: mild, non-explicit sexual innuendo**, only in the optional spicy pack (off by default). |
| Language | Profanity? | **Mild** (crude humour, no strong swearing). |
| Controlled substances | References to alcohol/tobacco/drugs? | **Yes, alcohol** |
| | Depicts or encourages use of alcohol? | **Yes.** Drinking is a gameplay penalty (optional; alcohol-free and dares modes available; capped per event). |
| | Tobacco / drugs? | No |
| Gambling | Real-money gambling? | **No** |
| | Simulated gambling? | **Yes** (Horse Race: betting sips/points, nothing of value). Declare it to stay consistent with Apple. |
| | Can players spend money on gambling? | No |
| Crude humour | Toilet/crude humour? | Mild |
| Miscellaneous | Users can interact or exchange content? | **No** |
| | Shares user location? | No |
| | Digital purchases? | **Yes** (content packs, remove ads; subscription later) |
| | Unrestricted internet / web browser? | No |
| | Is the app a web browser or search engine? | No |

Expected result: **PEGI 18** (alcohol use encouraged), ESRB Mature 17+, USK 18, IARC 18+. If a region returns lower, keep it: Play Console "Target audience" must still be **18 and over**.

### Other Play Console declarations
- **Target audience and content:** age groups **18+ only**; the app is **not** "designed for children"; it doesn't appeal to children (no cartoon mascots for kids, adult theme).
- **Ads:** **Yes, contains ads.**
- **Gambling apps declaration:** **not** a real-money gambling app.
- **Alcohol/Tobacco policy:** the app doesn't sell alcohol or facilitate its sale.
- **News app:** No. **Government app:** No. **Health app:** No. **Financial features:** None.
- **Data safety** (keep aligned with `privacy-policy.md`):
  - *Collected:* **Device or other IDs** (advertising ID, via AdMob, for advertising and fraud prevention; shared with Google). **App activity / app interactions** (ad interactions, via AdMob). **Personal info → email address and name/nickname**, only if the user submits the optional suggestion form (purpose: developer communications; not shared; optional). **Purchase history** (in-app purchases, handled by Google Play / RevenueCat if used).
  - *Not collected:* location, contacts, photos, health, financial info (payments are handled by Google Play).
  - Data encrypted in transit: **Yes** (HTTPS). Users can request deletion: **Yes** (email in the privacy policy).
  - Player names, settings and scores stay **only on the device**, so they are not declared as "collected".

---

## Keep consistent
If any of these change, update both questionnaires and the privacy policy:
- adding chat or shared/online content;
- making spicy content explicit (not allowed anyway);
- adding real-money items to the Horse Race;
- adding analytics or crash SDKs;
- showing user suggestions publicly.
