# WARLANDS → "Clash of Clans on the live map" — Pivot Design

## Context

WARLANDS is a deployed Web3 strategy MMO: a persistent **hex world** (Next.js 16 client on
Vercel, Node+ws+Postgres authoritative server on Railway, **$HEXAR SPL token on Solana (beta)**).
The user **does not like the current hex-economy gameplay** and wants to pivot it into a
**Clash-of-Clans-style base-builder** while **keeping the infrastructure** (deploy pipeline,
Solana token, multiplayer server, art/theme, and the server-authoritative deterministic-sim
pattern).

The chosen direction is **"CoC on the live map"**: the shared persistent hex world stays, but a
player's holding becomes a **buildable, upgradeable base** — buildings + walls + defensive
towers + resource collectors + army on a **cluster of hexes** — and you **raid neighbors**
(deploy troops → combat → loot + stars).

This document is the approved design from a `superpowers:brainstorming` session. The next step is
`superpowers:writing-plans` to produce the implementation plan for **Sub-project 0**.

The architecture is a clean, content-agnostic frame — **state container + deterministic sim +
ws broadcast + Postgres JSONB snapshots** — with game *content* plugged in. The pivot swaps the
*ruleset* (state shape, tick logic, command set, `src/game/*` config), not the frame.

---

## Design decisions (from brainstorming)

| Area | Decision |
|---|---|
| Core loop | CoC on the live map: claim hex cluster → build/upgrade base → train troops → raid neighbors (live) → stars + loot → defend (auto + shields) → clan donations |
| Base layout | **Cluster of adjacent hexes** = your base; one primary building per hex; **walls on hex edges**; traps hidden on hexes |
| Cluster size | **Growable**: start = center Command Center hex + 6 neighbors (7); each Command Center level unlocks annexing more adjacent hexes |
| Resources | **Gold + Elixir** (collectors → storages with caps, lootable) + **WAR** as premium |
| Progression | **Command Center** level (Town Hall) gates building unlocks, max levels, counts, and cluster expansion |
| Build model | **Limited builders + real-time timers**; WAR instant-finishes / buys extra builders |
| Combat | **Live troop deployment** via **instanced battle** (attack a snapshot; defender is offline/auto) |
| Scoring/loot | **3 stars** (≥50% destruction =1, Command Center destroyed =1, 100% =1) + **loot %** of available Gold/Elixir (storage protection) + trophies |
| Defenses | Ground tower (cannon), splash tower (mortar), **air defense (anti-air)**, **walls**, **traps**, **defending hero/garrison** |
| Troops | **Fresh ~5-troop roster**: melee (Grunt), ranged (Marksman), wall-breaker (Breacher), tank (Juggernaut), air (Gunship) |
| Shields | **Free shield** window after a damaging raid; **WAR extends**; matchmaking skips shielded bases |
| WAR token | **Hybrid**: spend in-game WAR (speed-ups, builders, instant-train, shield-extend, cosmetics, stake-to-protect); earn **real on-chain WAR** via raid/league payouts from a server treasury |
| Clans | **Basic in MVP**: create/join, chat, troop donations → reinforcements (defend + deployable on attack) |
| Lives on | **`/world`** (live shared map). `/play` single-player ruleset retired or repurposed as a local tutorial sandbox |

---

## Architecture: keep vs replace vs add (file-mapped)

**KEEP (reuse the frame):**
- `server/index.ts` — ws transport, 1 Hz world tick, broadcast, snapshot loop (add a battle-instance channel)
- `server/db.ts` — Postgres JSONB snapshots (extend schema; same load/save mechanism)
- `src/web3/*` (`solana.ts`, `Web3Provider.tsx`, `WalletButton.tsx`, `WalletPanel.tsx`) — Phantom + WAR reads (do NOT add `@solana/wallet-adapter-react-ui`; it hangs the build)
- `src/components/HexMap.tsx` — SVG hex grid, pan/zoom/pinch, click-select (re-theme for base tiles/walls)
- `src/components/GameShell.tsx` tab shell, `TopBar.tsx`, `TutorialOverlay.tsx` framework
- `applyCommand` dispatcher + seeded-determinism pattern (`mulberry32` in `src/game/combat.ts`); hex math/zones in `src/game/world.ts`

**REPLACE (the ruleset):**
- `src/sim/types.ts` — `WorldState`, `SimPlot`, `Command` union → base-cluster shapes
- `src/sim/tick.ts` `tickPlot()` → collector production, storage caps, builder/timer advance
- `src/sim/commands.ts` → new command set (claim cluster, place/upgrade building, manage builders, train, raid, shield, clan)
- `src/game/{resources,buildings,units,plotTypes,formulas,market}.ts` → Gold/Elixir economy, building catalog, troop roster, Command-Center progression tables
- `/play` Zustand single-player ruleset (`src/game/store.ts`); `PlotPanel`/`MilitaryPanel`/`MarketPanel` → base-editor + army + attack UIs

**ADD:**
- Instanced **battle subsystem** (server-side fast-tick battle sim + client raid screen) — *Sub-project 2*
- Builders/timers, shields, clan-lite, WAR payout treasury

---

## Decomposition (each sub-project = its own spec → plan → build)

- **SP0 — Buildable base + economy on the live map (no combat)** ← *first; spec & build now*
- **SP1 — Defenses + base-editor UI + onboarding tutorial**
- **SP2 — Live instanced raid (deploy, pathfinding, towers fire, stars/loot, replay) + shields + matchmaking**
- **SP3 — WAR economy (sinks: speed-ups/builders/instant-train/shield/cosmetics/stake; faucet: raid+league payouts incl. on-chain payout treasury)**
- **SP4 — Basic clans (donations/reinforcements) + leagues/trophies polish**

---

## Sub-project 0 — scope (first to spec → plan → build)

**Goal:** On `/world`, a player claims a hex cluster, builds & upgrades Command Center +
collectors + storages using builders on real-time timers, Gold/Elixir flow, all
server-authoritative and persisted. A demoable foundation before combat.

**In scope:**
1. **New sim ruleset** (new modules, e.g. `src/sim/coc/*`, reusing the frame — NOT in-place mutation of the live sim):
   - Base-cluster state: `ownedHexes`, per-hex building, gold/elixir, storages, `builders[]`, `buildQueue`, Command Center level
   - Commands: `claimCluster`, `placeBuilding`, `upgradeBuilding`, `assignBuilder`/timer handling, `collect` (or auto-collect), `expandCluster`
   - Tick: collector production, storage caps, builder/timer countdown → completion
   - Command-Center progression table (CC 1–5 for MVP): unlocks, max levels, building counts, cluster expansion
2. **Server:** reuse `server/index.ts` + `server/db.ts`; wire the new command set; extend the snapshot shape. Keep 1 Hz tick for economy/timers.
3. **Client `/world`:** base-editor interactions on the hex map — claim cluster, place/upgrade building, builder/timer indicators, Gold/Elixir HUD. Reuse pan/zoom/select, `TopBar`, `WalletPanel`.
4. **Tutorial:** minimal claim → build onboarding (reuse `TutorialOverlay`).
5. **Tests:** vitest sim units (economy, timers, claim/expand, caps); one server ws integration test.

**Out of scope for SP0 (stub cheap data shapes where useful):** combat, troops, defenses firing, shields, WAR sinks/payouts, clans.

**SP0-relevant design-brief sections:** §4 (shell/HUD), §5 (world map), §6 (my base / build mode), §8 (tutorial + shop stub), §9 (states), §10 (a11y). Combat/raid sections (§7) and the army/clan surfaces are deferred to later sub-projects.

**Build hygiene:** branch off `main` first (`feat/coc-pivot-sp0`); implement new ruleset in new modules and repoint `/world` behind it, keeping old code until parity, so live deploys stay safe. Solana payout/signer work (later SPs) must run from a **no-space path** (repo path has spaces → breaks Solana/Anchor CLIs).

---

## "claude design" visual brief (approved — run before building UI)

### 0. Mission
Design the complete interface for **WARLANDS**, a war-themed, Clash-of-Clans-style base-builder
played on a **shared, persistent live hex map**. The feeling we want: the **tactile, juicy,
"one-more-upgrade" satisfaction of CoC** crossed with a **gritty command-room war aesthetic** —
gunmetal, field maps, stencil type, radar glow. It must feel premium and alive at phone size
first, scale up to desktop, and never feel like a generic dashboard.

### 1. Product context
- **Core loop:** claim a cluster of adjacent hexes on the live map → build & upgrade your base
  (Command Center, Gold/Elixir collectors + storages, defensive towers, walls, traps, barracks)
  using **limited builders on real-time timers** → train troops → **raid neighbors with live
  troop deployment** → earn **stars + loot + trophies** → defend via auto-defense + **shields** →
  donate/reinforce in a **clan**.
- **Base = a cluster of hexes.** Not a square village — a growable patch of the *world* grid.
  **One primary building sits on each hex; walls live on the hex *edges* between your hexes; traps
  are hidden on hexes.** Leveling the Command Center **annexes more adjacent hexes** (start at 7:
  center + 6 neighbors).
- **Three currencies:** **Gold** and **Elixir** (collected, stored with caps, lootable) and
  **WAR** (premium — real Solana SPL token; speeds builds, buys builders, extends shields,
  cosmetics; also *earned* from raids/leagues).
- **Two map scales the UI must switch between:** the **world** (a field of many bases) and **your
  base** (one cluster, zoomed in, editable).

### 2. Platform & technical constraints (must honor)
- **Mobile-first**, touch-native: pan, pinch-zoom, tap-to-select, long-press for context, drag for
  placement. Respect iOS safe-area insets (already set in the root layout). Then scale up
  gracefully to tablet/desktop (sidebars instead of bottom-sheets).
- **Stack:** Next.js 16 (App Router, Turbopack) + React 19, dark theme only.
- **Fonts already wired:** **Oswald** (condensed display — headers, numbers, stat chips, "stencil"
  feel), **Geist Sans** (body/UI), **Geist Mono** (addresses, tx hashes, debug). Design the full
  type scale around these — do not introduce new font families.
- **Reuse, don't rebuild:** the existing **`HexMap` SVG renderer** (pointy-top hexes,
  pan/zoom/pinch, click-select, terrain sprite layer), the **`GameShell`** tab/layout shell,
  **`TopBar`** stat-chip header, **`WalletButton`/`WalletPanel`** (Phantom connect + live SOL/WAR
  balances), and the **`TutorialOverlay`** coachmark framework. Show how your screens drop into
  these, and re-skin the hex tiles/walls rather than replacing the renderer.
- **Performance:** the world view may show dozens–hundreds of bases; the base view animates
  timers, resource counters, and (later) a live battle. Specify what's SVG vs DOM vs canvas, and
  keep per-frame work cheap.

### 3. Art direction & design language
Deliver these as **reusable tokens** (Tailwind/CSS variables), not one-off values.

**Mood & references:** Clash of Clans' readability + "juice," but the chrome is a **tactical
command console / field map** — topographic contours, hex grid overlays, radar sweeps, stencil
unit IDs, ammo-counter numerics. Avoid: cartoon medieval, pastel, glassy SaaS gradients, generic
neumorphism.

**Palette (roles → suggested values, tune freely):**
- Surface base `#0E1113` (near-black gunmetal), raised `#171B1F`, sunken `#0A0C0D`.
- Hairlines/borders `#2A3036`; etched divider `#1C2226`.
- Primary text `#E6EAEC`, secondary `#9AA4AB`, disabled `#5A636A`.
- **Faction accent** (player identity / friendly): cold steel-cyan `#3FC1C9` → selection, owned
  tiles, CTAs.
- **Gold** resource `#E8B24A`; **Elixir** `#B061E0` (or acidic `#C2F542` "fuel" green — pick one
  and commit); **WAR** premium `#FF5A3C` warning-red/orange with a subtle metallic sheen.
- **Alert/under-attack** `#FF3B3B`; **shielded/safe** `#43D17A`; **timer/in-progress** amber
  `#F0A93B`.
- Define light/dark *states per token* (hover, active, focus ring = 2px faction-cyan glow).

**Typography scale:** specify display (Oswald) sizes for screen titles, building names, big
resource readouts, the **3-star result**; body (Geist) for descriptions; mono for hashes. Numbers
(resource counts, timers, damage) should use **tabular/condensed** treatment so they don't jitter
while ticking.

**Spacing / radius / elevation:** an 8pt spacing scale; small radii (4–8px — military, not
bubbly); a 3-tier shadow/elevation system (flat tile, raised card, floating sheet/modal) plus an
**inner-glow** treatment for selected/active hexes.

**Iconography:** a cohesive line+fill icon set for the **three resources**, each **building type**,
each **troop type**, **builder**, **timer/clock**, **shield**, **star**, **trophy**, **clan**,
plus map controls (zoom, recenter, find-target). Specify sizes (16/20/24) and the locked vs
unlocked vs upgradeable badge states.

**Texture/material:** how do hex tiles read? (terrain base sprite + faction tint overlay +
occupancy state). How do **walls on edges** render at different levels (palisade → concrete →
reinforced)? How does a **damaged/destroyed** building look post-raid?

**Motion & "juice" (call this out explicitly — it's half the feel):**
- Build/upgrade complete: pop + dust + level-up flourish; resource gain: coins/elixir fly into the
  counter.
- Counters **count up smoothly**, don't snap. Timers show a sweeping ring/progress bar.
- Tap feedback on every interactive element; placement has a satisfying "snap to hex" +
  valid/invalid tint.
- Selection: hex lifts, neighbors dim, build options slide in. Define durations/easing
  (e.g., 120–240ms, ease-out) and a **reduced-motion** variant.

### 4. Global shell & HUD
- **Top HUD:** Gold / Elixir / WAR readouts (current / cap, with cap-reached state), Command
  Center level badge, trophy count, **builder availability pill** (e.g. "2/3 builders — 1 free"),
  shield status, settings/wallet. Specify the mobile compact form vs desktop expanded form, and
  what collapses.
- **Mode switch:** how the player toggles **World ⇄ My Base**, and within base, **View ⇄
  Build/Edit** mode. Make the current mode unmistakable.
- **Persistent nav** (Base / World / Army / Clan / Shop) — adapt the existing `GameShell` tabs;
  define active/inactive/badged (e.g. "attack ready," "donation request") states.

### 5. Screen — Live World Map
- A field of **neighbor bases as hex clusters** on the shared grid; your base clearly highlighted
  (faction tint + marker). Show zoom levels: far (clusters as colored blobs/flags), mid (cluster
  shape + Command Center level + trophy/shield badges), near (individual buildings hinted).
- **Raid targets tappable** → preview card (owner, CC level, est. lootable Gold/Elixir, trophy
  delta, shield timer if protected — and the **"shielded → can't attack"** state). CTA: **Scout /
  Attack**.
- **Find-a-match** affordance (next attackable target), recenter-on-my-base, and a "you are being
  watched / recently raided" indicator.
- States: loading the world, sparse vs dense regions, your base under shield, your base recently
  raided (show the damage + "revenge" hook).

### 6. Screen — My Base (view + build/edit)
- **View mode:** your hex cluster, one building per hex, walls on edges, collectors visibly
  **filling up** (and a "tap to collect" bubble when ready), timers ticking on buildings under
  construction, idle-builder nudge.
- **Build/Edit mode:** entering it dims the world, shows the **buildable hexes** (empty owned
  hexes), **wall-edge slots**, and a **build bottom-sheet** (mobile) / side rail (desktop):
  - **Building cards:** icon, name, what it does, **cost in Gold/Elixir/WAR**, **build time**,
    current/next level, locked reason if gated by Command Center, and a clear **"can't afford / no
    builder free"** state.
  - **Placement flow:** pick a building → ghost preview snaps to a valid hex (invalid = red) →
    confirm. **Walls** placed/dragged along edges. Show how multi-select or drag-to-place walls
    feels.
- **Building info / upgrade modal:** stats at current vs next level, cost, **timer with WAR
  "finish now"** option, downgrade/move/sell, and the **builder assignment**.
- **Builders & timers:** make limited builders legible (which is busy, on what, time left); the
  **"buy extra builder with WAR"** upsell; **instant-finish with WAR** with a confirm.
- **Command Center upgrade = the milestone moment:** design the celebratory **cluster-expansion**
  flow (new adjacent hexes unlock, what's newly buildable, caps raised).
- States: brand-new player (mostly empty cluster + tutorial), storages full (collectors idle), all
  builders busy, mid-upgrade.

### 7. Screen — Raid / Attack *(SP2 — later)*
- **Pre-attack:** scout the target's layout (read-only base view, est. loot, defenses
  visible/partially hidden), pick your **army** from a troop tray (counts, housing space used).
- **Live deployment:** the target base fills the screen; a **troop tray** at the bottom (each
  troop: icon, count, cost/space); **tap a hex/edge to deploy** that troop there. Show **live
  battle juice** — troops moving/auto-targeting, towers firing, **air defense vs air troops**,
  walls breaking, traps springing, floating damage numbers, buildings smoking → destroyed, a
  **destruction % meter** and **star thresholds** filling (≥50% =★, Command Center destroyed =★,
  100% =★★★), a battle timer, and a **surrender/end** control.
- **Result card:** the **3-star reveal** (big, satisfying, Oswald), **loot breakdown** (Gold/Elixir
  taken vs available, WAR earned), trophy +/−, "next target / return home." Design the **defense
  report** the defender sees later (replay entry, what was lost, revenge button, shield granted).
- States: no troops trained, target shielded mid-scout, zero-star loss, perfect 3-star, connection
  drop mid-battle.

### 8. Supporting surfaces
- **Army / training** *(SP1/SP2)*: barracks queue, housing capacity, train/instant-train (WAR), the
  **5 troops** (Grunt = melee swarm, Marksman = ranged, Breacher = wall-breaker, Juggernaut =
  tank, Gunship = air) — each with role, counter hint, stats, cost.
- **Shields** *(SP2)*: current shield timer, how it was earned, **extend-with-WAR** purchase, and
  the "shield expired → vulnerable" state.
- **Clan (basic)** *(SP4)*: create/join, member list, chat, **donation request + fulfill**
  (reinforcement troops), clan badge/identity.
- **Shop / WAR** *(SP3; stub in SP0)*: the premium surface — builders, instant-finishes, shield
  extensions, **cosmetics** (base themes, wall skins, faction flags), and the **earn-WAR / on-chain
  payout** view tied to the existing wallet panel.
- **Tutorial/coachmarks** *(SP0)*: reuse `TutorialOverlay`; design the first-session path (claim →
  place collector → place storage → start an upgrade → wait/finish).
- **Leaderboard / trophies / league** badge *(SP4)*.

### 9. Component-state matrix (design each, don't assume happy-path)
For every interactive surface specify: **loading, empty, error, offline/disconnected, insufficient
resources, no builder free, storage full, shielded, under-attack, locked-by-CC-level, success.**
Provide the **skeleton/loading** treatment and the **toast/inline-error** patterns.

### 10. Accessibility & readability
- Legible at 360px width and in sunlight (high contrast, no thin gray-on-gray for critical
  numbers). WCAG AA contrast for text/icons.
- Touch targets ≥ 44px; don't bury actions under map gestures.
- Color is never the *only* signal (shield/alert/affordability also use icon + label).
- Honor `prefers-reduced-motion` (static fallbacks for all the juice).
- Map gestures must not trap scroll; provide explicit zoom/recenter buttons (already present in
  `HexMap`).

### 11. Deliverables & acceptance criteria
- A **design-token sheet** (color/type/space/radius/elevation/motion) ready to drop into
  Tailwind/CSS vars.
- **High-fidelity mockups** for: World Map, My Base (view + build mode + building/upgrade modal +
  CC-expansion), Raid (scout + live deploy + 3-star result + defense report), Army, Shield, Clan,
  Shop/WAR, plus the key **states** from §9.
- **Mobile (primary) + desktop** for each major screen.
- An **icon set** covering §3.
- A short **interaction/motion spec** (durations, easing, the build/upgrade/collect/star "juice").
- Notes on **what reuses `HexMap`/`GameShell`/`TopBar`/`WalletPanel`/`TutorialOverlay`** and what
  is net-new.
- **Acceptance:** a new player can, from the mockups alone, understand how to claim, build, upgrade
  (with timers/builders), train, attack, earn stars/loot, and defend — at phone size, in one glance
  per screen.

---

## Verification (SP0)

- `npm test` (vitest sim, incl. new economy/timer/claim tests green) and `cd server && npm test` (ws integration).
- `npx tsc --noEmit` clean.
- Local: kill any `next dev`, `rm -rf .next`, then `npm run build` (build contention + wallet-adapter-ui footguns noted in memory).
- Manual: run server + client locally, claim a cluster, place a collector + storage, watch a build timer complete and Gold/Elixir accrue and cap; confirm snapshot persists across a server restart.
- Deploy parity: Railway (`railway up --ci -s warlands-app`) + Vercel (`vercel --prod --yes`), live ws probe ticking.

## Next steps

1. **(this commit)** design spec written to `docs/superpowers/specs/2026-06-16-warlands-coc-pivot-design.md`.
2. Run `superpowers:writing-plans` to produce the **SP0** implementation plan.
3. Run the "claude design" visual pass for the SP0 UI (brief above; SP0 subset = §4, §5, §6, §8, §9, §10).
4. Implement SP0 (TDD), verify, deploy; then spec SP1.
