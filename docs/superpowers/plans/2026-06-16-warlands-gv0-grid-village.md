# WARLANDS GV0 — Grid Village Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans / subagent-driven-development. Steps use `- [ ]`.

**Goal:** Replace the hex-cluster base with a top-down 20×20 square-grid village (footprint buildings, tile walls, builders-from-huts), keep WORLD hex map as a map-of-villages, wire the vendored redesign art. Combat stays server-side but unsurfaced (GV1 makes it positional).

**Architecture:** Same content-agnostic frame (ws + 1 Hz tick + Postgres JSONB). Swap the `src/sim/coc/*` ruleset geometry from hex-cluster → grid; rewrite `/world` into WORLD + MY BASE (`BaseGrid.tsx`). Spec: `docs/superpowers/specs/2026-06-16-warlands-gv0-grid-village.md`.

**Tech Stack:** TypeScript, vitest, Next.js 16/React 19, ws, Postgres. Art: vendored SVGs + `src/app/base-builder.css` `--bb-*` tokens.

---

## File Structure

- `src/sim/coc/config.ts` — add `GRID_W/H=20`, `footprint` per building, `builderHut`+`clanCastle` defs, relabel Town Hall, `CcTier` drop `maxHexes` add `maxWalls`+`clanCastle` cap.
- `src/sim/coc/types.ts` — `CocBase`: +`location`, −`centerKey/ownedHexes/builders`; `BuildJob.hexKey`→`tileKey`; command union (claim single hex; place/upgrade/finishNow by `tileKey`; +`moveBuilding`; wall by `tileKey`; −`expandCluster`,−`buyBuilder`).
- `src/sim/coc/world.ts` — `ccLevel`/`townHallKey` scan for commandCenter; `builderCount`/`freeBuilders` from huts; geometry `tileKey/parseTile/footprintTiles/inGrid/fitsInGrid/occupiedTiles`; rewrite `normalizeWorld` (drop pre-`location` bases); remove `edgeKey`.
- `src/sim/coc/tick.ts` — `job.hexKey`→`job.tileKey`.
- `src/sim/coc/commands.ts` — rewrite claim/place/upgrade/wall geometry; +`moveBuilding`; builderHut via $WAR; −`expandCluster`/`buyBuilder`.
- Tests: rewrite `world/commands/tick/battle/config.test.ts` fixtures+cases; port `fuzz/stress`; `server/index.test.ts`.
- `src/components/BaseGrid.tsx` (new) — 20×20 pan/zoom stage, footprint building boxes + state overlays, placement ghost; read-only mode.
- `src/app/world/page.tsx` — WORLD (hex villages) + MY BASE (BaseGrid) + HUD + overlays + `BUILDING_ART`.
- `src/components/BaseTutorial.tsx` — grid onboarding copy.

## Tasks (TDD, commit per task)

### Task 1: config — grid, footprints, new buildings, tiers
- [ ] Add `GRID_W=20, GRID_H=20`; add `footprint:{w,h}` to `BuildingDef` + every building; add `builderHut`(2×2, $WAR/instant) + `clanCastle`(3×3, inert L1); relabel Town Hall; `CcTier` drop `maxHexes`, add `maxWalls`, add `clanCastle` cap at CC≥3.
- [ ] Update `config.test.ts`: every building has valid footprint; new ids; tiers have `maxWalls`. Run `npx vitest run src/sim/coc/config.test.ts`. Commit.

### Task 2: types — grid base + command union
- [ ] Edit `types.ts` per File Structure. (Type-only; verified by downstream compiles.)

### Task 3: world — helpers + normalizeWorld (TDD)
- [ ] Rewrite `world.test.ts` for new shape: `ccLevel` scans commandCenter; `builderCount`/`freeBuilders` from huts; `footprintTiles`/`occupiedTiles`/`fitsInGrid`; `normalizeWorld` drops pre-`location` bases + rebuilds `claimedHexes`.
- [ ] Implement `world.ts`. Run vitest world. Commit.

### Task 4: tick — tileKey
- [ ] `tick.ts` + `tick.test.ts` fixtures to new shape (`location`, no `ownedHexes/builders`, `job.tileKey`). Run vitest tick. Commit.

### Task 5: commands — claim/place/move/wall (TDD)
- [ ] Rewrite `commands.test.ts`: single-hex claim (TH+2 huts placed); placeBuilding footprint fit/oob/overlap/caps/builder/afford; builderHut $WAR+cap; moveBuilding; placeWall/upgradeWall tiles+maxWalls; upgrade/collect/train/raid/$WAR/clan ported; drop expandCluster/buyBuilder.
- [ ] Implement `commands.ts`. Run vitest commands. Commit.

### Task 6: battle fixtures + fuzz/stress + barrel
- [ ] `battle.test.ts` fixtures→new shape (resolver unchanged). Port `fuzz.test.ts`/`stress.test.ts` builders. `index.ts` barrel unchanged (`export *`). Run full root `npm test`. Commit.

### Task 7: server test
- [ ] `server/index.test.ts`: claim single hex → place collector → tick reflects. `cd server && npm test`. Commit.

### Task 8: client — BaseGrid + /world + tutorial
- [ ] `BaseGrid.tsx` (footprint boxes, overlays, placement, read-only). `BUILDING_ART` map. Rewrite `/world` WORLD+MY BASE. Update `BaseTutorial`. `npx tsc --noEmit`; `rm -rf .next && npm run build`. Commit.

### Task 9: verify + deploy
- [ ] Playwright drive `/world` mobile (claim→base→place→collect→move→wall→scout). `railway up --ci -s warlands-app`; `vercel --prod --yes`; ws probe. Commit.

## Verification
`npm test` + `cd server && npm test` + `npx tsc --noEmit` + `npm run build` all green; live `/world` 200 + ws ticking with `location`-shaped bases.
</content>
