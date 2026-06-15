import { generateWorld, hexKey } from "@/game/world";
import { BUILDINGS } from "@/game/buildings";
import type { SimPlot, SimPlayer, WorldState } from "./types";

export const WORLD_RADIUS = 9;
export const STORAGE_BASE_CAP = 1500;
export const STARTING_WAR = 200_000;

export function createWorld(seed: number): WorldState {
  const { radius, hexes } = generateWorld(WORLD_RADIUS);
  const hexRecord: WorldState["hexes"] = {};
  for (const [k, h] of hexes) hexRecord[k] = h;
  return { seed, radius, tick: 0, hexes: hexRecord, plots: {}, players: {}, burned: 0 };
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

export { hexKey };
