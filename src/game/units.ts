// Military units & the counter system — mirrors GDD §8 (Tactical Combat).
// Counter triangle: each unit is strong vs some classes, weak vs others.

import type { ResourceId } from "./resources";

export type UnitId = "infantry" | "tanks" | "artillery" | "aircraft" | "drones" | "engineers";

export interface UnitDef {
  id: UnitId;
  name: string;
  icon: string;
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  /** $WAR + resource cost to train one unit */
  costWar: number;
  cost: Partial<Record<ResourceId, number>>;
  trainTicks: number;
  desc: string;
}

export const UNITS: Record<UnitId, UnitDef> = {
  infantry: {
    id: "infantry", name: "Infantry", icon: "🪖",
    attack: 10, defense: 12, hp: 30, speed: 5, costWar: 20,
    cost: { rifles: 1, food: 5 }, trainTicks: 3,
    desc: "Cheap, durable garrison. Strong vs Engineers; weak vs Tanks/Artillery.",
  },
  tanks: {
    id: "tanks", name: "Tanks", icon: "🛡️",
    attack: 32, defense: 26, hp: 80, speed: 6, costWar: 120,
    cost: { tanks: 1, fuel: 4 }, trainTicks: 8,
    desc: "Armored spearhead. Strong vs Infantry/Turrets; weak vs Aircraft/Drones/Artillery.",
  },
  artillery: {
    id: "artillery", name: "Artillery", icon: "💥",
    attack: 40, defense: 8, hp: 40, speed: 3, costWar: 110,
    cost: { ammunition: 4, machineParts: 1 }, trainTicks: 7,
    desc: "Siege & area damage. Strong vs Tanks/Structures/massed Infantry; weak vs Aircraft/Drones.",
  },
  aircraft: {
    id: "aircraft", name: "Aircraft", icon: "✈️",
    attack: 38, defense: 14, hp: 50, speed: 12, costWar: 200,
    cost: { aircraft: 1, fuel: 6 }, trainTicks: 12,
    desc: "Fast strike. Strong vs Tanks/Artillery/ground; weak vs Drones & AA.",
  },
  drones: {
    id: "drones", name: "Drones", icon: "🛸",
    attack: 22, defense: 10, hp: 28, speed: 14, costWar: 90,
    cost: { drones: 1, electronics: 2 }, trainTicks: 6,
    desc: "Interceptor/recon. Strong vs Aircraft/Infantry; weak vs EMP & dedicated AA.",
  },
  engineers: {
    id: "engineers", name: "Engineers", icon: "🔧",
    attack: 6, defense: 8, hp: 24, speed: 5, costWar: 50,
    cost: { buildingComponents: 1, machineParts: 1 }, trainTicks: 5,
    desc: "Sabotage, repair, traps. Strong vs Structures; fragile in direct combat.",
  },
};

export const UNIT_IDS = Object.keys(UNITS) as UnitId[];
export type Army = Partial<Record<UnitId, number>>;

/**
 * §8.3 Counter matrix. COUNTER[attacker][defender] = damage multiplier.
 * 1.5 hard-counter, 1.2 soft-good, 1.0 neutral, 0.8 soft-bad, 0.6 hard-bad.
 */
export const COUNTER: Record<UnitId, Record<UnitId, number>> = {
  infantry:  { infantry: 1.0, tanks: 0.6, artillery: 1.2, aircraft: 0.8, drones: 0.8, engineers: 1.5 },
  tanks:     { infantry: 1.5, tanks: 1.0, artillery: 1.2, aircraft: 0.6, drones: 0.6, engineers: 1.2 },
  artillery: { infantry: 1.2, tanks: 1.5, artillery: 1.0, aircraft: 0.6, drones: 0.6, engineers: 1.2 },
  aircraft:  { infantry: 1.2, tanks: 1.5, artillery: 1.5, aircraft: 1.0, drones: 0.6, engineers: 1.2 },
  drones:    { infantry: 1.2, tanks: 1.2, artillery: 1.2, aircraft: 1.5, drones: 1.0, engineers: 1.0 },
  engineers: { infantry: 0.6, tanks: 0.6, artillery: 0.8, aircraft: 0.6, drones: 0.8, engineers: 1.0 },
};

/** Raw power of an army (no counters/terrain). Used for scouting estimates & ratios. */
export function armyPower(army: Army, mode: "attack" | "defense" = "attack"): number {
  let p = 0;
  for (const id of UNIT_IDS) {
    const n = army[id] ?? 0;
    if (!n) continue;
    const u = UNITS[id];
    const base = mode === "attack" ? u.attack : u.defense;
    p += n * (base + u.hp * 0.15);
  }
  return p;
}

export function armySize(army: Army): number {
  return UNIT_IDS.reduce((s, id) => s + (army[id] ?? 0), 0);
}

/**
 * Composition-weighted counter factor of attacker vs defender army.
 * Returns a multiplier in roughly [0.6, 1.5] used as CounterFactor in the win formula.
 */
export function counterFactor(attacker: Army, defender: Army): number {
  const defTotal = armySize(defender);
  if (defTotal === 0) return 1.2; // undefended -> attacker advantage
  let weighted = 0;
  let attTotal = 0;
  for (const a of UNIT_IDS) {
    const an = attacker[a] ?? 0;
    if (!an) continue;
    attTotal += an;
    // average this attacker type's counter vs the defender composition
    let avg = 0;
    for (const d of UNIT_IDS) {
      const dn = defender[d] ?? 0;
      if (!dn) continue;
      avg += COUNTER[a][d] * (dn / defTotal);
    }
    weighted += an * avg;
  }
  if (attTotal === 0) return 0.8;
  // map the raw average (centered ~1.0) into the [0.8,1.4] band used by winProbability
  const raw = weighted / attTotal;
  return Math.min(1.4, Math.max(0.8, raw));
}
