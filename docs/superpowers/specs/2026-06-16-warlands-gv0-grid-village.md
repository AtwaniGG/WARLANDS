# WARLANDS GV0 — Grid Village (top-down square base) — Spec

## Context

WARLANDS shipped a Clash-of-Clans pivot (SP0–SP4: claim → build → train → raid → clans → $WAR
sinks) that is **live in prod** (Railway server + Vercel client, `/world`). The user **dislikes
the current surface** — you build directly on a zoomed-out **cluster of shared world hexes**, which
reads as a strategy map, not a base-builder.

**Approved new direction (a "smaller Clash of Clans"):** split the surface into two screens.

- **MY BASE** = a **top-down 20×20 SQUARE-GRID village** you pan/zoom and build on, with
  **footprint buildings** (Town Hall 4×4, defenses 3×3, collectors/storages 3×3, Barracks 3×3,
  Army Camp 4×4, Builder's Hut 2×2, Clan Castle 3×3, Walls 1×1). Tap-to-place / upgrade / move.
  Builders + timers and collectors → COLLECT are kept.
- **WORLD** = the **existing hex map, repurposed as a MAP OF VILLAGES**. A claim is now **ONE world
  hex** (your village's spot). Tap your hex → MY BASE. Tap an enemy hex → scout. Matchmaking by
  tapping is kept.

**This spec covers GV0 only** (the data-model + base-view + economy foundation). Combat re-targeted
to the grid is **GV1** (separate spec). See [[warlands-coc-pivot]] for the full direction and
`docs/superpowers/specs/2026-06-16-warlands-coc-pivot-design.md` for the (now-superseded-on-layout)
SP design.

This document is the approved-direction spec. Next superpowers step after approval:
`superpowers:writing-plans` → the GV0 implementation plan, then TDD build.

### What stays (the frame is content-agnostic)
KEEP underneath, unchanged in behavior: the ws server + 1 Hz tick + Postgres JSONB snapshots
(`server/index.ts`, `server/db.ts`), the `applyCommand` dispatcher + `mulberry32` determinism, the
hex-map renderer (`HexMap`/SVG — now the **WORLD** screen), the design tokens/components
(`globals.css`, `src/components/ui/*`), the economy tick (`tick.ts`), troops/training, $WAR sinks,
and clans. The server must keep importing the sim via **file subpaths** (`@/sim/coc/world`,
`@/sim/coc/commands`, `@/sim/coc/tick`, `@/sim/coc/types`) — not the barrel (see
[[warlands-tech-gotchas]]).

---

## Decisions locked for GV0

| # | Decision |
|---|---|
| Base layout | A **fixed 20×20 square grid** (`GRID_W = GRID_H = 20`). Tiles keyed `"x,y"`, `0 ≤ x,y < 20`. |
| Building keying | Buildings keyed by their **anchor tile** (top-left) `"x,y"`; each has a **footprint** `{w,h}` from config and occupies the `w×h` block from its anchor. |
| Walls | A **tile set**: `walls: Record<"x,y", level>` (1×1 each), instant, gold-only (as today). Replaces hex-edge walls. |
| Village location | `CocBase.location` = the world hexKey the village sits on. **Claim = ONE world hex** (replaces the 7-hex cluster). |
| Builders | **Builder's Huts ARE builders.** `builders(base)` = count of operational `builderHut` buildings (start with **2 pre-placed**). The $WAR "buy builder" becomes "place a hut instantly" (reuses `builderCost`, capped at `MAX_BUILDERS = 5`). |
| Town Hall | Keep internal id **`commandCenter`** (avoid codebase-wide churn); relabel display `name` → **"Town Hall"**. |
| CC progression | Drop `maxHexes`/cluster expansion (grid is fixed). Keep per-building **count + max-level caps**; add a **`maxWalls`** count per tier. Add `clanCastle` (inert in GV0). |
| Clan Castle | A placeable 3×3 building, **inert** in GV0 (reinforcements stay deferred). |
| Combat in GV0 | The aggregate `resolveRaid` still runs on the new shape, but the **client does not surface "attack."** Tapping an enemy hex shows a **read-only scout** (their grid + est. loot) with a **"Raids return in GV1"** state. Army/Clan/$WAR stay fully functional. |
| Deploy | **Ship GV0 to prod** with the new base UI; raids "coming soon" until GV1. (Prod has ~0 real bases.) |
| Migration | `normalizeWorld` **drops old-shape bases** (cluster bases lack `location`) and rebuilds `claimedHexes` from survivors; **players preserved** (war/clan). Recommend a prod `TRUNCATE world_snapshots` for a clean launch. |
| Art | **Done — real redesign art is vendored in** (the "Redesign of Warlands" DS pass). Top-down faux-iso building SVGs (incl. per-level Town Hall + per-level walls), war-camp cracked-earth ground, and the `--bb-*` base-builder token set. No placeholders, no new design prompt needed. See "Art assets (landed)". |

---

## Art assets (landed — from the "Redesign of Warlands" DS pass)

Vendored into the repo, ready to wire (no placeholders):
- **Runtime SVGs** → `public/assets/buildings/*.svg`, `…/terrain/*`, `…/resources/*`, `…/units/*`
  (served at `/assets/...`; render via `<img>`). Each building art is a self-contained **100×100
  faux-iso** SVG (ground-shadow + extruded body) that scales into any footprint cell.
- **Base-builder tokens** → `src/app/base-builder.css` (imported from `globals.css`): `--bb-tile`
  (46px), `--bb-grid` (20), cracked-earth `--bb-earth`/tactical `--bb-tac` ground, placement
  valid/invalid tints, selection ring/glow, faux-iso depth/shadow, level badge, collect bubble,
  defense-range fill, and motion (`bb-thunk` snap, `bb-sweep` build-ring, `bb-fly` collect,
  `bb-star-pop`). All referenced tokens exist in `globals.css`.
- **Reference** → `docs/design-system/templates/base-builder/` (`BaseBuilder.dc.html` full mockup,
  `BaseBuilding.dc.html` per-building component), `ui_kits/base-builder/catalog.html`,
  `guidelines/brand-icons-buildings.card.html`. The mockup already implements the **exact GV0 model**:
  data-driven buildings `{tx, ty, w, h, range, src}` positioned at `calc(--bb-tile * tx/ty)` with a
  `w×h` footprint on a 20-grid cracked-earth stage, plus state overlays (level badge, build-ring +
  timer, collect bubble, range circle, selection brackets, hp bar, damage wash).

**Building id → SVG + footprint** (the GV0 art map):

| `CocBuildingId` | SVG | Footprint |
|---|---|---|
| `commandCenter` (Town Hall) | `commandCenter{level}.svg` (1–5, art per level) | 4×4 |
| `goldCollector` | `goldMine.svg` | 3×3 |
| `elixirCollector` | `elixirCollector.svg` | 3×3 |
| `goldStorage` | `goldStorage.svg` | 3×3 |
| `elixirStorage` | `elixirStorage.svg` | 3×3 |
| `cannon` | `cannon.svg` | 3×3 |
| `mortar` | `mortar.svg` | 3×3 |
| `airDefense` | `airDefense.svg` | 3×3 |
| `barracks` | `barracks.svg` | 3×3 |
| `armyCamp` | `armyCamp.svg` | 4×4 |
| `builderHut` | `buildersHut.svg` | 2×2 |
| `clanCastle` | `clanCastle.svg` | 3×3 |
| walls | `wall{level}.svg` (+ `wallCorner{level}.svg`) | 1×1 |

A small `BUILDING_ART` map in the client resolves id (+level for Town Hall) → `/assets/...`; reuse
the existing emoji-fallback pattern (`GameIcons` style) for any gap.

---

## Data model (file-mapped)

### `src/sim/coc/types.ts`
```ts
export type CocBuildingId =
  | "commandCenter" | "goldCollector" | "elixirCollector"
  | "goldStorage" | "elixirStorage"
  | "cannon" | "mortar" | "airDefense"
  | "barracks" | "armyCamp"
  | "builderHut"   // NEW — 2×2, is a builder
  | "clanCastle";  // NEW — 3×3, inert in GV0

// PlacedBuilding unchanged (id, level, buffer?). Record key is now the ANCHOR tile "x,y".

export interface CocBase {
  owner: string;
  location: string;                          // NEW: world hexKey of this village
  buildings: Record<string, PlacedBuilding>; // anchor tile "x,y" -> building
  walls: Record<string, number>;             // tile "x,y" -> wall level (1×1)
  gold: number; elixir: number;
  jobs: BuildJob[];                          // BuildJob.hexKey -> reused as the tile anchor key
  army: Army; trainQueue: TrainOrder[];
  shieldUntil: number; trophies: number;
  // REMOVED: centerKey, ownedHexes, builders (builders now derived from huts)
}
```
- `BuildJob.hexKey` is reused as the **tile anchor key** (rename optional; keep `hexKey` to limit churn, document it).
- Command union changes (see Commands).
- `CocWorld` unchanged in shape (`claimedHexes` now holds one entry per owner).

### `src/sim/coc/config.ts`
- Add `footprint: { w: number; h: number }` to `BuildingDef`. Footprints: Town Hall **4×4**;
  cannon/mortar/airDefense/goldCollector/elixirCollector/goldStorage/elixirStorage/barracks/clanCastle **3×3**;
  armyCamp **4×4**; builderHut **2×2**. (Walls are 1×1, handled outside `BUILDINGS`.)
- Add `builderHut` def (cost in **$WAR** via `builderCost`, instant, no gold/elixir levels needed beyond L1) and `clanCastle` def (L1 only for GV0, inert).
- Relabel `commandCenter.name` → `"Town Hall"`.
- `CcTier`: **remove `maxHexes`**, **add `maxWalls`** (count cap per tier). Keep `caps`. Add a
  `clanCastle` cap (e.g. unlock at CC≥3, maxCount 1). `builderHut` is **not** in `caps` (gated only
  by `MAX_BUILDERS` + $WAR).
- Add `export const GRID_W = 20, GRID_H = 20;`.
- Keep `$WAR` constants (`builderCost`, `finishCost`, shield, raid reward), `UNITS`, `WALL`,
  `LOOT_PCT`, etc.

### `src/sim/coc/world.ts` (helpers)
- `ccLevel(base)` → find the single `commandCenter` building's level (no `centerKey` anymore).
- `townHallKey(base)` → anchor key of the Town Hall (helper for UI/commands).
- `builderCount(base)` → count operational `builderHut`s; `freeBuilders(base) = builderCount − jobs.length`.
- **NEW** `footprintTiles(anchorKey, id)` → the list of `"x,y"` a building covers.
- **NEW** `occupiedTiles(base)` → `Set<"x,y">` over all building footprints **and** wall tiles
  (placement collision).
- **NEW** `inBounds(x,y)` / `fitsInGrid(anchorKey, id)`.
- Keep `storageCap`, `housingCap`, `housingUsed`, `hasBarracks` (iterate `buildings`, geometry-agnostic).
- Remove `edgeKey`.
- Rewrite `normalizeWorld`: drop any base without a `location` field (old cluster bases); rebuild
  `claimedHexes` = `{ [b.location]: owner }` over survivors; coerce missing fields; preserve players/clans.

### `src/sim/coc/tick.ts`
- No geometric change (jobs keyed by tile string, collectors/training/jobs iterate by key). Verify
  it compiles against the new `CocBase` (drop any `builders`/`ownedHexes` reads — there are none).

### `src/sim/coc/battle.ts`
- **No code change for GV0.** The resolver already aggregates structure HP + summed wall HP with no
  positions. Only its **test fixtures** move to the new shape. (GV1 makes it positional.)

---

## Commands (`src/sim/coc/commands.ts`)

| Command | GV0 behavior |
|---|---|
| `claimBase {q,r}` | Claim **one** unclaimed in-map hex. Init `CocBase` with `location`, a **Town Hall (4×4)** placed near grid center, and **2 Builder's Huts (2×2)** placed adjacent. `claimedHexes[hexKey]=owner`. (Drops cluster claim.) |
| `placeBuilding {tileKey, buildingId}` | Validate: in-bounds, footprint **fits grid**, **no overlap** with buildings/walls, CC `caps` (count/level), a **free builder** + gold/elixir affordability. **`builderHut`**: special-cased — **$WAR** cost (`builderCost`), **instant**, no builder consumed, capped at `MAX_BUILDERS`. |
| `upgradeBuilding {tileKey}` | As today, keyed by tile anchor. |
| `moveBuilding {fromTile, toTile}` | **NEW** — relocate a built (level≥1, not busy) building's anchor; validate fits/no-overlap; instant, free. |
| `collect` | Unchanged. |
| `placeWall {tileKey}` | **NEW shape** — place a 1×1 wall on an empty tile; instant, gold; gated by tier `maxWalls` (count) and CC for level. (Replaces `placeWall{aKey,bKey}`.) |
| `upgradeWall {tileKey}` | Upgrade wall level at a tile; gold, CC-gated (`maxWallLevel`). (Replaces edge key.) |
| `trainTroop` / `raid` / `finishNow` / `extendShield` / clan cmds / `donateTroops` | Ported unchanged. `raid` stays functional server-side but is **not surfaced** in the GV0 client. |
| `expandCluster` | **REMOVED.** |
| `buyBuilder` | **REMOVED** — folded into `placeBuilding{builderHut}`. Update the SP3 premium HUD button to enter build mode with the hut pre-selected. |

`applyCommand` dispatcher updated for the changed/removed/added commands.

---

## Client (`/world`)

Split the single page into **two views + a mode toggle** (reuse `GameShell`/`TopBar` patterns,
design tokens, `Panel`/`Button`/`Stat`/`Badge`):

- **WORLD view** (reuse the existing hex SVG renderer): each claimed hex = a **village marker**
  (owner color, Town Hall level badge, shield/`under-attack` state). Tap **own** hex → MY BASE;
  tap **enemy** hex → **scout** (read-only grid render + est. loot + **"Raids return in GV1"**);
  tap **unclaimed** in-map hex → claim. Keep recenter/zoom.
- **MY BASE view** (**NEW** `src/components/BaseGrid.tsx`): a **20×20 square grid**, pan/zoom/pinch
  (CSS transform), `--bb-earth` cracked-earth ground + `--bb-grid-overlay` tactical grid lines.
  Render each building as a **footprint-sized box** (`calc(--bb-tile * w/h)` at `calc(--bb-tile *
  tx/ty)`) holding its **vendored faux-iso SVG** (per `BUILDING_ART`; Town Hall art swaps by level)
  with the redesign **state overlays** from `BaseBuilding.dc.html` (level badge, build-ring + timer,
  ready-to-collect bubble, selection brackets, defense-range circle). View mode: collectors fill +
  "tap to collect"; timers tick.
  Build/edit mode: highlight valid/invalid tiles for the selected building (ghost preview snaps to
  the anchor), place/upgrade/**move**, walls placed per tile (tap; drag-run is a stretch goal).
- **HUD:** gold/elixir/$WAR/trophies, Town Hall level, **builders `free/total` (from huts)**, army
  housing, COLLECT, and $WAR sinks (+builder = place hut, +shield, finish-now).
- **Overlays kept:** Army/training, Clan (ported as-is; logic is base-level, not tile-level).
- **Tutorial:** update `BaseTutorial` for the grid path: claim → enter base → place a collector →
  place a storage → start an upgrade → collect.

The enemy **scout** reuses `BaseGrid` in **read-only** mode (also sets up GV1).

---

## Server

`server/index.ts` + `server/db.ts` unchanged except: boot path runs the rewritten `normalizeWorld`
(drops old cluster bases). Keep file-subpath imports. Keep 1 Hz tick. One ws integration test
updated for the new claim/place flow.

---

## Tests (TDD — write first)

- **`world.test.ts`**: `ccLevel` finds the Town Hall; `builderCount`/`freeBuilders` from huts;
  `footprintTiles`/`occupiedTiles`/`fitsInGrid` geometry; `normalizeWorld` drops old-shape bases &
  rebuilds `claimedHexes`; storage/housing unchanged.
- **`commands.test.ts`** (rewrite): single-hex `claimBase` + grid init (TH + 2 huts);
  `placeBuilding` footprint fit / out-of-bounds / overlap / CC caps / builder-free / affordability;
  `placeBuilding{builderHut}` $WAR cost + `MAX_BUILDERS` cap + instant; `moveBuilding`;
  `placeWall`/`upgradeWall` on tiles + `maxWalls`; `upgradeBuilding` by tile; `collect`; ported
  train/raid/$WAR/clan. Remove `expandCluster`/`buyBuilder` tests.
- **`config.test.ts`**: every building has a valid `footprint`; new ids present; tiers have `maxWalls`.
- **`battle.test.ts` / `tick.test.ts`**: fixtures moved to new shape (resolver/tick code unchanged).
- **`fuzz.test.ts` / `stress.test.ts`**: port fixtures/builders to the grid shape (keep
  invariant/determinism + $WAR-conservation soak).
- **`server/index.test.ts`**: ws claim single hex → place a collector → tick → state reflects it.

---

## Verification

- `npm test` (root vitest, all green incl. new geometry tests) and `cd server && npm test`.
- `npx tsc --noEmit` clean.
- Local build: `pkill -f "next dev"`, `rm -rf .next`, then `npm run build` (path-spaces + the
  wallet-adapter-ui build hang footguns from [[warlands-tech-gotchas]]).
- Manual (cached playwright-core, mobile viewport): claim a world hex → enter MY BASE → place a
  collector + storage → watch a build timer finish + gold/elixir accrue/cap → COLLECT → move a
  building → place/upgrade a wall → confirm snapshot persists across a server restart → tap an enemy
  hex shows read-only scout + "Raids return in GV1."
- Deploy: `railway up --ci -s warlands-app` + `vercel --prod --yes`; recommend `TRUNCATE
  world_snapshots` once for a clean launch; live ws probe ticking.

## Out of scope (GV0)

Positional/geometric combat (troop deploy at edges, range targeting, walls gate by adjacency) → **GV1**;
traps, defending hero/garrison, clan reinforcements in battle, leagues/seasons, cosmetics; on-chain
$WAR payout. (Art is **not** out of scope — the redesign assets are landed and used directly.)

## Next steps

1. GV0 spec written + **art landed** (`public/assets/*`, `src/app/base-builder.css`,
   `docs/design-system/templates/base-builder/`) — awaiting user approval.
2. `superpowers:writing-plans` → GV0 implementation plan (branch `feat/gv0-grid-village`).
3. TDD build (wire `BUILDING_ART` + `BaseGrid` to the vendored SVGs/tokens) → verify → deploy; then
   spec **GV1** (grid combat).
</content>
</invoke>
