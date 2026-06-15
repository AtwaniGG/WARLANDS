import { BUILDINGS } from "@/game/buildings";
import { PLOT_TYPES } from "@/game/plotTypes";
import { productionPerTick, plotUpkeep, levelMult, diminishingReturns } from "@/game/formulas";
import { RESOURCES, type ResourceBag, type ResourceId } from "@/game/resources";
import type { SimPlot, WorldState } from "./types";
import { storageCap } from "./world";

function addRes(bag: ResourceBag, id: ResourceId, amount: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amount);
}
function hasResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): boolean {
  return Object.entries(cost).every(([k, v]) => (bag[k as ResourceId] ?? 0) >= (v ?? 0));
}
function spendResources(bag: ResourceBag, cost: Partial<Record<ResourceId, number>>): void {
  for (const [k, v] of Object.entries(cost)) bag[k as ResourceId] = (bag[k as ResourceId] ?? 0) - (v ?? 0);
}

function tickPlot(plot: SimPlot, tick: number): SimPlot {
  const terrain = PLOT_TYPES[plot.terrain];
  const cap = storageCap(plot);
  const dr = diminishingReturns(plot.claimIndex);
  const resources = { ...plot.resources };
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];

    // Extractors: raw resource gathering (§18.1)
    if (def.kind === "extractor" && def.extracts && def.baseOutput) {
      const out = productionPerTick({
        base: def.baseOutput,
        terrainMult: terrain.yields[def.extracts] ?? 1,
        level: b.level,
        workforceMult: 1,
        plotIndex: plot.claimIndex,
      });
      addRes(resources, def.extracts, out, cap);
    }

    // Factories: transform inputs -> outputs when inputs available (§6)
    if (def.kind === "factory" && b.activeProduct) {
      const product = b.activeProduct;
      const recipe = RESOURCES[product].recipe ?? {};
      const rate = (def.baseOutput ?? 1) * levelMult(b.level) * (terrain.id === "industrial" ? 1.25 : 1) * dr;
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

  const upkeep = plotUpkeep(plot.claimIndex) * plot.buildings.length;
  resources.food = Math.max(0, (resources.food ?? 0) - upkeep);
  resources.water = Math.max(0, (resources.water ?? 0) - upkeep);
  return { ...plot, resources };
}

export function applyTick(state: WorldState): WorldState {
  const plots: WorldState["plots"] = {};
  for (const [key, plot] of Object.entries(state.plots)) plots[key] = tickPlot(plot, state.tick);
  return { ...state, tick: state.tick + 1, plots };
}
