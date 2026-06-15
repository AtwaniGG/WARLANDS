// WARLANDS War Room — game data (mirrors src/game/* from the codebase, trimmed for the kit).
// Exposed on window for the babel screen scripts.

const TERRAIN = {
  plains:     { name: "Basic Plot",            stake: 10000, color: "var(--terrain-plains)",     def: 1.0, reward: 1.0, blurb: "Balanced starter land. +5% build speed." },
  forest:     { name: "Forest Plot",           stake: 12500, color: "var(--terrain-forest)",     def: 1.1, reward: 1.1, blurb: "+15% wood, defender ambush bonus." },
  river:      { name: "River Plot",            stake: 15000, color: "var(--terrain-river)",      def: 1.0, reward: 1.15, blurb: "+20% food, +15% water, −10% market fees." },
  mountain:   { name: "Mountain Plot",         stake: 20000, color: "var(--terrain-mountain)",   def: 1.3, reward: 1.25, blurb: "+25% iron, +20% stone, +30% defense." },
  desert:     { name: "Oil Desert Plot",       stake: 25000, color: "var(--terrain-desert)",     def: 0.9, reward: 1.3, blurb: "+30% oil, exposed (weak natural defense)." },
  coastal:    { name: "Coastal Trade Plot",    stake: 30000, color: "var(--terrain-coastal)",    def: 1.0, reward: 1.4, blurb: "−20% transport cost, sea routes, trade hub." },
  industrial: { name: "Industrial Plot",       stake: 40000, color: "var(--terrain-industrial)", def: 1.0, reward: 1.6, blurb: "+25% factory efficiency, +1 factory slot." },
  techRuins:  { name: "Technology Ruins Plot", stake: 50000, color: "var(--terrain-techruins)",  def: 1.0, reward: 1.8, blurb: "+30% research, unlocks rare blueprints." },
  warzone:    { name: "Warzone Plot",          stake: 60000, color: "var(--terrain-warzone)",    def: 0.9, reward: 2.5, blurb: "+40% all yields, season ×2.5. No protection." },
};

const R = (id) => `../../assets/resources/${id}.svg`;
const B = (id) => `../../assets/buildings/${id}.svg`;
const U = (id) => `../../assets/units/${id}.svg`;

const RESOURCES = {
  food:   { name: "Food",   tier: "raw", art: R("food") },
  water:  { name: "Water",  tier: "raw", art: R("water") },
  wood:   { name: "Wood",   tier: "raw", art: R("wood") },
  stone:  { name: "Stone",  tier: "raw", art: R("stone") },
  iron:   { name: "Iron",   tier: "raw", art: R("iron") },
  oil:    { name: "Oil",    tier: "raw", art: R("oil") },
  fuel:   { name: "Fuel",   tier: "intermediate", art: R("fuel") },
  steel:  { name: "Steel",  tier: "intermediate", art: R("steel") },
  electronics: { name: "Electronics", tier: "intermediate", art: R("electronics") },
  rifles: { name: "Rifles", tier: "finished", art: R("rifles") },
  tanks:  { name: "Tanks",  tier: "finished", art: R("tanks") },
  aircraft: { name: "Aircraft", tier: "finished", art: R("aircraft") },
};

// Buildings buildable on a generic plot (subset; full set gated by terrain in the real game).
const BUILDINGS = [
  { id: "farm",        name: "Farm",          cost: 200,  art: B("farm"),        makes: "food",  kind: "extractor" },
  { id: "lumberCamp",  name: "Lumber Camp",   cost: 200,  art: B("lumberCamp"),  makes: "wood",  kind: "extractor" },
  { id: "quarry",      name: "Quarry",        cost: 250,  art: B("quarry"),      makes: "stone", kind: "extractor" },
  { id: "ironMine",    name: "Iron Mine",     cost: 400,  art: B("ironMine"),    makes: "iron",  kind: "extractor" },
  { id: "oilDerrick",  name: "Oil Derrick",   cost: 800,  art: B("oilDerrick"),  makes: "oil",   kind: "extractor" },
  { id: "refinery",    name: "Refinery",      cost: 1000, art: B("refinery"),    makes: "fuel",  kind: "factory" },
  { id: "foundry",     name: "Foundry",       cost: 1400, art: B("foundry"),     makes: "steel", kind: "factory" },
  { id: "armsFactory", name: "Arms Factory",  cost: 2200, art: B("armsFactory"), makes: "rifles",kind: "factory" },
  { id: "warehouse",   name: "Warehouse",     cost: 500,  art: B("warehouse"),   makes: null,    kind: "storage" },
];

const UNITS = {
  infantry:  { name: "Infantry",  art: U("infantry"),  atk: 10, def: 12, war: 20,  desc: "Cheap, durable garrison. Strong vs Engineers." },
  tanks:     { name: "Tanks",     art: U("tanks"),     atk: 32, def: 26, war: 120, desc: "Armored spearhead. Strong vs Infantry/Turrets." },
  artillery: { name: "Artillery", art: U("artillery"), atk: 40, def: 8,  war: 110, desc: "Siege & area damage. Strong vs Tanks/Structures." },
  aircraft:  { name: "Aircraft",  art: U("aircraft"),  atk: 38, def: 14, war: 200, desc: "Fast strike. Strong vs ground; weak vs Drones." },
  drones:    { name: "Drones",    art: U("drones"),    atk: 22, def: 10, war: 90,  desc: "Interceptor / recon. Strong vs Aircraft." },
  engineers: { name: "Engineers", art: U("engineers"), atk: 6,  def: 8,  war: 50,  desc: "Sabotage, repair, traps. Strong vs Structures." },
};

// ---- Build a small pointy-top hex world (axial coords, ring-based terrain) ----
const HEX_SIZE = 30;
function axialToPixel(q, r, size) {
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r };
}
function hexRing(q, r) { return (Math.abs(q) + Math.abs(r) + Math.abs(-q - r)) / 2; }

// Deterministic pseudo-random from coords
function rng(q, r) { const s = Math.sin(q * 127.1 + r * 311.7) * 43758.5453; return s - Math.floor(s); }

function buildWorld(radius) {
  const hexes = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const ring = hexRing(q, r);
      const v = rng(q, r);
      // inner rings = higher-tier / more hostile terrain
      let terrain;
      if (ring >= radius - 0) terrain = v < 0.5 ? "plains" : "forest";
      else if (ring >= 3) terrain = v < 0.3 ? "river" : v < 0.6 ? "forest" : "mountain";
      else if (ring === 2) terrain = v < 0.3 ? "mountain" : v < 0.55 ? "desert" : v < 0.8 ? "coastal" : "industrial";
      else if (ring === 1) terrain = v < 0.4 ? "industrial" : v < 0.75 ? "techRuins" : "warzone";
      else terrain = "warzone";
      const { x, y } = axialToPixel(q, r, HEX_SIZE);
      hexes.push({ key: `${q},${r}`, q, r, x, y, ring, terrain });
    }
  }
  return hexes;
}

window.WL_DATA = { TERRAIN, RESOURCES, BUILDINGS, UNITS, HEX_SIZE, axialToPixel, buildWorld };
