import type { Hex } from "@/game/world";

export type CocResource = "gold" | "elixir";
export type CocBuildingId =
  | "commandCenter"
  | "goldCollector"
  | "elixirCollector"
  | "goldStorage"
  | "elixirStorage";

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

export interface CocBase {
  owner: string;
  centerKey: string;
  ownedHexes: string[];
  buildings: Record<string, PlacedBuilding>; // hexKey -> building
  gold: number;
  elixir: number;
  builders: number;
  jobs: BuildJob[];
}

export interface CocPlayer {
  id: string;
  war: number;
  joinedTick: number;
}

export interface CocWorld {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>;
  bases: Record<string, CocBase>; // keyed by owner playerId
  claimedHexes: Record<string, string>; // hexKey -> owner
  players: Record<string, CocPlayer>;
}

export type CocCommand =
  | { type: "claimBase"; q: number; r: number }
  | { type: "placeBuilding"; hexKey: string; buildingId: CocBuildingId }
  | { type: "upgradeBuilding"; hexKey: string }
  | { type: "collect" }
  | { type: "expandCluster"; q: number; r: number };

export interface CommandResult {
  state: CocWorld;
  error?: string;
}
