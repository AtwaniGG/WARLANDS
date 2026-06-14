/* WARLANDS UI kit — game content & world gen.
   Names, icons, stakes, terrain colors and recipes are lifted verbatim from
   the WARLANDS prototype (src/game/*). Plain globals on window.WL. */
(function () {
  // ---- Terrain (GDD §4) ----
  const TERRAIN = {
    plains:     { name: "Basic Plot",            stake: 10000, color: "#7c8a4f", icon: "🌾", reward: 1.0, def: 1.0,  blurb: "Balanced starter land. +5% build speed.", build: ["farm","lumberCamp","quarry"] },
    forest:     { name: "Forest Plot",           stake: 12500, color: "#2f5d3a", icon: "🌲", reward: 1.1, def: 1.1,  blurb: "+15% wood, early growth, defender ambush bonus.", build: ["lumberCamp","farm","well"] },
    river:      { name: "River Plot",             stake: 15000, color: "#2c6f8c", icon: "💧", reward: 1.15, def: 1.0, blurb: "+20% food, +15% water, −10% market fees.", build: ["farm","well","lumberCamp"] },
    mountain:   { name: "Mountain Plot",          stake: 20000, color: "#6b6f78", icon: "⛰️", reward: 1.25, def: 1.3, blurb: "+25% iron, +20% stone, +30% defense.", build: ["ironMine","quarry"] },
    desert:     { name: "Oil Desert Plot",        stake: 25000, color: "#c9a14a", icon: "🛢️", reward: 1.3, def: 0.9,  blurb: "+30% oil, exposed (weak natural defense).", build: ["oilDerrick","mineralMine"] },
    coastal:    { name: "Coastal Trade Plot",     stake: 30000, color: "#3f9aa6", icon: "⚓", reward: 1.4, def: 1.0,  blurb: "−20% transport cost, sea routes, trade hub.", build: ["farm","well","mineralMine"] },
    industrial: { name: "Industrial Plot",        stake: 40000, color: "#8a5a3c", icon: "🏭", reward: 1.6, def: 1.0,  blurb: "+25% factory efficiency, +1 factory slot.", build: ["quarry","ironMine"] },
    techRuins:  { name: "Technology Ruins Plot",  stake: 50000, color: "#5b4b8a", icon: "🛸", reward: 1.8, def: 1.0,  blurb: "+30% research, +data chips, rare blueprints.", build: ["dataExcavator","mineralMine"] },
    warzone:    { name: "Warzone Plot",           stake: 60000, color: "#9c2b2b", icon: "⚔️", reward: 2.5, def: 0.9,  blurb: "+40% all yields, season-point ×2.5. No protection.", build: ["oilDerrick","ironMine","mineralMine"] },
  };

  // ---- Resources (GDD §5) ----
  const RES = {
    food:{n:"Food",i:"🌾",t:"raw"}, water:{n:"Water",i:"💧",t:"raw"}, wood:{n:"Wood",i:"🪵",t:"raw"},
    stone:{n:"Stone",i:"🪨",t:"raw"}, iron:{n:"Iron",i:"⛓️",t:"raw"}, rareMinerals:{n:"Rare Minerals",i:"💎",t:"raw"},
    oil:{n:"Oil",i:"🛢️",t:"raw"}, dataChips:{n:"Data Chips",i:"💽",t:"raw"},
    fuel:{n:"Fuel",i:"⛽",t:"intermediate"}, steel:{n:"Steel",i:"🔩",t:"intermediate"},
    electronics:{n:"Electronics",i:"🔌",t:"intermediate"}, machineParts:{n:"Machine Parts",i:"⚙️",t:"intermediate"},
    ammunition:{n:"Ammunition",i:"🧨",t:"intermediate"}, chemicals:{n:"Chemicals",i:"🧪",t:"intermediate"},
    rifles:{n:"Rifles",i:"🔫",t:"finished"}, tanks:{n:"Tanks",i:"🛡️",t:"finished"}, drones:{n:"Drones",i:"🛸",t:"finished"},
    aircraft:{n:"Aircraft",i:"✈️",t:"finished"}, turrets:{n:"Turrets",i:"🗼",t:"finished"}, buildingComponents:{n:"Building Components",i:"🧱",t:"finished"},
  };

  // ---- Buildings (GDD §6) ----
  const BUILD = {
    farm:{n:"Farm",i:"🌾",cost:200}, well:{n:"Water Well",i:"💧",cost:200}, lumberCamp:{n:"Lumber Camp",i:"🪵",cost:200},
    quarry:{n:"Quarry",i:"🪨",cost:250}, ironMine:{n:"Iron Mine",i:"⛓️",cost:400}, mineralMine:{n:"Mineral Mine",i:"💎",cost:700},
    oilDerrick:{n:"Oil Derrick",i:"🛢️",cost:800}, dataExcavator:{n:"Data Excavator",i:"💽",cost:1200},
    refinery:{n:"Refinery",i:"🏭",cost:1000}, foundry:{n:"Foundry",i:"⚒️",cost:1400},
    armsFactory:{n:"Arms Factory",i:"🔫",cost:2200}, heavyWorks:{n:"Heavy Works",i:"🛠️",cost:3500},
    electronicsLab:{n:"Electronics Lab",i:"🔬",cost:4000}, warehouse:{n:"Warehouse",i:"📦",cost:500},
  };

  // ---- Units (GDD §8) ----
  const UNITS = {
    infantry:{n:"Infantry",i:"🪖",a:10,d:12,war:20}, tanks:{n:"Tanks",i:"🛡️",a:32,d:26,war:120},
    artillery:{n:"Artillery",i:"💥",a:40,d:8,war:110}, aircraft:{n:"Aircraft",i:"✈️",a:38,d:14,war:200},
    drones:{n:"Drones",i:"🛸",a:22,d:10,war:90}, engineers:{n:"Engineers",i:"🔧",a:6,d:8,war:50},
  };

  // ---- Market reference prices ----
  const REF = { food:1.2, water:1.0, wood:1.4, stone:1.5, iron:3.1, rareMinerals:8.4, oil:4.6, dataChips:11.2,
    fuel:7.0, steel:9.5, electronics:18.0, machineParts:14.0, ammunition:6.5, chemicals:9.0,
    rifles:22.0, tanks:120.0, drones:64.0, aircraft:180.0, turrets:40.0, buildingComponents:16.0 };

  // ---- World generation (pointy-top hex, radius R) ----
  const SIZE = 26;
  function axialToPixel(q, r) {
    return { x: SIZE * Math.sqrt(3) * (q + r / 2), y: SIZE * 1.5 * r };
  }
  function ringOf(q, r) { return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2; }
  // deterministic pseudo-random
  function rng(seed) { let s = seed * 9301 + 49297; return ((s % 233280) / 233280 + 1) % 1; }

  function terrainForRing(ring, R, seed) {
    const t = ring / R; // 0 center → 1 edge
    const v = rng(seed);
    if (t > 0.78) return v < 0.6 ? "plains" : v < 0.85 ? "forest" : "river";
    if (t > 0.55) return v < 0.4 ? "forest" : v < 0.65 ? "river" : v < 0.85 ? "mountain" : "plains";
    if (t > 0.32) return v < 0.3 ? "mountain" : v < 0.55 ? "desert" : v < 0.78 ? "coastal" : "industrial";
    if (t > 0.12) return v < 0.35 ? "industrial" : v < 0.6 ? "techRuins" : v < 0.8 ? "desert" : "warzone";
    return v < 0.7 ? "warzone" : "techRuins";
  }

  function buildWorld(R) {
    const hexes = [];
    let seed = 1;
    for (let q = -R; q <= R; q++) {
      for (let r = -R; r <= R; r++) {
        if (Math.abs(q + r) > R) continue;
        const ring = ringOf(q, r);
        seed += 7;
        const terrain = terrainForRing(ring, R, seed);
        const { x, y } = axialToPixel(q, r);
        // NPC hostile camps: more common toward center
        const npc = ring < R && rng(seed * 3) < (0.06 + (1 - ring / R) * 0.16);
        hexes.push({ key: q + "," + r, q, r, ring, terrain, x, y, npc, npcTier: Math.max(1, Math.round((1 - ring / R) * 4)) });
      }
    }
    return hexes;
  }

  function zoneOf(ring, R) {
    const t = ring / R;
    if (t < 0.2) return "crucible";
    if (t > 0.8) return "newbie";
    return "mid";
  }

  window.WL = { TERRAIN, RES, BUILD, UNITS, REF, SIZE, axialToPixel, buildWorld, zoneOf, ringOf,
    fmt: (n) => Math.floor(n).toLocaleString() };
})();
