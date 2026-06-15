import type { AllegianceBuildingId } from "@/game/allegiance";
import type { WorldState } from "./types";

export const CREATE_ALLEGIANCE_COST = 5000; // §13 #21 sink

/** Per-building buffs granted to every member's plots. */
export interface AllyBuffs {
  production: number; // additive workforce bonus
  defense: number; // additive defense-cap bonus
  marketFee: number; // 0..1 fee discount
}

const ZERO: AllyBuffs = { production: 0, defense: 0, marketFee: 0 };

const BUILDING_BUFF: Partial<Record<AllegianceBuildingId, Partial<AllyBuffs>>> = {
  research: { production: 0.12 },
  fortress: { defense: 0.15 },
  tradeHub: { marketFee: 0.25 },
};

/** Aggregate buffs for a player from their allegiance's buildings. */
export function allegianceBuffs(state: WorldState, playerId: string): AllyBuffs {
  const player = state.players[playerId];
  const allyId = player?.allegianceId;
  if (!allyId) return ZERO;
  const ally = state.allegiances[allyId];
  if (!ally) return ZERO;
  const buffs: AllyBuffs = { ...ZERO };
  for (const b of ally.buildings) {
    const add = BUILDING_BUFF[b];
    if (!add) continue;
    buffs.production += add.production ?? 0;
    buffs.defense += add.defense ?? 0;
    buffs.marketFee += add.marketFee ?? 0;
  }
  buffs.marketFee = Math.min(0.8, buffs.marketFee);
  return buffs;
}
