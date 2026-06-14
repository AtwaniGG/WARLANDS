// Plot / terrain definitions — mirrors GDD §4 (Plot Types) and §3 (Terrain).
// Stake amounts are in $WAR and are LOCKED (never spent) to secure a plot.

import type { ResourceId } from "./resources";

export type TerrainId =
  | "plains"
  | "forest"
  | "river"
  | "mountain"
  | "desert"
  | "coastal"
  | "industrial"
  | "techRuins"
  | "warzone";

export interface PlotTypeDef {
  id: TerrainId;
  name: string;
  stake: number; // $WAR locked to claim
  color: string; // map fill
  /** Per-resource production multipliers vs the base rate (1.0 = baseline, absent = baseline). */
  yields: Partial<Record<ResourceId, number>>;
  /** Which raw resources this terrain can produce at all. */
  produces: ResourceId[];
  defenseMult: number; // multiplies defensive power (GDD §4, §8)
  buildSpeedMult: number;
  /** Season-point / reward multiplier (Warzone is highest, highest risk). */
  rewardMult: number;
  /** Can this plot ever receive beginner/shield protection? */
  protectable: boolean;
  blurb: string;
}

export const PLOT_TYPES: Record<TerrainId, PlotTypeDef> = {
  plains: {
    id: "plains",
    name: "Basic Plot",
    stake: 10_000,
    color: "#7c8a4f",
    produces: ["food", "wood", "stone"],
    yields: { food: 1.0, wood: 1.0, stone: 1.0 },
    defenseMult: 1.0,
    buildSpeedMult: 1.05,
    rewardMult: 1.0,
    protectable: true,
    blurb: "Balanced starter land. +5% build speed.",
  },
  forest: {
    id: "forest",
    name: "Forest Plot",
    stake: 12_500,
    color: "#2f5d3a",
    produces: ["wood", "food", "water"],
    yields: { wood: 1.15, food: 1.05, water: 1.0 },
    defenseMult: 1.1, // ambush bonus for defender
    buildSpeedMult: 1.0,
    rewardMult: 1.1,
    protectable: true,
    blurb: "+15% wood, early growth, defender ambush bonus.",
  },
  river: {
    id: "river",
    name: "River Plot",
    stake: 15_000,
    color: "#2c6f8c",
    produces: ["food", "water", "wood"],
    yields: { food: 1.2, water: 1.15, wood: 1.0 },
    defenseMult: 1.0,
    buildSpeedMult: 1.0,
    rewardMult: 1.15,
    protectable: true,
    blurb: "+20% food, +15% water, −10% market fees.",
  },
  mountain: {
    id: "mountain",
    name: "Mountain Plot",
    stake: 20_000,
    color: "#6b6f78",
    produces: ["iron", "stone"],
    yields: { iron: 1.25, stone: 1.2 },
    defenseMult: 1.3, // +30% defense
    buildSpeedMult: 0.95,
    rewardMult: 1.25,
    protectable: true,
    blurb: "+25% iron, +20% stone, +30% defense.",
  },
  desert: {
    id: "desert",
    name: "Oil Desert Plot",
    stake: 25_000,
    color: "#c9a14a",
    produces: ["oil", "rareMinerals"],
    yields: { oil: 1.3, rareMinerals: 1.05 },
    defenseMult: 0.9, // exposed
    buildSpeedMult: 1.0,
    rewardMult: 1.3,
    protectable: true,
    blurb: "+30% oil, exposed (weak natural defense).",
  },
  coastal: {
    id: "coastal",
    name: "Coastal Trade Plot",
    stake: 30_000,
    color: "#3f9aa6",
    produces: ["food", "water", "rareMinerals"],
    yields: { food: 1.1, water: 1.1, rareMinerals: 1.1 },
    defenseMult: 1.0,
    buildSpeedMult: 1.0,
    rewardMult: 1.4,
    protectable: true,
    blurb: "−20% transport cost, sea routes, trade hub.",
  },
  industrial: {
    id: "industrial",
    name: "Industrial Plot",
    stake: 40_000,
    color: "#8a5a3c",
    produces: ["stone", "iron"],
    yields: { stone: 1.1, iron: 1.1 },
    defenseMult: 1.0,
    buildSpeedMult: 1.0,
    rewardMult: 1.6,
    protectable: true,
    blurb: "+25% factory efficiency, +1 factory slot.",
  },
  techRuins: {
    id: "techRuins",
    name: "Technology Ruins Plot",
    stake: 50_000,
    color: "#5b4b8a",
    produces: ["dataChips", "rareMinerals"],
    yields: { dataChips: 1.3, rareMinerals: 1.15 },
    defenseMult: 1.0,
    buildSpeedMult: 1.0,
    rewardMult: 1.8,
    protectable: true,
    blurb: "+30% research, +data chips, unlocks rare blueprints.",
  },
  warzone: {
    id: "warzone",
    name: "Warzone Plot",
    stake: 60_000,
    color: "#9c2b2b",
    produces: ["oil", "iron", "rareMinerals", "dataChips"],
    yields: { oil: 1.4, iron: 1.4, rareMinerals: 1.4, dataChips: 1.4 },
    defenseMult: 0.9,
    buildSpeedMult: 1.0,
    rewardMult: 2.5,
    protectable: false, // no protection ever
    blurb: "+40% all yields, season-point ×2.5. No protection. Highest risk.",
  },
};

export const TERRAIN_IDS = Object.keys(PLOT_TYPES) as TerrainId[];
