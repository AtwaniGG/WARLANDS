// Tech research tree (GDD §6.4) — spend Data Chips + $HEXAR to permanently unlock empire-wide
// bonuses. Four branches (Production / Industry / Military / Economy) with prerequisites.

import type { ResourceId } from "./resources";

export type TechId =
  | "mechFarming" | "autoExtraction" | "geosurvey"
  | "assemblyLines" | "precisionTooling"
  | "advancedOptics" | "compositeArmor" | "fireControl"
  | "tradeNetworks" | "logisticsCorps" | "coldStorage";

export interface TechDef {
  id: TechId;
  name: string;
  branch: "Production" | "Industry" | "Military" | "Economy";
  desc: string;
  requires: TechId[];
  costWar: number;
  costData: number; // Data Chips
  /** effect contributions, summed across unlocked techs */
  production?: number; // +extractor/factory output
  combat?: number; // +combat factor
  scout?: number; // +scouting/ambush
  marketFee?: number; // market fee discount (0..1)
  storage?: number; // +flat storage cap
}

export const TECHS: Record<TechId, TechDef> = {
  // Production
  mechFarming: { id: "mechFarming", name: "Mechanized Farming", branch: "Production", desc: "+8% resource extraction.", requires: [], costWar: 2000, costData: 40, production: 0.08 },
  autoExtraction: { id: "autoExtraction", name: "Automated Extraction", branch: "Production", desc: "+12% resource extraction.", requires: ["mechFarming"], costWar: 5000, costData: 110, production: 0.12 },
  geosurvey: { id: "geosurvey", name: "Geological Survey", branch: "Production", desc: "+10% extraction; unlocks deep deposits.", requires: ["autoExtraction"], costWar: 9000, costData: 220, production: 0.1 },
  // Industry
  assemblyLines: { id: "assemblyLines", name: "Assembly Lines", branch: "Industry", desc: "+10% factory throughput.", requires: [], costWar: 3000, costData: 60, production: 0.1 },
  precisionTooling: { id: "precisionTooling", name: "Precision Tooling", branch: "Industry", desc: "+14% factory throughput.", requires: ["assemblyLines"], costWar: 6500, costData: 160, production: 0.14 },
  // Military
  advancedOptics: { id: "advancedOptics", name: "Advanced Optics", branch: "Military", desc: "+scouting & ambush edge.", requires: [], costWar: 3000, costData: 70, scout: 0.06, combat: 0.03 },
  compositeArmor: { id: "compositeArmor", name: "Composite Armor", branch: "Military", desc: "+combat effectiveness.", requires: ["advancedOptics"], costWar: 6000, costData: 150, combat: 0.06 },
  fireControl: { id: "fireControl", name: "Fire Control Systems", branch: "Military", desc: "+combat effectiveness.", requires: ["compositeArmor"], costWar: 10000, costData: 260, combat: 0.07 },
  // Economy
  tradeNetworks: { id: "tradeNetworks", name: "Trade Networks", branch: "Economy", desc: "−15% market fees.", requires: [], costWar: 2500, costData: 50, marketFee: 0.15 },
  logisticsCorps: { id: "logisticsCorps", name: "Logistics Corps", branch: "Economy", desc: "+2000 storage capacity.", requires: ["tradeNetworks"], costWar: 4000, costData: 120, storage: 2000 },
  coldStorage: { id: "coldStorage", name: "Cold Storage", branch: "Economy", desc: "+3000 storage capacity.", requires: ["logisticsCorps"], costWar: 7000, costData: 200, storage: 3000 },
};

export const TECH_IDS = Object.keys(TECHS) as TechId[];
export const RESEARCH_RESOURCE: ResourceId = "dataChips";

export interface TechBonuses {
  production: number;
  combat: number;
  scout: number;
  marketFee: number;
  storage: number;
}

export function computeTechBonuses(unlocked: string[]): TechBonuses {
  const b: TechBonuses = { production: 0, combat: 0, scout: 0, marketFee: 0, storage: 0 };
  for (const id of unlocked) {
    const t = TECHS[id as TechId];
    if (!t) continue;
    b.production += t.production ?? 0;
    b.combat += t.combat ?? 0;
    b.scout += t.scout ?? 0;
    b.marketFee += t.marketFee ?? 0;
    b.storage += t.storage ?? 0;
  }
  b.marketFee = Math.min(0.6, b.marketFee); // cap fee discount
  return b;
}

export function canResearch(unlocked: string[], id: TechId): boolean {
  if (unlocked.includes(id)) return false;
  return TECHS[id].requires.every((r) => unlocked.includes(r));
}
