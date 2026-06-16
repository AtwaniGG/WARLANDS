import { describe, it, expect } from "vitest";
import { createWorld, fitsInGrid, occupiedTiles } from "./world";
import { seedBots, ensureBots, makeBotBase, BOT_TARGET } from "./bots";
import { resolveRaid } from "./battle";
import { BUILDINGS } from "./config";

describe("bots", () => {
  it("seedBots populates N raidable AI villages with loot, on claimed hexes", () => {
    const w = seedBots(createWorld(1), 10);
    expect(Object.values(w.players).filter((p) => p.isBot).length).toBe(10);
    expect(Object.keys(w.bases).length).toBe(10);
    for (const b of Object.values(w.bases)) {
      expect(b.location).toBeTruthy();
      expect(w.claimedHexes[b.location]).toBe(b.owner);
      expect(Object.values(b.buildings).some((x) => x.id === "commandCenter")).toBe(true);
      expect(b.gold).toBeGreaterThan(0);
      for (const [tk, bld] of Object.entries(b.buildings)) expect(fitsInGrid(tk, bld.id)).toBe(true);
    }
  });

  it("is deterministic for the same world + seed", () => {
    expect(seedBots(createWorld(7), 8)).toEqual(seedBots(createWorld(7), 8));
  });

  it("ensureBots tops up to the target and is idempotent", () => {
    const w = ensureBots(createWorld(2));
    expect(Object.values(w.players).filter((p) => p.isBot).length).toBe(BOT_TARGET);
    expect(Object.values(ensureBots(w).players).filter((p) => p.isBot).length).toBe(BOT_TARGET);
  });

  it("a tier-3 bot base has defenses, a walled core, traps, a clan castle + garrison, and no overlaps", () => {
    const b = makeBotBase("bot0", "0,0", 3, () => 0.5);
    expect(Object.values(b.buildings).some((x) => x.id === "clanCastle")).toBe(true);
    expect((b.garrison.grunt ?? 0)).toBeGreaterThan(0);
    expect(Object.keys(b.walls).length).toBeGreaterThan(0);
    expect(Object.keys(b.traps).length).toBeGreaterThan(0);
    // footprints + walls + traps never collide: occupied-tile count == sum of all their tiles
    let tiles = 0;
    for (const bld of Object.values(b.buildings)) { const { w, h } = BUILDINGS[bld.id].footprint; tiles += w * h; }
    tiles += Object.keys(b.walls).length + Object.keys(b.traps).length;
    expect(occupiedTiles(b).size).toBe(tiles);
  });

  it("bot bases are valid raid targets for the positional resolver", () => {
    const b = makeBotBase("bot1", "0,0", 2, () => 0.3);
    const deploy = Array.from({ length: 20 }, (_, i) => ({ unit: "grunt" as const, x: i % 5, y: Math.floor(i / 5) }));
    const r = resolveRaid(deploy, b, 123);
    expect(r.stars).toBeGreaterThanOrEqual(0);
    expect(r.stars).toBeLessThanOrEqual(3);
    expect(r.loot.gold).toBeLessThanOrEqual(b.gold);
  });
});
