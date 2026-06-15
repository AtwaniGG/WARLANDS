import type { CocBuildingId, CocResource } from "./types";

export const STARTING_WAR = 200_000;
export const STARTING_GOLD = 500;
export const STARTING_ELIXIR = 500;
export const STARTING_BUILDERS = 2;
export const BASE_STORAGE_CAP = 1000;

export type DefenseTarget = "ground" | "air" | "any";

export interface BuildingLevel {
  cost: Partial<Record<CocResource, number>>;
  buildTimeSec: number;
  producePerTick?: number; // collectors
  bufferCap?: number; // collectors
  storageCap?: number; // storages
  // ---- defense combat stats (inert until SP2) ----
  hp?: number;
  dps?: number;
  range?: number;
  targets?: DefenseTarget;
  splash?: boolean;
}

export interface BuildingDef {
  id: CocBuildingId;
  name: string;
  category: "hq" | "collector" | "storage" | "defense";
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
  cannon: {
    id: "cannon",
    name: "Cannon",
    category: "defense",
    levels: [
      { cost: { gold: 200 }, buildTimeSec: 60, hp: 420, dps: 12, range: 3, targets: "ground" },
      { cost: { gold: 800 }, buildTimeSec: 300, hp: 600, dps: 18, range: 3, targets: "ground" },
      { cost: { gold: 2500 }, buildTimeSec: 1200, hp: 880, dps: 26, range: 3, targets: "ground" },
    ],
  },
  mortar: {
    id: "mortar",
    name: "Mortar",
    category: "defense",
    levels: [
      { cost: { gold: 500 }, buildTimeSec: 300, hp: 360, dps: 8, range: 4, targets: "ground", splash: true },
      { cost: { gold: 1500 }, buildTimeSec: 900, hp: 520, dps: 12, range: 4, targets: "ground", splash: true },
      { cost: { gold: 4500 }, buildTimeSec: 3600, hp: 760, dps: 18, range: 4, targets: "ground", splash: true },
    ],
  },
  airDefense: {
    id: "airDefense",
    name: "Air Defense",
    category: "defense",
    levels: [
      { cost: { gold: 700 }, buildTimeSec: 300, hp: 540, dps: 22, range: 4, targets: "air" },
      { cost: { gold: 2000 }, buildTimeSec: 900, hp: 760, dps: 32, range: 4, targets: "air" },
      { cost: { gold: 6000 }, buildTimeSec: 3600, hp: 1040, dps: 44, range: 4, targets: "air" },
    ],
  },
};

/** Walls live on hex edges, not hexes: instant, gold-only, no builder. */
export interface WallLevel {
  cost: Partial<Record<CocResource, number>>;
  hp: number;
}
export const WALL: { name: string; levels: WallLevel[] } = {
  name: "Wall",
  levels: [
    { cost: { gold: 100 }, hp: 300 },
    { cost: { gold: 400 }, hp: 800 },
    { cost: { gold: 1500 }, hp: 2000 },
  ],
};
/** Wall level is gated by the Command Center level (capped at the wall table length). */
export function maxWallLevel(ccLevel: number): number {
  return Math.min(Math.max(ccLevel, 1), WALL.levels.length);
}

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
      cannon: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxHexes: 9,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 2 },
      elixirCollector: { maxCount: 2, maxLevel: 2 },
      goldStorage: { maxCount: 1, maxLevel: 2 },
      elixirStorage: { maxCount: 1, maxLevel: 2 },
      cannon: { maxCount: 1, maxLevel: 2 },
      mortar: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxHexes: 11,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 3 },
      elixirCollector: { maxCount: 2, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
      cannon: { maxCount: 2, maxLevel: 3 },
      mortar: { maxCount: 1, maxLevel: 2 },
      airDefense: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxHexes: 13,
    caps: {
      goldCollector: { maxCount: 3, maxLevel: 3 },
      elixirCollector: { maxCount: 3, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
      cannon: { maxCount: 2, maxLevel: 3 },
      mortar: { maxCount: 2, maxLevel: 3 },
      airDefense: { maxCount: 1, maxLevel: 2 },
    },
  },
  {
    maxHexes: 19,
    caps: {
      goldCollector: { maxCount: 4, maxLevel: 3 },
      elixirCollector: { maxCount: 4, maxLevel: 3 },
      goldStorage: { maxCount: 3, maxLevel: 3 },
      elixirStorage: { maxCount: 3, maxLevel: 3 },
      cannon: { maxCount: 3, maxLevel: 3 },
      mortar: { maxCount: 2, maxLevel: 3 },
      airDefense: { maxCount: 2, maxLevel: 3 },
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
