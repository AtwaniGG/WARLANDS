import { describe, it, expect } from "vitest";
import { BUILDINGS, levelDef, maxLevelOf, ccTier } from "./config";

describe("coc config", () => {
  it("command center has 5 levels", () => {
    expect(maxLevelOf("commandCenter")).toBe(5);
  });
  it("collector output scales with level", () => {
    expect(levelDef("goldCollector", 1)?.producePerTick).toBe(2);
    expect(levelDef("goldCollector", 2)?.producePerTick).toBe(4);
  });
  it("CC1 allows exactly one gold collector at level 1", () => {
    expect(ccTier(1).caps.goldCollector).toEqual({ maxCount: 1, maxLevel: 1 });
  });
  it("CC level clamps above the table length", () => {
    expect(ccTier(99)).toBe(ccTier(5));
  });
  it("every building level has a non-negative build time and a cost object", () => {
    for (const def of Object.values(BUILDINGS)) {
      for (const lv of def.levels) {
        expect(lv.buildTimeSec).toBeGreaterThanOrEqual(0);
        expect(typeof lv.cost).toBe("object");
      }
    }
  });
});
