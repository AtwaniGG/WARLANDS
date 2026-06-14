// Hex world generation — mirrors GDD §3 (World Design).
// Axial-coordinate hex grid with a center->edge risk/reward gradient:
// outer = newbie ring (basic terrain), center = the Crucible (warzone/tech/industrial).

import { PLOT_TYPES, type TerrainId } from "./plotTypes";

export interface Hex {
  q: number;
  r: number;
  /** distance from world center in hex steps */
  ring: number;
  terrain: TerrainId;
}

export type ZoneId = "newbie" | "heartland" | "crucible";

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Axial -> pixel (pointy-top hexes). */
export function axialToPixel(q: number, r: number, size: number): { x: number; y: number } {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

/** Hex distance from origin in axial coords. */
export function hexDistance(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
}

export function zoneForRing(ring: number, radius: number): ZoneId {
  if (ring >= radius * 0.66) return "newbie";
  if (ring <= radius * 0.25) return "crucible";
  return "heartland";
}

// Deterministic hash-based pseudo-random so the world is stable across reloads.
function hash(q: number, r: number, salt: number): number {
  let h = (q * 374761393 + r * 668265263 + salt * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = (h * 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
function rand01(q: number, r: number, salt: number): number {
  return hash(q, r, salt) / 0xffffffff;
}

/**
 * Pick terrain for a hex based on its zone + clustered noise so geography
 * forms coherent regions (rivers, ranges, oil belts) rather than random soup.
 */
function pickTerrain(q: number, r: number, ring: number, radius: number): TerrainId {
  const zone = zoneForRing(ring, radius);

  // Crucible: high-value contested land.
  if (zone === "crucible") {
    const n = rand01(q, r, 11);
    if (n < 0.45) return "warzone";
    if (n < 0.7) return "techRuins";
    if (n < 0.9) return "industrial";
    return "mountain";
  }

  // Newbie ring: gentle starter land.
  if (zone === "newbie") {
    const n = rand01(q, r, 22);
    if (n < 0.5) return "plains";
    if (n < 0.8) return "forest";
    return "river";
  }

  // Heartland: full mix with coherent clustering via low-frequency noise.
  const belt = rand01(Math.floor(q / 3), Math.floor(r / 3), 33); // cluster key
  const fine = rand01(q, r, 44);
  if (belt < 0.16) return fine < 0.7 ? "river" : "coastal";
  if (belt < 0.34) return fine < 0.75 ? "forest" : "plains";
  if (belt < 0.5) return "mountain";
  if (belt < 0.64) return fine < 0.7 ? "desert" : "industrial";
  if (belt < 0.78) return fine < 0.6 ? "industrial" : "plains";
  if (belt < 0.9) return fine < 0.7 ? "plains" : "forest";
  return fine < 0.5 ? "techRuins" : "coastal";
}

export interface World {
  radius: number;
  hexes: Map<string, Hex>;
}

/** Generate a hex world of the given radius (number of rings out from center). */
export function generateWorld(radius: number): World {
  const hexes = new Map<string, Hex>();
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (hexDistance(q, r) > radius) continue;
      const ring = hexDistance(q, r);
      const terrain = pickTerrain(q, r, ring, radius);
      hexes.set(hexKey(q, r), { q, r, ring, terrain });
    }
  }
  return { radius, hexes };
}

export { PLOT_TYPES };
