import { BUILDINGS } from "@/game/buildings";
import { PLOT_TYPES } from "@/game/plotTypes";
import { productionPerTick, plotUpkeep, levelMult, diminishingReturns } from "@/game/formulas";
import { RESOURCES, type ResourceBag, type ResourceId } from "@/game/resources";
import { driftPrices } from "@/game/market";
import type { Army } from "@/game/units";
import type { SimPlot, TrainOrder, WorldState } from "./types";
import { storageCap } from "./world";
import { allegianceBuffs, resolveProposals } from "./allegiance";

function addRes(bag: ResourceBag, id: ResourceId, amount: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amount);
}
function hasResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (bag[k as ResourceId] ?? 0) >= (v ?? 0));
}
function spendResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): void {
  for (const [k, v] of Object.entries(cost)) bag[k as ResourceId] = (bag[k as ResourceId] ?? 0) - (v ?? 0);
}

function tickPlot(plot: SimPlot, tick: number, prodBuff: number, defBuff: number): SimPlot {
  const terrain = PLOT_TYPES[plot.terrain];
  const cap = storageCap(plot);
  const dr = diminishingReturns(plot.claimIndex);
  const workforceMult = Math.max(0.1, 1 + prodBuff); // allegiance research buff
  const resources = { ...plot.resources };
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];

    // Extractors: raw resource gathering (§18.1)
    if (def.kind === "extractor" && def.extracts && def.baseOutput) {
      const out = productionPerTick({
        base: def.baseOutput,
        terrainMult: terrain.yields[def.extracts] ?? 1,
        level: b.level,
        workforceMult,
        plotIndex: plot.claimIndex,
      });
      addRes(resources, def.extracts, out, cap);
    }

    // Factories: transform inputs -> outputs when inputs available (§6)
    if (def.kind === "factory" && b.activeProduct) {
      const product = b.activeProduct;
      const recipe = RESOURCES[product].recipe ?? {};
      const rate = (def.baseOutput ?? 1) * levelMult(b.level) * (terrain.id === "industrial" ? 1.25 : 1) * dr * workforceMult;
      const batches = Math.floor(rate);
      const frac = rate - batches;
      for (let i = 0; i < batches; i++) {
        if (!hasResources(resources, recipe)) break;
        spendResources(resources, recipe);
        addRes(resources, product, 1, cap);
      }
      // deterministic fractional batch: fire on a tick cadence derived from frac
      if (frac > 0 && hasResources(resources, recipe) && tick % Math.round(1 / Math.max(frac, 0.01)) === 0) {
        spendResources(resources, recipe);
        addRes(resources, product, 1, cap);
      }
    }
  }

  // Training queue: finished orders join the army (§8)
  const army: Army = { ...(plot.army ?? {}) };
  const trainQueue: TrainOrder[] = [];
  for (const order of plot.trainQueue ?? []) {
    if (order.ticksLeft <= 1) army[order.unit] = (army[order.unit] ?? 0) + 1;
    else trainQueue.push({ ...order, ticksLeft: order.ticksLeft - 1 });
  }

  const upkeep = plotUpkeep(plot.claimIndex) * plot.buildings.length;
  resources.food = Math.max(0, (resources.food ?? 0) - upkeep);
  resources.water = Math.max(0, (resources.water ?? 0) - upkeep);

  // Defense regen / starvation decay (§5.3, §16.2); allegiance fortress raises the cap
  const maxDefense = 1 + defBuff;
  let defensePct = plot.defensePct ?? 1;
  if ((resources.food ?? 0) <= 0 || (resources.water ?? 0) <= 0) defensePct = Math.max(0.3, defensePct - 0.01);
  else if (defensePct < maxDefense) defensePct = Math.min(maxDefense, defensePct + 0.005);

  return { ...plot, resources, army, trainQueue, defensePct };
}

export function applyTick(state: WorldState): WorldState {
  // precompute each player's allegiance buffs once per tick
  const buffByPlayer: Record<string, { production: number; defense: number }> = {};
  for (const pid of Object.keys(state.players)) {
    const b = allegianceBuffs(state, pid);
    buffByPlayer[pid] = { production: b.production, defense: b.defense };
  }
  const plots: WorldState["plots"] = {};
  for (const [key, plot] of Object.entries(state.plots)) {
    const buff = buffByPlayer[plot.owner] ?? { production: 0, defense: 0 };
    plots[key] = tickPlot(plot, state.tick, buff.production, buff.defense);
  }
  // Market life: reference prices drift each tick (book persists).
  const market = { ...state.market, refPrices: driftPrices(state.market.refPrices, state.tick + 1) };

  // Governance: resolve allegiance proposals whose voting window has closed.
  const nextTick = state.tick + 1;
  let burned = state.burned ?? 0;
  let allegiances = state.allegiances;
  for (const [aid, ally] of Object.entries(state.allegiances)) {
    const due = ally.proposals?.some((p) => !p.resolved && nextTick >= p.closesAtTick);
    if (!due) continue;
    const { ally: resolved, spent } = resolveProposals(ally, nextTick);
    if (allegiances === state.allegiances) allegiances = { ...state.allegiances };
    allegiances[aid] = resolved;
    burned += spent;
  }

  return { ...state, tick: nextTick, plots, market, allegiances, burned };
}
