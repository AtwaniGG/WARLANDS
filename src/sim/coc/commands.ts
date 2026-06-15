import { hexKey, hexNeighbors } from "@/game/world";
import { BUILDINGS, ccTier, levelDef, maxLevelOf, STARTING_BUILDERS, STARTING_ELIXIR, STARTING_GOLD } from "./config";
import { ccLevel, freeBuilders, storageCap } from "./world";
import type { CocBase, CocBuildingId, CocCommand, CocResource, CocWorld, CommandResult, PlacedBuilding } from "./types";

function fail(state: CocWorld, error: string): CommandResult {
  return { state, error };
}

function countOf(base: CocBase, id: CocBuildingId): number {
  return Object.values(base.buildings).filter((b) => b.id === id).length;
}
function hasJobOn(base: CocBase, key: string): boolean {
  return base.jobs.some((j) => j.hexKey === key);
}
function canAfford(base: CocBase, cost: Partial<Record<CocResource, number>>): boolean {
  return base.gold >= (cost.gold ?? 0) && base.elixir >= (cost.elixir ?? 0);
}
function spend(base: CocBase, cost: Partial<Record<CocResource, number>>): { gold: number; elixir: number } {
  return { gold: base.gold - (cost.gold ?? 0), elixir: base.elixir - (cost.elixir ?? 0) };
}

function claimBase(state: CocWorld, playerId: string, q: number, r: number): CommandResult {
  if (!state.players[playerId]) return fail(state, "Unknown player.");
  if (state.bases[playerId]) return fail(state, "You already have a base.");
  const centerKey = hexKey(q, r);
  if (!state.hexes[centerKey]) return fail(state, "No such hex.");
  const cluster = [centerKey, ...hexNeighbors(q, r).map((n) => hexKey(n.q, n.r))];
  for (const k of cluster) {
    if (!state.hexes[k]) return fail(state, "Base must be fully inside the map.");
    if (state.claimedHexes[k]) return fail(state, "That land is already claimed.");
  }
  const base: CocBase = {
    owner: playerId,
    centerKey,
    ownedHexes: cluster,
    buildings: { [centerKey]: { id: "commandCenter", level: 1 } },
    gold: STARTING_GOLD,
    elixir: STARTING_ELIXIR,
    builders: STARTING_BUILDERS,
    jobs: [],
  };
  const claimedHexes = { ...state.claimedHexes };
  for (const k of cluster) claimedHexes[k] = playerId;
  return { state: { ...state, bases: { ...state.bases, [playerId]: base }, claimedHexes } };
}

function placeBuilding(state: CocWorld, playerId: string, key: string, buildingId: CocBuildingId): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  if (buildingId === "commandCenter") return fail(state, "The Command Center cannot be placed.");
  if (!base.ownedHexes.includes(key)) return fail(state, "That hex is not in your base.");
  if (base.buildings[key]) return fail(state, "That hex is already occupied.");
  const cap = ccTier(ccLevel(base)).caps[buildingId];
  if (!cap) return fail(state, "Locked at this Command Center level.");
  if (countOf(base, buildingId) >= cap.maxCount) return fail(state, "Build limit reached for this Command Center level.");
  if (freeBuilders(base) <= 0) return fail(state, "No builder is free.");
  const lv = levelDef(buildingId, 1)!;
  if (!canAfford(base, lv.cost)) {
    const need = lv.cost.gold ? "gold" : "elixir";
    return fail(state, `Not enough ${need}.`);
  }
  const { gold, elixir } = spend(base, lv.cost);
  const building: PlacedBuilding = { id: buildingId, level: 0, buffer: 0 };
  const newBase: CocBase = {
    ...base,
    gold,
    elixir,
    buildings: { ...base.buildings, [key]: building },
    jobs: [...base.jobs, { hexKey: key, buildingId, kind: "build", toLevel: 1, finishesAtTick: state.tick + lv.buildTimeSec }],
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase } } };
}

function upgradeBuilding(state: CocWorld, playerId: string, key: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const b = base.buildings[key];
  if (!b) return fail(state, "Nothing to upgrade there.");
  if (b.level < 1) return fail(state, "Still under construction.");
  if (hasJobOn(base, key)) return fail(state, "That building is busy.");
  const nextLevel = b.level + 1;
  if (nextLevel > maxLevelOf(b.id)) return fail(state, "Already at max level.");
  if (b.id !== "commandCenter") {
    const cap = ccTier(ccLevel(base)).caps[b.id];
    if (!cap || nextLevel > cap.maxLevel) return fail(state, "Upgrade the Command Center to raise the level cap.");
  }
  if (freeBuilders(base) <= 0) return fail(state, "No builder is free.");
  const lv = levelDef(b.id, nextLevel)!; // cost/time of the target level
  if (!canAfford(base, lv.cost)) {
    const need = lv.cost.gold ? "gold" : "elixir";
    return fail(state, `Not enough ${need}.`);
  }
  const { gold, elixir } = spend(base, lv.cost);
  const newBase: CocBase = {
    ...base,
    gold,
    elixir,
    jobs: [...base.jobs, { hexKey: key, buildingId: b.id, kind: "upgrade", toLevel: nextLevel, finishesAtTick: state.tick + lv.buildTimeSec }],
  };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase } } };
}

function collect(state: CocWorld, playerId: string): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  let gold = base.gold;
  let elixir = base.elixir;
  const goldCap = storageCap(base, "gold");
  const elixirCap = storageCap(base, "elixir");
  const buildings: Record<string, PlacedBuilding> = {};
  for (const [k, b] of Object.entries(base.buildings)) {
    const def = BUILDINGS[b.id];
    if (def.category === "collector" && b.level >= 1 && (b.buffer ?? 0) > 0) {
      if (def.produces === "gold") {
        const room = Math.max(0, goldCap - gold);
        const moved = Math.min(room, b.buffer ?? 0);
        gold += moved;
        buildings[k] = { ...b, buffer: (b.buffer ?? 0) - moved };
      } else {
        const room = Math.max(0, elixirCap - elixir);
        const moved = Math.min(room, b.buffer ?? 0);
        elixir += moved;
        buildings[k] = { ...b, buffer: (b.buffer ?? 0) - moved };
      }
    } else {
      buildings[k] = b;
    }
  }
  return { state: { ...state, bases: { ...state.bases, [playerId]: { ...base, gold, elixir, buildings } } } };
}

function expandCluster(state: CocWorld, playerId: string, q: number, r: number): CommandResult {
  const base = state.bases[playerId];
  if (!base) return fail(state, "You have no base.");
  const key = hexKey(q, r);
  if (!state.hexes[key]) return fail(state, "No such hex.");
  if (state.claimedHexes[key]) return fail(state, "That land is already claimed.");
  if (base.ownedHexes.length >= ccTier(ccLevel(base)).maxHexes) {
    return fail(state, "Upgrade the Command Center to expand your territory.");
  }
  const adjacent = hexNeighbors(q, r).some((n) => base.ownedHexes.includes(hexKey(n.q, n.r)));
  if (!adjacent) return fail(state, "You can only expand onto land next to your base.");
  const newBase: CocBase = { ...base, ownedHexes: [...base.ownedHexes, key] };
  return { state: { ...state, bases: { ...state.bases, [playerId]: newBase }, claimedHexes: { ...state.claimedHexes, [key]: playerId } } };
}

export function applyCommand(state: CocWorld, playerId: string, cmd: CocCommand): CommandResult {
  switch (cmd.type) {
    case "claimBase":
      return claimBase(state, playerId, cmd.q, cmd.r);
    case "placeBuilding":
      return placeBuilding(state, playerId, cmd.hexKey, cmd.buildingId);
    case "upgradeBuilding":
      return upgradeBuilding(state, playerId, cmd.hexKey);
    case "collect":
      return collect(state, playerId);
    case "expandCluster":
      return expandCluster(state, playerId, cmd.q, cmd.r);
    default:
      return fail(state, "Unknown command.");
  }
}
