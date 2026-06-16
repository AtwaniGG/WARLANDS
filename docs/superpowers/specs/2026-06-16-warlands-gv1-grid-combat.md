# WARLANDS GV1 — Positional Grid Combat — Spec

## Context

GV0 shipped the top-down 20×20 grid village (footprint buildings, tile walls, builders-from-huts,
WORLD = map of villages). Combat was deferred: the existing `resolveRaid` is a **non-geometric
aggregate** (sums structure HP + wall HP, no positions), kept server-side but unsurfaced — the
client shows a read-only scout + "raids return in GV1".

**GV1 re-targets combat to the grid.** A raid plays out **on the defender's square village**:
the attacker **deploys troops on tiles**, troops **path around / break walls**, **defenses fire by
range**, structures fall, and the raid scores **3 stars + loot** as today. Resolution is a
**deterministic, server-authoritative tick sim**; the client **replays** it (deterministic, from
the same seed + snapshot) as an animated battle on the `BaseGrid`.

Builds on the GV0 data model (`src/sim/coc/*`, grid `CocBase`). See
`docs/superpowers/specs/2026-06-16-warlands-gv0-grid-village.md` and [[warlands-coc-pivot]].

---

## Decisions locked for GV1

| # | Decision |
|---|---|
| Battle space | The defender's **20×20 grid**. Structures occupy their footprint tiles; walls are 1×1 obstacles. |
| Deploy | Attacker sends `deploy: {unit,x,y}[]` (individual troops on **open** tiles — no building/wall). Sum per unit ≤ owned army. Troops are consumed (as today). |
| Tick sim | Deterministic fixed-step loop (`BATTLE_TICKS` cap). Troops acquire a target → step along a **BFS path** (walls/buildings block ground; flyers ignore both) → attack in range. Defenses fire at the nearest in-range troop each tick (mortar = splash; air defense → flyers only; cannon/mortar → ground only). Ties broken by tile/troop index + the seed. |
| Walls | Block ground movement. If a ground troop's BFS to its structure target is blocked, it retargets the **nearest blocking wall**; **Breachers** deal `wallMultiplier` vs walls. Flyers ignore walls. |
| Scoring | Unchanged: destroyed buildings / total → `pct`; ★ at ≥50%, ★ if Town Hall destroyed, ★ at 100%; `loot = LOOT_PCT*pct` of gold/elixir; trophies as today. Walls don't count toward stars. |
| Output | `resolveRaid(deploy, defender, seed, { frames? })` → `BattleResult` (same fields) **+ `frames?: BattleFrame[]`** (troop positions + structure hp per sampled tick) when `frames:true`. |
| Playback | **Client re-simulates** with `frames:true` from the captured pre-raid defender snapshot + the report's `seed` + its own `deploy` (deterministic ⇒ identical to the server result). No frames over the wire. |
| Command | `raid` becomes `{ targetOwner, deploy: Deployment[] }`; report gains `seed` + `deploy` for replay. Shields/loot/trophies/$WAR-reward flow unchanged. |
| Determinism | Pure + seeded (`mulberry32`); same `(deploy, defender, seed)` ⇒ identical result & frames (re-run equality test; preserved in fuzz/stress). |
| Perf | BFS over ≤400 tiles, ≤ a few hundred troops, ≤180 ticks. Frames **opt-in** (off in fuzz/stress to stay fast). |

---

## Data model / signatures (`src/sim/coc`)

### `types.ts`
```ts
export interface Deployment { unit: CocUnitId; x: number; y: number; }

// raid command:
| { type: "raid"; targetOwner: string; deploy: Deployment[] }

export interface BattleReport {
  attacker: string; defender: string; tick: number;
  stars: number; destructionPct: number;
  loot: { gold: number; elixir: number };
  trophies: number;
  deploy: Deployment[];   // NEW — for client replay
  seed: number;           // NEW — for client replay
}
```

### `battle.ts` (rewrite — positional)
```ts
export interface BattleTroop { unit: CocUnitId; x: number; y: number; hp: number; alive: boolean; }
export interface BattleFrame { t: number; troops: { x: number; y: number; unit: CocUnitId; alive: boolean }[]; structures: { key: string; hp: number; max: number }[]; walls: { key: string; hp: number }[]; }
export interface BattleResult { /* existing */ stars; destructionPct; loot; trophies; structuresTotal; structuresDestroyed; ccDestroyed; ticks; frames?: BattleFrame[]; }

export function resolveRaid(deploy: Deployment[], defender: CocBase, seed: number, opts?: { frames?: boolean }): BattleResult;
```
- **Structures**: from `defender.buildings` — each gets footprint tiles, center, hp (`structureHp`), and (if defense + level≥1) dps/range/targets/splash. Building is "destroyed" when hp≤0.
- **Walls**: `defender.walls` tile → hp from `WALL.levels`. Block ground passage until hp≤0.
- **Passability (ground)**: a tile is passable if in-grid, not a wall (hp>0), and not covered by a *living* building footprint (except the troop's current target building, whose adjacent tile is the goal). Flyers: all tiles passable.
- **Targeting**: nearest living building by Euclidean from troop; recompute on target death or every `RETARGET_EVERY` ticks. Ground: BFS (4-neighbour) from troop tile to any tile adjacent to the target footprint; if unreachable, retarget nearest living wall.
- **Move**: step `MOVE_PER_TICK` toward the next path waypoint (clamp to waypoint).
- **Attack**: when Chebyshev distance(troop, nearest target footprint tile) ≤ `unit range` (melee≈1), apply `dps * DT` to target hp (Breacher: `dps*wallMultiplier*DT` vs walls).
- **Defenses**: each living defense each tick targets the nearest living troop within `range` (Chebyshev from any footprint tile) it can hit (ground/air filter); apply `dps*DT`. Mortar: apply to all troops within `SPLASH_R` of the primary target.
- **Frames** (opt-in): push a `BattleFrame` every `FRAME_EVERY` ticks (and a final frame).
- Empty deploy or no structures → graceful zero result (as today).

### `commands.ts` — `raid`
Validate counts (`Σ deploy[unit] ≤ attacker.army[unit]`), target exists + not shielded + not self. Seed as today. Call positional `resolveRaid(deploy, defender, seed)` (no frames server-side). Apply loot/shield/trophies/$WAR exactly as today. Report includes `deploy` + `seed`.

### `world.ts`
Add `inGrid` (exists), a BFS helper may live in `battle.ts` (keep `world.ts` lean). No base-shape change.

---

## Client (`/world`)

Re-enable the attack flow on the scout:
1. **Scout** (read-only `BaseGrid`) → **ATTACK** button (no longer disabled).
2. **Deploy phase**: army tray (counts from `myBase.army`); select a unit; **tap open tiles** on the defender `BaseGrid` to place troops (ghosts), respecting open-tile validity; running housing/used count. **GO** when ≥1 placed.
3. Send `raid {targetOwner, deploy}`. On `report`, **capture** the pre-raid defender snapshot (held since scout) + `report.seed` + `deploy`, run `resolveRaid(deploy, snapshot, seed, {frames:true})` locally, and **animate** frames on `BaseGrid` (troop dots moving, structure hp shrinking, destroyed buildings dimmed) via a frame ticker (respect `prefers-reduced-motion` → jump to final).
4. **Result card** (existing 3-star reveal) with loot/trophies; "return home".

`BaseGrid` gains an optional **overlay layer** for battle: render `troops` (small unit dots/IDs) and structure damage state from the current frame; a `battleFrame` prop drives it.

---

## Tests (TDD)

- **`battle.test.ts`** (rewrite): deploy overwhelming melee on an undefended base → 3 stars / 100%; a single grunt vs a walled, cannon-defended base → 0 stars; **walls slow ground** (same army 3-stars faster/at-all without walls); **breachers** open walls (ground army that fails walled succeeds with breachers); **flyers** ignore walls + only air defense hits them; **determinism** (same deploy+seed+defender ⇒ equal result & frames); empty deploy → 0. Frame invariants (monotonic non-increasing structure hp; troop count non-increasing).
- **`commands.test.ts`**: `raid` validates `deploy` counts (reject troops you don't have / empty), consumes army, loots, shields, awards trophies + $WAR, report carries `deploy`+`seed`; reject self/shielded.
- **`fuzz.test.ts`/`stress.test.ts`**: random `deploy` (tiles + units); positional resolver invariants (stars 0–3, pct 0–1, loot ≤ available, finite) + determinism; keep `frames:false`.
- **`config.test.ts`**: unchanged (combat consts sane).

## Verification

`npm test` + `cd server && npm test` green; `npx tsc --noEmit`; `pkill next dev; rm -rf .next; npm run build`; live ws boot + raid e2e (deploy → report w/ stars); Playwright mobile: scout → deploy → playback → result. Deploy: `railway up --ci -s warlands-app`, `vercel --prod --yes` (user-run; no network in agent env).

## Out of scope (GV1)

Clan reinforcements fighting in battle, traps, defending hero, heal/rage spells, multi-wave deploy timing, surrender; on-chain $WAR payout. (These remain deferred.)
