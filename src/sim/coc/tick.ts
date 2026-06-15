import { BUILDINGS } from "./config";
import type { Army, BuildJob, CocBase, CocWorld, PlacedBuilding, TrainOrder } from "./types";

function tickBase(base: CocBase, nextTick: number): CocBase {
  const buildings: Record<string, PlacedBuilding> = {};
  for (const [key, b] of Object.entries(base.buildings)) buildings[key] = { ...b };

  // Collectors accumulate into their buffer up to bufferCap.
  for (const b of Object.values(buildings)) {
    const def = BUILDINGS[b.id];
    if (def.category === "collector" && b.level >= 1) {
      const lv = def.levels[b.level - 1];
      const cap = lv?.bufferCap ?? 0;
      const rate = lv?.producePerTick ?? 0;
      b.buffer = Math.min(cap, (b.buffer ?? 0) + rate);
    }
  }

  // Jobs whose timer elapsed complete (set level) and free their builder.
  const jobs: BuildJob[] = [];
  for (const job of base.jobs) {
    if (nextTick >= job.finishesAtTick) {
      const b = buildings[job.hexKey];
      if (b) b.level = job.toLevel;
    } else {
      jobs.push(job);
    }
  }

  // Training queue: finished orders join the army.
  const army: Army = { ...base.army };
  const trainQueue: TrainOrder[] = [];
  for (const order of base.trainQueue) {
    if (nextTick >= order.finishesAtTick) army[order.unit] = (army[order.unit] ?? 0) + 1;
    else trainQueue.push(order);
  }

  return { ...base, buildings, jobs, army, trainQueue };
}

export function applyTick(state: CocWorld): CocWorld {
  const nextTick = state.tick + 1;
  const bases: CocWorld["bases"] = {};
  for (const [owner, base] of Object.entries(state.bases)) {
    bases[owner] = tickBase(base, nextTick);
  }
  return { ...state, tick: nextTick, bases };
}
