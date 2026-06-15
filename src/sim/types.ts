import type { TerrainId } from "@/game/plotTypes";
import type { BuildingId } from "@/game/buildings";
import type { ResourceBag } from "@/game/resources";
import type { Hex } from "@/game/world";

export interface PlacedBuilding {
  id: BuildingId;
  level: number;
}

export interface SimPlayer {
  id: string;
  war: number;
  joinedTick: number;
}

export interface SimPlot {
  q: number;
  r: number;
  terrain: TerrainId;
  owner: string; // SimPlayer.id
  claimIndex: number; // per-player claim order -> diminishing returns
  stakeLocked: number;
  buildings: PlacedBuilding[];
  resources: ResourceBag;
}

export interface WorldState {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>; // serializable (was Map)
  plots: Record<string, SimPlot>; // keyed by "q,r"
  players: Record<string, SimPlayer>;
}

export type Command =
  | { type: "stake"; q: number; r: number }
  | { type: "build"; key: string; buildingId: BuildingId };

export interface CommandResult {
  state: WorldState;
  error?: string;
}
