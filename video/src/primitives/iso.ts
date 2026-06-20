/** Isometric (2:1) projection helpers shared by IsoTile / IsoBuilding. */
export const TILE_W = 140;
export const TILE_H = 70; // 2:1

export type Pt = { x: number; y: number };

/** Grid (col,row) → screen center, relative to an origin. */
export function isoPos(col: number, row: number, origin: Pt): Pt {
  return {
    x: origin.x + (col - row) * (TILE_W / 2),
    y: origin.y + (col + row) * (TILE_H / 2),
  };
}

/** Diamond corners for a tile centered at (cx,cy). Returns SVG points string. */
export function diamond(cx: number, cy: number, w = TILE_W, h = TILE_H): string {
  const hw = w / 2;
  const hh = h / 2;
  return `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
}

/** Shade a hex color by a multiplier (0..2). */
export function shade(hex: string, mul: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * mul));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * mul));
  const b = Math.min(255, Math.round((n & 255) * mul));
  return `rgb(${r},${g},${b})`;
}
