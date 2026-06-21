// Player-driven marketplace — mirrors GDD §7.
// Prototype uses an AI-liquidity order book around drifting reference prices so a
// solo player can actually trade. Real game replaces AI orders with other players'.

import { RESOURCES, RESOURCE_IDS, type ResourceId } from "./resources";

/** Baseline reference price in $HEXAR per unit, derived from tier + recipe depth. */
export const BASE_PRICE: Record<ResourceId, number> = (() => {
  const p = {} as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) {
    const def = RESOURCES[id];
    let price = def.tier === "raw" ? 1 : def.tier === "intermediate" ? 4 : 14;
    // add recipe-implied cost so finished goods are pricier
    if (def.recipe) {
      price += Object.values(def.recipe).reduce((s, v) => s + (v ?? 0), 0) * 0.6;
    }
    p[id] = Math.round(price * 10) / 10;
  }
  return p;
})();

export interface MarketOrder {
  id: string;
  side: "buy" | "sell";
  item: ResourceId;
  qty: number;
  price: number; // $HEXAR per unit
  owner: "player" | "ai";
}

export const MARKET_FEE = 0.04; // 4% transaction fee (GDD §13 #2)
export const LISTING_FEE = 5; // flat $HEXAR listing fee (GDD §13 #10)
export const FEE_BURN_SHARE = 0.5; // half of fees burned, half to season pool (§12.3)

// deterministic-ish RNG for AI book generation
function mkRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Build an AI liquidity book around the given reference prices. */
export function generateBook(refPrices: Record<ResourceId, number>, seed: number): MarketOrder[] {
  const rnd = mkRand(seed);
  const orders: MarketOrder[] = [];
  let n = 0;
  for (const item of RESOURCE_IDS) {
    const ref = refPrices[item];
    // a few buy orders below ref, a few sell orders above ref (spread)
    for (let i = 0; i < 3; i++) {
      const buyPrice = Math.max(0.1, ref * (0.97 - i * 0.04 - rnd() * 0.02));
      orders.push({ id: `ai-${n++}`, side: "buy", item, qty: Math.round(20 + rnd() * 120), price: round2(buyPrice), owner: "ai" });
      const sellPrice = ref * (1.03 + i * 0.04 + rnd() * 0.02);
      orders.push({ id: `ai-${n++}`, side: "sell", item, qty: Math.round(20 + rnd() * 120), price: round2(sellPrice), owner: "ai" });
    }
  }
  return orders;
}

/** Drift reference prices slightly each tick toward a noisy random walk (market life). */
export function driftPrices(ref: Record<ResourceId, number>, tick: number): Record<ResourceId, number> {
  const rnd = mkRand(tick * 2654435761);
  const next = { ...ref };
  for (const id of RESOURCE_IDS) {
    const shock = (rnd() - 0.5) * 0.04; // ±2%
    next[id] = round2(Math.max(0.1, ref[id] * (1 + shock)));
  }
  return next;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
