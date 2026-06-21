import { describe, it, expect } from "vitest";
import {
  createWorld, addPlayer, storageCap, ccLevel, builderCount, freeBuilders, normalizeWorld, validateWorld,
  footprintTiles, occupiedTiles, fitsInGrid, townHallKey,
} from "./world";
import { BASE_STORAGE_CAP, STARTING_HEXAR } from "./config";
import type { CocBase } from "./types";

const base = (over: Partial<CocBase> = {}): CocBase => ({
  owner: "p1",
  location: "0,0",
  buildings: {
    "8,8": { id: "commandCenter", level: 1 },
    "5,9": { id: "builderHut", level: 1 },
    "14,9": { id: "builderHut", level: 1 },
  },
  walls: {},
  traps: {},
  gold: 0,
  elixir: 0,
  jobs: [],
  army: {},
  garrison: {},
  trainQueue: [],
  shieldUntil: 0,
  trophies: 0,
  ...over,
});

describe("createWorld", () => {
  it("has a radius-9 hex map and no bases", () => {
    const w = createWorld(1);
    expect(w.radius).toBe(9);
    expect(Object.keys(w.hexes).length).toBe(271);
    expect(Object.keys(w.bases).length).toBe(0);
    expect(w.tick).toBe(0);
  });
  it("is deterministic for the same seed", () => {
    expect(createWorld(7)).toEqual(createWorld(7));
  });
});

describe("addPlayer", () => {
  it("adds a player with the starting $HEXAR balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    expect(w.players.p1.hexar).toBe(STARTING_HEXAR);
  });
  it("is idempotent", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = { ...w, players: { ...w.players, p1: { ...w.players.p1, hexar: 5 } } };
    w = addPlayer(w, "p1");
    expect(w.players.p1.hexar).toBe(5);
  });
});

describe("grid geometry", () => {
  it("footprintTiles covers the w×h block from the anchor", () => {
    expect(footprintTiles("3,4", "cannon")).toEqual(["3,4", "4,4", "5,4", "3,5", "4,5", "5,5", "3,6", "4,6", "5,6"]);
  });
  it("fitsInGrid is false when the footprint runs off the edge", () => {
    expect(fitsInGrid("0,0", "commandCenter")).toBe(true);
    expect(fitsInGrid("18,18", "commandCenter")).toBe(false); // 4×4 needs up to 21,21
  });
  it("occupiedTiles unions building footprints and walls, and can exclude one anchor", () => {
    const b = base({ walls: { "0,0": 1 } });
    const occ = occupiedTiles(b);
    expect(occ.has("8,8")).toBe(true); // town hall
    expect(occ.has("11,11")).toBe(true); // town hall far corner
    expect(occ.has("0,0")).toBe(true); // wall
    expect(occ.has("19,19")).toBe(false);
    expect(occupiedTiles(b, "8,8").has("8,8")).toBe(false); // excluded
  });
});

describe("storageCap", () => {
  it("is the base cap with no storage", () => {
    expect(storageCap(base(), "gold")).toBe(BASE_STORAGE_CAP);
  });
  it("adds storage capacity for the matching resource only", () => {
    const b = base({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldStorage", level: 1 } } });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP + 2000);
    expect(storageCap(b, "elixir")).toBe(BASE_STORAGE_CAP);
  });
  it("ignores storages still under construction (level 0)", () => {
    const b = base({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldStorage", level: 0 } } });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP);
  });
});

describe("ccLevel + builders", () => {
  it("reads CC level from the placed Town Hall, wherever it sits", () => {
    expect(ccLevel(base())).toBe(1);
    expect(townHallKey(base())).toBe("8,8");
    expect(ccLevel(base({ buildings: { "2,2": { id: "commandCenter", level: 3 } } }))).toBe(3);
  });
  it("builders come from operational builder huts; free = builders minus jobs", () => {
    expect(builderCount(base())).toBe(2);
    expect(freeBuilders(base())).toBe(2);
    expect(
      freeBuilders(base({ jobs: [{ tileKey: "0,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 30 }] })),
    ).toBe(1);
  });
});

describe("normalizeWorld", () => {
  it("fills missing collections on a restored snapshot", () => {
    const restored = { seed: 1, radius: 9, tick: 5, hexes: {} } as never;
    const w = normalizeWorld(restored);
    expect(w.bases).toEqual({});
    expect(w.claimedHexes).toEqual({});
    expect(w.players).toEqual({});
  });
  it("drops legacy hex-cluster bases that predate the grid (no location) and rebuilds claimedHexes", () => {
    const restored = {
      seed: 1, radius: 9, tick: 5, hexes: {}, players: {}, claimedHexes: { "0,0": "old", "1,0": "old" },
      bases: {
        old: { owner: "old", centerKey: "0,0", ownedHexes: ["0,0", "1,0"], buildings: { "0,0": { id: "commandCenter", level: 1 } }, walls: {}, gold: 0, elixir: 0, builders: 2, jobs: [] },
        nu: { owner: "nu", location: "3,0", buildings: { "8,8": { id: "commandCenter", level: 1 } }, walls: {}, gold: 0, elixir: 0, jobs: [], army: {}, trainQueue: [], shieldUntil: 0, trophies: 0 },
      },
    } as never;
    const w = normalizeWorld(restored);
    expect(w.bases.old).toBeUndefined();
    expect(w.bases.nu).toBeDefined();
    expect(w.claimedHexes).toEqual({ "3,0": "nu" });
  });
  it("repairs the claimed>earned treasury invariant (and floors balances) so a bad record can't brick the world", () => {
    const restored = {
      seed: 1, radius: 9, tick: 5, hexes: {}, claimedHexes: {}, clans: {},
      seasonPool: 1000, season: { id: 1, endsAtTick: 100 },
      players: {
        bad: { id: "bad", hexar: -50, earned: 100, claimed: 9999 }, // over-claimed + negative balance
        ok: { id: "ok", hexar: 200, earned: 300, claimed: 120 },
      },
      bases: {},
    } as never;
    const w = normalizeWorld(restored);
    expect(w.players.bad.claimed).toBe(100); // clamped down to earned (never pay more than earned)
    expect(w.players.bad.hexar).toBe(0); // floored
    expect(w.players.ok.claimed).toBe(120); // valid record untouched
    expect(validateWorld(w).ok).toBe(true); // the repaired world now passes the boot safeguard
  });
});
