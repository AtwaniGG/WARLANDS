import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, storageCap, ccLevel, freeBuilders, normalizeWorld, edgeKey } from "./world";
import { BASE_STORAGE_CAP, STARTING_BUILDERS, STARTING_WAR } from "./config";
import type { CocBase } from "./types";

const base = (over: Partial<CocBase> = {}): CocBase => ({
  owner: "p1",
  centerKey: "0,0",
  ownedHexes: ["0,0"],
  buildings: { "0,0": { id: "commandCenter", level: 1 } },
  walls: {},
  gold: 0,
  elixir: 0,
  builders: STARTING_BUILDERS,
  jobs: [],
  army: {},
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
  it("adds a player with the starting WAR balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    expect(w.players.p1.war).toBe(STARTING_WAR);
  });
  it("is idempotent", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = { ...w, players: { ...w.players, p1: { ...w.players.p1, war: 5 } } };
    w = addPlayer(w, "p1");
    expect(w.players.p1.war).toBe(5);
  });
});

describe("storageCap", () => {
  it("is the base cap with no storage", () => {
    expect(storageCap(base(), "gold")).toBe(BASE_STORAGE_CAP);
  });
  it("adds storage capacity for the matching resource only", () => {
    const b = base({
      ownedHexes: ["0,0", "1,0"],
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "goldStorage", level: 1 },
      },
    });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP + 2000);
    expect(storageCap(b, "elixir")).toBe(BASE_STORAGE_CAP);
  });
  it("ignores storages still under construction (level 0)", () => {
    const b = base({
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "goldStorage", level: 0 },
      },
    });
    expect(storageCap(b, "gold")).toBe(BASE_STORAGE_CAP);
  });
});

describe("ccLevel + freeBuilders", () => {
  it("reads CC level from the center building", () => {
    expect(ccLevel(base())).toBe(1);
    expect(ccLevel(base({ buildings: { "0,0": { id: "commandCenter", level: 3 } } }))).toBe(3);
  });
  it("free builders = builders minus active jobs", () => {
    expect(freeBuilders(base())).toBe(2);
    expect(
      freeBuilders(
        base({ jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 30 }] }),
      ),
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
  it("defaults walls on a restored base that predates them", () => {
    const restored = { seed: 1, radius: 9, tick: 5, hexes: {}, players: {}, claimedHexes: {}, bases: { p1: { owner: "p1", centerKey: "0,0", ownedHexes: ["0,0"], buildings: {}, gold: 0, elixir: 0, builders: 2, jobs: [] } } } as never;
    expect(normalizeWorld(restored).bases.p1.walls).toEqual({});
  });
});

describe("edgeKey", () => {
  it("is canonical regardless of hex order", () => {
    expect(edgeKey("1,0", "0,0")).toBe(edgeKey("0,0", "1,0"));
    expect(edgeKey("0,0", "1,0")).toBe("0,0|1,0");
  });
});
