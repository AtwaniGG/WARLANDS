# WARLANDS CoC SP2 — Troops, Raids, Shields, Matchmaking — Plan

> Sub-project 2 of the CoC pivot. Builds on SP0/SP1. Delivers the **raid loop**: train troops, attack a neighbour's base, earn stars + loot, defender gets a shield. The battle is **server-authoritative + deterministic (seeded auto-resolve)** producing a full report/replay; live frame-by-frame *animation* of that report is a later polish (the resolved timeline is already step-by-step, so the data is there).

**Decisions (autonomous):**
- **Troops cost elixir** (elixir sink; gold funds defenses/walls). 5 troops: grunt (melee), marksman (ranged), breacher (wall-breaker, ×bonus vs walls), juggernaut (tank), gunship (air — ignores walls, only Air Defense hits it).
- **Army buildings:** `barracks` (enables training) + `armyCamp` (housing capacity). New category `army`. Training is a queue (builder-independent) at elixir cost; finished troops join `base.army`. Housing caps total troops.
- **Battle = pure deterministic reducer** `resolveRaid(army, defenderSnapshot, seed)` in `src/sim/coc/battle.ts`: troops target nearest structure, walls gate ground troops (breachers prioritise + bonus), defenses (cannon/mortar/airDefense) deal dps to troops in range each battle-tick; run to wipe / timeout. Returns `{ stars, destructionPct, loot, timeline }`. Reuse the seeded RNG pattern (`mulberry32`).
- **Stars:** ≥50% destruction = 1, Command Center destroyed = 1, 100% = 1. **Loot:** `lootPct` (e.g. 20%) of defender available gold/elixir × destruction, capped, storage-protected.
- **Shields:** `base.shieldUntil` tick set on the defender after a damaging raid (duration scales with destruction). Matchmaking + raid reject shielded/own bases.
- **Matchmaking:** `raid { targetOwner, army }` validates target (exists, not self, not shielded); client picks targets off the live map. Report returned to attacker only (`type:"report"`), persisted as `lastReport` on attacker for the result card.

**Tasks (TDD, commit each):**
1. **Troops + army config:** `CocUnitId`, `UNITS`, add `barracks`/`armyCamp` to `BUILDINGS` (category `army`), CC caps, housing helper. Tests.
2. **Training:** `base.army`, `base.trainQueue`, `trainTroop` command (elixir + housing gated), tick advances train queue → army. `base.shieldUntil`, `base.trophies`. Tests.
3. **Battle resolver:** `src/sim/coc/battle.ts` pure `resolveRaid`. Heavy unit tests (stars thresholds, walls gate, air vs airDefense, loot math, determinism).
4. **Raid command + shields:** `raid` command wires `resolveRaid`, applies loot/trophies/shield/damage, returns report. Matchmaking validation. Tests.
5. **Server:** forward `report` to attacker (re-add the report channel for CoC). 
6. **UI:** target preview card (scout: owner, CC, est. loot, shield) → army picker → ATTACK → result card (3-star + loot + trophies). Army/training surface.
7. **Verify:** tests + tsc + build + live smoke (train → raid → stars/loot/shield); push.

Out of scope (later): live animated battle playback, clan reinforcements (SP4), traps/hero.
