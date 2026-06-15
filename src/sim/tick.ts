import { BUILDINGS } from "@/game/buildings";
import { PLOT_TYPES } from "@/game/plotTypes";
import { productionPerTick, plotUpkeep } from "@/game/formulas";
import type { ResourceId } from "@/game/resources";
import type { SimPlot, WorldState } from "./types";
import { storageCap } from "./world";

function addRes(bag: SimPlot["resources"], id: ResourceId, amount: number, cap: number): void {
  bag[id] = Math.min(cap, (bag[id] ?? 0) + amount);
}

function tickPlot(plot: SimPlot): SimPlot {
  const terrain = PLOT_TYPES[plot.terrain];
  const cap = storageCap(plot);
  const resources = { ...plot.resources };
  for (const b of plot.buildings) {
    const def = BUILDINGS[b.id];
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
  }
  const upkeep = plotUpkeep(plot.claimIndex) * plot.buildings.length;
  resources.food = Math.max(0, (resources.food ?? 0) - upkeep);
  resources.water = Math.max(0, (resources.water ?? 0) - upkeep);
  return { ...plot, resources };
}

export function applyTick(state: WorldState): WorldState {
  const plots: WorldState["plots"] = {};
  for (const [key, plot] of Object.entries(state.plots)) plots[key] = tickPlot(plot);
  return { ...state, tick: state.tick + 1, plots };
}
