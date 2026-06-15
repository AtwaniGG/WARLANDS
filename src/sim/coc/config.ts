import type { CocBuildingId, CocResource } from "./types";

export const STARTING_WAR = 200_000;
export const STARTING_GOLD = 500;
export const STARTING_ELIXIR = 500;
export const STARTING_BUILDERS = 2;
export const BASE_STORAGE_CAP = 1000;

export interface BuildingLevel {
  cost: Partial<Record<CocResource, number>>;
  buildTimeSec: number;
  producePerTick?: number; // collectors
  bufferCap?: number; // collectors
  storageCap?: number; // storages
}

export interface BuildingDef {
  id: CocBuildingId;
  name: string;
  category: "hq" | "collector" | "storage";
  produces?: CocResource;
  stores?: CocResource;
  levels: BuildingLevel[]; // index 0 => level 1
}

export const BUILDINGS: Record<CocBuildingId, BuildingDef> = {
  commandCenter: {
    id: "commandCenter",
    name: "Command Center",
    category: "hq",
    levels: [
      { cost: {}, buildTimeSec: 0 },
      { cost: { gold: 1000 }, buildTimeSec: 60 },
      { cost: { gold: 4000 }, buildTimeSec: 300 },
      { cost: { gold: 12000 }, buildTimeSec: 1800 },
      { cost: { gold: 40000 }, buildTimeSec: 7200 },
    ],
  },
  goldCollector: {
    id: "goldCollector",
    name: "Gold Collector",
    category: "collector",
    produces: "gold",
    levels: [
      { cost: { elixir: 150 }, buildTimeSec: 30, producePerTick: 2, bufferCap: 500 },
      { cost: { elixir: 600 }, buildTimeSec: 120, producePerTick: 4, bufferCap: 1000 },
      { cost: { elixir: 2000 }, buildTimeSec: 600, producePerTick: 8, bufferCap: 2000 },
    ],
  },
  elixirCollector: {
    id: "elixirCollector",
    name: "Elixir Collector",
    category: "collector",
    produces: "elixir",
    levels: [
      { cost: { gold: 150 }, buildTimeSec: 30, producePerTick: 2, bufferCap: 500 },
      { cost: { gold: 600 }, buildTimeSec: 120, producePerTick: 4, bufferCap: 1000 },
      { cost: { gold: 2000 }, buildTimeSec: 600, producePerTick: 8, bufferCap: 2000 },
    ],
  },
  goldStorage: {
    id: "goldStorage",
    name: "Gold Storage",
    category: "storage",
    stores: "gold",
    levels: [
      { cost: { elixir: 300 }, buildTimeSec: 60, storageCap: 2000 },
      { cost: { elixir: 1200 }, buildTimeSec: 300, storageCap: 5000 },
      { cost: { elixir: 4000 }, buildTimeSec: 1200, storageCap: 12000 },
    ],
  },
  elixirStorage: {
    id: "elixirStorage",
    name: "Elixir Storage",
    category: "storage",
    stores: "elixir",
    levels: [
      { cost: { gold: 300 }, buildTimeSec: 60, storageCap: 2000 },
      { cost: { gold: 1200 }, buildTimeSec: 300, storageCap: 5000 },
      { cost: { gold: 4000 }, buildTimeSec: 1200, storageCap: 12000 },
    ],
  },
};

export interface CcCap {
  maxCount: number;
  maxLevel: number;
}
export interface CcTier {
  maxHexes: number;
  caps: Partial<Record<CocBuildingId, CcCap>>;
}

/** index 0 => Command Center level 1. */
export const CC_PROGRESSION: CcTier[] = [
  {
    maxHexes: 7,
    caps: {
      goldCollector: { maxCount: 1, maxLevel: 1 },
      elixirCollector: { maxCount: 1, maxLevel: 1 },
      goldStorage: { maxCount: 1, maxLevel: 1 },
      elixirStorage: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxHexes: 9,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 2 },
      elixirCollector: { maxCount: 2, maxLevel: 2 },
      goldStorage: { maxCount: 1, maxLevel: 2 },
      elixirStorage: { maxCount: 1, maxLevel: 2 },
    },
  },
  {
    maxHexes: 11,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 3 },
      elixirCollector: { maxCount: 2, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
    },
  },
  {
    maxHexes: 13,
    caps: {
      goldCollector: { maxCount: 3, maxLevel: 3 },
      elixirCollector: { maxCount: 3, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
    },
  },
  {
    maxHexes: 19,
    caps: {
      goldCollector: { maxCount: 4, maxLevel: 3 },
      elixirCollector: { maxCount: 4, maxLevel: 3 },
      goldStorage: { maxCount: 3, maxLevel: 3 },
      elixirStorage: { maxCount: 3, maxLevel: 3 },
    },
  },
];

export function levelDef(id: CocBuildingId, level: number): BuildingLevel | undefined {
  return BUILDINGS[id].levels[level - 1];
}
export function maxLevelOf(id: CocBuildingId): number {
  return BUILDINGS[id].levels.length;
}
export function ccTier(level: number): CcTier {
  const idx = Math.min(Math.max(level, 1), CC_PROGRESSION.length) - 1;
  return CC_PROGRESSION[idx];
}
