import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, builderCount, fitsInGrid, housingCap, housingUsed, inGrid, parseTile } from "./world";
import { applyCommand } from "./commands";
import { applyTick } from "./tick";
import { maxLevelOf, UNIT_IDS, WALL } from "./config";
import type { CocBuildingId, CocCommand, CocUnitId, CocWorld } from "./types";

// Deterministic PRNG so a failure is reproducible.
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

const BUILDABLE: CocBuildingId[] = [
  "goldCollector", "elixirCollector", "goldStorage", "elixirStorage",
  "cannon", "mortar", "airDefense", "barracks", "armyCamp", "builderHut", "clanCastle",
];

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
/** A random grid tile "x,y" within [0,20)². */
function randomTile(rnd: () => number): string {
  return `${Math.floor(rnd() * 20)},${Math.floor(rnd() * 20)}`;
}

/** Invariants that must hold for any reachable world state. */
function checkInvariants(w: CocWorld): void {
  for (const p of Object.values(w.players)) {
    expect(p.war).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(p.war)).toBe(true);
  }
  for (const [owner, b] of Object.entries(w.bases)) {
    expect(b.gold).toBeGreaterThanOrEqual(0);
    expect(b.elixir).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(b.gold)).toBe(true);
    expect(Number.isFinite(b.elixir)).toBe(true);
    // builders (from huts) are never over-committed
    expect(b.jobs.length).toBeLessThanOrEqual(builderCount(b));
    // army never overflows housing
    expect(housingUsed(b)).toBeLessThanOrEqual(housingCap(b));
    // the village sits on its claimed world hex
    expect(w.claimedHexes[b.location]).toBe(owner);
    // every building fits the grid; levels in range; jobs reference real buildings
    for (const [tk, bld] of Object.entries(b.buildings)) {
      expect(fitsInGrid(tk, bld.id)).toBe(true);
      expect(bld.level).toBeGreaterThanOrEqual(0);
      expect(bld.level).toBeLessThanOrEqual(maxLevelOf(bld.id));
    }
    for (const job of b.jobs) {
      expect(b.buildings[job.tileKey]).toBeDefined();
      expect(job.toLevel).toBeLessThanOrEqual(maxLevelOf(job.buildingId));
    }
    // wall tiles are in-grid with valid levels
    for (const [tk, lvl] of Object.entries(b.walls)) {
      const { x, y } = parseTile(tk);
      expect(inGrid(x, y)).toBe(true);
      expect(lvl).toBeGreaterThanOrEqual(1);
      expect(lvl).toBeLessThanOrEqual(WALL.levels.length);
    }
    // army counts non-negative
    for (const u of UNIT_IDS) expect(b.army[u] ?? 0).toBeGreaterThanOrEqual(0);
  }
  // clan membership is consistent both ways
  for (const [cid, clan] of Object.entries(w.clans)) {
    expect(clan.members.length).toBeGreaterThan(0);
    for (const m of clan.members) expect(w.players[m]?.clanId).toBe(cid);
  }
  for (const p of Object.values(w.players)) {
    if (p.clanId) expect(w.clans[p.clanId]?.members).toContain(p.id);
  }
}

function randomCommand(rnd: () => number, w: CocWorld, pid: string): CocCommand {
  const hexes = Object.keys(w.hexes);
  const owners = Object.keys(w.bases);
  const r = rnd();
  if (r < 0.10) { const [q, c] = pick(rnd, hexes).split(",").map(Number); return { type: "claimBase", q, r: c }; }
  if (r < 0.30) return { type: "placeBuilding", tileKey: randomTile(rnd), buildingId: pick(rnd, BUILDABLE) };
  if (r < 0.40) return { type: "upgradeBuilding", tileKey: randomTile(rnd) };
  if (r < 0.48) return { type: "collect" };
  if (r < 0.55) return { type: "moveBuilding", fromTile: randomTile(rnd), toTile: randomTile(rnd) };
  if (r < 0.62) return { type: "placeWall", tileKey: randomTile(rnd) };
  if (r < 0.67) return { type: "upgradeWall", tileKey: randomTile(rnd) };
  if (r < 0.77) return { type: "trainTroop", unit: pick(rnd, UNIT_IDS) as CocUnitId };
  if (r < 0.86) return { type: "raid", targetOwner: owners.length ? pick(rnd, owners) : pid, army: { grunt: Math.floor(rnd() * 20), gunship: Math.floor(rnd() * 5) } };
  if (r < 0.90) return { type: "finishNow", tileKey: randomTile(rnd) };
  if (r < 0.96) return { type: "extendShield", hours: Math.floor(rnd() * 26) };
  if (r < 0.98) return { type: "createClan", name: `Clan${Math.floor(rnd() * 1000)}` };
  if (r < 0.99) return { type: "joinClan", clanId: pick(rnd, ["clan1", "clan2", "clan3"]) };
  return { type: "leaveClan" };
}

describe("coc fuzz — invariants under random command streams", () => {
  it("never throws and preserves all invariants over 30k mixed steps (4 players)", () => {
    const rnd = mulberry32(0xC0FFEE);
    let w = createWorld(42);
    const players = ["p1", "p2", "p3", "p4"];
    for (const p of players) w = addPlayer(w, p);

    for (let i = 0; i < 30000; i++) {
      const pid = pick(rnd, players);
      const cmd = randomCommand(rnd, w, pid);
      // applyCommand must never throw; errors return the prior state unchanged.
      w = applyCommand(w, pid, cmd).state;
      if (i % 25 === 0) w = applyTick(w);
      if (i % 500 === 0) checkInvariants(w);
    }
    checkInvariants(w);
    expect(w.tick).toBeGreaterThan(0);
  });

  it("is deterministic — same seed yields the same final tick & base count", () => {
    function run(): { tick: number; bases: number } {
      const rnd = mulberry32(7);
      let w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
      const players = ["p1", "p2"];
      for (let i = 0; i < 3000; i++) {
        w = applyCommand(w, pick(rnd, players), randomCommand(rnd, w, "p1")).state;
        if (i % 20 === 0) w = applyTick(w);
      }
      return { tick: w.tick, bases: Object.keys(w.bases).length };
    }
    expect(run()).toEqual(run());
  });
});
