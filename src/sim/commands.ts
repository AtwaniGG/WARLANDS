import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { hexKey } from "@/game/world";
import type { ResourceBag, ResourceId } from "@/game/resources";
import type { Command, CommandResult, PlacedBuilding, SimPlot, WorldState } from "./types";

function hasResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (bag[k as ResourceId] ?? 0) >= (v ?? 0));
}
function spendResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): void {
  for (const [k, v] of Object.entries(cost)) bag[k as ResourceId] = (bag[k as ResourceId] ?? 0) - (v ?? 0);
}
function fail(state: WorldState, error: string): CommandResult {
  return { state, error };
}

function stake(state: WorldState, playerId: string, q: number, r: number): CommandResult {
  const key = hexKey(q, r);
  if (state.plots[key]) return fail(state, "Hex already claimed.");
  const hex = state.hexes[key];
  if (!hex) return fail(state, "No such hex.");
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const def = PLOT_TYPES[hex.terrain];
  if (player.war < def.stake) return fail(state, `Not enough $WAR (need ${def.stake.toLocaleString()}).`);
  const claimIndex = Object.values(state.plots).filter((p) => p.owner === playerId).length + 1;
  const plot: SimPlot = {
    q,
    r,
    terrain: hex.terrain,
    owner: playerId,
    claimIndex,
    stakeLocked: def.stake,
    buildings: [{ id: "camp", level: 1 }],
    resources: { food: 100, water: 100, wood: 100, stone: 100 },
  };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: plot },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.stake } },
    },
  };
}

function build(state: WorldState, playerId: string, key: string, buildingId: PlacedBuilding["id"]): CommandResult {
  const plot = state.plots[key];
  if (!plot) return fail(state, "No plot there.");
  if (plot.owner !== playerId) return fail(state, "Not your plot.");
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const def = BUILDINGS[buildingId];
  if (!isBuildingAllowedOnTerrain(def, PLOT_TYPES[plot.terrain].produces)) {
    return fail(state, `Can't build ${def.name} on ${plot.terrain}.`);
  }
  const camp = plot.buildings.find((b) => b.id === "camp");
  const slotCap = 3 + (camp?.level ?? 1) * 2;
  if (plot.buildings.filter((b) => b.id !== "camp").length >= slotCap) return fail(state, "No free building slots.");
  if (player.war < def.baseCost) return fail(state, `Need ${def.baseCost.toLocaleString()} $WAR.`);
  if (!hasResources(plot.resources, def.baseResourceCost)) return fail(state, `Missing resources for ${def.name}.`);
  const resources = { ...plot.resources };
  spendResources(resources, def.baseResourceCost);
  const updated: SimPlot = { ...plot, resources, buildings: [...plot.buildings, { id: buildingId, level: 1 }] };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: updated },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.baseCost } },
    },
  };
}

export function applyCommand(state: WorldState, playerId: string, cmd: Command): CommandResult {
  switch (cmd.type) {
    case "stake":
      return stake(state, playerId, cmd.q, cmd.r);
    case "build":
      return build(state, playerId, cmd.key, cmd.buildingId);
    default:
      return fail(state, "Unknown command.");
  }
}
