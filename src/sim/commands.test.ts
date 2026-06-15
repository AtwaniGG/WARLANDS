import { describe, it, expect } from "vitest";
import { applyCommand } from "./commands";
import { createWorld, addPlayer } from "./world";
import { PLOT_TYPES } from "@/game/plotTypes";
import type { WorldState } from "./types";

// find a plains hex for predictable stake cost
function plainsKey(w: WorldState): string {
  return Object.keys(w.hexes).find((k) => w.hexes[k].terrain === "plains")!;
}

describe("stake", () => {
  it("claims a plot and locks stake from the player's balance", () => {
    const w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { state, error } = applyCommand(w, "p1", { type: "stake", q, r });
    expect(error).toBeUndefined();
    expect(state.plots[key].owner).toBe("p1");
    expect(state.players.p1.war).toBe(200_000 - PLOT_TYPES.plains.stake);
    expect(state.plots[key].claimIndex).toBe(1);
  });
  it("rejects an already-owned hex", () => {
    const w = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const once = applyCommand(w, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(once, "p2", { type: "stake", q, r });
    expect(error).toMatch(/already/i);
  });
  it("rejects when the player cannot afford the stake", () => {
    let w = addPlayer(createWorld(1), "poor");
    w = { ...w, players: { ...w.players, poor: { ...w.players.poor, war: 0 } } };
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    const { error } = applyCommand(w, "poor", { type: "stake", q, r });
    expect(error).toMatch(/\$WAR/);
  });
});

describe("build", () => {
  it("builds a farm on an owned plains plot, spending $WAR + resources", () => {
    const w0 = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const warBefore = w1.players.p1.war;
    const { state, error } = applyCommand(w1, "p1", { type: "build", key, buildingId: "farm" });
    expect(error).toBeUndefined();
    expect(state.plots[key].buildings.some((b) => b.id === "farm")).toBe(true);
    expect(state.players.p1.war).toBe(warBefore - 200); // farm baseCost
  });
  it("rejects building on a plot you don't own", () => {
    const w0 = addPlayer(addPlayer(createWorld(1), "p1"), "p2");
    const key = plainsKey(w0);
    const [q, r] = key.split(",").map(Number);
    const w1 = applyCommand(w0, "p1", { type: "stake", q, r }).state;
    const { error } = applyCommand(w1, "p2", { type: "build", key, buildingId: "farm" });
    expect(error).toMatch(/not your plot/i);
  });

  it("sets a factory's activeProduct to its first product on build", () => {
    let w = addPlayer(createWorld(1), "p1");
    const key = plainsKey(w);
    const [q, r] = key.split(",").map(Number);
    w = applyCommand(w, "p1", { type: "stake", q, r }).state;
    // give iron for the refinery recipe (base cost stone 60, iron 30)
    w = { ...w, plots: { ...w.plots, [key]: { ...w.plots[key], resources: { stone: 100, iron: 100 } } } };
    const { state, error } = applyCommand(w, "p1", { type: "build", key, buildingId: "refinery" });
    expect(error).toBeUndefined();
    const fac = state.plots[key].buildings.find((b) => b.id === "refinery")!;
    expect(fac.activeProduct).toBe("fuel"); // refinery.makes[0]
  });
});

// helper: a staked plains plot owned by p1
function ownedPlains(): { state: ReturnType<typeof createWorld>; key: string } {
  let w = addPlayer(createWorld(1), "p1");
  const key = plainsKey(w);
  const [q, r] = key.split(",").map(Number);
  w = applyCommand(w, "p1", { type: "stake", q, r }).state;
  return { state: w, key };
}

describe("upgrade", () => {
  it("raises a building level and charges the upgrade cost", () => {
    let { state, key } = ownedPlains();
    // build a farm at index 1 first
    state = { ...state, plots: { ...state.plots, [key]: { ...state.plots[key], resources: { wood: 100 } } } };
    state = applyCommand(state, "p1", { type: "build", key, buildingId: "farm" }).state;
    const warBefore = state.players.p1.war;
    const { state: after, error } = applyCommand(state, "p1", { type: "upgrade", key, index: 1 });
    expect(error).toBeUndefined();
    expect(after.plots[key].buildings[1].level).toBe(2);
    expect(after.players.p1.war).toBeLessThan(warBefore);
  });
  it("rejects upgrading on a plot you don't own", () => {
    let { state, key } = ownedPlains();
    state = addPlayer(state, "p2");
    const { error } = applyCommand(state, "p2", { type: "upgrade", key, index: 0 });
    expect(error).toMatch(/not your plot/i);
  });
});

describe("setProduct", () => {
  it("changes a factory's active product", () => {
    let { state, key } = ownedPlains();
    state = { ...state, plots: { ...state.plots, [key]: { ...state.plots[key], resources: { stone: 100, iron: 100 } } } };
    state = applyCommand(state, "p1", { type: "build", key, buildingId: "refinery" }).state;
    const idx = state.plots[key].buildings.findIndex((b) => b.id === "refinery");
    const { state: after, error } = applyCommand(state, "p1", { type: "setProduct", key, index: idx, product: "chemicals" });
    expect(error).toBeUndefined();
    expect(after.plots[key].buildings[idx].activeProduct).toBe("chemicals");
  });
});

describe("unstake", () => {
  it("returns stake minus 3% fee, removes the plot, accumulates burn", () => {
    const { state, key } = ownedPlains();
    const stake = state.plots[key].stakeLocked;
    const warBefore = state.players.p1.war;
    const { state: after, error } = applyCommand(state, "p1", { type: "unstake", key });
    expect(error).toBeUndefined();
    expect(after.plots[key]).toBeUndefined();
    const fee = Math.round(stake * 0.03);
    expect(after.players.p1.war).toBe(warBefore + stake - fee);
    expect(after.burned).toBe(fee);
  });
  it("rejects unstaking a plot you don't own", () => {
    let { state, key } = ownedPlains();
    state = addPlayer(state, "p2");
    const { error } = applyCommand(state, "p2", { type: "unstake", key });
    expect(error).toMatch(/not your plot/i);
  });
});
