import { describe, it, expect } from "vitest";
import { createWorld, addPlayer, storageCap } from "./world";

describe("createWorld", () => {
  it("creates a radius-9 world with the expected hex count and tick 0", () => {
    const w = createWorld(123);
    expect(w.radius).toBe(9);
    expect(w.tick).toBe(0);
    // axial hexes within distance 9 => 1 + 3*9*(9+1) = 271
    expect(Object.keys(w.hexes).length).toBe(271);
    expect(Object.keys(w.plots).length).toBe(0);
  });
  it("is deterministic for the same seed", () => {
    expect(createWorld(7)).toEqual(createWorld(7));
  });
});

describe("addPlayer", () => {
  it("adds a player with the starting balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    expect(w.players.p1.war).toBe(200_000);
    expect(w.players.p1.joinedTick).toBe(0);
  });
  it("is idempotent (re-adding keeps existing balance)", () => {
    let w = addPlayer(createWorld(1), "p1");
    w = { ...w, players: { ...w.players, p1: { ...w.players.p1, war: 5 } } };
    w = addPlayer(w, "p1");
    expect(w.players.p1.war).toBe(5);
  });
});

describe("storageCap", () => {
  it("is the base cap with no warehouse", () => {
    expect(
      storageCap({
        q: 0,
        r: 0,
        terrain: "plains",
        owner: "p1",
        claimIndex: 1,
        stakeLocked: 0,
        buildings: [{ id: "camp", level: 1 }],
        resources: {},
        army: {},
        trainQueue: [],
        defensePct: 1,
      }),
    ).toBe(1500);
  });
  it("adds 2000 per warehouse level", () => {
    expect(
      storageCap({
        q: 0,
        r: 0,
        terrain: "plains",
        owner: "p1",
        claimIndex: 1,
        stakeLocked: 0,
        buildings: [
          { id: "camp", level: 1 },
          { id: "warehouse", level: 2 },
        ],
        resources: {},
        army: {},
        trainQueue: [],
        defensePct: 1,
      }),
    ).toBe(1500 + 2000 * 2);
  });
});
