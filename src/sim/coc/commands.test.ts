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
