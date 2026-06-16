# WARLANDS GV1 — Positional Grid Combat Implementation Plan

> REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Replace the aggregate `resolveRaid` with a deterministic positional grid battle (deploy → pathfind/break walls → defenses fire → 3-star+loot), rewire the `raid` command to deployments, and re-surface raids in the client with deterministic playback.

**Architecture:** Pure seeded tick sim in `battle.ts` returning `BattleResult` (+ opt-in `frames`). Server resolves authoritatively (no frames); client replays from `{deploy, seed, capturedDefender}`. Spec: `docs/superpowers/specs/2026-06-16-warlands-gv1-grid-combat.md`.

---

## Tasks (TDD, commit per task)

### Task 1: types — Deployment + raid + report
- [ ] `types.ts`: add `Deployment`; `raid` → `{ targetOwner, deploy: Deployment[] }`; `BattleReport` += `deploy`, `seed`.

### Task 2: positional battle sim (TDD)
- [ ] Rewrite `battle.test.ts` (overwhelm→3★; walled+cannon vs 1 grunt→0★; walls slow ground; breachers open walls; flyers ignore walls / only air defense; determinism incl. frames; empty→0; frame monotonicity).
- [ ] Implement `battle.ts`: structures/walls model, BFS ground pathing (flyers free), targeting, move, attack (breacher×wall), defenses (range/air-ground/mortar splash), scoring (unchanged), opt-in frames. Run vitest battle. Commit.

### Task 3: raid command (TDD)
- [ ] Update `commands.test.ts` raid cases to `deploy`. Implement `raid()` (validate Σdeploy[unit] ≤ army[unit], consume, loot/shield/trophies/$WAR, report w/ deploy+seed). Run vitest commands. Commit.

### Task 4: fuzz/stress port + full suite
- [ ] `fuzz.test.ts`/`stress.test.ts`: random `deploy` tiles+units, `frames:false`; invariants + determinism. Run root `npm test` + `cd server && npm test`. Commit.

### Task 5: client deploy + playback
- [ ] `BaseGrid`: add `battleFrame` overlay (troop dots + per-structure hp/dim). 
- [ ] `/world`: scout → enable ATTACK → deploy phase (unit tray + tap open tiles to place, validity, housing) → send raid → on report, replay `resolveRaid(deploy, capturedDefender, seed, {frames:true})` animated → result card. `prefers-reduced-motion` → jump to final.
- [ ] `npx tsc --noEmit`; `rm -rf .next && npm run build`. Commit.

### Task 6: verify + deploy
- [ ] Live ws raid e2e (deploy → report stars) + Playwright mobile scout→deploy→playback. Hand deploy cmds (no network in agent env).

## Verification
`npm test` + server tests + `tsc` + `next build` green; deterministic raid e2e; playback renders.
