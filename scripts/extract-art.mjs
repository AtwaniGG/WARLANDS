// Extracts the WARLANDS SVG <symbol> sprite sheet from the design-system bundle into
// standalone, self-contained SVG files under public/assets/<group>/<id>.svg.
// - resolves CSS-var tokens (var(--x)) to literal hex from tokens/colors.css
// - inlines the shared #hx hex clipPath where used
// Run: node scripts/extract-art.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHEET = join(ROOT, "docs/design-system/guidelines/brand-sprite-sheet.html");
const COLORS = join(ROOT, "docs/design-system/tokens/colors.css");

// ---- 1. token map (resolve var() chains) ----
const css = readFileSync(COLORS, "utf8");
const raw = {};
for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) raw[m[1]] = m[2].trim();
function resolve(val, depth = 0) {
  if (depth > 10) return val;
  const m = val.match(/^var\(--([\w-]+)(?:\s*,\s*([^)]+))?\)$/);
  if (!m) return val;
  const next = raw[m[1]];
  if (next) return resolve(next, depth + 1);
  return (m[2] || "#888888").trim();
}
const token = (name) => resolve(`var(--${name})`);

// inline var(--x) / var(--x, fallback) occurrences inside an svg string
function inlineVars(svg) {
  return svg.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fb) => {
    const v = raw[name] ? resolve(raw[name]) : (fb ? fb.trim() : "#888888");
    return v;
  });
}

const html = readFileSync(SHEET, "utf8");

// ---- 2. shared hex clipPath ----
const hxMatch = html.match(/<clipPath id="hx"[\s\S]*?<\/clipPath>/);
const hxClip = hxMatch ? hxMatch[0] : "";

// ---- 3. symbol id -> output path(s) ----
const T = (id) => [`terrain/${id}`];
const U = (id) => [`units/${id}`];
const R = (id) => [`resources/${id}`];
const MAP = {
  // terrain
  "t-plains": T("plains"), "t-forest": T("forest"), "t-river": T("river"),
  "t-mountain": T("mountain"), "t-desert": T("desert"), "t-coastal": T("coastal"),
  "t-industrial": T("industrial"), "t-techruins": T("techRuins"), "t-warzone": T("warzone"),
  // units
  "u-infantry": U("infantry"), "u-tank": U("tanks"), "u-artillery": U("artillery"),
  "u-aircraft": U("aircraft"), "u-drone": U("drones"), "u-engineer": U("engineers"),
  // resources
  "r-food": R("food"), "r-water": R("water"), "r-wood": R("wood"), "r-stone": R("stone"),
  "r-iron": R("iron"), "r-rare": R("rareMinerals"), "r-oil": R("oil"), "r-data": R("dataChips"),
  "r-fuel": R("fuel"), "r-steel": R("steel"), "r-electronics": R("electronics"),
  "r-machine": R("machineParts"), "r-ammo": R("ammunition"), "r-chemicals": R("chemicals"),
  "r-rifles": R("rifles"), "r-tanks": R("tanks"), "r-drones": R("drones"),
  "r-aircraft": R("aircraft"), "r-turrets": R("turrets"), "r-bcomp": R("buildingComponents"),
  // buildings (one sprite can serve several game buildings)
  "b-hq": ["buildings/camp", "buildings/allegiance/hq"],
  "b-farm": ["buildings/farm", "buildings/well", "buildings/lumberCamp"],
  "b-mine": ["buildings/ironMine", "buildings/quarry", "buildings/mineralMine", "buildings/dataExcavator"],
  "b-derrick": ["buildings/oilDerrick"],
  "b-refinery": ["buildings/refinery"],
  "b-foundry": ["buildings/foundry"],
  "b-factory": ["buildings/armsFactory", "buildings/heavyWorks", "buildings/electronicsLab", "buildings/allegiance/factory"],
  "b-warehouse": ["buildings/warehouse"],
  "b-radar": ["buildings/allegiance/radar"],
  "b-fortress": ["buildings/allegiance/fortress"],
};

// ---- 4. extract each symbol & write ----
let count = 0;
for (const m of html.matchAll(/<symbol id="([\w-]+)"([^>]*)>([\s\S]*?)<\/symbol>/g)) {
  const [, id, attrs, inner] = m;
  const targets = MAP[id];
  if (!targets) continue;
  const vb = (attrs.match(/viewBox="([^"]+)"/) || [, "0 0 100 100"])[1];
  const needsHx = inner.includes("url(#hx)");
  const defs = needsHx && hxClip ? `<defs>${hxClip}</defs>` : "";
  let body = inlineVars(inner).trim();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${defs}${body}</svg>\n`;
  for (const t of targets) {
    const out = join(ROOT, "public/assets", `${t}.svg`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, svg);
    count++;
  }
}
console.log(`Wrote ${count} SVG assets. token sample terrain-plains=${token("terrain-plains")} sand=${token("sand")}`);
