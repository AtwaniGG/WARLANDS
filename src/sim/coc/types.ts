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
  | "armyCamp"
  | "builderHut"
  | "clanCastle";

export type CocUnitId = "grunt" | "marksman" | "breacher" | "juggernaut" | "gunship";

/** Hidden battle traps placed on a tile (1×1). */
export type CocTrapId = "bomb" | "airMine";

/** A building placed on the village grid, anchored at a tile key "x,y". level 0 = under construction. */
export interface PlacedBuilding {
  id: CocBuildingId;
  level: number;
  /** collector accumulation awaiting collection */
  buffer?: number;
}

export interface BuildJob {
  /** anchor tile "x,y" of the building this job belongs to */
  tileKey: string;
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

/** A single troop placed on the defender's grid at the start of a raid. */
export interface Deployment {
  unit: CocUnitId;
  x: number;
  y: number;
}

export interface CocBase {
  owner: string;
  /** world hexKey "q,r" where this village sits on the WORLD map */
  location: string;
  /** anchor tile "x,y" -> building (footprint read from config) */
  buildings: Record<string, PlacedBuilding>;
  /** wall tiles: tile "x,y" -> wall level (each wall is 1×1) */
  walls: Record<string, number>;
  /** hidden traps: tile "x,y" -> trap (1×1, triggered in battle) */
  traps: Record<string, { id: CocTrapId; level: number }>;
  gold: number;
  elixir: number;
  jobs: BuildJob[];
  /** trained troops ready to attack with */
  army: Army;
  /** clanmate-donated troops stationed in the Clan Castle; defend when raided */
  garrison: Army;
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
  /** AI-controlled village seeded to populate the world (always a valid raid target). */
  isBot?: boolean;
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
  claimedHexes: Record<string, string>; // hexKey -> owner (one village per owner)
  players: Record<string, CocPlayer>;
  clans: Record<string, Clan>;
  nextClanId: number;
  /** defense reports queued for offline players (raided while away) — delivered on connect. */
  pendingReports?: Record<string, BattleReport[]>;
}

export type CocCommand =
  | { type: "claimBase"; q: number; r: number }
  | { type: "placeBuilding"; tileKey: string; buildingId: CocBuildingId }
  | { type: "upgradeBuilding"; tileKey: string }
  | { type: "moveBuilding"; fromTile: string; toTile: string }
  | { type: "collect" }
  | { type: "placeWall"; tileKey: string }
  | { type: "upgradeWall"; tileKey: string }
  | { type: "placeTrap"; tileKey: string; trapId: CocTrapId }
  | { type: "trainTroop"; unit: CocUnitId }
  | { type: "raid"; targetOwner: string; deploy: Deployment[] }
  | { type: "finishNow"; tileKey: string }
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
  deploy: Deployment[]; // troop placements used — lets the attacker client replay the battle
  seed: number; // battle seed — replay is deterministic from (deploy, defender snapshot, seed)
}

export interface CommandResult {
  state: CocWorld;
  error?: string;
  report?: BattleReport;
}
