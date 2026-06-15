import { generateWorld, hexKey } from "@/game/world";
import { BUILDINGS } from "@/game/buildings";
import { BASE_PRICE } from "@/game/market";
import type { Market, SimPlot, SimPlayer, WorldState } from "./types";

export const WORLD_RADIUS = 9;
export const STORAGE_BASE_CAP = 1500;
export const STARTING_WAR = 200_000;

function freshMarket(): Market {
  return { refPrices: { ...BASE_PRICE }, book: [], nextOrderId: 1 };
}

export function createWorld(seed: number): WorldState {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: WorldState["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, plots: {}, players: {}, burned: 0, market: freshMarket() };
}

export function addPlayer(state: WorldState, id: string): WorldState {
  if (state.players[id]) return state;
  const player: SimPlayer = { id, war: STARTING_WAR, joinedTick: state.tick };
  return { ...state, players: { ...state.players, [id]: player } };
}

export function storageCap(plot: SimPlot): number {
  let cap = STORAGE_BASE_CAP;
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];
    if (def.kind === "storage" && def.capacity) cap += def.capacity * b.level;
  }
  return cap;
}

/**
 * Make a restored snapshot resilient to schema evolution: fill in fields that
 * older persisted worlds predate (army/trainQueue/defensePct, burned).
 */
export function normalizeWorld(state: WorldState): WorldState {
  const plots: WorldState["plots"] = {};
  for (const [k, p] of Object.entries(state.plots)) {
    plots[k] = {
      ...p,
      army: p.army ?? {},
      trainQueue: p.trainQueue ?? [],
      defensePct: p.defensePct ?? 1,
      resources: p.resources ?? {},
      buildings: p.buildings ?? [{ id: "camp", level: 1 }],
    };
  }
  const market: Market = state.market
    ? {
        refPrices: { ...BASE_PRICE, ...state.market.refPrices },
        book: state.market.book ?? [],
        nextOrderId: state.market.nextOrderId ?? 1,
      }
    : freshMarket();
  return { ...state, burned: state.burned ?? 0, plots, market };
}

export { hexKey };
