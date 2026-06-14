// World events — controlled global swing events (GDD §9 critical events, §15.3 season modifiers).
// Fire periodically, last a while, and apply world-wide economic/combat modifiers.

export interface WorldEvent {
  id: string;
  name: string;
  icon: string;
  desc: string;
  tone: "amber" | "blood" | "emerald" | "teal" | "sky";
  durationTicks: number;
  /** global production multiplier delta (added to 1.0) */
  production: number;
  /** market reference-price multiplier per tick (1.0 = neutral) */
  priceMult: number;
  /** flat combat factor bonus to the player's raids while active */
  combat: number;
}

export const EVENTS: WorldEvent[] = [
  { id: "techBoom", name: "Tech Boom", icon: "💡", desc: "Research breakthroughs lift output across the world.", tone: "amber", durationTicks: 35, production: 0.15, priceMult: 1.0, combat: 0 },
  { id: "oilCrisis", name: "Oil Crisis", icon: "🛢️", desc: "Fuel shortages choke production; prices spike.", tone: "blood", durationTicks: 30, production: -0.12, priceMult: 1.04, combat: 0 },
  { id: "bountifulHarvest", name: "Bountiful Harvest", icon: "🌾", desc: "Fertile season — extraction surges.", tone: "emerald", durationTicks: 30, production: 0.1, priceMult: 0.99, combat: 0 },
  { id: "marketCrash", name: "Market Crash", icon: "📉", desc: "Panic selling craters commodity prices.", tone: "blood", durationTicks: 25, production: 0, priceMult: 0.93, combat: 0 },
  { id: "goldRush", name: "Mineral Rush", icon: "💎", desc: "Rich strikes drive output and prices up.", tone: "amber", durationTicks: 28, production: 0.08, priceMult: 1.03, combat: 0 },
  { id: "warFervor", name: "War Fervor", icon: "🔥", desc: "Militarized fervor sharpens every offensive.", tone: "blood", durationTicks: 32, production: 0, priceMult: 1.0, combat: 0.08 },
  { id: "supplyLines", name: "Open Supply Lines", icon: "🚚", desc: "Smooth logistics: cheaper goods, steady output.", tone: "teal", durationTicks: 30, production: 0.05, priceMult: 0.96, combat: 0 },
  { id: "harshWinter", name: "Harsh Winter", icon: "❄️", desc: "Brutal cold slows extraction across the map.", tone: "sky", durationTicks: 28, production: -0.1, priceMult: 1.02, combat: 0 },
];

export const EVENT_INTERVAL_TICKS = 45; // gap between events after one ends

export function eventById(id: string | null | undefined): WorldEvent | undefined {
  return id ? EVENTS.find((e) => e.id === id) : undefined;
}

export function rollEvent(seed: number): WorldEvent {
  const i = Math.abs(Math.floor(Math.sin(seed) * 10000)) % EVENTS.length;
  return EVENTS[i];
}
