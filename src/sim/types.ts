import type { TerrainId } from "@/game/plotTypes";
import type { BuildingId } from "@/game/buildings";
import type { ResourceBag, ResourceId } from "@/game/resources";
import type { Hex } from "@/game/world";
import type { Army, UnitId } from "@/game/units";
import type { BattleResult, BattleIntent } from "@/game/combat";
import type { AllegianceBuildingId } from "@/game/allegiance";

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
  allegianceId?: string | null;
}

export interface AllegianceProposal {
  id: string;
  buildingId: AllegianceBuildingId;
  for: string[]; // playerIds who voted yes
  against: string[]; // playerIds who voted no
  closesAtTick: number;
  resolved: boolean;
  passed?: boolean;
}

export interface Allegiance {
  id: string;
  name: string;
  founder: string; // SimPlayer.id
  members: string[]; // SimPlayer.ids
  treasuryWar: number;
  contributions: Record<string, number>; // playerId -> cumulative $HEXAR contributed
  buildings: AllegianceBuildingId[];
  proposals: AllegianceProposal[];
  nextProposalId: number;
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

/** A standing sell order in the shared marketplace; goods are escrowed in the order. */
export interface MarketOrder {
  id: string;
  item: ResourceId;
  qty: number;
  price: number; // $HEXAR per unit
  owner: string; // SimPlayer.id
}

export interface Market {
  refPrices: Record<ResourceId, number>;
  book: MarketOrder[];
  nextOrderId: number;
}

export interface WorldState {
  seed: number;
  radius: number;
  tick: number;
  hexes: Record<string, Hex>; // serializable (was Map)
  plots: Record<string, SimPlot>; // keyed by "q,r"
  players: Record<string, SimPlayer>;
  /** total $HEXAR removed via sinks (early-unstake fees, etc.) — GDD §13 */
  burned: number;
  market: Market;
  allegiances: Record<string, Allegiance>;
  nextAllegianceId: number;
}

export type Command =
  | { type: "stake"; q: number; r: number }
  | { type: "build"; key: string; buildingId: BuildingId }
  | { type: "upgrade"; key: string; index: number }
  | { type: "setProduct"; key: string; index: number; product: ResourceId }
  | { type: "unstake"; key: string }
  | { type: "train"; key: string; unit: UnitId }
  | { type: "raid"; fromKey: string; targetKey: string; army: Army; intent: BattleIntent }
  | { type: "list"; key: string; item: ResourceId; qty: number; price: number }
  | { type: "buy"; item: ResourceId; qty: number; toKey: string }
  | { type: "cancel"; orderId: string; toKey: string }
  | { type: "found"; name: string }
  | { type: "joinAllegiance"; id: string }
  | { type: "leaveAllegiance" }
  | { type: "contribute"; amount: number }
  | { type: "allegianceBuild"; buildingId: AllegianceBuildingId }
  | { type: "propose"; buildingId: AllegianceBuildingId }
  | { type: "vote"; proposalId: string; support: boolean };

export interface CommandResult {
  state: WorldState;
  error?: string;
  /** PvP raid outcome, surfaced to the issuing client only */
  report?: BattleReport;
}
