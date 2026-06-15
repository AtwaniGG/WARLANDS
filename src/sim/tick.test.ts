import { describe, it, expect } from "vitest";
import { applyTick } from "./tick";
import { createWorld, addPlayer } from "./world";
import type { SimPlot, WorldState } from "./types";

function worldWithFarm(): WorldState {
  let w = addPlayer(createWorld(1), "p1");
  const plot: SimPlot = {
    q: 0,
    r: 0,
    terrain: "plains",
    owner: "p1",
    claimIndex: 1,
    stakeLocked: 10000,
    buildings: [
      { id: "camp", level: 1 },
      { id: "farm", level: 1 },
    ],
    resources: { food: 100, water: 100 },
    army: {},
    trainQueue: [],
    defensePct: 1,
  };
  w = { ...w, plots: { "0,0": plot } };
  return w;
}

describe("applyTick", () => {
  it("advances the tick counter", () => {
    expect(applyTick(createWorld(1)).tick).toBe(1);
  });
  it("produces food from a farm on plains (net of upkeep)", () => {
    const after = applyTick(worldWithFarm());
    // farm baseOutput 6, terrainMult 1, level 1, workforce 1, DR(1)=1 => +6; upkeep small
    expect(after.plots["0,0"].resources.food).toBeGreaterThan(100);
  });
  it("is deterministic", () => {
    const w = worldWithFarm();
    expect(applyTick(w)).toEqual(applyTick(w));
  });
  it("does not exceed storage cap", () => {
    let w = worldWithFarm();
    w = { ...w, plots: { "0,0": { ...w.plots["0,0"], resources: { food: 1500, water: 1500 } } } };
    expect(applyTick(w).plots["0,0"].resources.food!).toBeLessThanOrEqual(1500);
  });

  it("runs a factory: consumes recipe inputs and outputs the product", () => {
    let w = addPlayer(createWorld(1), "p1");
    // refinery makes fuel (recipe: oil 2, water 1). Give plenty of inputs.
    const plot: SimPlot = {
      q: 0, r: 0, terrain: "industrial", owner: "p1", claimIndex: 1, stakeLocked: 40000,
      buildings: [
        { id: "camp", level: 1 },
        { id: "refinery", level: 1, activeProduct: "fuel" },
      ],
      resources: { oil: 100, water: 100, food: 100 },
      army: {},
      trainQueue: [],
      defensePct: 1,
    };
    w = { ...w, plots: { "0,0": plot } };
    const after = applyTick(w).plots["0,0"].resources;
    expect(after.fuel ?? 0).toBeGreaterThan(0);
    expect(after.oil!).toBeLessThan(100); // oil consumed
  });

  it("resolves a finished training order into the army", () => {
    let w = addPlayer(createWorld(1), "p1");
    const plot: SimPlot = {
      q: 0, r: 0, terrain: "plains", owner: "p1", claimIndex: 1, stakeLocked: 10000,
      buildings: [{ id: "camp", level: 1 }],
      resources: { food: 100, water: 100 },
      army: {},
      trainQueue: [{ unit: "infantry", ticksLeft: 1 }],
      defensePct: 1,
    };
    w = { ...w, plots: { "0,0": plot } };
    const after = applyTick(w).plots["0,0"];
    expect(after.army.infantry).toBe(1);
    expect(after.trainQueue.length).toBe(0);
  });

  it("a factory makes nothing when inputs are missing", () => {
    let w = addPlayer(createWorld(1), "p1");
    const plot: SimPlot = {
      q: 0, r: 0, terrain: "industrial", owner: "p1", claimIndex: 1, stakeLocked: 40000,
      buildings: [
        { id: "camp", level: 1 },
        { id: "refinery", level: 1, activeProduct: "fuel" },
      ],
      resources: { water: 100, food: 100 }, // no oil
      army: {},
      trainQueue: [],
      defensePct: 1,
    };
    w = { ...w, plots: { "0,0": plot } };
    expect(applyTick(w).plots["0,0"].resources.fuel ?? 0).toBe(0);
  });
});
