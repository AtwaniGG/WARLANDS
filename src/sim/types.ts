import type { TerrainId } from "@/game/plotTypes";
import type { BuildingId } from "@/game/buildings";
import type { ResourceBag, ResourceId } from "@/game/resources";
import type { Hex } from "@/game/world";
import type { Army, UnitId } from "@/game/units";
import type { BattleResult, BattleIntent } from "@/game/combat";

export interface PlacedBuilding {
  id: BuildingId;
  level: number;
  /** for factories: which product this factory is currently making */
  activeProduct?: ResourceId;
}

export interface TrainOrder {
  unit: UnitId;
  ticksLeft: number;
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
  army: Army;
  trainQueue: TrainOrder[];
  /** 0..1 plot defense health */
  defensePct: number;
}

export interface BattleReport {
  result: BattleResult;
  attackerKey: string;
  targetKey: string;
  tick: number;
}

export interface WorldState {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>; // serializable (was Map)
  plots: Record<string, SimPlot>; // keyed by "q,r"
  players: Record<string, SimPlayer>;
  /** total $WAR removed via sinks (early-unstake fees, etc.) — GDD §13 */
  burned: number;
}

export type Command =
  | { type: "stake"; q: number; r: number }
  | { type: "build"; key: string; buildingId: BuildingId }
  | { type: "upgrade"; key: string; index: number }
  | { type: "setProduct"; key: string; index: number; product: ResourceId }
  | { type: "unstake"; key: string }
  | { type: "train"; key: string; unit: UnitId }
  | { type: "raid"; fromKey: string; targetKey: string; army: Army; intent: BattleIntent };

export interface CommandResult {
  state: WorldState;
  error?: string;
  /** PvP raid outcome, surfaced to the issuing client only */
  report?: BattleReport;
}
