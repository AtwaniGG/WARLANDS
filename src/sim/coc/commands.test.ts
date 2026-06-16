import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer, builderCount } from "./world";
import { STARTING_WAR } from "./config";
import type { CocBase, CocWorld, PlacedBuilding } from "./types";

const fresh = (): CocWorld => addPlayer(createWorld(1), "p1");
const claimed = (): CocWorld => applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 }).state;
function give(s: CocWorld, gold: number, elixir: number): CocWorld {
  return { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, gold, elixir } } };
}
/** Merge fields into p1's base. */
function withBase(s: CocWorld, over: Partial<CocBase>): CocWorld {
  return { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, ...over } } };
}
function addBuildings(s: CocWorld, more: Record<string, PlacedBuilding>): CocWorld {
  return withBase(s, { buildings: { ...s.bases.p1.buildings, ...more } });
}

describe("claimBase", () => {
  it("claims one world hex with a Town Hall and two Builder's Huts", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 0, r: 0 });
    expect(r.error).toBeUndefined();
    const b = r.state.bases.p1;
    expect(b.location).toBe("0,0");
    expect(b.buildings["8,8"]).toEqual({ id: "commandCenter", level: 1 });
    expect(builderCount(b)).toBe(2);
    expect(r.state.claimedHexes["0,0"]).toBe("p1");
  });
  it("rejects a second base for the same player", () => {
    const r = applyCommand(claimed(), "p1", { type: "claimBase", q: 5, r: 0 });
    expect(r.error).toMatch(/already/i);
  });
  it("rejects an out-of-bounds hex", () => {
    const r = applyCommand(fresh(), "p1", { type: "claimBase", q: 999, r: 999 });
    expect(r.error).toMatch(/hex/i);
  });
  it("rejects claiming a hex another player already holds", () => {
    const s = addPlayer(claimed(), "p2");
    const r = applyCommand(s, "p2", { type: "claimBase", q: 0, r: 0 });
    expect(r.error).toMatch(/claimed/i);
  });
});

describe("placeBuilding", () => {
  it("places a gold collector under construction and occupies a builder + spends elixir", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["0,0"]).toEqual({ id: "goldCollector", level: 0, buffer: 0 });
    expect(r.state.bases.p1.jobs.length).toBe(1);
    expect(r.state.bases.p1.elixir).toBe(850);
  });
  it("rejects when the resource is insufficient", () => {
    const r = applyCommand(give(claimed(), 0, 0), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" });
    expect(r.error).toMatch(/elixir/i);
  });
  it("rejects overlapping an occupied tile (the Town Hall)", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", tileKey: "8,8", buildingId: "goldCollector" });
    expect(r.error).toMatch(/occupied/i);
  });
  it("rejects a footprint that runs off the grid", () => {
    const r = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", tileKey: "19,19", buildingId: "goldCollector" });
    expect(r.error).toMatch(/fit/i);
  });
  it("rejects exceeding the CC1 building cap", () => {
    let s = give(claimed(), 0, 1000);
    s = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" }).state;
    const r = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,4", buildingId: "goldCollector" });
    expect(r.error).toMatch(/limit/i);
  });
  it("rejects when no builder is free", () => {
    let s = give(claimed(), 1000, 1000);
    s = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" }).state;
    s = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,4", buildingId: "elixirCollector" }).state;
    const r = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,8", buildingId: "goldStorage" });
    expect(r.error).toMatch(/builder/i);
  });
});

describe("placeBuilding — Builder's Hut (paid in $WAR, instant)", () => {
  it("adds a builder for $WAR instantly, no builder consumed", () => {
    const r = applyCommand(claimed(), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "builderHut" });
    expect(r.error).toBeUndefined();
    expect(builderCount(r.state.bases.p1)).toBe(3);
    expect(r.state.bases.p1.buildings["0,0"]).toEqual({ id: "builderHut", level: 1 });
    expect(r.state.players.p1.war).toBe(STARTING_WAR - 2000 * (2 - 1));
    expect(r.state.bases.p1.jobs.length).toBe(0);
  });
  it("rejects placing a hut past the maximum builders", () => {
    let s = withBase(claimed(), {
      buildings: {
        "8,8": { id: "commandCenter", level: 1 },
        "0,0": { id: "builderHut", level: 1 }, "0,2": { id: "builderHut", level: 1 },
        "0,4": { id: "builderHut", level: 1 }, "2,0": { id: "builderHut", level: 1 },
        "2,2": { id: "builderHut", level: 1 },
      },
    });
    const r = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "15,15", buildingId: "builderHut" });
    expect(r.error).toMatch(/maximum/i);
  });
  it("rejects without enough $WAR", () => {
    const s = { ...claimed(), players: { p1: { ...claimed().players.p1, war: 0 } } };
    const r = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "builderHut" });
    expect(r.error).toMatch(/\$WAR/i);
  });
});

describe("moveBuilding", () => {
  it("relocates a built building to a free area", () => {
    const r = applyCommand(claimed(), "p1", { type: "moveBuilding", fromTile: "5,9", toTile: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["0,0"]?.id).toBe("builderHut");
    expect(r.state.bases.p1.buildings["5,9"]).toBeUndefined();
  });
  it("rejects moving onto occupied tiles", () => {
    const r = applyCommand(claimed(), "p1", { type: "moveBuilding", fromTile: "5,9", toTile: "8,8" });
    expect(r.error).toMatch(/occupied/i);
  });
  it("rejects moving a building still under construction", () => {
    const s = applyCommand(give(claimed(), 0, 1000), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" }).state;
    const r = applyCommand(s, "p1", { type: "moveBuilding", fromTile: "0,0", toTile: "0,4" });
    expect(r.error).toMatch(/construction/i);
  });
});

describe("upgradeBuilding", () => {
  it("upgrades the Town Hall: spends gold, queues a job, keeps the current level until done", () => {
    const r = applyCommand(give(claimed(), 2000, 0), "p1", { type: "upgradeBuilding", tileKey: "8,8" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.jobs[0]).toMatchObject({ tileKey: "8,8", kind: "upgrade", toLevel: 2 });
    expect(r.state.bases.p1.buildings["8,8"].level).toBe(1);
  });
  it("rejects upgrading a building already at its CC-capped level", () => {
    const s = addBuildings(give(claimed(), 0, 1000), { "0,0": { id: "goldCollector", level: 1 } });
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", tileKey: "0,0" });
    expect(r.error).toMatch(/town hall|max|level/i);
  });
  it("rejects upgrading a building that is under construction", () => {
    const s = addBuildings(give(claimed(), 0, 1000), { "0,0": { id: "goldCollector", level: 0 } });
    const r = applyCommand(s, "p1", { type: "upgradeBuilding", tileKey: "0,0" });
    expect(r.error).toMatch(/construction|busy/i);
  });
});

describe("collect", () => {
  it("drains collector buffers into storage up to the cap", () => {
    const s = addBuildings(give(claimed(), 0, 0), { "0,0": { id: "goldCollector", level: 1, buffer: 300 } });
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(300);
    expect(r.state.bases.p1.buildings["0,0"].buffer).toBe(0);
  });
  it("respects storage cap and leaves the overflow in the buffer", () => {
    const s = addBuildings(give(claimed(), 900, 0), { "0,0": { id: "goldCollector", level: 1, buffer: 300 } });
    const r = applyCommand(s, "p1", { type: "collect" });
    expect(r.state.bases.p1.gold).toBe(1000);
    expect(r.state.bases.p1.buildings["0,0"].buffer).toBe(200);
  });
});

describe("placeBuilding — defenses", () => {
  it("builds a cannon (gold) at CC1, occupying a builder", () => {
    const r = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "cannon" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.buildings["0,0"]).toEqual({ id: "cannon", level: 0, buffer: 0 });
    expect(r.state.bases.p1.gold).toBe(800);
  });
  it("rejects air defense at CC1 (locked)", () => {
    const r = applyCommand(give(claimed(), 5000, 0), "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "airDefense" });
    expect(r.error).toMatch(/locked/i);
  });
});

describe("placeWall", () => {
  it("places a wall on an empty tile, instantly, spending gold, using no builder", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", tileKey: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.walls["0,0"]).toBe(1);
    expect(r.state.bases.p1.gold).toBe(400);
    expect(r.state.bases.p1.jobs.length).toBe(0);
  });
  it("rejects a tile occupied by a building", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", tileKey: "8,8" });
    expect(r.error).toMatch(/occupied/i);
  });
  it("rejects a tile outside the village", () => {
    const r = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", tileKey: "20,20" });
    expect(r.error).toMatch(/outside/i);
  });
  it("rejects a duplicate wall", () => {
    const s = applyCommand(give(claimed(), 500, 0), "p1", { type: "placeWall", tileKey: "0,0" }).state;
    const r = applyCommand(s, "p1", { type: "placeWall", tileKey: "0,0" });
    expect(r.error).toMatch(/occupied/i);
  });
  it("rejects when gold is insufficient", () => {
    const r = applyCommand(give(claimed(), 0, 0), "p1", { type: "placeWall", tileKey: "0,0" });
    expect(r.error).toMatch(/gold/i);
  });
  it("rejects when the wall count cap is reached", () => {
    const walls: Record<string, number> = {};
    for (let y = 0; y < 12; y++) walls[`0,${y}`] = 1; // CC1 cap = 12
    const s = withBase(give(claimed(), 500, 0), { walls });
    const r = applyCommand(s, "p1", { type: "placeWall", tileKey: "1,0" });
    expect(r.error).toMatch(/limit|town hall/i);
  });
});

describe("upgradeWall", () => {
  it("rejects upgrading past the CC-gated wall cap (CC1 → L1 only)", () => {
    const s = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeWall", tileKey: "0,0" }).state;
    const r = applyCommand(s, "p1", { type: "upgradeWall", tileKey: "0,0" });
    expect(r.error).toMatch(/town hall/i);
  });
  it("upgrades the wall once the CC level allows", () => {
    let s = applyCommand(give(claimed(), 1000, 0), "p1", { type: "placeWall", tileKey: "0,0" }).state;
    s = withBase(s, { gold: 1000, buildings: { ...s.bases.p1.buildings, "8,8": { id: "commandCenter", level: 2 } } });
    const r = applyCommand(s, "p1", { type: "upgradeWall", tileKey: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.walls["0,0"]).toBe(2);
    expect(r.state.bases.p1.gold).toBe(600);
  });
});

// army-capable base: barracks + army camp operational
function withArmyBuildings(s: CocWorld, elixir: number): CocWorld {
  return addBuildings(withBase(s, { elixir }), { "0,0": { id: "barracks", level: 1 }, "0,4": { id: "armyCamp", level: 1 } });
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
    const s = addBuildings(withBase(claimed(), { elixir: 1000 }), { "0,0": { id: "barracks", level: 1 } });
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

function dep(unit: "grunt" | "marksman" | "breacher" | "juggernaut" | "gunship", n: number): import("./types").Deployment[] {
  const out: import("./types").Deployment[] = [];
  for (let i = 0; i < n; i++) out.push({ unit, x: i % 5, y: Math.floor(i / 5) });
  return out;
}

describe("raid", () => {
  it("raids a neighbour: loots, awards stars, consumes the army, shields the defender", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, gold: 500, army: { grunt: 80 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", deploy: dep("grunt", 80) });
    expect(r.error).toBeUndefined();
    expect(r.report).toBeDefined();
    expect(r.report!.stars).toBe(3); // p2 base is undefended (Town Hall + huts)
    expect(r.report!.seed).toBeGreaterThan(0);
    expect(r.report!.deploy.length).toBe(80);
    expect(r.state.bases.p1.army.grunt).toBe(0); // army consumed
    expect(r.state.bases.p1.gold).toBe(500 + Math.floor(500 * 0.2)); // looted 20% of p2's 500
    expect(r.state.bases.p2.gold).toBe(400);
    expect(r.state.bases.p2.shieldUntil).toBeGreaterThan(s.tick);
  });
  it("rejects raiding your own base", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 10 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p1", deploy: dep("grunt", 10) });
    expect(r.error).toMatch(/your own/i);
  });
  it("rejects raiding a shielded base", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 10 } }, p2: { ...s.bases.p2, shieldUntil: 9999 } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", deploy: dep("grunt", 10) });
    expect(r.error).toMatch(/shield/i);
  });
  it("rejects an empty deploy", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 10 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", deploy: [] });
    expect(r.error).toMatch(/deploy/i);
  });
  it("rejects deploying troops you don't have", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 5 } } } };
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", deploy: dep("grunt", 50) });
    expect(r.error).toMatch(/don't have/i);
  });
  it("awards $WAR to the attacker scaled by stars", () => {
    let s = twoBases();
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 80 } } } };
    const before = s.players.p1.war;
    const r = applyCommand(s, "p1", { type: "raid", targetOwner: "p2", deploy: dep("grunt", 80) });
    expect(r.report!.stars).toBe(3);
    expect(r.state.players.p1.war).toBe(before + 3 * 50);
  });
});

describe("$WAR premium economy", () => {
  it("finishNow instantly completes a job for $WAR", () => {
    let s = give(claimed(), 0, 1000);
    s = applyCommand(s, "p1", { type: "placeBuilding", tileKey: "0,0", buildingId: "goldCollector" }).state;
    expect(s.bases.p1.jobs.length).toBe(1);
    const warBefore = s.players.p1.war;
    const r = applyCommand(s, "p1", { type: "finishNow", tileKey: "0,0" });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.jobs.length).toBe(0);
    expect(r.state.bases.p1.buildings["0,0"].level).toBe(1);
    expect(r.state.players.p1.war).toBeLessThan(warBefore);
  });
  it("extendShield buys shield time for $WAR", () => {
    const r = applyCommand(claimed(), "p1", { type: "extendShield", hours: 2 });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.shieldUntil).toBe(2 * 3600); // tick 0 + 2h
    expect(r.state.players.p1.war).toBe(STARTING_WAR - 1000);
  });
  it("rejects premium actions without enough $WAR", () => {
    const s = { ...claimed(), players: { p1: { ...claimed().players.p1, war: 0 } } };
    const r = applyCommand(s, "p1", { type: "extendShield", hours: 2 });
    expect(r.error).toMatch(/\$WAR/i);
  });
});

describe("clans", () => {
  it("creates a clan and enrolls the founder", () => {
    const r = applyCommand(twoBases(), "p1", { type: "createClan", name: "Iron Vanguard" });
    expect(r.error).toBeUndefined();
    const clan = Object.values(r.state.clans)[0];
    expect(clan.members).toEqual(["p1"]);
    expect(r.state.players.p1.clanId).toBe(clan.id);
  });
  it("lets a second player join", () => {
    let s = applyCommand(twoBases(), "p1", { type: "createClan", name: "Iron Vanguard" }).state;
    const clanId = Object.keys(s.clans)[0];
    const r = applyCommand(s, "p2", { type: "joinClan", clanId });
    expect(r.error).toBeUndefined();
    expect(r.state.clans[clanId].members).toEqual(["p1", "p2"]);
    expect(r.state.players.p2.clanId).toBe(clanId);
  });
  it("reassigns the founder when they leave a non-empty clan", () => {
    let s = applyCommand(twoBases(), "p1", { type: "createClan", name: "Iron Vanguard" }).state;
    const clanId = Object.keys(s.clans)[0];
    s = applyCommand(s, "p2", { type: "joinClan", clanId }).state;
    const r = applyCommand(s, "p1", { type: "leaveClan" });
    expect(r.state.clans[clanId].members).toEqual(["p2"]);
    expect(r.state.clans[clanId].founder).toBe("p2");
    expect(r.state.players.p1.clanId).toBeNull();
  });
  it("deletes the clan when the last member leaves", () => {
    let s = applyCommand(twoBases(), "p1", { type: "createClan", name: "Lone Wolf" }).state;
    const clanId = Object.keys(s.clans)[0];
    const r = applyCommand(s, "p1", { type: "leaveClan" });
    expect(r.state.clans[clanId]).toBeUndefined();
  });
  it("donates troops to a clanmate with housing", () => {
    let s = applyCommand(twoBases(), "p1", { type: "createClan", name: "Iron Vanguard" }).state;
    const clanId = Object.keys(s.clans)[0];
    s = applyCommand(s, "p2", { type: "joinClan", clanId }).state;
    s = {
      ...s,
      bases: {
        ...s.bases,
        p1: { ...s.bases.p1, army: { grunt: 5 } },
        p2: { ...s.bases.p2, buildings: { ...s.bases.p2.buildings, "0,0": { id: "armyCamp", level: 1 } } },
      },
    };
    const r = applyCommand(s, "p1", { type: "donateTroops", toOwner: "p2", army: { grunt: 3 } });
    expect(r.error).toBeUndefined();
    expect(r.state.bases.p1.army.grunt).toBe(2);
    expect(r.state.bases.p2.army.grunt).toBe(3);
  });
  it("rejects donating to a non-clanmate", () => {
    let s = applyCommand(twoBases(), "p1", { type: "createClan", name: "Iron Vanguard" }).state;
    s = { ...s, bases: { ...s.bases, p1: { ...s.bases.p1, army: { grunt: 5 } } } };
    const r = applyCommand(s, "p1", { type: "donateTroops", toOwner: "p2", army: { grunt: 1 } });
    expect(r.error).toMatch(/clanmate/i);
  });
});
