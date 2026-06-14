// Resource economy — mirrors GDD §5 (Resource Economy)
// Three tiers: raw (gathered) -> intermediate (refined) -> finished (manufactured)

export type ResourceId =
  // Tier 0 — Raw
  | "food"
  | "water"
  | "wood"
  | "stone"
  | "iron"
  | "rareMinerals"
  | "oil"
  | "dataChips"
  // Tier 1 — Intermediate
  | "fuel"
  | "steel"
  | "electronics"
  | "machineParts"
  | "ammunition"
  | "chemicals"
  // Tier 2 — Finished
  | "rifles"
  | "tanks"
  | "drones"
  | "aircraft"
  | "turrets"
  | "buildingComponents";

export type ResourceTier = "raw" | "intermediate" | "finished";

export interface ResourceDef {
  id: ResourceId;
  name: string;
  tier: ResourceTier;
  icon: string; // emoji placeholder; swap for sprite later
  /** Recipe of inputs consumed to make 1 unit (intermediate/finished only). */
  recipe?: Partial<Record<ResourceId, number>>;
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  // ---------- Tier 0: Raw ----------
  food: { id: "food", name: "Food", tier: "raw", icon: "🌾" },
  water: { id: "water", name: "Water", tier: "raw", icon: "💧" },
  wood: { id: "wood", name: "Wood", tier: "raw", icon: "🪵" },
  stone: { id: "stone", name: "Stone", tier: "raw", icon: "🪨" },
  iron: { id: "iron", name: "Iron", tier: "raw", icon: "⛓️" },
  rareMinerals: { id: "rareMinerals", name: "Rare Minerals", tier: "raw", icon: "💎" },
  oil: { id: "oil", name: "Oil", tier: "raw", icon: "🛢️" },
  dataChips: { id: "dataChips", name: "Data Chips", tier: "raw", icon: "💽" },

  // ---------- Tier 1: Intermediate ----------
  fuel: { id: "fuel", name: "Fuel", tier: "intermediate", icon: "⛽", recipe: { oil: 2, water: 1 } },
  steel: { id: "steel", name: "Steel", tier: "intermediate", icon: "🔩", recipe: { iron: 2, stone: 1, fuel: 1 } },
  electronics: { id: "electronics", name: "Electronics", tier: "intermediate", icon: "🔌", recipe: { rareMinerals: 2, dataChips: 1, water: 1 } },
  machineParts: { id: "machineParts", name: "Machine Parts", tier: "intermediate", icon: "⚙️", recipe: { steel: 2, fuel: 1 } },
  chemicals: { id: "chemicals", name: "Chemicals", tier: "intermediate", icon: "🧪", recipe: { oil: 1, water: 1, rareMinerals: 1 } },
  ammunition: { id: "ammunition", name: "Ammunition", tier: "intermediate", icon: "🧨", recipe: { steel: 1, chemicals: 1 } },

  // ---------- Tier 2: Finished ----------
  rifles: { id: "rifles", name: "Rifles", tier: "finished", icon: "🔫", recipe: { steel: 3, wood: 2, ammunition: 1 } },
  tanks: { id: "tanks", name: "Tanks", tier: "finished", icon: "🛡️", recipe: { steel: 12, oil: 6, electronics: 4, machineParts: 2 } },
  drones: { id: "drones", name: "Drones", tier: "finished", icon: "🛸", recipe: { electronics: 4, machineParts: 2, fuel: 2 } },
  aircraft: { id: "aircraft", name: "Aircraft", tier: "finished", icon: "✈️", recipe: { electronics: 6, machineParts: 4, fuel: 4, steel: 4 } },
  turrets: { id: "turrets", name: "Turrets", tier: "finished", icon: "🗼", recipe: { steel: 4, electronics: 2, ammunition: 2 } },
  buildingComponents: { id: "buildingComponents", name: "Building Components", tier: "finished", icon: "🧱", recipe: { steel: 2, machineParts: 1, wood: 2 } },
};

export const RESOURCE_IDS = Object.keys(RESOURCES) as ResourceId[];
export const RAW_RESOURCES = RESOURCE_IDS.filter((r) => RESOURCES[r].tier === "raw");
export const INTERMEDIATE_RESOURCES = RESOURCE_IDS.filter((r) => RESOURCES[r].tier === "intermediate");
export const FINISHED_RESOURCES = RESOURCE_IDS.filter((r) => RESOURCES[r].tier === "finished");

export type ResourceBag = Partial<Record<ResourceId, number>>;
