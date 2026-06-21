/**
 * Heavy, long-running stress + invariant suite for the CoC ruleset.
 * SKIPPED by default (keeps `npm test` fast). Run explicitly:
 *
 *   STRESS=1 npx vitest run src/sim/coc/stress.test.ts
 *
 * Tunables (env): STRESS_SEEDS, STRESS_STEPS, STRESS_BATTLES.
 * Defaults are sized for ~60–90 min of CPU on a laptop.
 */
import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, builderCount, fitsInGrid, housingCap, housingUsed, inGrid, parseTile } from "./world";
import { applyCommand } from "./commands";
import { applyTick } from "./tick";
import { resolveRaid } from "./battle";
import { maxLevelOf, TRAP_IDS, UNIT_IDS, WALL } from "./config";
import type { CocBuildingId, CocCommand, CocUnitId, CocWorld, CocBase } from "./types";

const RUN = !!process.env.STRESS;
const SEEDS = Number(process.env.STRESS_SEEDS ?? 250);
const STEPS = Number(process.env.STRESS_STEPS ?? 120_000);
const BATTLES = Number(process.env.STRESS_BATTLES ?? 400_000);
const NINETY_MIN = 90 * 60 * 1000;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function randomTile(rnd: () => number): string {
  return `${Math.floor(rnd() * 20)},${Math.floor(rnd() * 20)}`;
}

const BUILDABLE: CocBuildingId[] = [
  "goldCollector", "elixirCollector", "goldStorage", "elixirStorage",
  "cannon", "mortar", "airDefense", "barracks", "armyCamp", "builderHut", "clanCastle",
];

function checkInvariants(w: CocWorld): void {
  for (const p of Object.values(w.players)) {
    if (!(p.hexar >= 0) || !Number.isFinite(p.hexar)) throw new Error(`bad hexar ${p.hexar} for ${p.id}`);
  }
  for (const [owner, b] of Object.entries(w.bases)) {
    if (!(b.gold >= 0) || !Number.isFinite(b.gold)) throw new Error(`bad gold ${b.gold}`);
    if (!(b.elixir >= 0) || !Number.isFinite(b.elixir)) throw new Error(`bad elixir ${b.elixir}`);
    if (b.jobs.length > builderCount(b)) throw new Error("builders over-committed");
    if (housingUsed(b) > housingCap(b)) throw new Error("army over housing");
    if (w.claimedHexes[b.location] !== owner) throw new Error("ownership desync");
    for (const [tk, bld] of Object.entries(b.buildings)) {
      if (!fitsInGrid(tk, bld.id)) throw new Error("building off-grid");
      if (bld.level < 0 || bld.level > maxLevelOf(bld.id)) throw new Error("bad building level");
    }
    for (const job of b.jobs) {
      if (!b.buildings[job.tileKey]) throw new Error("job without building");
      if (job.toLevel > maxLevelOf(job.buildingId)) throw new Error("job over max level");
    }
    for (const [tk, lvl] of Object.entries(b.walls)) {
      const { x, y } = parseTile(tk);
      if (!inGrid(x, y)) throw new Error("wall off-grid");
      if (lvl < 1 || lvl > WALL.levels.length) throw new Error("bad wall level");
    }
    for (const u of UNIT_IDS) if ((b.army[u] ?? 0) < 0) throw new Error("negative army");
  }
  for (const [cid, clan] of Object.entries(w.clans)) {
    if (clan.members.length < 1) throw new Error("empty clan not pruned");
    for (const m of clan.members) if (w.players[m]?.clanId !== cid) throw new Error("clan member desync");
  }
}

function randomCommand(rnd: () => number, w: CocWorld): CocCommand {
  const hexes = Object.keys(w.hexes);
  const owners = Object.keys(w.bases);
  const r = rnd();
  if (r < 0.10) { const [q, c] = pick(rnd, hexes).split(",").map(Number); return { type: "claimBase", q, r: c }; }
  if (r < 0.30) return { type: "placeBuilding", tileKey: randomTile(rnd), buildingId: pick(rnd, BUILDABLE) };
  if (r < 0.40) return { type: "upgradeBuilding", tileKey: randomTile(rnd) };
  if (r < 0.48) return { type: "collect" };
  if (r < 0.55) return { type: "moveBuilding", fromTile: randomTile(rnd), toTile: randomTile(rnd) };
  if (r < 0.62) return { type: "placeWall", tileKey: randomTile(rnd) };
  if (r < 0.66) return { type: "upgradeWall", tileKey: randomTile(rnd) };
  if (r < 0.70) return { type: "placeTrap", tileKey: randomTile(rnd), trapId: pick(rnd, TRAP_IDS) };
  if (r < 0.77) return { type: "trainTroop", unit: pick(rnd, UNIT_IDS) as CocUnitId };
  if (r < 0.86) {
    const deploy = [];
    const n = Math.floor(rnd() * 16);
    for (let i = 0; i < n; i++) deploy.push({ unit: pick(rnd, UNIT_IDS) as CocUnitId, x: Math.floor(rnd() * 20), y: Math.floor(rnd() * 20) });
    return { type: "raid", targetOwner: owners.length ? pick(rnd, owners) : "p1", deploy };
  }
  if (r < 0.90) return { type: "finishNow", tileKey: randomTile(rnd) };
  if (r < 0.96) return { type: "extendShield", hours: Math.floor(rnd() * 26) };
  if (r < 0.98) return { type: "createClan", name: `C${Math.floor(rnd() * 9999)}` };
  if (r < 0.99) return { type: "joinClan", clanId: pick(rnd, ["clan1", "clan2", "clan3", "clan4"]) };
  return { type: "leaveClan" };
}

function runWorld(seed: number, steps: number): CocWorld {
  const rnd = mulberry32(seed);
  let w = addPlayer(addPlayer(addPlayer(addPlayer(createWorld(seed), "p1"), "p2"), "p3"), "p4");
  const players = ["p1", "p2", "p3", "p4"];
  for (let i = 0; i < steps; i++) {
    w = applyCommand(w, pick(rnd, players), randomCommand(rnd, w)).state;
    if (i % 25 === 0) w = applyTick(w);
    if (i % 2000 === 0) checkInvariants(w);
  }
  checkInvariants(w);
  return w;
}

describe.skipIf(!RUN)("CoC STRESS (long-running)", () => {
  it(`world fuzz: ${SEEDS} seeds × ${STEPS.toLocaleString()} steps, invariants hold + deterministic`, () => {
    let totalBases = 0;
    for (let s = 0; s < SEEDS; s++) {
      const a = runWorld(1000 + s, STEPS);
      totalBases += Object.keys(a.bases).length;
      // determinism spot-check on every 25th seed (re-run must match tick + base count)
      if (s % 25 === 0) {
        const b = runWorld(1000 + s, STEPS);
        expect(b.tick).toBe(a.tick);
        expect(Object.keys(b.bases).length).toBe(Object.keys(a.bases).length);
      }
    }
    expect(totalBases).toBeGreaterThan(0);
  }, NINETY_MIN);

  it(`battle resolver: ${BATTLES.toLocaleString()} random raids, invariants + determinism`, () => {
    const rnd = mulberry32(0xBA771E);
    for (let i = 0; i < BATTLES; i++) {
      const defender = randomDefender(rnd);
      const deploy = [];
      const n = Math.floor(rnd() * 40);
      for (let k = 0; k < n; k++) deploy.push({ unit: pick(rnd, UNIT_IDS) as CocUnitId, x: Math.floor(rnd() * 20), y: Math.floor(rnd() * 20) });
      const seed = Math.floor(rnd() * 0xffffffff);
      const res = resolveRaid(deploy, defender, seed);
      expect(res.stars).toBeGreaterThanOrEqual(0);
      expect(res.stars).toBeLessThanOrEqual(3);
      expect(res.destructionPct).toBeGreaterThanOrEqual(0);
      expect(res.destructionPct).toBeLessThanOrEqual(1);
      expect(res.loot.gold).toBeLessThanOrEqual(defender.gold);
      expect(res.loot.elixir).toBeLessThanOrEqual(defender.elixir);
      expect(Number.isFinite(res.loot.gold)).toBe(true);
      if (i % 5000 === 0) expect(resolveRaid(deploy, defender, seed)).toEqual(res); // determinism
    }
  }, NINETY_MIN);
});

function randomDefender(rnd: () => number): CocBase {
  const tiles = ["0,0", "4,0", "8,0", "0,4", "4,4", "8,4", "0,8", "12,0", "12,4"];
  const ids: CocBuildingId[] = ["commandCenter", "goldCollector", "elixirCollector", "goldStorage", "elixirStorage", "cannon", "mortar", "airDefense", "barracks", "armyCamp"];
  const buildings: Record<string, { id: CocBuildingId; level: number }> = { "8,8": { id: "commandCenter", level: 1 + Math.floor(rnd() * 5) } };
  const n = 1 + Math.floor(rnd() * 8);
  for (let i = 0; i < n; i++) buildings[tiles[i]] = { id: pick(rnd, ids.slice(1)), level: 1 + Math.floor(rnd() * 3) };
  const walls: Record<string, number> = {};
  if (rnd() < 0.7) walls["1,1"] = 1 + Math.floor(rnd() * 3);
  if (rnd() < 0.5) walls["2,2"] = 1 + Math.floor(rnd() * 3);
  const traps: Record<string, { id: "bomb" | "airMine"; level: number }> = {};
  if (rnd() < 0.5) traps["3,3"] = { id: "bomb", level: 1 };
  if (rnd() < 0.3) traps["4,4"] = { id: "airMine", level: 1 };
  return {
    owner: "d", location: "0,0", buildings, walls, traps,
    gold: Math.floor(rnd() * 20000), elixir: Math.floor(rnd() * 20000),
    jobs: [], army: {}, garrison: {}, trainQueue: [], shieldUntil: 0, trophies: 0,
  };
}
