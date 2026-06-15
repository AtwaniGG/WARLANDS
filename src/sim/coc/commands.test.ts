import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer } from "./world";
import type { CocWorld } from "./types";

const fresh = (): CocWorld => addPlayer(createWorld(1), "p1");
const claimed = (): CocWorld => applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 }).state;
function give(s: CocWorld, gold: number, elixir: number, builders = 2): CocWorld {
  return { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, gold, elixir, builders } } };
}

describe("claimBase", () => {
  it("claims a 7-hex cluster with a level-1 command center", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 });
    expect(r.error).toBeUndefined();
    const b = r.state.bases.p1;
    expect(b.ownedHexes.length).toBe(7);
    expect(b.buildings["0,0"]).toEqual({ id: "commandCenter", level: 1 });
    expect(r.state.claimedHexes["1,0"]).toBe("p1");
  });
  it("rejects a second base for the same player", () => {
    const r = applyCommand(claimed(), "p1", { type: "claimBase", q: 5, r: 0 });
    expect(r.error).toMatch(/already/i);
  });
  it("rejects an out-of-bounds center", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 999, r: 999 });
    expect(r.error).toMatch(/hex/i);
  });
  it("rejects overlapping another player's cluster", () => {
    const s = addPlayer(claimed(), "p2");
    const r = applyCommand(s, "p2", { type: "claimBase", q: 1, r: 0 });
    expect(r.error).toMatch(/claimed/i);
  });
});

describe("placeBuilding", () => {
  it("places a gold collector under construction and occupies a builder + spends elixir", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["1,0"]).toEqual({ id: "goldCollector", level: 0, buffer: 0 });
    expect(r.state.bases.p1.jobs.length).toBe(1);
    expect(r.state.bases.p1.elixir).toBe(850);
  });
  it("rejects when the resource is insufficient", () => {
    const r = applyCommand(give(claimed(), 0, 0), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/elixir/i);
  });
  it("rejects building on an occupied hex", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "0,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/occupied|empty/i);
  });
  it("rejects a hex outside the cluster", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", hexKey: "5,5", buildingId: "goldCollector" });
    expect(r.error).toMatch(/your base|cluster|owned/i);
  });
  it("rejects exceeding the CC1 building cap", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1 } } } } };
    const r = applyCommand(s, "p1", { type: "placeBuilding", hexKey: "1,-1", buildingId: "goldCollector" });
    expect(r.error).toMatch(/limit/i);
  });
  it("rejects when no builder is free", () => {
    const s = give(claimed(), 0, 1000, 0);
    const r = applyCommand(s, "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/builder/i);
  });
});

describe("upgradeBuilding", () => {
  it("upgrades the command center: spends gold, queues a job, keeps the current level until done", () => {
    const r = applyCommand(give(claimed(), 2000, 0), "p1", { type: "upgradeBuilding", hexKey: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.jobs[0]).toMatchObject({ hexKey: "0,0", kind: "upgrade", toLevel: 2 });
    expect(r.state.bases.p1.buildings["0,0"].level).toBe(1);
  });
  it("rejects upgrading a building already at its CC-capped level", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1 } } } } };
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", hexKey: "1,0" });
    expect(r.error).toMatch(/command center|max|level/i);
  });
  it("rejects upgrading a building that is under construction", () => {
    let s = give(claimed(), 0, 1000, 5);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 0 } } } } };
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", hexKey: "1,0" });
    expect(r.error).toMatch(/construction|busy/i);
  });
});

describe("collect", () => {
  it("drains collector buffers into storage up to the cap", () => {
    let s = give(claimed(), 0, 0);
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1, buffer: 300 } } } } };
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(300);
    expect(r.state.bases.p1.buildings["1,0"].buffer).toBe(0);
  });
  it("respects storage cap and leaves the overflow in the buffer", () => {
    let s = give(claimed(), 900, 0); // base cap 1000 => room for 100
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "1,0": { id: "goldCollector", level: 1, buffer: 300 } } } } };
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.buildings["1,0"].buffer).toBe(200);
  });
});

describe("expandCluster", () => {
  it("rejects expanding past the CC level max hexes", () => {
    const r = applyCommand(claimed(), "p1", { type: "expandCluster", q: 2, r: 0 });
    expect(r.error).toMatch(/command center|expand|max/i);
  });
  it("annexes an adjacent unclaimed hex once CC level allows", () => {
    let s = claimed();
    s = { ...s, bases: { p1: { ...s.bases.p1, buildings: { ...s.bases.p1.buildings, "0,0": { id: "commandCenter", level: 2 } } } } };
    const r = applyCommand(s, "p1", { type: "expandCluster", q: 2, r: 0 }); // (2,0) adjacent to owned (1,0)
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.ownedHexes).toContain("2,0");
    expect(r.state.claimedHexes["2,0"]).toBe("p1");
  });
});

describe("placeBuilding — defenses", () => {
  it("builds a cannon (gold) at CC1, occupying a builder", () => {
    const r = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "cannon" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["1,0"]).toEqual({ id: "cannon", level: 0, buffer: 0 });
    expect(r.state.bases.p1.gold).toBe(800);
  });
  it("rejects air defense at CC1 (locked)", () => {
    const r = applyCommand(give(claimed(), 5000, 0), "p1", { type: "placeBuilding", hexKey: "1,0", buildingId: "airDefense" });
    expect(r.error).toMatch(/locked/i);
  });
});

describe("placeWall", () => {
  it("places a wall between two adjacent owned hexes, instantly, spending gold", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "1,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.walls["0,0|1,0"]).toBe(1);
    expect(r.state.bases.p1.gold).toBe(400);
    expect(r.state.bases.p1.jobs.length).toBe(0); // no builder used
  });
  it("rejects non-adjacent hexes", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", aKey: "1,0", bKey: "-1,0" });
    expect(r.error).toMatch(/adjacent/i);
  });
  it("rejects a hex outside the base", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "5,5" });
    expect(r.error).toMatch(/your base/i);
  });
  it("rejects a duplicate wall", () => {
    let s = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "1,0" }).state;
    const r = applyCommand(s, "p1", { type: "placeWall", aKey: "1,0", bKey: "0,0" });
    expect(r.error).toMatch(/already/i);
  });
  it("rejects when gold is insufficient", () => {
    const r = applyCommand(give(claimed(), 0, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "1,0" });
    expect(r.error).toMatch(/gold/i);
  });
});

describe("upgradeWall", () => {
  it("rejects upgrading past the CC-gated wall cap (CC1 → L1 only)", () => {
    let s = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "1,0" }).state;
    const r = applyCommand(s, "p1", { type: "upgradeWall", edgeKey: "0,0|1,0" });
    expect(r.error).toMatch(/command center/i);
  });
  it("upgrades the wall once the CC level allows", () => {
    let s = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeWall", aKey: "0,0", bKey: "1,0" }).state;
    s = { ...s, bases: { p1: { ...s.bases.p1, gold: 1000, buildings: { ...s.bases.p1.buildings, "0,0": { id: "commandCenter", level: 2 } } } } };
    const r = applyCommand(s, "p1", { type: "upgradeWall", edgeKey: "0,0|1,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.walls["0,0|1,0"]).toBe(2);
    expect(r.state.bases.p1.gold).toBe(600);
  });
});

// army-capable base: barracks + army camp operational
function withArmyBuildings(s: CocWorld, elixir: number): CocWorld {
  const b = s.bases.p1;
  return { ...s, bases: { ...s.bases, p1: { ...b, elixir, buildings: { ...b.buildings, "1,0": { id: "barracks", level: 1 }, "0,1": { id: "armyCamp", level: 1 } } } } };
}

describe("trainTroop", () => {
  it("queues a troop, spending elixir", () => {
    const s = withArmyBuildings(claimed(), 1000);
    const r = applyCommand(s, "p1", { type: "trainTroop", unit: "grunt" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.trainQueue.length).toBe(1);
    expect(r.state.bases.p1.elixir).toBe(960);
  });
  it("rejects training without a barracks", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "trainTroop", unit: "grunt" });
    expect(r.error).toMatch(/barracks/i);
  });
  it("rejects training without enough army housing", () => {
    const b = claimed().bases.p1;
    const s = { ...claimed(), bases: { p1: { ...b, elixir: 1000, buildings: { ...b.buildings, "1,0": { id: "barracks", level: 1 } } } } } as CocWorld;
    const r = applyCommand(s, "p1", { type: "trainTroop", unit: "grunt" });
    expect(r.error).toMatch(/housing/i);
  });
  it("rejects training with insufficient elixir", () => {
    const s = withArmyBuildings(claimed(), 0);
    const r = applyCommand(s, "p1", { type: "trainTroop", unit: "grunt" });
    expect(r.error).toMatch(/elixir/i);
  });
});

function twoBases(): CocWorld {
  let s = applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 }).state;
  s = addPlayer(s, "p2");
  s = applyCommand(s, "p2", { type: "claimBase", q: 3, r: 0 }).state;
  return s;
}

describe("raid", () => {
  it("raids a neighbour: loots, awards stars, consumes the army, shields the defender", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, gold: 500, army: { grunt: 80 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", army: { grunt: 80 } });
    expect(r.error).toBeUndefined();
    expect(r.report).toBeDefined();
    expect(r.report!.stars).toBe(3); // p2 base is just a Command Center
    expect(r.state.bases.p1.army.grunt).toBe(0); // army consumed
    expect(r.state.bases.p1.gold).toBe(500 + Math.floor(500 * 0.2)); // looted 20% of p2's 500
    expect(r.state.bases.p2.gold).toBe(400);
    expect(r.state.bases.p2.shieldUntil).toBeGreaterThan(s.tick);
  });
  it("rejects raiding your own base", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 10 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p1", army: { grunt: 10 } });
    expect(r.error).toMatch(/your own/i);
  });
  it("rejects raiding a shielded base", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 10 } }, p2: { ...s.bases.p2, shieldUntil: 9999 } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", army: { grunt: 10 } });
    expect(r.error).toMatch(/shield/i);
  });
  it("rejects deploying troops you don't have", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 5 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", army: { grunt: 50 } });
    expect(r.error).toMatch(/don't have/i);
  });
});
