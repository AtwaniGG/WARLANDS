import { describe, it, expect } from "vitest";
import { applyTick } from "./tick";
import { createWorld } from "./world";
import type { CocBase, CocWorld } from "./types";

const baseWith = (over: Partial<CocBase>): CocBase => ({
  owner: "p1",
  centerKey: "0,0",
  ownedHexes: ["0,0", "1,0"],
  buildings: { "0,0": { id: "commandCenter", level: 1 } },
  walls: {},
  gold: 0,
  elixir: 0,
  builders: 2,
  jobs: [],
  ...over,
});

function worldWith(b: CocBase): CocWorld {
  const w = createWorld(1);
  return {
    ...w,
    players: { p1: { id: "p1", war: 0, joinedTick: 0 } },
    bases: { p1: b },
    claimedHexes: Object.fromEntries(b.ownedHexes.map((h) => [h, "p1"])),
  };
}

describe("applyTick", () => {
  it("increments the tick", () => {
    expect(applyTick(createWorld(1)).tick).toBe(1);
  });
  it("fills an operational collector's buffer by producePerTick", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 1, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer).toBe(2);
  });
  it("caps the buffer at bufferCap", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 1, buffer: 499 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer).toBe(500);
  });
  it("does not fill a collector under construction (level 0)", () => {
    const w = worldWith(baseWith({ buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["1,0"].buffer ?? 0).toBe(0);
  });
  it("completes a build job at finishesAtTick and frees the builder", () => {
    const w = worldWith(baseWith({
      buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0 } },
      jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 1 }],
    }));
    const after = applyTick(w);
    expect(after.bases.p1.buildings["1,0"].level).toBe(1);
    expect(after.bases.p1.jobs.length).toBe(0);
  });
  it("leaves a job that has not yet finished", () => {
    const w = worldWith(baseWith({
      buildings: { "0,0": { id: "commandCenter", level: 1 }, "1,0": { id: "goldCollector", level: 0 } },
      jobs: [{ hexKey: "1,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 5 }],
    }));
    expect(applyTick(w).bases.p1.jobs.length).toBe(1);
  });
});
