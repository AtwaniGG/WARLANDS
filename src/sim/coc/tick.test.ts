import { describe, it, expect } from "vitest";
import { applyTick } from "./tick";
import { createWorld } from "./world";
import { makeBotBase } from "./bots";
import type { CocBase, CocWorld } from "./types";

const baseWith = (over: Partial<CocBase>): CocBase => ({
  owner: "p1",
  location: "0,0",
  buildings: { "8,8": { id: "commandCenter", level: 1 } },
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

function worldWith(b: CocBase): CocWorld {
  const w = createWorld(1);
  return {
    ...w,
    players: { p1: { id: "p1", war: 0, joinedTick: 0 } },
    bases: { p1: b },
    claimedHexes: { [b.location]: "p1" },
  };
}

describe("applyTick", () => {
  it("increments the tick", () => {
    expect(applyTick(createWorld(1)).tick).toBe(1);
  });
  it("fills an operational collector's buffer by producePerTick", () => {
    const w = worldWith(baseWith({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldCollector", level: 1, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["0,0"].buffer).toBe(2);
  });
  it("caps the buffer at bufferCap", () => {
    const w = worldWith(baseWith({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldCollector", level: 1, buffer: 499 } } }));
    expect(applyTick(w).bases.p1.buildings["0,0"].buffer).toBe(500);
  });
  it("does not fill a collector under construction (level 0)", () => {
    const w = worldWith(baseWith({ buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldCollector", level: 0, buffer: 0 } } }));
    expect(applyTick(w).bases.p1.buildings["0,0"].buffer ?? 0).toBe(0);
  });
  it("completes a build job at finishesAtTick and frees the builder", () => {
    const w = worldWith(baseWith({
      buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldCollector", level: 0 } },
      jobs: [{ tileKey: "0,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 1 }],
    }));
    const after = applyTick(w);
    expect(after.bases.p1.buildings["0,0"].level).toBe(1);
    expect(after.bases.p1.jobs.length).toBe(0);
  });
  it("leaves a job that has not yet finished", () => {
    const w = worldWith(baseWith({
      buildings: { "8,8": { id: "commandCenter", level: 1 }, "0,0": { id: "goldCollector", level: 0 } },
      jobs: [{ tileKey: "0,0", buildingId: "goldCollector", kind: "build", toLevel: 1, finishesAtTick: 5 }],
    }));
    expect(applyTick(w).bases.p1.jobs.length).toBe(1);
  });

  it("AI raid waves loot an out-of-shield live player and queue a defense report (real stakes)", () => {
    let w = createWorld(5);
    w = {
      ...w,
      players: { bot0: { id: "bot0", war: 0, joinedTick: 0, isBot: true }, p1: { id: "p1", war: 0, joinedTick: 0 } },
      bases: {
        bot0: makeBotBase("bot0", "1,0", 2, () => 0.5),
        p1: baseWith({ location: "0,0", gold: 5000, elixir: 5000, buildings: { "8,8": { id: "commandCenter", level: 1 } } }),
      },
      claimedHexes: { "1,0": "bot0", "0,0": "p1" },
      tick: 0,
    };
    for (let i = 0; i < 1200; i++) w = applyTick(w); // spans several raid waves
    expect(w.bases.p1.gold).toBeLessThan(5000); // looted at least once
    expect((w.pendingReports?.p1 ?? []).length).toBeGreaterThan(0);
    expect(w.bases.p1.shieldUntil).toBeGreaterThan(0); // shielded after being raided
    expect(w.bases.bot0.gold).toBe(makeBotBase("bot0", "1,0", 2, () => 0.5).gold); // bots are static targets
  });

  it("no AI raids fire in a bot-free world (deterministic sim untouched)", () => {
    let w = worldWith(baseWith({ gold: 5000 }));
    for (let i = 0; i < 600; i++) w = applyTick(w);
    expect(w.bases.p1.gold).toBe(5000);
    expect(w.pendingReports?.p1 ?? []).toEqual([]);
  });
});
