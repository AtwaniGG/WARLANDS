import { describe, it, expect } from "vitest";
import { BUILDINGS, GRID_W, GRID_H, levelDef, maxLevelOf, ccTier, WALL, maxWallLevel } from "./config";

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

  it("the grid is 20×20", () => {
    expect(GRID_W).toBe(20);
    expect(GRID_H).toBe(20);
  });

  it("every building has a footprint that fits inside the grid", () => {
    for (const def of Object.values(BUILDINGS)) {
      expect(def.footprint.w).toBeGreaterThan(0);
      expect(def.footprint.h).toBeGreaterThan(0);
      expect(def.footprint.w).toBeLessThanOrEqual(GRID_W);
      expect(def.footprint.h).toBeLessThanOrEqual(GRID_H);
    }
  });

  it("matches the approved footprints for the hero set", () => {
    expect(BUILDINGS.commandCenter.footprint).toEqual({ w: 4, h: 4 });
    expect(BUILDINGS.armyCamp.footprint).toEqual({ w: 4, h: 4 });
    expect(BUILDINGS.cannon.footprint).toEqual({ w: 3, h: 3 });
    expect(BUILDINGS.builderHut.footprint).toEqual({ w: 2, h: 2 });
    expect(BUILDINGS.clanCastle.footprint).toEqual({ w: 3, h: 3 });
  });

  it("defines the builder hut and clan castle", () => {
    expect(BUILDINGS.builderHut.category).toBe("builder");
    expect(BUILDINGS.clanCastle.category).toBe("clan");
  });

  it("defines the three defensive towers with combat stats", () => {
    expect(BUILDINGS.cannon.category).toBe("defense");
    expect(maxLevelOf("cannon")).toBe(3);
    expect(levelDef("cannon", 1)?.targets).toBe("ground");
    expect(levelDef("cannon", 1)?.dps).toBeGreaterThan(0);
    expect(levelDef("mortar", 1)?.splash).toBe(true);
    expect(levelDef("airDefense", 1)?.targets).toBe("air");
    expect(levelDef("cannon", 1)?.cost.gold).toBeGreaterThan(0);
  });

  it("gates defenses and the clan castle by Command Center level", () => {
    expect(ccTier(1).caps.cannon).toEqual({ maxCount: 1, maxLevel: 1 });
    expect(ccTier(1).caps.airDefense).toBeUndefined();
    expect(ccTier(3).caps.airDefense).toBeDefined();
    expect(ccTier(1).caps.clanCastle).toBeUndefined();
    expect(ccTier(3).caps.clanCastle).toBeDefined();
  });

  it("caps wall count per Command Center tier (rising)", () => {
    expect(ccTier(1).maxWalls).toBeGreaterThan(0);
    expect(ccTier(5).maxWalls).toBeGreaterThan(ccTier(1).maxWalls);
  });

  it("defines walls (3 levels, gold cost + hp) gated by CC level", () => {
    expect(WALL.levels.length).toBe(3);
    expect(WALL.levels[0].cost.gold).toBeGreaterThan(0);
    expect(WALL.levels[0].hp).toBeGreaterThan(0);
    expect(maxWallLevel(1)).toBe(1);
    expect(maxWallLevel(5)).toBe(3); // capped at table length
  });
});
