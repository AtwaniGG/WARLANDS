# WARLANDS CoC SP1 — Defenses + Walls + Base-Editor UX + Tutorial — Plan

> Sub-project 1 of the CoC pivot. Builds on SP0 (`src/sim/coc/*`). Defenses/walls are **placeable & upgradeable but inert** until SP2 wires live combat. REQUIRED SUB-SKILL when executed cold: superpowers:executing-plans.

**Goal:** Players can fortify their hex-cluster base — place/upgrade **defensive towers** (cannon, mortar, air defense) on hexes and **walls** on the edges between owned hexes — through a categorized base-editor, guided by an onboarding tutorial. Combat stats are defined now (consumed in SP2).

**Decisions (made autonomously):**
- **Defenses are buildings** (category `defense`) placed on hexes via the existing `placeBuilding` path (builder + real-time timer), cost **gold** (a clear gold sink; collectors already cross-fund). Combat stats (`hp`, `dps`, `range`, `targets`, `splash`) live on each level, inert in SP1.
- **Walls are edge objects**, not hex buildings: `CocBase.walls: Record<edgeKey, level>`. Placement is **instant, gold-only, no builder** (matches CoC; avoids builder contention; big gold sink). `edgeKey` = the two adjacent owned hex keys sorted + joined `|`. Max wall level = `min(ccLevel, WALL.levels.length)`.
- **Defer traps + defending hero/garrison to SP2** — both are combat-coupled and add hex pressure to a small base; they land with the battle sim.
- CC progression gains defense caps per tier.

**Files:** modify `src/sim/coc/{types,config,world,commands}.ts` (+ their tests); rewrite `src/app/world/page.tsx` (categorized build menu, wall mode, wall rendering, defense info); add `src/components/BaseTutorial.tsx`. `tick.ts` unchanged (inert).

## Tasks (TDD)

1. **Config — defenses + walls.** Add `cannon`/`mortar`/`airDefense` to `BUILDINGS` (category `defense`, gold cost, `hp/dps/range/targets/splash` per level); add `WALL` const (3 levels: gold cost + hp); extend `BuildingLevel`. Add defense caps to all 5 `CC_PROGRESSION` tiers. Add `maxWallLevel(ccLevel)`. Tests in `config.test.ts`.
   - cannon (ground): L1 g200/60s hp420 dps12 r3 · L2 g800/300 hp600 dps18 · L3 g2500/1200 hp880 dps26
   - mortar (ground, splash): L1 g500/300 hp360 dps8 r4 · L2 g1500/900 hp520 dps12 · L3 g4500/3600 hp760 dps18
   - airDefense (air): L1 g700/300 hp540 dps22 r4 · L2 g2000/900 hp760 dps32 · L3 g6000/3600 hp1040 dps44
   - WALL: L1 g100 hp300 · L2 g400 hp800 · L3 g1500 hp2000
   - caps: CC1 +cannon{1,1}; CC2 +cannon{1,2},mortar{1,1}; CC3 +cannon{2,3},mortar{1,2},airDefense{1,1}; CC4 +cannon{2,3},mortar{2,3},airDefense{1,2}; CC5 +cannon{3,3},mortar{2,3},airDefense{2,3}
2. **Types + world.** `CocBuildingId` += defense ids; `BuildingDef.category` += `"defense"`; `CocBase.walls`; `CocCommand` += `placeWall`/`upgradeWall`. `edgeKey(a,b)` in `world.ts`; `normalizeWorld` defaults `walls: {}`. Tests in `world.test.ts` (edgeKey canonical, normalize).
3. **Commands — walls.** `placeWall` (both hexes owned + adjacent + no existing wall + afford gold → instant) and `upgradeWall` (exists + level < maxWallLevel(cc) + afford → instant). Wire dispatch. Defense placement already works via `placeBuilding` (cap-gated). Tests in `commands.test.ts`.
4. **UI — base editor.** Rewrite build menu into **RESOURCES** vs **DEFENSE** groups (by `BUILDINGS[id].category`); add a **WALL MODE** toggle (tap two adjacent owned hexes → `placeWall`); render walls as stone segments between owned-hex centers; click a wall to select+upgrade; defense `BuildingInfo` shows DEF/RANGE.
5. **Tutorial.** `src/components/BaseTutorial.tsx` — derives the current onboarding step from base state (claim → gold collector → storage → defense → wall → done), dismissible card; mounted in `/world`.
6. **Verify:** `npm test` + `cd server && npm test` green; `tsc` clean; `next build` clean; live ws smoke (claim → build cannon → place wall). Commit per task; push.
