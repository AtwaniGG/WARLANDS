/**
 * WARLANDS brand tokens — mirrored from src/app/globals.css.
 * Single source of truth so every scene stays on-brand.
 */
export const COLORS = {
  // surfaces
  panelVoid: "#0c1018",
  panel: "#12161f",
  panel2: "#1a2030",
  surfaceSunken: "#0a0d14",
  hairline: "#232b3a",
  borderStrong: "#2f3a4d",

  // accents
  amber: "#f5b301",
  amberHi: "#ffc21f",
  amberText: "#fbbf24",
  blood: "#9c2b2b",
  bloodStrong: "#dc2626",
  bloodText: "#f87171",
  teal: "#3f9aa6",
  tealText: "#5ec8d4",
  toxic: "#6ee7a8",
  emeraldText: "#34d399",
  sky: "#4a90d9",
  skyText: "#7cb3ec",
  violet: "#8b5cf6",

  // text
  textHi: "#e6e9ef",
  textLo: "#8a92a3",
  textFaint: "#5a6273",

  // ownership rims
  rimOwned: "#facc15",
  rimEnemy: "#dc2626",
  rimNeutral: "#1c2433",
  rimSelected: "#ffd24a",

  // terrain
  terrainPlains: "#7c8a4f",
  terrainForest: "#2f5d3a",
  terrainRiver: "#2c6f8c",
  terrainMountain: "#6b6f78",
  terrainDesert: "#c9a14a",
  terrainIndustrial: "#8a5a3c",

  // base environment
  gunmetal: "#2a2f3a",
  ash: "#4b515c",
  oliveDrab: "#5c6347",
  dirtBrown: "#6b5840",
} as const;

export const FONTS = {
  // set by fonts.ts loaders; fall back to system stacks
  display: '"Oswald", "Arial Narrow", sans-serif',
  ui: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

export const EASE = {
  out: [0.2, 0.8, 0.2, 1] as const,
  snap: [0.34, 1.4, 0.5, 1] as const,
};

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

/** Shared atmospheric background gradient for scenes. */
export const SCENE_BG =
  "radial-gradient(120% 100% at 50% 0%, #161b27 0%, #0c1018 55%, #070a10 100%)";
