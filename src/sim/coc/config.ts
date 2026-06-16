import type { CocBuildingId, CocResource, CocUnitId } from "./types";

export const STARTING_WAR = 200_000;
export const STARTING_GOLD = 500;
export const STARTING_ELIXIR = 500;
export const STARTING_BUILDERS = 2;
export const BASE_STORAGE_CAP = 1000;

/** The MY BASE village is a fixed square grid; tiles are keyed "x,y" with 0 ≤ x,y < GRID. */
export const GRID_W = 20;
export const GRID_H = 20;

export type DefenseTarget = "ground" | "air" | "any";

export interface BuildingLevel {
  cost: Partial<Record<CocResource, number>>;
  buildTimeSec: number;
  producePerTick?: number; // collectors
  bufferCap?: number; // collectors
  storageCap?: number; // storages
  // ---- defense combat stats ----
  hp?: number;
  dps?: number;
  range?: number;
  targets?: DefenseTarget;
  splash?: boolean;
  // ---- army camp ----
  housing?: number;
}

export interface BuildingDef {
  id: CocBuildingId;
  name: string;
  category: "hq" | "collector" | "storage" | "defense" | "army" | "builder" | "clan";
  produces?: CocResource;
  stores?: CocResource;
  /** Tile footprint on the village grid (w×h), anchored at the top-left tile. */
  footprint: { w: number; h: number };
  levels: BuildingLevel[]; // index 0 => level 1
}

export const BUILDINGS: Record<CocBuildingId, BuildingDef> = {
  commandCenter: {
    id: "commandCenter",
    name: "Town Hall",
    category: "hq",
    footprint: { w: 4, h: 4 },
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
    name: "Gold Mine",
    category: "collector",
    produces: "gold",
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
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
    footprint: { w: 3, h: 3 },
    levels: [
      { cost: { gold: 700 }, buildTimeSec: 300, hp: 540, dps: 22, range: 4, targets: "air" },
      { cost: { gold: 2000 }, buildTimeSec: 900, hp: 760, dps: 32, range: 4, targets: "air" },
      { cost: { gold: 6000 }, buildTimeSec: 3600, hp: 1040, dps: 44, range: 4, targets: "air" },
    ],
  },
  barracks: {
    id: "barracks",
    name: "Barracks",
    category: "army",
    footprint: { w: 3, h: 3 },
    levels: [
      { cost: { elixir: 250 }, buildTimeSec: 60, hp: 300 },
      { cost: { elixir: 1000 }, buildTimeSec: 300, hp: 450 },
      { cost: { elixir: 3000 }, buildTimeSec: 1200, hp: 650 },
    ],
  },
  armyCamp: {
    id: "armyCamp",
    name: "Army Camp",
    category: "army",
    footprint: { w: 4, h: 4 },
    levels: [
      { cost: { elixir: 200 }, buildTimeSec: 60, hp: 250, housing: 20 },
      { cost: { elixir: 800 }, buildTimeSec: 300, hp: 350, housing: 40 },
      { cost: { elixir: 2500 }, buildTimeSec: 1200, hp: 500, housing: 70 },
    ],
  },
  builderHut: {
    id: "builderHut",
    name: "Builder's Hut",
    category: "builder",
    footprint: { w: 2, h: 2 },
    // Placed instantly for $WAR (see commands); the building IS a builder.
    levels: [{ cost: {}, buildTimeSec: 0, hp: 250 }],
  },
  clanCastle: {
    id: "clanCastle",
    name: "Clan Castle",
    category: "clan",
    footprint: { w: 3, h: 3 },
    // Inert in GV0 (reinforcements deferred); placeable + lootable HP only.
    levels: [{ cost: { elixir: 1000 }, buildTimeSec: 300, hp: 500 }],
  },
};

/** Combat troops (cost elixir; housed in army camps). */
export interface UnitDef {
  id: CocUnitId;
  name: string;
  role: string;
  hp: number;
  dps: number;
  housing: number;
  trainTimeSec: number;
  cost: { elixir: number };
  /** flying troops ignore walls and are only hit by air defense */
  flying?: boolean;
  /** wall-breakers prioritise walls and deal a multiplier against them */
  favoriteTarget?: "wall";
  wallMultiplier?: number;
}

export const UNITS: Record<CocUnitId, UnitDef> = {
  grunt: { id: "grunt", name: "Grunt", role: "Melee swarm", hp: 80, dps: 10, housing: 1, trainTimeSec: 10, cost: { elixir: 40 } },
  marksman: { id: "marksman", name: "Marksman", role: "Ranged", hp: 40, dps: 14, housing: 1, trainTimeSec: 12, cost: { elixir: 60 } },
  breacher: { id: "breacher", name: "Breacher", role: "Wall-breaker", hp: 30, dps: 8, housing: 2, trainTimeSec: 20, cost: { elixir: 120 }, favoriteTarget: "wall", wallMultiplier: 40 },
  juggernaut: { id: "juggernaut", name: "Juggernaut", role: "Tank", hp: 600, dps: 18, housing: 5, trainTimeSec: 60, cost: { elixir: 300 } },
  gunship: { id: "gunship", name: "Gunship", role: "Air", hp: 120, dps: 22, housing: 4, trainTimeSec: 45, cost: { elixir: 250 }, flying: true },
};

export const UNIT_IDS: CocUnitId[] = ["grunt", "marksman", "breacher", "juggernaut", "gunship"];

/** Fraction of the defender's available resources that can be looted at 100% destruction. */
export const LOOT_PCT = 0.2;
/** Seconds of shield granted per 1% destruction taken (capped). */
export const SHIELD_SECS_PER_PCT = 6;
export const SHIELD_MAX_SECS = 8 * 3600;

// ---- $WAR premium economy (in-game balance; on-chain bridge is later infra) ----
export const MAX_BUILDERS = 5;
export const WAR_FINISH_PER_SEC = 1; // $WAR to instant-finish, per remaining second
export const WAR_MIN_FINISH = 10;
export const WAR_BUILDER_BASE = 2000; // 3rd builder costs 2000, 4th 4000, 5th 6000
export const WAR_SHIELD_PER_HOUR = 500;
export const WAR_RAID_REWARD_PER_STAR = 50;

/** $WAR to instant-finish a job with `remainingSecs` left. */
export function finishCost(remainingSecs: number): number {
  return Math.max(WAR_MIN_FINISH, Math.ceil(remainingSecs * WAR_FINISH_PER_SEC));
}
/** $WAR to buy the next builder (place a Builder's Hut), given the current builder count. */
export function builderCost(currentBuilders: number): number {
  return WAR_BUILDER_BASE * (currentBuilders - 1);
}

/** Walls are 1×1 tiles: instant, gold-only, no builder. */
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
  /** Max number of wall tiles allowed at this Command Center level. */
  maxWalls: number;
  caps: Partial<Record<CocBuildingId, CcCap>>;
}

/** index 0 => Command Center level 1. */
export const CC_PROGRESSION: CcTier[] = [
  {
    maxWalls: 12,
    caps: {
      goldCollector: { maxCount: 1, maxLevel: 1 },
      elixirCollector: { maxCount: 1, maxLevel: 1 },
      goldStorage: { maxCount: 1, maxLevel: 1 },
      elixirStorage: { maxCount: 1, maxLevel: 1 },
      cannon: { maxCount: 1, maxLevel: 1 },
      barracks: { maxCount: 1, maxLevel: 1 },
      armyCamp: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxWalls: 25,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 2 },
      elixirCollector: { maxCount: 2, maxLevel: 2 },
      goldStorage: { maxCount: 1, maxLevel: 2 },
      elixirStorage: { maxCount: 1, maxLevel: 2 },
      cannon: { maxCount: 1, maxLevel: 2 },
      mortar: { maxCount: 1, maxLevel: 1 },
      barracks: { maxCount: 1, maxLevel: 2 },
      armyCamp: { maxCount: 2, maxLevel: 2 },
    },
  },
  {
    maxWalls: 50,
    caps: {
      goldCollector: { maxCount: 2, maxLevel: 3 },
      elixirCollector: { maxCount: 2, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
      cannon: { maxCount: 2, maxLevel: 3 },
      mortar: { maxCount: 1, maxLevel: 2 },
      airDefense: { maxCount: 1, maxLevel: 1 },
      barracks: { maxCount: 1, maxLevel: 3 },
      armyCamp: { maxCount: 2, maxLevel: 3 },
      clanCastle: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxWalls: 75,
    caps: {
      goldCollector: { maxCount: 3, maxLevel: 3 },
      elixirCollector: { maxCount: 3, maxLevel: 3 },
      goldStorage: { maxCount: 2, maxLevel: 3 },
      elixirStorage: { maxCount: 2, maxLevel: 3 },
      cannon: { maxCount: 2, maxLevel: 3 },
      mortar: { maxCount: 2, maxLevel: 3 },
      airDefense: { maxCount: 1, maxLevel: 2 },
      barracks: { maxCount: 1, maxLevel: 3 },
      armyCamp: { maxCount: 3, maxLevel: 3 },
      clanCastle: { maxCount: 1, maxLevel: 1 },
    },
  },
  {
    maxWalls: 100,
    caps: {
      goldCollector: { maxCount: 4, maxLevel: 3 },
      elixirCollector: { maxCount: 4, maxLevel: 3 },
      goldStorage: { maxCount: 3, maxLevel: 3 },
      elixirStorage: { maxCount: 3, maxLevel: 3 },
      cannon: { maxCount: 3, maxLevel: 3 },
      mortar: { maxCount: 2, maxLevel: 3 },
      airDefense: { maxCount: 2, maxLevel: 3 },
      barracks: { maxCount: 1, maxLevel: 3 },
      armyCamp: { maxCount: 4, maxLevel: 3 },
      clanCastle: { maxCount: 1, maxLevel: 1 },
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
