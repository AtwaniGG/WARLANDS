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
});
