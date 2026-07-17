# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page React + TypeScript "SAMSAVE" — a mocked-up UI for monitoring and controlling smart home appliances, tracking energy usage/cost, and gamifying energy savings. All data is static/in-memory (no backend, no API calls, no persistence); state lives entirely in `App.tsx` via `useState`.

## Commands

```bash
npm install      # install deps
npm run dev      # start Vite dev server (default port 5173)
npm run build    # type-check (tsc -b) then production build via Vite
npm run preview  # preview the production build
```

There is no test suite, linter, or formatter configured in this repo.

## Architecture

**State ownership**: `App.tsx` is the single source of truth. It holds `appliances`, `automations`, `activeTab`, `isNightMode`, and `inspectedCard` (the appliance currently shown in the modal), and passes both data and mutator callbacks (`onToggleAppliance`, `onToggleAutomation`, `onSelectAppliance`) down as props. Views and components are otherwise stateless/presentational.

**Tab-based routing without a router**: `activeTab: TabId` (`'dashboard' | 'rank' | '3dhome'`, defined in `src/types.ts`) controls which view renders in `App.tsx`; there is no `react-router`. `BottomNav` is the only tab switcher.

**Views** (`src/views/`) — top-level screens rendered by `App.tsx`:
- `Dashboard.tsx` — live power draw summary, appliance grid, automations list, insights panel.
- `EnergyRank.tsx` — gamification results screen (XP, rank, achievements). Receives `matchHistory` from `App.tsx` and derives all stats live from it (`src/data/ranks.ts`, `src/data/achievements.ts`) — no hardcoded numbers.
- `GameView.tsx` — the 7-round match itself (control points, power-up toggles, combo penalties, scoring). See "Game loop" below.
- `Home3D.tsx` — CSS-only isometric "3D" floor plan visualizing appliance locations and live energy flow (SVG lines from a central panel to each active appliance).
- `Discover.tsx` — static cross-sell screen, 3 real Samsung.com product listings (`src/data/discoverProducts.ts`). Vendor-published specs/model numbers/URLs, not measured household data — no `ruleSource`, no kWh ties, the "every number traces to the household table" Hard Rule below doesn't apply here. No price field (Samsung's own page owns current pricing). Each card also shows the real current appliance's weeklyKwh next to `estimatedWeeklySavingsKwh` — **that one field is hardcoded/invented, a deliberate exception to the Hard Rule below**, confirmed by the project owner after being offered two real alternatives (a live Coach Agent lookup scaled against real weeklyKwh; a real ISEER-formula estimate for the AC specifically) and choosing to hardcode all 3 instead. See the field's doc comment in `src/types.ts` for the full reasoning — do not extend this exception to any other number in the app without the same explicit confirmation. Also includes a self-reported "I Upgraded to This" button — one-time +1000 XP (`UPGRADE_BONUS_XP`, `src/utils/gameEngine.ts`) and a "Home Upgrader" achievement, both clearly labeled honor-system/not verified (no purchase backend exists).

**Components** (`src/components/`) — shared UI: `ApplianceModal` (detail/inspection modal opened via `onSelectAppliance`), `BottomNav`, `StarIcon`.

**Data model** (`src/types.ts`, `src/data/`): `Appliance`, `Automation`, `Insight` interfaces. Seed data lives in `src/data/appliances.ts`, `automations.ts`, `insights.ts` as plain exported arrays (`initialAppliances`, `initialAutomations`, `insights`). Each `Appliance` carries both dashboard fields (watts, kWh, cost, `recommendation`) and 3D-map fields (`pos: { top, left }` as percentage strings, `color`/`accent` for glow/theming). To add a new appliance, add an entry to `appliances.ts` with a `lucide-react` icon and a `pos` — it will automatically appear in both the Dashboard grid and the 3D map.

## Styling

Tailwind CSS with a hand-rolled "chunky toy" design system defined in `src/index.css` (not in `tailwind.config.js`, which is unextended):
- Signature look: thick `4px` dark borders (`#2D3436`) + solid offset "shadow" (e.g. `shadow-[0_8px_0_0_#2D3436]`) that shrinks on hover/active to fake a pressed-button effect. Reuse the `.toy-card` class and this shadow pattern for new card-like UI rather than inventing a new style.
- Hex colors are used directly in JSX (`text-[#3498DB]`, etc.) rather than Tailwind theme tokens — there is no central color token setup, so match existing hex values when adding UI (`#2D3436` dark/ink, `#3498DB` blue, `#2ECC71` green, `#F1C40F` yellow, `#E74C3C` red, `#9B59B6` purple).
- Font is Nunito (loaded via Google Fonts `@import` in `index.css`), weights 400/600/800/900, used almost exclusively at `font-black`.
- Custom animations/effects (`energy-bar`, `pop-in`, `iso-*`, `glow-*`, `energy-path`, `xp-bar-fill`, `float-up-fade`, `cool-pulse`, `clock-shift`, `daylight-swap`) are defined as CSS classes in `index.css` and applied via `className`, not Tailwind utilities. The game-loop ones are all transform/opacity only and wrapped in a `prefers-reduced-motion` block — the first such handling in this app; keep new animations inside that same block.
- Currency is Indian Rupees (`₹`), and units are metric (kWh, kg CO₂).

## Real Data — Source of Truth

`src/data/appliances.ts` currently contains PLACEHOLDER numbers invented by Canvas.
They must be replaced with the actual 7-day household dataset before this ships.
Do not invent kWh, watts, or ₹ figures anywhere in this repo — use only the numbers below,
or read them from `src/data/household.json` once that file exists.

| Appliance | kWh/week | Pattern |
|---|---|---|
| AC (WindFree) | 208.48 (59.5% of total) | Flat ~1,040W every night, 6-hour overnight window (21% of AC's own weekly total, confirmed against 43.9 kWh) |
| Water Heater | 74.99 | Fires daily — 2h morning (avg ~2,770W) + 2h evening (avg ~1,777W) = 4h/day baseline; +2h on days overlapping the washing machine — same hours as AC's peaks |
| Washing Machine | 8.80 | Runs May 8 (11am-12pm), May 11 (9-10am) — both overlap water heater, produce week's two highest demand spikes (6,777W / 6,703W vs ~4,700W typical); measured average draw ~2,200W (samples: 2,220/2,227/2,186/2,169W) |
| Lights | 14.27 | Steady 38-42W, 10am-4pm daily (daylight hours) |
| Refrigerator | 34.85 | Baseline 150-180W |

## Hard Rules

- Never generate or allow a rule/automation that proposes full shutoff of the AC or refrigerator
  (heat-safety constraint — India, 40°C+ summers). Mode/setpoint changes only. Enforced at
  runtime by `checkShutoffGuard` (`src/utils/guardrail.ts`), called both at module-load over the
  static `automations.ts` array and at runtime over every Coach Agent-generated automation and
  chatbot answer before it reaches the UI.
- Every `Automation` and every Coach Agent output must reference a real number from the table above
  **when `ruleSource === 'measured'`**. **Exception**: a `ruleSource: 'generic'` card (user-created
  via the Coach Agent's product-lookup flow, see below) may show an AI-estimated wattage/category
  guidance number instead — this is allowed specifically because it's clearly labeled as an
  estimate (badge + confidence text: "Based on published specs for X" or "No specific data found —
  showing typical X guidance"), never presented as if it were measured. Fabricating a number
  *without* that labeling is still forbidden.
- `EnergyRank.tsx` has no local placeholder constants anymore — XP/rank/achievements all derive
  from real `matchHistory` (`src/utils/gameEngine.ts`'s `toHistoryEntry`), fed by real matches
  played in `GameView.tsx`. The only genuinely invented numbers left in the game loop are the
  rank-tier XP thresholds themselves (`src/data/ranks.ts`) — there's no real data to derive
  "how much cumulative XP = a rank" from, unlike every kWh/XP-per-kWh/combo-multiplier figure,
  which all trace to real automation/appliance data (see `gameEngine.ts`'s comments for each).

## Planned Architecture

The Coach Agent is now implemented (`src/utils/coachAgent.ts`) — a client-side Gemini wrapper,
**not** a backend proxy. This is a deliberate scope tradeoff for a 5-day capstone: the Gemini API
key (`VITE_GEMINI_API_KEY`) is called directly from the browser, baked into the client bundle at
build time exactly like `VITE_KIRI_API_KEY` already was (see `KiriScanner.jsx`'s exposure-disclosure
comment) — visible in the shipped JS via devtools. **Do not add a backend proxy for this without
asking first** — if key protection genuinely matters later, that's a real architecture change, not
a quick fix. Three modes, one wrapper (`callGemini(prompt, useSearch)`):
- **Product-lookup mode** (`lookupProduct`, `useSearch: true`) — used when a user creates a new
  appliance card by name; searches for the specific product's published specs, or falls back to
  category-level generic guidance if nothing specific/unambiguous is found.
- **Setup mode** (`generateAutomations`, `useSearch: false`) — generates 1-2 `Automation`s for a
  *new* card only, from its product-lookup result. **Never regenerates the 5 real, hardened
  `ruleSource: 'measured'` automations in `automations.ts`** — those stay exactly as verified.
- **Chatbot mode** (`chatbotSynthesize`, `useSearch: false`) — writes the chatbot's final answer
  from live-retrieved context (`src/utils/liveKnowledge.ts`, built fresh from the current
  `appliances`/`automations` state), only once the existing local Layer 0/1/2 routing
  (greeting/identity/domain-vocab/relevance) has already accepted the query — those stay 100%
  local and free, unchanged.
- No key configured (`VITE_GEMINI_API_KEY` unset) → every mode falls back to a deterministic mock
  (product-lookup always resolves "generic, nothing found"; chatbot mode returns `null` and the
  caller uses the existing local template answer) — the whole app works with zero live calls.
- Game loop is now implemented (`src/views/GameView.tsx`, `src/utils/gameEngine.ts`): 7 rounds =
  the 5 real measured automations reframed as per-round power-up toggles, 2 control points/round
  (tightened from an original 3 — with 3-4 activatable power-ups per round, 3 CP left enough slack
  to dodge every combo penalty for free; 2 forces a real tradeoff each round), combo penalties
  grounded in the real washer/heater overlap spike ratio (1.434×, averaged from the two measured
  spikes in `laundry_stagger.evidence`) and applied to BOTH overlapping appliances' real per-round
  shares (not just one), which round is the laundry round is randomized each match (always keeping
  the real 3-day gap between the washing machine's two dated events, May 8 and May 11 — possible
  placements are rounds (1,4)/(2,5)/(3,6)/(4,7)) — every other appliance behaves identically every
  round, matching their own automations' "100%/consistent all 7 days" confidence text. Only
  measured automations/appliances participate; generic Coach Agent-created cards are not involved
  in round mechanics. kWh only, no ₹ conversion anywhere in the game (same open TODO as
  `costMonthly` elsewhere). Entirely in-memory, no persistence, same
  as the rest of the app — a page reload resets both the current match and `matchHistory`.
  **Clean next step, not built**: a Coach Agent "play mode" hook for live one-line feedback during
  rounds — `chatbotSynthesize`/`generateAutomations`'s existing mock-fallback + guardrail-filtered
  pattern is ready to slot into `gameEngine.ts`'s `resolveRound` whenever that's wanted.
