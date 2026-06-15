import { PLOT_TYPES } from "@/game/plotTypes";
import { BUILDINGS, isBuildingAllowedOnTerrain } from "@/game/buildings";
import { hexKey } from "@/game/world";
import { upgradeCost } from "@/game/formulas";
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
  const placed: PlacedBuilding = {
    id: buildingId,
    level: 1,
    activeProduct: def.kind === "factory" ? def.makes?.[0] : undefined,
  };
  const updated: SimPlot = { ...plot, resources, buildings: [...plot.buildings, placed] };
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: updated },
      players: { ...state.players, [playerId]: { ...player, war: player.war - def.baseCost } },
    },
  };
}

function ownedPlot(state: WorldState, playerId: string, key: string): { plot: SimPlot } | { fail: CommandResult } {
  const plot = state.plots[key];
  if (!plot) return { fail: fail(state, "No plot there.") };
  if (plot.owner !== playerId) return { fail: fail(state, "Not your plot.") };
  return { plot };
}

function upgrade(state: WorldState, playerId: string, key: string, index: number): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const b = plot.buildings[index];
  if (!b) return fail(state, "No building at that slot.");
  const def = BUILDINGS[b.id];
  if (b.level >= def.maxLevel) return fail(state, `${def.name} is already max level.`);
  const cost = upgradeCost(def.baseCost || 200, b.level + 1);
  if (player.war < cost) return fail(state, `Need ${cost.toLocaleString()} $WAR to upgrade ${def.name}.`);
  const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, level: x.level + 1 } : x));
  return {
    state: {
      ...state,
      plots: { ...state.plots, [key]: { ...plot, buildings } },
      players: { ...state.players, [playerId]: { ...player, war: player.war - cost } },
    },
  };
}

function setProduct(state: WorldState, playerId: string, key: string, index: number, product: ResourceId): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const b = plot.buildings[index];
  if (!b) return fail(state, "No building at that slot.");
  const def = BUILDINGS[b.id];
  if (def.kind !== "factory") return fail(state, `${def.name} is not a factory.`);
  if (!def.makes?.includes(product)) return fail(state, `${def.name} can't make that.`);
  const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, activeProduct: product } : x));
  return { state: { ...state, plots: { ...state.plots, [key]: { ...plot, buildings } } } };
}

function unstake(state: WorldState, playerId: string, key: string): CommandResult {
  const got = ownedPlot(state, playerId, key);
  if ("fail" in got) return got.fail;
  const plot = got.plot;
  const player = state.players[playerId];
  if (!player) return fail(state, "Unknown player.");
  const fee = Math.round(plot.stakeLocked * 0.03); // §4.1 early-unstake sink
  const plots = { ...state.plots };
  delete plots[key];
  return {
    state: {
      ...state,
      plots,
      players: { ...state.players, [playerId]: { ...player, war: player.war + plot.stakeLocked - fee } },
      burned: (state.burned ?? 0) + fee,
    },
  };
}

export function applyCommand(state: WorldState, playerId: string, cmd: Command): CommandResult {
  switch (cmd.type) {
    case "stake":
      return stake(state, playerId, cmd.q, cmd.r);
    case "build":
      return build(state, playerId, cmd.key, cmd.buildingId);
    case "upgrade":
      return upgrade(state, playerId, cmd.key, cmd.index);
    case "setProduct":
      return setProduct(state, playerId, cmd.key, cmd.index, cmd.product);
    case "unstake":
      return unstake(state, playerId, cmd.key);
    default:
      return fail(state, "Unknown command.");
  }
}
