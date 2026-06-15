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
});
