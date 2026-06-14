// Commanders — account-permanent hero units (GDD §8.4). Recruited with $WAR, assigned to a
// plot, they buff combat (CommanderFactor in the win formula) and economy. They survive
// season resets — part of the permanent identity layer (GDD §15).

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type SkillId = "vanguard" | "bulwark" | "ambusher" | "tactician" | "siegeMaster" | "quartermaster" | "logistician";

export interface SkillDef {
  id: SkillId;
  name: string;
  icon: string;
  desc: string;
  /** combat win-factor contribution at L1 (added into CommanderFactor, capped 0.9..1.2) */
  combat?: number;
  /** flat production multiplier bonus (e.g. 0.08 = +8%) */
  production?: number;
  /** scouting/ambush factor bonus */
  scout?: number;
  /** extra effectiveness on sieges specifically */
  siege?: number;
}

export const SKILLS: Record<SkillId, SkillDef> = {
  vanguard: { id: "vanguard", name: "Vanguard", icon: "⚔️", desc: "+attack in offensive battles", combat: 0.08 },
  bulwark: { id: "bulwark", name: "Bulwark", icon: "🛡️", desc: "+defense when garrisoned", combat: 0.07 },
  ambusher: { id: "ambusher", name: "Ambusher", icon: "🥷", desc: "+ambush & scouting edge", combat: 0.04, scout: 0.08 },
  tactician: { id: "tactician", name: "Tactician", icon: "🎖️", desc: "general combat command", combat: 0.1 },
  siegeMaster: { id: "siegeMaster", name: "Siege Master", icon: "🏰", desc: "+siege effectiveness", combat: 0.05, siege: 0.12 },
  quartermaster: { id: "quartermaster", name: "Quartermaster", icon: "📦", desc: "+production on home plot", production: 0.1 },
  logistician: { id: "logistician", name: "Logistician", icon: "🚚", desc: "+production & light combat", combat: 0.03, production: 0.06 },
};

export interface Commander {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  skillId: SkillId;
  level: number;
  xp: number;
}

export const RARITY_META: Record<Rarity, { color: string; recruitCost: number; xpScale: number }> = {
  common: { color: "#8a92a3", recruitCost: 1200, xpScale: 1 },
  rare: { color: "#4a90d9", recruitCost: 3000, xpScale: 1.25 },
  epic: { color: "#8b5cf6", recruitCost: 7000, xpScale: 1.6 },
  legendary: { color: "#f5b301", recruitCost: 15000, xpScale: 2.1 },
};

const FIRST_NAMES = ["Volkov", "Reyes", "Karim", "Stone", "Okoye", "Vasquez", "Hale", "Nakamura", "Cromwell", "Adler", "Singh", "Moreau"];
const TITLES = ["the Iron", "the Unbroken", "Ghost", "the Anvil", "Warhound", "the Quick", "Ironside", "the Cold", "Blackthorn", "the Relentless"];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Roll a fresh recruit pool of N commanders (deterministic by seed). */
export function rollRecruits(seed: number, n = 4): Commander[] {
  const r = rng(seed);
  const skillIds = Object.keys(SKILLS) as SkillId[];
  const out: Commander[] = [];
  for (let i = 0; i < n; i++) {
    const roll = r();
    const rarity: Rarity = roll < 0.55 ? "common" : roll < 0.83 ? "rare" : roll < 0.96 ? "epic" : "legendary";
    const name = `${FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]} ${TITLES[Math.floor(r() * TITLES.length)]}`;
    const skillId = skillIds[Math.floor(r() * skillIds.length)];
    out.push({ id: `cmd-${seed}-${i}`, name, icon: SKILLS[skillId].icon, rarity, skillId, level: 1, xp: 0 });
  }
  return out;
}

/** XP needed to reach the next level. */
export function xpForLevel(level: number, rarity: Rarity): number {
  return Math.round(100 * level * RARITY_META[rarity].xpScale);
}

/** CommanderFactor for the win formula: 1 + level-scaled combat skill, capped to [0.9, 1.2]. */
export function commanderCombatFactor(c: Commander | undefined, intent: "raid" | "siege" = "raid"): number {
  if (!c) return 1;
  const s = SKILLS[c.skillId];
  let bonus = (s.combat ?? 0) * (1 + 0.12 * (c.level - 1));
  if (intent === "siege") bonus += (s.siege ?? 0) * (1 + 0.1 * (c.level - 1));
  return Math.min(1.2, Math.max(0.9, 1 + bonus));
}

export function commanderProductionBonus(c: Commander | undefined): number {
  if (!c) return 0;
  return (SKILLS[c.skillId].production ?? 0) * (1 + 0.1 * (c.level - 1));
}

export function commanderScoutBonus(c: Commander | undefined): number {
  if (!c) return 0;
  return (SKILLS[c.skillId].scout ?? 0) * (1 + 0.1 * (c.level - 1));
}
