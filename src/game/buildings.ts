// Buildings & factories — mirrors GDD §6 (Manufacturing Economy).
// Camp is the HQ. Extractors gather raw resources. Refineries/factories transform them.

import type { ResourceId } from "./resources";

export type BuildingId =
  | "camp"
  | "farm"
  | "well"
  | "lumberCamp"
  | "quarry"
  | "ironMine"
  | "mineralMine"
  | "oilDerrick"
  | "dataExcavator"
  | "refinery"
  | "foundry"
  | "armsFactory"
  | "heavyWorks"
  | "electronicsLab"
  | "warehouse";

export type BuildingKind = "hq" | "extractor" | "factory" | "storage";

export interface BuildingDef {
  id: BuildingId;
  name: string;
  kind: BuildingKind;
  icon: string;
  /** Raw resource this extractor produces (extractors only). */
  extracts?: ResourceId;
  /** Finished/intermediate products this factory can make (factories only). */
  makes?: ResourceId[];
  /** Base $HEXAR cost to build at level 1. Upgrades scale with UPGRADE_COST_GROWTH. */
  baseCost: number;
  /** Base resource cost to build at level 1. */
  baseResourceCost: Partial<Record<ResourceId, number>>;
  /** Base output per tick at level 1 (extractors), before terrain/DR multipliers. */
  baseOutput?: number;
  /** Storage capacity added (storage only). */
  capacity?: number;
  maxLevel: number;
  desc: string;
}

export const BUILDINGS: Record<BuildingId, BuildingDef> = {
  camp: {
    id: "camp",
    name: "Camp (HQ)",
    kind: "hq",
    icon: "🏕️",
    baseCost: 0,
    baseResourceCost: {},
    maxLevel: 10,
    desc: "Your headquarters. Higher level unlocks more building slots.",
  },

  // ---------- Extractors (Tier 0 raw) ----------
  farm: { id: "farm", name: "Farm", kind: "extractor", icon: "🌾", extracts: "food", baseCost: 200, baseResourceCost: { wood: 20 }, baseOutput: 6, maxLevel: 20, desc: "Produces Food." },
  well: { id: "well", name: "Water Well", kind: "extractor", icon: "💧", extracts: "water", baseCost: 200, baseResourceCost: { stone: 20 }, baseOutput: 6, maxLevel: 20, desc: "Produces Water." },
  lumberCamp: { id: "lumberCamp", name: "Lumber Camp", kind: "extractor", icon: "🪵", extracts: "wood", baseCost: 200, baseResourceCost: { stone: 15 }, baseOutput: 5, maxLevel: 20, desc: "Produces Wood." },
  quarry: { id: "quarry", name: "Quarry", kind: "extractor", icon: "🪨", extracts: "stone", baseCost: 250, baseResourceCost: { wood: 25 }, baseOutput: 5, maxLevel: 20, desc: "Produces Stone." },
  ironMine: { id: "ironMine", name: "Iron Mine", kind: "extractor", icon: "⛓️", extracts: "iron", baseCost: 400, baseResourceCost: { wood: 30, stone: 30 }, baseOutput: 4, maxLevel: 20, desc: "Produces Iron." },
  mineralMine: { id: "mineralMine", name: "Mineral Mine", kind: "extractor", icon: "💎", extracts: "rareMinerals", baseCost: 700, baseResourceCost: { stone: 40, iron: 20 }, baseOutput: 2.5, maxLevel: 20, desc: "Produces Rare Minerals." },
  oilDerrick: { id: "oilDerrick", name: "Oil Derrick", kind: "extractor", icon: "🛢️", extracts: "oil", baseCost: 800, baseResourceCost: { steel: 10, stone: 40 }, baseOutput: 3.5, maxLevel: 20, desc: "Produces Oil." },
  dataExcavator: { id: "dataExcavator", name: "Data Excavator", kind: "extractor", icon: "💽", extracts: "dataChips", baseCost: 1200, baseResourceCost: { steel: 20, electronics: 5 }, baseOutput: 1.5, maxLevel: 20, desc: "Recovers Data Chips from ruins." },

  // ---------- Factories (Tier 1 & 2) ----------
  refinery: { id: "refinery", name: "Refinery", kind: "factory", icon: "🏭", makes: ["fuel", "chemicals"], baseCost: 1000, baseResourceCost: { stone: 60, iron: 30 }, baseOutput: 3, maxLevel: 15, desc: "Refines Oil into Fuel & Chemicals." },
  foundry: { id: "foundry", name: "Foundry", kind: "factory", icon: "⚒️", makes: ["steel", "machineParts"], baseCost: 1400, baseResourceCost: { stone: 80, iron: 40 }, baseOutput: 3, maxLevel: 15, desc: "Smelts Steel & Machine Parts." },
  armsFactory: { id: "armsFactory", name: "Arms Factory", kind: "factory", icon: "🔫", makes: ["rifles", "ammunition"], baseCost: 2200, baseResourceCost: { steel: 60, buildingComponents: 10 }, baseOutput: 2, maxLevel: 15, desc: "Builds Rifles & Ammunition." },
  heavyWorks: { id: "heavyWorks", name: "Heavy Works", kind: "factory", icon: "🛠️", makes: ["tanks", "buildingComponents", "turrets"], baseCost: 3500, baseResourceCost: { steel: 120, electronics: 20 }, baseOutput: 1, maxLevel: 15, desc: "Builds Tanks, Turrets & Components." },
  electronicsLab: { id: "electronicsLab", name: "Electronics Lab", kind: "factory", icon: "🔬", makes: ["electronics", "drones", "aircraft"], baseCost: 4000, baseResourceCost: { steel: 80, rareMinerals: 40 }, baseOutput: 1.5, maxLevel: 15, desc: "Builds Electronics, Drones & Aircraft." },

  // ---------- Storage ----------
  warehouse: { id: "warehouse", name: "Warehouse", kind: "storage", icon: "📦", baseCost: 500, baseResourceCost: { wood: 60, stone: 40 }, capacity: 2000, maxLevel: 20, desc: "+2000 storage capacity per level." },
};

export const BUILDING_IDS = Object.keys(BUILDINGS) as BuildingId[];

/** Which buildings a given terrain allows you to construct (extractors gated by terrain.produces). */
export function isBuildingAllowedOnTerrain(
  building: BuildingDef,
  terrainProduces: ResourceId[],
): boolean {
  if (building.kind === "extractor" && building.extracts) {
    return terrainProduces.includes(building.extracts);
  }
  return true; // factories, storage, hq buildable anywhere
}
