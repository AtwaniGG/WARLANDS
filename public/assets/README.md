# WARLANDS — Art Assets Drop Zone

Unzip your design assets here. Anything in `public/` is served at the site root,
so `public/assets/terrain/mountain.png` → `/assets/terrain/mountain.png`.

**Use these exact filenames** (they match the IDs in `src/game/*`) and the components
can be wired to them with zero guesswork. PNG with alpha unless noted.

```
public/assets/
├── brand/
│   ├── logo.svg            wordmark + mark (horizontal)
│   ├── mark.svg            icon-only
│   ├── war-token.svg       $WAR coin/sigil
│   └── og.png              social card 1200×630
│
├── terrain/                # hex tiles — 256×256, seamless (GDD §4 ids)
│   ├── plains.png   forest.png   river.png   mountain.png
│   ├── desert.png   coastal.png  industrial.png  techRuins.png
│   └── warzone.png
│
├── buildings/              # 128×128, 3/4 view (GDD §6 building ids)
│   ├── camp.png  farm.png  well.png  lumberCamp.png  quarry.png
│   ├── ironMine.png  mineralMine.png  oilDerrick.png  dataExcavator.png
│   ├── refinery.png  foundry.png  armsFactory.png  heavyWorks.png
│   ├── electronicsLab.png  warehouse.png
│   └── allegiance/         hq.png fortress.png tradeHub.png radar.png
│                           research.png factory.png shield.png
│
├── units/                  # 96×96 map tokens (GDD §8 unit ids)
│   ├── infantry.png  tanks.png  artillery.png
│   └── aircraft.png  drones.png  engineers.png
│
├── resources/              # 48×48 icons (GDD §5 resource ids)
│   ├── food.png water.png wood.png stone.png iron.png
│   ├── rareMinerals.png oil.png dataChips.png
│   ├── fuel.png steel.png electronics.png machineParts.png
│   ├── ammunition.png chemicals.png
│   └── rifles.png tanks.png drones.png aircraft.png turrets.png
│       buildingComponents.png
│
├── ui/                     # panels, buttons, frames, fog-of-war, cursors
└── keyart/                 # hero / splash / marketing images
```

### After you drop them in
Tell me and I'll wire the components to use the images:
- terrain → `HexMap` tiles (currently flat colors)
- buildings → `PlotPanel` / map building markers (currently emoji)
- units → `MilitaryPanel` / `BattleReport` (currently emoji)
- resources → resource chips everywhere (currently emoji)
- brand/keyart → landing page (`src/app/page.tsx`)

If your zip uses different names, just drop it in `public/assets/` as-is and I'll map
whatever's inside to the in-game IDs.
