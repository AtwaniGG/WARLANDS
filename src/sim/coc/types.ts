import type { Hex } from "@/game/world";

export type CocResource = "gold" | "elixir";
export type CocBuildingId =
  | "commandCenter"
  | "goldCollector"
  | "elixirCollector"
  | "goldStorage"
  | "elixirStorage"
  | "cannon"
  | "mortar"
  | "airDefense"
  | "barracks"
  | "armyCamp";

export type CocUnitId = "grunt" | "marksman" | "breacher" | "juggernaut" | "gunship";

/** A building placed on a hex. level 0 = under construction (not yet operational). */
export interface PlacedBuilding {
  id: CocBuildingId;
  level: number;
  /** collector accumulation awaiting collection */
  buffer?: number;
}

export interface BuildJob {
  hexKey: string;
  buildingId: CocBuildingId;
  kind: "build" | "upgrade";
  toLevel: number;
  finishesAtTick: number;
}

export interface TrainOrder {
  unit: CocUnitId;
  finishesAtTick: number;
}

export type Army = Partial<Record<CocUnitId, number>>;

export interface CocBase {
  owner: string;
  centerKey: string;
  ownedHexes: string[];
  buildings: Record<string, PlacedBuilding>; // hexKey -> building
  /** wall segments on edges between owned hexes; keyed by edgeKey -> level */
  walls: Record<string, number>;
  gold: number;
  elixir: number;
  builders: number;
  jobs: BuildJob[];
  /** trained troops ready to attack with */
  army: Army;
  trainQueue: TrainOrder[];
  /** tick until which the base is protected from raids (0 = none) */
  shieldUntil: number;
  trophies: number;
}

export interface CocPlayer {
  id: string;
  war: number;
  joinedTick: number;
  clanId?: string | null;
}

export interface Clan {
  id: string;
  name: string;
  founder: string;
  members: string[];
}

export interface CocWorld {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>;
  bases: Record<string, CocBase>; // keyed by owner playerId
  claimedHexes: Record<string, string>; // hexKey -> owner
  players: Record<string, CocPlayer>;
  clans: Record<string, Clan>;
  nextClanId: number;
}

export type CocCommand =
  | { type: "claimBase"; q: number; r: number }
  | { type: "placeBuilding"; hexKey: string; buildingId: CocBuildingId }
  | { type: "upgradeBuilding"; hexKey: string }
  | { type: "collect" }
  | { type: "expandCluster"; q: number; r: number }
  | { type: "placeWall"; aKey: string; bKey: string }
  | { type: "upgradeWall"; edgeKey: string }
  | { type: "trainTroop"; unit: CocUnitId }
  | { type: "raid"; targetOwner: string; army: Army }
  | { type: "finishNow"; hexKey: string }
  | { type: "buyBuilder" }
  | { type: "extendShield"; hours: number }
  | { type: "createClan"; name: string }
  | { type: "joinClan"; clanId: string }
  | { type: "leaveClan" }
  | { type: "donateTroops"; toOwner: string; army: Army };

/** Outcome of a raid, surfaced to the attacking client only. */
export interface BattleReport {
  attacker: string;
  defender: string;
  tick: number;
  stars: number;
  destructionPct: number;
  loot: { gold: number; elixir: number };
  trophies: number; // delta for the attacker (defender gets the negative)
  armyUsed: Army;
}

export interface CommandResult {
  state: CocWorld;
  error?: string;
  report?: BattleReport;
}
