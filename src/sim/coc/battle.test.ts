import { describe, it, expect } from "vitest";
import { resolveRaid } from "./battle";
import { LOOT_PCT } from "./config";
import type { CocBase } from "./types";

const D = (over: Partial<CocBase> = {}): CocBase => ({
  owner: "d",
  centerKey: "0,0",
  ownedHexes: ["0,0"],
  buildings: { "0,0": { id: "commandCenter", level: 1 } },
  walls: {},
  gold: 1000,
  elixir: 1000,
  builders: 2,
  jobs: [],
  army: {},
  trainQueue: [],
  shieldUntil: 0,
  trophies: 0,
  ...over,
});

describe("resolveRaid", () => {
  it("an overwhelming army 3-stars an undefended base and loots", () => {
    const defender = D({
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "goldCollector", level: 1 },
        "0,1": { id: "goldStorage", level: 1 },
      },
    });
    const r = resolveRaid({ grunt: 80 }, defender, 12345);
    expect(r.stars).toBe(3);
    expect(r.destructionPct).toBe(1);
    expect(r.ccDestroyed).toBe(true);
    expect(r.loot.gold).toBe(Math.floor(1000 * LOOT_PCT)); // pct 1
  });

  it("a lone grunt cannot crack a defended base (0 stars)", () => {
    const defender = D({
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "cannon", level: 3 },
        "0,1": { id: "goldStorage", level: 3 },
        "1,-1": { id: "elixirStorage", level: 3 },
      },
    });
    const r = resolveRaid({ grunt: 1 }, defender, 99);
    expect(r.stars).toBe(0);
    expect(r.destructionPct).toBeLessThan(0.5);
  });

  it("is deterministic for the same inputs + seed", () => {
    const defender = D({ buildings: { "0,0": { id: "commandCenter", level: 2 }, "1,0": { id: "cannon", level: 2 } } });
    expect(resolveRaid({ grunt: 10, marksman: 5 }, defender, 7)).toEqual(resolveRaid({ grunt: 10, marksman: 5 }, defender, 7));
  });

  it("flying troops beat a heavily walled, ground-only base better than ground troops do", () => {
    const defender = D({
      buildings: {
        "0,0": { id: "commandCenter", level: 1 },
        "1,0": { id: "cannon", level: 3 }, // ground-only
        "0,1": { id: "goldStorage", level: 2 },
        "1,-1": { id: "goldCollector", level: 2 },
      },
      walls: { "0,0|1,0": 3, "0,0|0,1": 3, "0,0|1,-1": 3 }, // big walls
    });
    const ground = resolveRaid({ grunt: 12 }, defender, 555); // housing 12
    const air = resolveRaid({ gunship: 3 }, defender, 555); // housing 12, ignores walls + cannon can't hit
    expect(air.destructionPct).toBeGreaterThan(ground.destructionPct);
  });

  it("returns no loot and zero stars when there is no army", () => {
    const r = resolveRaid({}, D(), 1);
    expect(r.stars).toBe(0);
    expect(r.loot).toEqual({ gold: 0, elixir: 0 });
  });
});
