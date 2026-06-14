// Game store — the core loop engine. Mirrors GDD §2 (Core Loop):
// stake -> claim plot -> build camp -> farm resources -> specialize -> manufacture.
// Client-side prototype: staking is mocked (no chain yet), production is tick-based.

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import {
  RESOURCES,
  type ResourceBag,
  type ResourceId,
} from "./resources";
import { PLOT_TYPES, type TerrainId } from "./plotTypes";
import {
  BUILDINGS,
  type BuildingId,
  isBuildingAllowedOnTerrain,
} from "./buildings";
import {
  productionPerTick,
  levelMult,
  upgradeCost,
  plotUpkeep,
  diminishingReturns,
} from "./formulas";
import {
  generateWorld,
  hexKey,
  zoneForRing,
  type World,
} from "./world";
import { UNITS, UNIT_IDS, armySize, type Army, type UnitId } from "./units";
import { resolveBattle, type BattleResult } from "./combat";
import {
  BASE_PRICE, generateBook, driftPrices, round2,
  MARKET_FEE, LISTING_FEE, FEE_BURN_SHARE,
  type MarketOrder,
} from "./market";
import {
  ALLEGIANCE_BUILDINGS, generateAiAllegiances, aiVotes, proposalPasses,
  type Allegiance, type GovModel, type AllegianceBuildingId, type Proposal,
} from "./allegiance";
import {
  generateEmpires,
  type Empire, type Stance,
} from "./empire";
import {
  rollRecruits, RARITY_META, xpForLevel,
  commanderCombatFactor, commanderProductionBonus, commanderScoutBonus,
  type Commander,
} from "./commanders";
import {
  TECHS, RESEARCH_RESOURCE, computeTechBonuses, canResearch,
  type TechId, type TechBonuses,
} from "./research";
import { eventById, rollEvent, EVENT_INTERVAL_TICKS } from "./events";
import { ACHIEVEMENTS, QUESTS, EMPTY_STATS, type Stats } from "./achievements";

export const WORLD_RADIUS = 9;
export const RECRUIT_REROLL_COST = 500; // §13 sink
export const TICK_MS = 1000; // 1 real second = 1 game tick (prototype speed)
export const STORAGE_BASE_CAP = 1500;
export const STARTING_WAR = 200_000; // mocked $WAR balance
export const CREATE_ALLEGIANCE_COST = 5000; // §13 #21
export const SEASON_TICKS = 300; // demo season length (GDD §15: 30 days live)

export interface SeasonState {
  index: number;
  startTick: number;
  lengthTicks: number;
  scoreEcon: number; // cumulative value of goods sold
  scoreMilitary: number; // raids/sieges won, weighted by tier
  lastPayout: number | null;
}

/** A sampled snapshot for the stats dashboard charts. */
export interface HistoryPoint {
  tick: number;
  war: number;
  staked: number;
  burned: number;
  pool: number;
  plots: number;
}

export interface AllegianceBuffs {
  production: number; // production multiplier bonus (e.g. 0.12)
  defense: number; // defense bonus
  scout: number;
  marketFeeDiscount: number; // 0..1
}

export interface PlacedBuilding {
  id: BuildingId;
  level: number;
  /** for factories: which product is currently selected to produce */
  activeProduct?: ResourceId;
}

export interface TrainOrder {
  unit: UnitId;
  ticksLeft: number;
}

export interface Plot {
  q: number;
  r: number;
  terrain: TerrainId;
  /** order in which the player claimed it (1-indexed) -> diminishing returns */
  claimIndex: number;
  stakeLocked: number;
  buildings: PlacedBuilding[];
  resources: ResourceBag;
  army: Army;
  trainQueue: TrainOrder[];
  /** 0..1 — 1.0 = full defenses */
  defensePct: number;
  status: "active" | "decaying";
  name: string;
}

/** AI-held raidable camp sitting on an unclaimed hex (single-player target). */
export interface NpcCamp {
  q: number;
  r: number;
  terrain: TerrainId;
  army: Army;
  stock: ResourceBag;
  scouted: boolean;
  defeatedAtTick: number | null; // respawn timer
  tier: number;
}

interface GameState {
  world: World;
  war: number; // mocked $WAR balance
  warStaked: number;
  warBurned: number; // total $WAR removed via sinks (GDD §13)
  seasonPool: number; // sink revenue routed to the season reward pool (GDD §12.3, §14)
  plots: Record<string, Plot>; // keyed by hexKey
  npcs: Record<string, NpcCamp>;
  refPrices: Record<ResourceId, number>;
  book: MarketOrder[];
  allegiances: Record<string, Allegiance>;
  playerAllegianceId: string | null;
  empires: Record<string, Empire>;
  commanders: Commander[]; // owned, account-permanent (GDD §8.4, §15)
  recruitPool: Commander[]; // available to recruit
  plotCommander: Record<string, string>; // hexKey -> commanderId
  unlockedTech: string[]; // researched tech ids (GDD §6.4)
  activeEventId: string | null; // current world event (GDD §9, §15.3)
  eventEndsAt: number; // tick the active event ends
  nextEventAt: number; // tick the next event may fire
  stats: Stats; // lifetime stats (permanent account layer)
  unlockedAchievements: string[]; // permanent
  completedQuests: string[]; // permanent (one-time rewards)
  history: HistoryPoint[]; // sampled time-series for charts
  season: SeasonState;
  selectedHex: string | null;
  tick: number;
  log: string[];
  battleReport: (BattleResult & { target: string }) | null;

  // selectors
  ownedPlots: () => Plot[];
  storageCap: (plot: Plot) => number;
  resourceTotal: (item: ResourceId) => number;

  // economy actions
  select: (key: string | null) => void;
  claimPlot: (q: number, r: number) => void;
  build: (key: string, buildingId: BuildingId) => void;
  upgrade: (key: string, index: number) => void;
  setFactoryProduct: (key: string, index: number, product: ResourceId) => void;
  unstake: (key: string) => void;

  // military actions
  trainUnit: (key: string, unit: UnitId) => void;
  scoutNpc: (npcKey: string, fromPlot: string) => void;
  raidNpc: (npcKey: string, fromPlot: string, army: Army, intent: "raid" | "siege") => void;
  clearReport: () => void;

  // market actions (GDD §7)
  marketBuy: (item: ResourceId, qty: number) => void;
  marketSell: (item: ResourceId, qty: number) => void;
  placeSellOrder: (item: ResourceId, qty: number, price: number) => void;

  // season actions (GDD §14-15)
  seasonScore: () => { econ: number; military: number; territory: number; allegiance: number; total: number };
  endSeason: () => void;

  // diplomacy & rival empires (GDD §10.5-10.6)
  empireAt: (key: string) => { empireId: string; empire: Empire } | null;
  setStance: (empireId: string, stance: Stance) => void;
  scoutEmpire: (empireId: string, fromPlot: string) => void;
  raidEmpire: (targetKey: string, fromPlot: string, army: Army, intent: "raid" | "siege") => void;

  // commanders (GDD §8.4)
  rerollRecruits: () => void;
  recruitCommander: (id: string) => void;
  assignCommander: (plotKey: string, commanderId: string | null) => void;

  // research (GDD §6.4)
  techBonuses: () => TechBonuses;
  research: (id: TechId) => void;

  // meta
  resetGame: () => void;

  // allegiance actions (GDD §10-11)
  allegianceBuffs: () => AllegianceBuffs;
  createAllegiance: (name: string, govModel: GovModel) => void;
  joinAllegiance: (id: string) => void;
  leaveAllegiance: () => void;
  contributeWar: (amount: number) => void;
  proposeBuilding: (building: AllegianceBuildingId) => void;
  voteProposal: (proposalId: string, support: boolean) => void;

  doTick: () => void;
}

// Deterministic NPC garrison generation: stronger + richer toward the center.
function generateNpcs(world: World): Record<string, NpcCamp> {
  const npcs: Record<string, NpcCamp> = {};
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (const hex of world.hexes.values()) {
    const zone = zoneForRing(hex.ring, world.radius);
    // density: ~18% of hexes host a camp, more common inward
    const density = zone === "crucible" ? 0.34 : zone === "heartland" ? 0.2 : 0.1;
    if (rnd() > density) continue;
    const tier = zone === "crucible" ? 3 : zone === "heartland" ? 2 : 1;
    const scale = tier;
    const army: Army = {
      infantry: Math.round((4 + rnd() * 8) * scale),
      tanks: tier >= 2 ? Math.round(rnd() * 3 * scale) : 0,
      artillery: tier >= 2 ? Math.round(rnd() * 2 * scale) : 0,
      drones: tier >= 3 ? Math.round(rnd() * 3) : 0,
    };
    const stock: ResourceBag = {
      food: Math.round(200 * scale + rnd() * 300 * scale),
      wood: Math.round(150 * scale + rnd() * 200 * scale),
      iron: Math.round(80 * scale + rnd() * 150 * scale),
      steel: tier >= 2 ? Math.round(40 * scale + rnd() * 120) : 0,
      oil: tier >= 2 ? Math.round(60 * scale + rnd() * 120) : 0,
      electronics: tier >= 3 ? Math.round(20 + rnd() * 60) : 0,
    };
    npcs[hexKey(hex.q, hex.r)] = {
      q: hex.q, r: hex.r, terrain: hex.terrain,
      army, stock, scouted: false, defeatedAtTick: null, tier,
    };
  }
  return npcs;
}

function addRes(bag: ResourceBag, id: ResourceId, amt: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amt);
}

/** Rough "richness" of a plot — total stored resources. Used to pick AI raid targets. */
function resourceWorth(plot: Plot): number {
  return Object.values(plot.resources).reduce((s, v) => s + (v ?? 0), 0);
}

/** Remove `qty` of an item from the player's plots (drawing from richest first). */
function withdrawFromPlots(state: { plots: Record<string, Plot> }, item: ResourceId, qty: number): Record<string, Plot> {
  let remaining = qty;
  const entries = Object.entries(state.plots).sort(
    (a, b) => (b[1].resources[item] ?? 0) - (a[1].resources[item] ?? 0),
  );
  const plots = { ...state.plots };
  for (const [key, plot] of entries) {
    if (remaining <= 0) break;
    const have = plot.resources[item] ?? 0;
    const take = Math.min(have, remaining);
    if (take > 0) {
      plots[key] = { ...plot, resources: { ...plot.resources, [item]: have - take } };
      remaining -= take;
    }
  }
  return plots;
}

/** Add `qty` of an item to the player's plots, respecting per-plot storage caps. */
function depositToPlots(
  state: { plots: Record<string, Plot>; storageCap: (p: Plot) => number },
  item: ResourceId,
  qty: number,
): Record<string, Plot> {
  let remaining = qty;
  const plots = { ...state.plots };
  for (const [key, plot] of Object.entries(plots)) {
    if (remaining <= 0) break;
    const cap = state.storageCap(plot);
    const free = cap - (plot.resources[item] ?? 0);
    const add = Math.min(free, remaining);
    if (add > 0) {
      plots[key] = { ...plot, resources: { ...plot.resources, [item]: (plot.resources[item] ?? 0) + add } };
      remaining -= add;
    }
  }
  return plots;
}
function hasResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (bag[k as ResourceId] ?? 0) >= (v ?? 0));
}
function spendResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): void {
  for (const [k, v] of Object.entries(cost)) bag[k as ResourceId] = (bag[k as ResourceId] ?? 0) - (v ?? 0);
}

/** The commander assigned to a plot, if any. */
function getPlotCommander(
  state: { commanders: Commander[]; plotCommander: Record<string, string> },
  plotKey: string,
): Commander | undefined {
  const id = state.plotCommander[plotKey];
  return id ? state.commanders.find((c) => c.id === id) : undefined;
}

/** Award XP to a commander and auto-level when the threshold is crossed. Returns a new array. */
function applyCommanderXp(commanders: Commander[], commanderId: string | undefined, xp: number): Commander[] {
  if (!commanderId || xp <= 0) return commanders;
  return commanders.map((c) => {
    if (c.id !== commanderId) return c;
    let level = c.level;
    let total = c.xp + xp;
    while (total >= xpForLevel(level, c.rarity) && level < 20) {
      total -= xpForLevel(level, c.rarity);
      level += 1;
    }
    return { ...c, level, xp: total };
  });
}

/** Unlock newly-earned achievements & complete quests; returns deltas + reward + messages. */
function checkProgress(state: { stats: Stats; unlockedAchievements: string[]; completedQuests: string[] }) {
  const msgs: string[] = [];
  let rewardWar = 0;
  let achChanged = false;
  let questChanged = false;
  const newAch = [...state.unlockedAchievements];
  for (const a of ACHIEVEMENTS) {
    if (!newAch.includes(a.id) && state.stats[a.stat] >= a.threshold) {
      newAch.push(a.id);
      achChanged = true;
      msgs.push(`${a.icon} Achievement unlocked: ${a.name}!`);
    }
  }
  const newQuests = [...state.completedQuests];
  for (const q of QUESTS) {
    if (!newQuests.includes(q.id) && state.stats[q.stat] >= q.target) {
      newQuests.push(q.id);
      questChanged = true;
      rewardWar += q.reward;
      msgs.push(`✅ Quest complete: ${q.name} (+${q.reward.toLocaleString()} $WAR)`);
    }
  }
  return { newAch, newQuests, rewardWar, msgs, achChanged, questChanged };
}

const INITIAL_WORLD = generateWorld(WORLD_RADIUS);

/** Fresh economic/military/season state (everything except the derived world). */
function freshState() {
  const npcs = generateNpcs(INITIAL_WORLD);
  const empires = generateEmpires(INITIAL_WORLD, new Set(Object.keys(npcs)));
  return {
    war: STARTING_WAR,
    warStaked: 0,
    warBurned: 0,
    seasonPool: 0,
    plots: {} as Record<string, Plot>,
    npcs,
    empires,
    refPrices: { ...BASE_PRICE },
    book: generateBook(BASE_PRICE, 99),
    allegiances: generateAiAllegiances(),
    playerAllegianceId: null as string | null,
    recruitPool: rollRecruits((Date.now() & 0x7fffffff) || 1),
    plotCommander: {} as Record<string, string>,
    unlockedTech: [] as string[],
    activeEventId: null as string | null,
    eventEndsAt: 0,
    nextEventAt: 25,
    history: [] as HistoryPoint[],
    season: { index: 1, startTick: 0, lengthTicks: SEASON_TICKS, scoreEcon: 0, scoreMilitary: 0, lastPayout: null as number | null },
    selectedHex: null as string | null,
    tick: 0,
    battleReport: null as (BattleResult & { target: string }) | null,
    log: ["Welcome, Commander. Stake $WAR to claim your first plot."],
  };
}

// SSR-safe storage: localStorage on the client, a no-op on the server.
const noopStorage: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
  ...freshState(),
  world: INITIAL_WORLD,
  commanders: [] as Commander[], // permanent — preserved across resetGame
  stats: { ...EMPTY_STATS }, // permanent account layer
  unlockedAchievements: [] as string[],
  completedQuests: [] as string[],

  ownedPlots: () => Object.values(get().plots),

  storageCap: (plot) => {
    const fromWarehouses = plot.buildings
      .filter((b) => b.id === "warehouse")
      .reduce((sum, b) => sum + (BUILDINGS.warehouse.capacity ?? 0) * b.level, 0);
    return STORAGE_BASE_CAP + fromWarehouses + computeTechBonuses(get().unlockedTech).storage;
  },

  resourceTotal: (item) =>
    Object.values(get().plots).reduce((s, p) => s + (p.resources[item] ?? 0), 0),

  select: (key) => set({ selectedHex: key }),

  claimPlot: (q, r) => {
    const state = get();
    const key = hexKey(q, r);
    if (state.plots[key]) return; // already owned
    const hex = state.world.hexes.get(key);
    if (!hex) return;
    const def = PLOT_TYPES[hex.terrain];
    if (state.war < def.stake) {
      set({ log: [`Not enough $WAR to stake ${def.name} (need ${def.stake.toLocaleString()}).`, ...state.log].slice(0, 50) });
      return;
    }
    const claimIndex = Object.keys(state.plots).length + 1;
    const plot: Plot = {
      q,
      r,
      terrain: hex.terrain,
      claimIndex,
      stakeLocked: def.stake,
      buildings: [{ id: "camp", level: 1 }],
      resources: { food: 100, water: 100, wood: 100, stone: 100 },
      army: {},
      trainQueue: [],
      defensePct: 1,
      status: "active",
      name: `${def.name} (${q},${r})`,
    };
    set({
      plots: { ...state.plots, [key]: plot },
      war: state.war - def.stake,
      warStaked: state.warStaked + def.stake,
      stats: { ...state.stats, plotsClaimed: state.stats.plotsClaimed + 1 },
      selectedHex: key,
      log: [`Staked ${def.stake.toLocaleString()} $WAR → claimed ${def.name}. (DR ×${diminishingReturns(claimIndex).toFixed(2)})`, ...state.log].slice(0, 50),
    });
  },

  build: (key, buildingId) => {
    const state = get();
    const plot = state.plots[key];
    if (!plot) return;
    const def = BUILDINGS[buildingId];
    const terrainProduces = PLOT_TYPES[plot.terrain].produces;
    if (!isBuildingAllowedOnTerrain(def, terrainProduces)) return;

    // building-slot cap from camp level
    const camp = plot.buildings.find((b) => b.id === "camp");
    const slotCap = 3 + (camp?.level ?? 1) * 2;
    const nonCamp = plot.buildings.filter((b) => b.id !== "camp").length;
    if (nonCamp >= slotCap) {
      set({ log: [`No free building slots. Upgrade your Camp.`, ...state.log].slice(0, 50) });
      return;
    }
    if (state.war < def.baseCost) {
      set({ log: [`Need ${def.baseCost.toLocaleString()} $WAR to build ${def.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    if (!hasResources(plot.resources, def.baseResourceCost)) {
      set({ log: [`Missing resources to build ${def.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    const resources = { ...plot.resources };
    spendResources(resources, def.baseResourceCost);
    const newBuilding: PlacedBuilding = {
      id: buildingId,
      level: 1,
      activeProduct: def.kind === "factory" ? def.makes?.[0] : undefined,
    };
    set({
      war: state.war - def.baseCost,
      plots: {
        ...state.plots,
        [key]: { ...plot, resources, buildings: [...plot.buildings, newBuilding] },
      },
      log: [`Built ${def.name} on ${plot.name}.`, ...state.log].slice(0, 50),
    });
  },

  upgrade: (key, index) => {
    const state = get();
    const plot = state.plots[key];
    if (!plot) return;
    const b = plot.buildings[index];
    if (!b) return;
    const def = BUILDINGS[b.id];
    if (b.level >= def.maxLevel) return;
    const cost = upgradeCost(def.baseCost || 200, b.level + 1);
    if (state.war < cost) {
      set({ log: [`Need ${cost.toLocaleString()} $WAR to upgrade ${def.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, level: x.level + 1 } : x));
    set({
      war: state.war - cost,
      plots: { ...state.plots, [key]: { ...plot, buildings } },
      log: [`Upgraded ${def.name} to L${b.level + 1}.`, ...state.log].slice(0, 50),
    });
  },

  setFactoryProduct: (key, index, product) => {
    const state = get();
    const plot = state.plots[key];
    if (!plot) return;
    const buildings = plot.buildings.map((x, i) => (i === index ? { ...x, activeProduct: product } : x));
    set({ plots: { ...state.plots, [key]: { ...plot, buildings } } });
  },

  unstake: (key) => {
    const state = get();
    const plot = state.plots[key];
    if (!plot) return;
    // §4.1: principal returns (minus early-unstake fee sink), plot decays.
    const fee = Math.round(plot.stakeLocked * 0.03);
    const rest = { ...state.plots };
    delete rest[key];
    set({
      plots: rest,
      war: state.war + plot.stakeLocked - fee,
      warStaked: state.warStaked - plot.stakeLocked,
      warBurned: state.warBurned + fee,
      selectedHex: state.selectedHex === key ? null : state.selectedHex,
      log: [`Unstaked ${plot.name}. Returned ${(plot.stakeLocked - fee).toLocaleString()} $WAR (3% early-unstake fee burned).`, ...state.log].slice(0, 50),
    });
  },

  // ---------- Military (GDD §8, §9) ----------
  trainUnit: (key, unit) => {
    const state = get();
    const plot = state.plots[key];
    if (!plot) return;
    const u = UNITS[unit];
    if (state.war < u.costWar) {
      set({ log: [`Need ${u.costWar} $WAR to train ${u.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    if (!hasResources(plot.resources, u.cost)) {
      set({ log: [`Missing resources to train ${u.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    const resources = { ...plot.resources };
    spendResources(resources, u.cost);
    const trainQueue = [...plot.trainQueue, { unit, ticksLeft: u.trainTicks }];
    set({
      war: state.war - u.costWar,
      warBurned: state.warBurned + Math.round(u.costWar * 0.5), // training fee partly burned (§13 #7)
      plots: { ...state.plots, [key]: { ...plot, resources, trainQueue } },
      log: [`Training ${u.name} (${u.trainTicks} ticks)…`, ...state.log].slice(0, 50),
    });
  },

  scoutNpc: (npcKey, fromPlot) => {
    const state = get();
    const npc = state.npcs[npcKey];
    const plot = state.plots[fromPlot];
    if (!npc || !plot) return;
    const cost = 50; // §13 #16 scouting sink
    if (state.war < cost) {
      set({ log: [`Need ${cost} $WAR to scout.`, ...state.log].slice(0, 50) });
      return;
    }
    set({
      war: state.war - cost,
      warBurned: state.warBurned + cost,
      npcs: { ...state.npcs, [npcKey]: { ...npc, scouted: true } },
      log: [`Scouted camp at (${npc.q},${npc.r}): ~${armySize(npc.army)} units, tier ${npc.tier}.`, ...state.log].slice(0, 50),
    });
  },

  raidNpc: (npcKey, fromPlot, army, intent) => {
    const state = get();
    const npc = state.npcs[npcKey];
    const plot = state.plots[fromPlot];
    if (!npc || !plot) return;
    if (npc.defeatedAtTick !== null) return;
    // verify the attacker actually has these units
    for (const id of UNIT_IDS) {
      if ((army[id] ?? 0) > (plot.army[id] ?? 0)) return;
    }
    if (armySize(army) === 0) {
      set({ log: ["Select units to send.", ...state.log].slice(0, 50) });
      return;
    }
    const terrain = PLOT_TYPES[npc.terrain];
    const cmd = getPlotCommander(state, fromPlot);
    const tech = get().techBonuses();
    const result = resolveBattle({
      seed: (state.tick + 1) * 2654435761 + npc.q * 40503 + npc.r,
      intent,
      attacker: army,
      defender: npc.army,
      terrainFactor: terrain.defenseMult >= 1 ? 1 + (terrain.defenseMult - 1) : terrain.defenseMult,
      scoutFactor: (npc.scouted ? 1.1 : 0.97) + commanderScoutBonus(cmd) + tech.scout,
      commanderFactor: Math.min(1.2, commanderCombatFactor(cmd, intent) * (1 + tech.combat + (eventById(get().activeEventId)?.combat ?? 0))),
      defenderStock: npc.stock,
      defensePct: 1,
    });

    // remove sent army from plot, return survivors, add loot
    const plotArmy: Army = { ...plot.army };
    for (const id of UNIT_IDS) {
      plotArmy[id] = (plotArmy[id] ?? 0) - (army[id] ?? 0) + (result.attackerSurvivors[id] ?? 0);
      if (!plotArmy[id]) delete plotArmy[id];
    }
    const cap = get().storageCap(plot);
    const resources = { ...plot.resources };
    for (const [k, v] of Object.entries(result.loot)) {
      addRes(resources, k as ResourceId, v as number, cap);
    }

    const npcs = { ...state.npcs };
    if (result.attackerWins) {
      npcs[npcKey] = { ...npc, army: {}, stock: {}, defeatedAtTick: state.tick };
    } else {
      npcs[npcKey] = { ...npc, army: result.defenderSurvivors };
    }

    set({
      npcs,
      plots: { ...state.plots, [fromPlot]: { ...plot, army: plotArmy, resources } },
      commanders: result.attackerWins ? applyCommanderXp(state.commanders, cmd?.id, npc.tier * 40) : state.commanders,
      stats: result.attackerWins
        ? { ...state.stats, raidsWon: state.stats.raidsWon + (intent === "raid" ? 1 : 0), siegesWon: state.stats.siegesWon + (intent === "siege" ? 1 : 0) }
        : state.stats,
      battleReport: { ...result, target: `Camp (${npc.q},${npc.r})` },
      season: result.attackerWins
        ? { ...state.season, scoreMilitary: state.season.scoreMilitary + npc.tier * 100 }
        : state.season,
      log: [`${intent === "siege" ? "Siege" : "Raid"} on (${npc.q},${npc.r}): ${result.summary}`, ...state.log].slice(0, 50),
    });
  },

  clearReport: () => set({ battleReport: null }),

  // ---------- Marketplace (GDD §7) ----------
  marketBuy: (item, qty) => {
    const state = get();
    if (qty <= 0) return;
    // fill against the cheapest sell orders in the book
    const sells = state.book
      .filter((o) => o.side === "sell" && o.item === item)
      .sort((a, b) => a.price - b.price);
    let remaining = qty;
    let cost = 0;
    const book = [...state.book];
    for (const o of sells) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, o.qty);
      cost += take * o.price;
      remaining -= take;
      const idx = book.findIndex((b) => b.id === o.id);
      if (take >= o.qty) book.splice(idx, 1);
      else book[idx] = { ...o, qty: o.qty - take };
    }
    const filled = qty - remaining;
    if (filled <= 0) {
      set({ log: ["No sell liquidity for that item.", ...state.log].slice(0, 50) });
      return;
    }
    const fee = Math.ceil(cost * MARKET_FEE * (1 - Math.min(0.8, get().allegianceBuffs().marketFeeDiscount + get().techBonuses().marketFee)));
    const total = Math.ceil(cost) + fee;
    if (state.war < total) {
      set({ log: [`Need ${total.toLocaleString()} $WAR (incl. ${fee} fee) to buy ${filled} ${item}.`, ...state.log].slice(0, 50) });
      return;
    }
    // deposit goods into the player's plots (fill those with free capacity first)
    const plots = depositToPlots(state, item, filled);
    set({
      book,
      plots,
      war: state.war - total,
      warBurned: state.warBurned + Math.round(fee * FEE_BURN_SHARE),
      seasonPool: state.seasonPool + (fee - Math.round(fee * FEE_BURN_SHARE)),
      stats: { ...state.stats, trades: state.stats.trades + 1 },
      log: [`Bought ${filled} ${item} for ${Math.ceil(cost).toLocaleString()} $WAR (+${fee} fee).`, ...state.log].slice(0, 50),
    });
  },

  marketSell: (item, qty) => {
    const state = get();
    if (qty <= 0) return;
    const have = get().resourceTotal(item);
    const sellQty = Math.min(qty, Math.floor(have));
    if (sellQty <= 0) {
      set({ log: [`You have no ${item} to sell.`, ...state.log].slice(0, 50) });
      return;
    }
    // fill against the highest buy orders
    const buys = state.book
      .filter((o) => o.side === "buy" && o.item === item)
      .sort((a, b) => b.price - a.price);
    let remaining = sellQty;
    let revenue = 0;
    const book = [...state.book];
    for (const o of buys) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, o.qty);
      revenue += take * o.price;
      remaining -= take;
      const idx = book.findIndex((b) => b.id === o.id);
      if (take >= o.qty) book.splice(idx, 1);
      else book[idx] = { ...o, qty: o.qty - take };
    }
    const sold = sellQty - remaining;
    if (sold <= 0) {
      set({ log: ["No buy liquidity for that item.", ...state.log].slice(0, 50) });
      return;
    }
    const fee = Math.ceil(revenue * MARKET_FEE * (1 - Math.min(0.8, get().allegianceBuffs().marketFeeDiscount + get().techBonuses().marketFee)));
    const net = Math.floor(revenue) - fee;
    const plots = withdrawFromPlots(state, item, sold);
    set({
      book,
      plots,
      war: state.war + net,
      warBurned: state.warBurned + Math.round(fee * FEE_BURN_SHARE),
      seasonPool: state.seasonPool + (fee - Math.round(fee * FEE_BURN_SHARE)),
      season: { ...state.season, scoreEcon: state.season.scoreEcon + net },
      stats: { ...state.stats, trades: state.stats.trades + 1 },
      log: [`Sold ${sold} ${item} for ${net.toLocaleString()} $WAR (after ${fee} fee).`, ...state.log].slice(0, 50),
    });
  },

  placeSellOrder: (item, qty, price) => {
    const state = get();
    const have = get().resourceTotal(item);
    if (qty <= 0 || have < qty) {
      set({ log: [`Not enough ${item} to list ${qty}.`, ...state.log].slice(0, 50) });
      return;
    }
    if (state.war < LISTING_FEE) return;
    const plots = withdrawFromPlots(state, item, qty);
    const order: MarketOrder = { id: `p-${state.tick}-${Math.random().toString(36).slice(2, 7)}`, side: "sell", item, qty, price: round2(price), owner: "player" };
    set({
      book: [...state.book, order],
      plots,
      war: state.war - LISTING_FEE,
      warBurned: state.warBurned + LISTING_FEE, // listing fee burned (§13 #10)
      log: [`Listed ${qty} ${item} @ ${round2(price)} $WAR (−${LISTING_FEE} listing fee).`, ...state.log].slice(0, 50),
    });
  },

  // ---------- Seasons (GDD §14-15) ----------
  seasonScore: () => {
    const state = get();
    // territory = time-weighted control proxy: sum of plot reward multipliers
    const territory = Object.values(state.plots).reduce(
      (s, p) => s + PLOT_TYPES[p.terrain].rewardMult * 20,
      0,
    );
    const a = state.playerAllegianceId ? state.allegiances[state.playerAllegianceId] : null;
    const allegiance = a ? (a.members.find((m) => m.isPlayer)?.contribution ?? 0) : 0;
    const econ = state.season.scoreEcon;
    const military = state.season.scoreMilitary;
    return { econ, military, territory, allegiance, total: econ + military + territory + allegiance };
  },

  endSeason: () => {
    const state = get();
    const score = get().seasonScore();
    // §18.10 reward share vs AI competitors (top-heavy p=1.5), funded ONLY by seasonPool (§12.2)
    const p = 1.5;
    const aiScores = [score.total * 1.3, score.total * 0.9, score.total * 0.6, score.total * 0.4];
    const denom = Math.pow(score.total, p) + aiScores.reduce((s, v) => s + Math.pow(Math.max(v, 1), p), 0);
    const share = denom > 0 ? Math.pow(score.total, p) / denom : 0;
    const payout = Math.floor(state.seasonPool * share);

    set({
      war: state.war + payout,
      seasonPool: state.seasonPool - payout, // remainder rolls into next season's pool
      stats: { ...state.stats, seasonsPlayed: state.stats.seasonsPlayed + 1 },
      season: {
        index: state.season.index + 1,
        startTick: state.tick,
        lengthTicks: SEASON_TICKS,
        scoreEcon: 0,
        scoreMilitary: 0,
        lastPayout: payout,
      },
      // new map opens: refresh hostile camps & market liquidity (player keeps plots/stake & account progression)
      npcs: generateNpcs(state.world),
      log: [
        `🏆 Season ${state.season.index} ended. Reward share ${(share * 100).toFixed(1)}% → +${payout.toLocaleString()} $WAR (from sink-funded pool).`,
        ...state.log,
      ].slice(0, 50),
    });
  },

  // ---------- Diplomacy & rival empires (GDD §10.5-10.6) ----------
  empireAt: (key) => {
    const empires = get().empires;
    for (const e of Object.values(empires)) {
      if (e.plots[key]) return { empireId: e.id, empire: e };
    }
    return null;
  },

  setStance: (empireId, stance) => {
    const state = get();
    const e = state.empires[empireId];
    if (!e) return;
    const verb = stance === "war" ? "declared WAR on" : stance === "ally" ? "allied with" : "made peace with";
    set({
      empires: { ...state.empires, [empireId]: { ...e, stance } },
      log: [`Diplomacy: you ${verb} ${e.name}.`, ...state.log].slice(0, 50),
    });
  },

  scoutEmpire: (empireId, fromPlot) => {
    const state = get();
    const e = state.empires[empireId];
    if (!e || !state.plots[fromPlot]) return;
    const cost = 80;
    if (state.war < cost) {
      set({ log: [`Need ${cost} $WAR to run espionage.`, ...state.log].slice(0, 50) });
      return;
    }
    set({
      war: state.war - cost,
      warBurned: state.warBurned + cost,
      empires: { ...state.empires, [empireId]: { ...e, scouted: true } },
      log: [`Espionage on ${e.name}: ${Object.keys(e.plots).length} territories revealed.`, ...state.log].slice(0, 50),
    });
  },

  raidEmpire: (targetKey, fromPlot, army, intent) => {
    const state = get();
    const found = get().empireAt(targetKey);
    const plot = state.plots[fromPlot];
    if (!found || !plot) return;
    const { empireId, empire } = found;
    const target = empire.plots[targetKey];
    if (!target) return;
    for (const id of UNIT_IDS) {
      if ((army[id] ?? 0) > (plot.army[id] ?? 0)) return;
    }
    if (armySize(army) === 0) {
      set({ log: ["Select units to send.", ...state.log].slice(0, 50) });
      return;
    }

    const terrain = PLOT_TYPES[target.terrain];
    const cmd = getPlotCommander(state, fromPlot);
    const tech = get().techBonuses();
    const result = resolveBattle({
      seed: (state.tick + 1) * 40503 + target.q * 31 + target.r * 7,
      intent,
      attacker: army,
      defender: target.garrison,
      terrainFactor: terrain.defenseMult >= 1 ? terrain.defenseMult : 1 - (1 - terrain.defenseMult) * 0.5,
      scoutFactor: (empire.scouted ? 1.1 : 0.97) + commanderScoutBonus(cmd) + tech.scout,
      commanderFactor: Math.min(1.2, commanderCombatFactor(cmd, intent) * (1 + tech.combat + (eventById(get().activeEventId)?.combat ?? 0))),
      defenderStock: target.stock,
      defensePct: 1,
    });

    // attacking an empire forces a state of war
    const empires = { ...state.empires };
    const e = { ...empire, stance: "war" as Stance, plots: { ...empire.plots } };

    // return survivors to the launching plot, deduct sent army
    const plotArmy: Army = { ...plot.army };
    for (const id of UNIT_IDS) {
      plotArmy[id] = (plotArmy[id] ?? 0) - (army[id] ?? 0) + (result.attackerSurvivors[id] ?? 0);
      if (!plotArmy[id]) delete plotArmy[id];
    }
    const cap = get().storageCap(plot);
    const resources = { ...plot.resources };
    for (const [k, v] of Object.entries(result.loot)) addRes(resources, k as ResourceId, v as number, cap);

    if (result.attackerWins) {
      if (intent === "siege") {
        // conquer the territory: empire loses the plot
        delete e.plots[targetKey];
      } else {
        // raid: garrison depleted, stock looted
        e.plots[targetKey] = { ...target, garrison: result.defenderSurvivors, stock: {} };
      }
    } else {
      e.plots[targetKey] = { ...target, garrison: result.defenderSurvivors };
    }

    // eliminate empire if it lost all territory
    if (Object.keys(e.plots).length === 0) {
      delete empires[empireId];
      set({
        empires,
        plots: { ...state.plots, [fromPlot]: { ...plot, army: plotArmy, resources } },
        commanders: applyCommanderXp(state.commanders, cmd?.id, empire.tier * 80),
        stats: { ...state.stats, empiresEliminated: state.stats.empiresEliminated + 1, siegesWon: state.stats.siegesWon + (intent === "siege" ? 1 : 0), raidsWon: state.stats.raidsWon + (intent === "raid" ? 1 : 0) },
        battleReport: { ...result, target: empire.name },
        season: { ...state.season, scoreMilitary: state.season.scoreMilitary + empire.tier * 250 },
        log: [`💀 ${empire.name} has been eliminated!`, ...state.log].slice(0, 50),
      });
      return;
    }
    empires[empireId] = e;

    set({
      empires,
      plots: { ...state.plots, [fromPlot]: { ...plot, army: plotArmy, resources } },
      commanders: result.attackerWins ? applyCommanderXp(state.commanders, cmd?.id, empire.tier * 60) : state.commanders,
      stats: result.attackerWins
        ? { ...state.stats, raidsWon: state.stats.raidsWon + (intent === "raid" ? 1 : 0), siegesWon: state.stats.siegesWon + (intent === "siege" ? 1 : 0) }
        : state.stats,
      battleReport: { ...result, target: `${empire.name} (${target.q},${target.r})` },
      season: result.attackerWins
        ? { ...state.season, scoreMilitary: state.season.scoreMilitary + empire.tier * 120 }
        : state.season,
      log: [`${intent === "siege" ? "Siege" : "Raid"} vs ${empire.name}: ${result.summary}`, ...state.log].slice(0, 50),
    });
  },

  // ---------- Commanders (GDD §8.4) ----------
  rerollRecruits: () => {
    const state = get();
    if (state.war < RECRUIT_REROLL_COST) {
      set({ log: [`Need ${RECRUIT_REROLL_COST} $WAR to recruit new candidates.`, ...state.log].slice(0, 50) });
      return;
    }
    set({
      war: state.war - RECRUIT_REROLL_COST,
      warBurned: state.warBurned + RECRUIT_REROLL_COST,
      recruitPool: rollRecruits((state.tick + 1) * 7919 + (Date.now() & 0xffff)),
      log: [`New commander candidates available.`, ...state.log].slice(0, 50),
    });
  },

  recruitCommander: (id) => {
    const state = get();
    const c = state.recruitPool.find((x) => x.id === id);
    if (!c) return;
    const cost = RARITY_META[c.rarity].recruitCost;
    if (state.war < cost) {
      set({ log: [`Need ${cost.toLocaleString()} $WAR to recruit ${c.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    set({
      war: state.war - cost,
      warBurned: state.warBurned + Math.round(cost * 0.5),
      commanders: [...state.commanders, c],
      stats: { ...state.stats, commandersRecruited: state.stats.commandersRecruited + 1 },
      recruitPool: state.recruitPool.filter((x) => x.id !== id),
      log: [`Recruited ${c.icon} ${c.name} (${c.rarity}).`, ...state.log].slice(0, 50),
    });
  },

  assignCommander: (plotKey, commanderId) => {
    const state = get();
    const pc = { ...state.plotCommander };
    // a commander serves one plot at a time
    if (commanderId) {
      for (const k of Object.keys(pc)) if (pc[k] === commanderId) delete pc[k];
      pc[plotKey] = commanderId;
    } else {
      delete pc[plotKey];
    }
    set({ plotCommander: pc });
  },

  // ---------- Research (GDD §6.4) ----------
  techBonuses: () => computeTechBonuses(get().unlockedTech),

  research: (id) => {
    const state = get();
    if (!canResearch(state.unlockedTech, id)) return;
    const t = TECHS[id];
    const haveData = get().resourceTotal(RESEARCH_RESOURCE);
    if (state.war < t.costWar || haveData < t.costData) {
      set({ log: [`Need ${t.costWar.toLocaleString()} $WAR + ${t.costData} Data Chips to research ${t.name}.`, ...state.log].slice(0, 50) });
      return;
    }
    const plots = withdrawFromPlots(state, RESEARCH_RESOURCE, t.costData);
    set({
      plots,
      war: state.war - t.costWar,
      warBurned: state.warBurned + Math.round(t.costWar * 0.5),
      unlockedTech: [...state.unlockedTech, id],
      stats: { ...state.stats, techsResearched: state.stats.techsResearched + 1 },
      log: [`🔬 Researched ${t.name} (${t.branch}).`, ...state.log].slice(0, 50),
    });
  },

  resetGame: () => {
    // commanders are permanent (GDD §15) — freshState omits them so they survive.
    set({ ...freshState(), log: ["New world generated. Stake $WAR to claim your first plot."] });
  },

  // ---------- Allegiances (GDD §10-11) ----------
  allegianceBuffs: () => {
    const state = get();
    const a = state.playerAllegianceId ? state.allegiances[state.playerAllegianceId] : null;
    const buffs: AllegianceBuffs = { production: 0, defense: 0, scout: 0, marketFeeDiscount: 0 };
    if (!a) return buffs;
    for (const b of a.buildings) {
      if (b === "research") buffs.production += 0.12;
      if (b === "fortress") buffs.defense += 0.15;
      if (b === "radar") buffs.scout += 0.1;
      if (b === "tradeHub") buffs.marketFeeDiscount += 0.25;
    }
    return buffs;
  },

  createAllegiance: (name, govModel) => {
    const state = get();
    if (state.playerAllegianceId) return;
    if (state.war < CREATE_ALLEGIANCE_COST) {
      set({ log: [`Need ${CREATE_ALLEGIANCE_COST.toLocaleString()} $WAR to found an Allegiance.`, ...state.log].slice(0, 50) });
      return;
    }
    const id = `player-${state.tick}`;
    const allegiance: Allegiance = {
      id, name: name || "My Allegiance", govModel,
      members: [{ name: "You", isPlayer: true, contribution: 100, archetype: "warlord", role: "founder" }],
      treasuryWar: 0, treasuryRes: {}, buildings: ["hq"], proposals: [], isPlayerOwned: true,
    };
    set({
      allegiances: { ...state.allegiances, [id]: allegiance },
      playerAllegianceId: id,
      war: state.war - CREATE_ALLEGIANCE_COST,
      warBurned: state.warBurned + CREATE_ALLEGIANCE_COST,
      log: [`Founded Allegiance "${allegiance.name}" (${govModel}). −${CREATE_ALLEGIANCE_COST.toLocaleString()} $WAR.`, ...state.log].slice(0, 50),
    });
  },

  joinAllegiance: (id) => {
    const state = get();
    if (state.playerAllegianceId) return;
    const a = state.allegiances[id];
    if (!a) return;
    const updated: Allegiance = {
      ...a,
      members: [...a.members, { name: "You", isPlayer: true, contribution: 50, archetype: "warlord", role: "member" }],
    };
    set({
      allegiances: { ...state.allegiances, [id]: updated },
      playerAllegianceId: id,
      log: [`Joined "${a.name}".`, ...state.log].slice(0, 50),
    });
  },

  leaveAllegiance: () => {
    const state = get();
    const id = state.playerAllegianceId;
    if (!id) return;
    const a = state.allegiances[id];
    const allegiances = { ...state.allegiances };
    if (a.isPlayerOwned) delete allegiances[id];
    else allegiances[id] = { ...a, members: a.members.filter((m) => !m.isPlayer) };
    set({ allegiances, playerAllegianceId: null, log: [`Left "${a.name}".`, ...state.log].slice(0, 50) });
  },

  contributeWar: (amount) => {
    const state = get();
    const id = state.playerAllegianceId;
    if (!id || amount <= 0 || state.war < amount) return;
    const a = state.allegiances[id];
    const members = a.members.map((m) => (m.isPlayer ? { ...m, contribution: m.contribution + amount / 100 } : m));
    set({
      war: state.war - amount,
      allegiances: { ...state.allegiances, [id]: { ...a, treasuryWar: a.treasuryWar + amount, members } },
      log: [`Contributed ${amount.toLocaleString()} $WAR to the treasury (+${(amount / 100).toFixed(0)} CS).`, ...state.log].slice(0, 50),
    });
  },

  proposeBuilding: (building) => {
    const state = get();
    const id = state.playerAllegianceId;
    if (!id) return;
    const a = state.allegiances[id];
    const def = ALLEGIANCE_BUILDINGS[building];
    if (a.buildings.includes(building)) {
      set({ log: [`${def.name} already built.`, ...state.log].slice(0, 50) });
      return;
    }
    const proposal: Proposal = {
      id: `prop-${state.tick}-${building}`,
      kind: "build",
      label: `Build ${def.name} (${def.cost.toLocaleString()} $WAR from treasury)`,
      payload: { building },
      votesFor: 0, votesAgainst: 0, playerVoted: false,
      closesAtTick: state.tick + 8, resolved: false,
    };
    set({
      allegiances: { ...state.allegiances, [id]: { ...a, proposals: [proposal, ...a.proposals] } },
      log: [`Proposed: ${proposal.label}. Vote now.`, ...state.log].slice(0, 50),
    });
  },

  voteProposal: (proposalId, support) => {
    const state = get();
    const id = state.playerAllegianceId;
    if (!id) return;
    const a = state.allegiances[id];
    const proposals = a.proposals.map((p) => {
      if (p.id !== proposalId || p.playerVoted || p.resolved) return p;
      const weight = a.govModel === "weighted" ? Math.max(1, Math.round((a.members.find((m) => m.isPlayer)?.contribution ?? 50) / 100)) : 1;
      return {
        ...p,
        playerVoted: true,
        votesFor: p.votesFor + (support ? weight : 0),
        votesAgainst: p.votesAgainst + (support ? 0 : weight),
      };
    });
    set({ allegiances: { ...state.allegiances, [id]: { ...a, proposals } } });
  },

  doTick: () => {
    const state = get();
    const buffs = get().allegianceBuffs();
    const tech = computeTechBonuses(state.unlockedTech);
    const evt = eventById(state.activeEventId);
    const evtProd = evt ? evt.production : 0;
    const plots = { ...state.plots };
    const plotList = Object.values(plots);
    const empLog: string[] = []; // empire-AI messages collected this tick

    for (const plot of plotList) {
      const cap = get().storageCap(plot);
      const resources = { ...plot.resources };
      const terrain = PLOT_TYPES[plot.terrain];
      const dr = diminishingReturns(plot.claimIndex);
      const cmdProd = commanderProductionBonus(getPlotCommander(state, plot.q + "," + plot.r)); // Quartermaster (§8.4)

      // count factory product lines for specialization focus
      let producedAnything = false;

      for (const b of plot.buildings) {
        const def = BUILDINGS[b.id];

        // ---- Extractors: raw resource gathering (§18.1) ----
        if (def.kind === "extractor" && def.extracts && def.baseOutput) {
          const terrainMult = terrain.yields[def.extracts] ?? 1;
          const out = productionPerTick({
            base: def.baseOutput,
            terrainMult,
            level: b.level,
            workforceMult: Math.max(0.1, 1 + buffs.production + cmdProd + tech.production + evtProd), // Allegiance + Commander + Tech + Event
            plotIndex: plot.claimIndex,
          });
          addRes(resources, def.extracts, out, cap);
          producedAnything = true;
        }

        // ---- Factories: transform inputs -> outputs if inputs available (§6) ----
        if (def.kind === "factory" && b.activeProduct) {
          const product = b.activeProduct;
          const recipe = RESOURCES[product].recipe ?? {};
          const rate = (def.baseOutput ?? 1) * levelMult(b.level) * (terrain.id === "industrial" ? 1.25 : 1) * dr * Math.max(0.1, 1 + buffs.production + cmdProd + tech.production + evtProd);
          // produce as many whole units as inputs allow, up to rate
          const batches = Math.floor(rate);
          const frac = rate - batches;
          let made = 0;
          for (let i = 0; i < batches; i++) {
            if (!hasResources(resources, recipe)) break;
            spendResources(resources, recipe);
            addRes(resources, product, 1, cap);
            made++;
          }
          // fractional progress: probabilistic last unit using deterministic-ish tick noise
          if (frac > 0 && hasResources(resources, recipe) && (state.tick % Math.round(1 / Math.max(frac, 0.01))) === 0) {
            spendResources(resources, recipe);
            addRes(resources, product, 1, cap);
            made++;
          }
          if (made > 0) producedAnything = true;
        }
      }

      // ---- Training queue: resolve finished units (§8) ----
      const army: Army = { ...plot.army };
      const trainQueue: typeof plot.trainQueue = [];
      for (const order of plot.trainQueue) {
        if (order.ticksLeft <= 1) {
          army[order.unit] = (army[order.unit] ?? 0) + 1;
        } else {
          trainQueue.push({ ...order, ticksLeft: order.ticksLeft - 1 });
        }
      }

      // ---- Upkeep: food + water consumed (§5.3, §16.2) ----
      const upkeep = plotUpkeep(plot.claimIndex) * plot.buildings.length;
      resources.food = Math.max(0, (resources.food ?? 0) - upkeep);
      resources.water = Math.max(0, (resources.water ?? 0) - upkeep);

      // starvation softly degrades defense (encourages a food economy)
      let defensePct = plot.defensePct;
      const maxDefense = 1 + buffs.defense; // Allegiance Fortress raises the cap (§10.3)
      if ((resources.food ?? 0) <= 0 || (resources.water ?? 0) <= 0) {
        defensePct = Math.max(0.3, defensePct - 0.01);
      } else if (defensePct < maxDefense) {
        defensePct = Math.min(maxDefense, defensePct + 0.005);
      }

      plots[plot.q + "," + plot.r] = { ...plot, resources, defensePct, army, trainQueue };
      void producedAnything;
    }

    // ---- Market life (GDD §7): prices drift, AI liquidity refreshes, limit orders fill ----
    const nextTick = state.tick + 1;
    const refPrices = driftPrices(state.refPrices, nextTick);
    // world events nudge prices each tick
    if (evt && evt.priceMult !== 1) {
      for (const k of Object.keys(refPrices) as ResourceId[]) {
        refPrices[k] = Math.round(Math.max(0.1, refPrices[k] * evt.priceMult) * 100) / 100;
      }
    }
    let book = state.book;
    let marketWar = 0;
    let marketBurn = 0;
    let marketPool = 0;

    // passively fill the player's limit sell orders when priced at/under market
    book = book.flatMap((o) => {
      if (o.owner !== "player" || o.side !== "sell") return [o];
      if (o.price <= refPrices[o.item] * 1.02) {
        const take = Math.min(o.qty, Math.ceil(o.qty * 0.34) + 5); // partial fill
        const revenue = take * o.price;
        const fee = Math.ceil(revenue * MARKET_FEE);
        marketWar += Math.floor(revenue) - fee;
        marketBurn += Math.round(fee * FEE_BURN_SHARE);
        marketPool += fee - Math.round(fee * FEE_BURN_SHARE);
        return take >= o.qty ? [] : [{ ...o, qty: o.qty - take }];
      }
      return [o];
    });

    // refresh AI liquidity every 12 ticks (keep player orders)
    if (nextTick % 12 === 0) {
      const playerOrders = book.filter((o) => o.owner === "player");
      book = [...generateBook(refPrices, nextTick), ...playerOrders];
    }

    // ---- Allegiance governance: resolve proposals whose voting window closed (§11) ----
    let allegiances = state.allegiances;
    const pid = state.playerAllegianceId;
    if (pid && allegiances[pid]) {
      const a = allegiances[pid];
      let changed = false;
      let treasuryWar = a.treasuryWar;
      const newBuildings = [...a.buildings];
      const proposals = a.proposals.map((p) => {
        if (p.resolved || nextTick < p.closesAtTick) return p;
        const ai = aiVotes(a);
        const tallied = { ...p, votesFor: p.votesFor + ai.forVotes, votesAgainst: p.votesAgainst + ai.againstVotes };
        const passed = proposalPasses(a, tallied);
        let didApply = passed;
        if (passed && p.kind === "build" && p.payload?.building) {
          const cost = ALLEGIANCE_BUILDINGS[p.payload.building].cost;
          if (treasuryWar >= cost && !newBuildings.includes(p.payload.building)) {
            treasuryWar -= cost;
            newBuildings.push(p.payload.building);
          } else {
            didApply = false;
          }
        }
        changed = true;
        return { ...tallied, resolved: true, passed: didApply };
      });
      if (changed) {
        allegiances = { ...allegiances, [pid]: { ...a, proposals, treasuryWar, buildings: newBuildings } };
      }
    }

    // ---- Rival empires: passive regen + war retaliation (GDD §10.5) ----
    let empires = state.empires;
    {
      const empCopy: typeof empires = {};
      let empChanged = false;
      const playerKeys = Object.keys(plots);
      for (const [eid, e] of Object.entries(state.empires)) {
        const ne = { ...e, plots: { ...e.plots } };
        // light passive regrowth of garrisons every 10 ticks
        if (nextTick % 10 === 0) {
          for (const [k, ep] of Object.entries(ne.plots)) {
            ne.plots[k] = { ...ep, garrison: { ...ep.garrison, infantry: (ep.garrison.infantry ?? 0) + e.tier } };
          }
          empChanged = true;
        }
        // war retaliation: strike the player's richest plot
        if (e.stance === "war" && nextTick % 5 === 0 && playerKeys.length > 0) {
          const r = ((nextTick * 9301 + e.tier * 49297) % 233280) / 233280;
          if (r < 0.5) {
            const strike: Army = {};
            for (const ep of Object.values(e.plots)) {
              for (const id of UNIT_IDS) strike[id] = (strike[id] ?? 0) + Math.floor((ep.garrison[id] ?? 0) * 0.2);
            }
            if (armySize(strike) > 0) {
              const targetKey = playerKeys
                .slice()
                .sort((a, b) => resourceWorth(plots[b]) - resourceWorth(plots[a]))[0];
              const tp = plots[targetKey];
              const terrain = PLOT_TYPES[tp.terrain];
              const res = resolveBattle({
                seed: nextTick * 131 + e.tier * 17,
                intent: "raid",
                attacker: strike,
                defender: tp.army,
                terrainFactor: terrain.defenseMult,
                defenderStock: tp.resources,
                defensePct: tp.defensePct,
              });
              if (res.attackerWins) {
                const looted = { ...tp.resources };
                for (const [k, v] of Object.entries(res.loot)) {
                  looted[k as ResourceId] = Math.max(0, (looted[k as ResourceId] ?? 0) - (v as number));
                }
                plots[targetKey] = { ...tp, resources: looted, army: res.defenderSurvivors };
                empLog.unshift(`⚠️ ${e.name} raided ${tp.name} and stole resources!`);
              } else {
                plots[targetKey] = { ...tp, army: res.defenderSurvivors };
                empLog.unshift(`🛡️ You repelled a raid from ${e.name}.`);
              }
            }
          }
        }
        empCopy[eid] = ne;
      }
      if (empChanged || Object.values(state.empires).some((e) => e.stance === "war")) {
        empires = empCopy;
      }
    }

    // NPC camps respawn 60 ticks after defeat (regenerated by deterministic gen seed)
    const npcs = { ...state.npcs };
    let respawned = false;
    const fresh = generateNpcs(state.world);
    for (const [k, npc] of Object.entries(npcs)) {
      if (npc.defeatedAtTick !== null && state.tick - npc.defeatedAtTick >= 60) {
        if (fresh[k]) { npcs[k] = { ...fresh[k] }; respawned = true; }
      }
    }

    // World events: expire the current one or fire a new one after the cooldown (GDD §9, §15.3)
    let activeEventId = state.activeEventId;
    let eventEndsAt = state.eventEndsAt;
    let nextEventAt = state.nextEventAt;
    const eventMsgs: string[] = [];
    if (activeEventId && nextTick >= eventEndsAt) {
      const ended = eventById(activeEventId);
      if (ended) eventMsgs.push(`${ended.icon} ${ended.name} has ended.`);
      activeEventId = null;
      nextEventAt = nextTick + EVENT_INTERVAL_TICKS;
    } else if (!activeEventId && nextTick >= nextEventAt) {
      const e = rollEvent(nextTick + 0.5);
      activeEventId = e.id;
      eventEndsAt = nextTick + e.durationTicks;
      eventMsgs.push(`${e.icon} World Event: ${e.name} — ${e.desc}`);
    }

    // Achievements & quests (GDD §2 cadences)
    const prog = checkProgress(state);

    // Sample the macro time-series every 5 ticks for the stats dashboard.
    const newWar = state.war + marketWar + prog.rewardWar;
    let history = state.history;
    if (nextTick % 5 === 0) {
      const point: HistoryPoint = {
        tick: nextTick,
        war: newWar,
        staked: state.warStaked,
        burned: state.warBurned + marketBurn,
        pool: state.seasonPool + marketPool,
        plots: Object.keys(plots).length,
      };
      history = [...state.history, point].slice(-48);
    }

    const marketLog = marketWar > 0 ? [`Market: limit orders filled for +${marketWar.toLocaleString()} $WAR.`] : [];
    const nextLog = prog.msgs.length || eventMsgs.length || empLog.length || marketLog.length
      ? [...prog.msgs, ...eventMsgs, ...empLog, ...marketLog, ...state.log].slice(0, 50)
      : state.log;

    set({
      plots,
      npcs: respawned ? npcs : state.npcs,
      allegiances,
      empires,
      tick: nextTick,
      refPrices,
      book,
      activeEventId,
      eventEndsAt,
      nextEventAt,
      war: state.war + marketWar + prog.rewardWar,
      warBurned: state.warBurned + marketBurn,
      seasonPool: state.seasonPool + marketPool,
      unlockedAchievements: prog.achChanged ? prog.newAch : state.unlockedAchievements,
      completedQuests: prog.questChanged ? prog.newQuests : state.completedQuests,
      history,
      season: marketWar > 0 ? { ...state.season, scoreEcon: state.season.scoreEcon + marketWar } : state.season,
      log: nextLog,
    });

    // Auto-resolve the season when its window closes (GDD §15)
    const s = get().season;
    if (nextTick - s.startTick >= s.lengthTicks) {
      get().endSeason();
    }
  },
    }),
    {
      name: "warlands-save-v1",
      version: 1,
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
      skipHydration: true, // we rehydrate manually on the client to avoid SSR mismatch
      // Persist only serializable game state — the hex `world` is deterministic and regenerated.
      partialize: (s) => ({
        war: s.war,
        warStaked: s.warStaked,
        warBurned: s.warBurned,
        seasonPool: s.seasonPool,
        plots: s.plots,
        npcs: s.npcs,
        refPrices: s.refPrices,
        book: s.book,
        allegiances: s.allegiances,
        playerAllegianceId: s.playerAllegianceId,
        empires: s.empires,
        commanders: s.commanders,
        recruitPool: s.recruitPool,
        plotCommander: s.plotCommander,
        unlockedTech: s.unlockedTech,
        activeEventId: s.activeEventId,
        eventEndsAt: s.eventEndsAt,
        nextEventAt: s.nextEventAt,
        stats: s.stats,
        unlockedAchievements: s.unlockedAchievements,
        completedQuests: s.completedQuests,
        history: s.history,
        season: s.season,
        selectedHex: s.selectedHex,
        tick: s.tick,
        log: s.log,
      }),
    },
  ),
);
