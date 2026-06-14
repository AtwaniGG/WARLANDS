// Allegiances (alliances) — mirrors GDD §10-11.
// Political/military/economic orgs with treasury, contribution scores, and governance.

import type { ResourceBag } from "./resources";

export type GovModel = "democracy" | "weighted" | "council" | "founder";

export type AllegianceBuildingId = "hq" | "fortress" | "tradeHub" | "radar" | "research" | "factory" | "shield";

export interface AllegianceBuildingDef {
  id: AllegianceBuildingId;
  name: string;
  icon: string;
  cost: number; // $WAR from treasury
  benefit: string;
}

export const ALLEGIANCE_BUILDINGS: Record<AllegianceBuildingId, AllegianceBuildingDef> = {
  hq: { id: "hq", name: "Headquarters", icon: "🏛️", cost: 0, benefit: "Enables governance & member cap." },
  fortress: { id: "fortress", name: "Fortress", icon: "🏰", cost: 8000, benefit: "+15% defense to all members' plots." },
  tradeHub: { id: "tradeHub", name: "Trade Hub", icon: "🏪", cost: 10000, benefit: "−25% market fees for members." },
  radar: { id: "radar", name: "Radar Network", icon: "📡", cost: 9000, benefit: "+10% scouting; reduces enemy ambush." },
  research: { id: "research", name: "Research Center", icon: "🔬", cost: 12000, benefit: "+12% production for members." },
  factory: { id: "factory", name: "Alliance Factory", icon: "🏭", cost: 15000, benefit: "Unlocks pooled superweapon projects." },
  shield: { id: "shield", name: "Shield Network", icon: "🛡️", cost: 20000, benefit: "Timed regional shield (war defense)." },
};

export type MemberRole = "founder" | "officer" | "member";
export type Archetype = "food" | "metal" | "oil" | "weapons" | "tech" | "trader" | "warlord" | "logistics";

export interface Member {
  name: string;
  isPlayer: boolean;
  contribution: number; // §11.3 contribution score
  archetype: Archetype;
  role: MemberRole;
}

export type ProposalKind = "build" | "war" | "spend";
export interface Proposal {
  id: string;
  kind: ProposalKind;
  label: string;
  payload?: { building?: AllegianceBuildingId };
  votesFor: number;
  votesAgainst: number;
  playerVoted: boolean;
  closesAtTick: number;
  resolved: boolean;
  passed?: boolean;
}

export interface Allegiance {
  id: string;
  name: string;
  govModel: GovModel;
  members: Member[];
  treasuryWar: number;
  treasuryRes: ResourceBag;
  buildings: AllegianceBuildingId[];
  proposals: Proposal[];
  isPlayerOwned: boolean;
}

const ARCHETYPES: Archetype[] = ["food", "metal", "oil", "weapons", "tech", "trader", "warlord", "logistics"];
const AI_NAMES = ["Iron Concord", "Crimson Pact", "Desert Wolves", "Northern Vanguard", "Steel Syndicate", "Oilmen's League"];

/** Seed a few AI allegiances the player can apply to join. */
export function generateAiAllegiances(): Record<string, Allegiance> {
  const out: Record<string, Allegiance> = {};
  AI_NAMES.slice(0, 4).forEach((name, i) => {
    const memberCount = 6 + ((i * 7) % 9);
    const members: Member[] = Array.from({ length: memberCount }, (_, m) => ({
      name: `${name.split(" ")[0]}-${m + 1}`,
      isPlayer: false,
      contribution: Math.round(200 + ((i + 1) * (m + 3) * 37) % 900),
      archetype: ARCHETYPES[(i + m) % ARCHETYPES.length],
      role: m === 0 ? "founder" : m < 3 ? "officer" : "member",
    }));
    const models: GovModel[] = ["council", "weighted", "democracy", "founder"];
    out[`ai-${i}`] = {
      id: `ai-${i}`,
      name,
      govModel: models[i % models.length],
      members,
      treasuryWar: 20000 + i * 12000,
      treasuryRes: { steel: 2000, oil: 1500, food: 4000 },
      buildings: i % 2 === 0 ? ["hq", "fortress"] : ["hq", "research", "radar"],
      proposals: [],
      isPlayerOwned: false,
    };
  });
  return out;
}

/** §11.1 — does a proposal pass under the allegiance's governance model? */
export function proposalPasses(a: Allegiance, p: Proposal): boolean {
  const total = p.votesFor + p.votesAgainst;
  if (total === 0) return false;
  switch (a.govModel) {
    case "founder":
      return p.votesFor >= p.votesAgainst; // founder's bloc dominates; tie = pass
    case "council":
      return p.votesFor > p.votesAgainst * 0.8; // council leans permissive
    case "weighted":
    case "democracy":
    default:
      return p.votesFor > p.votesAgainst;
  }
}

/** AI members auto-vote on a proposal, weighted by model + contribution. */
export function aiVotes(a: Allegiance): { forVotes: number; againstVotes: number } {
  let forV = 0, against = 0;
  for (const m of a.members) {
    if (m.isPlayer) continue;
    const weight = a.govModel === "weighted" ? Math.max(1, Math.round(m.contribution / 100)) : 1;
    // AI generally supports growth proposals ~70%
    if ((m.contribution % 10) < 7) forV += weight;
    else against += weight;
  }
  return { forVotes: forV, againstVotes: against };
}

export function totalContribution(a: Allegiance): number {
  return a.members.reduce((s, m) => s + m.contribution, 0);
}
