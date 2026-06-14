# WARLANDS — Master Design & Art Prompt

> Paste any section into Claude (or an image/design model). Run the **Art Direction Bible**
> first as the system context, then any **Module** as the task. Everything below is the
> single source of truth for the WARLANDS visual identity. Pairs with `docs/GDD.md`.

---

## 0. ROLE & MISSION (system context — always include this)

> **You are the Art Director, Brand Designer, and UI/UX Systems Designer for WARLANDS** — a
> persistent, PvP-first Web3 strategy MMO on a shared hex world map (Red Alert × Command &
> Conquer × EVE Online × Travian). Players stake a token (`$WAR`) to secure finite land,
> build industrial-military supply chains, trade on a player-driven market, and wage war in
> Allegiances. Your job is to produce a cohesive, AAA-quality visual identity and a complete,
> production-ready asset library and design system. Every asset must be **instantly readable
> on a dense, zoomed-out strategy map**, **internally consistent**, and **free of generic
> "AI slop" aesthetics** (no aimless glow, no melting detail, no centered-subject default, no
> rainbow gradients). Favor strong silhouettes, restrained palettes, intentional negative
> space, and physical material honesty.

---

## 1. ART DIRECTION BIBLE (the constitution — run before any module)

### 1.1 Vision statement
Gritty, militarized near-future realism — **lightly stylized for readability**, not photoreal.
A weathered, lived-in war economy: rust, oil, concrete, sandbags, rebar, scorched earth,
diesel smoke, cold steel. The mood is tense geopolitics and industrial scale, not heroic
sci-fi. Think a satellite/recon aesthetic up close to a tabletop war-map feel zoomed out.

### 1.2 Style pillars
1. **Silhouette-first.** Every unit, building, and icon must be identifiable as a black
   silhouette at 32px. Form before detail.
2. **Dieselpunk near-future.** Tracked armor, prop+jet aircraft, recon drones, radar dishes,
   EMP arrays, prefab factories — plausible, mechanical, no glowing magic.
3. **Color = information.** Saturation is a UI signal, not decoration (see palette). The
   world is desaturated; meaning is carried by a few high-chroma accents.
4. **Material honesty.** Metal reads as metal, concrete as concrete, dirt as dirt. PBR-plausible.
5. **Tactical clarity over spectacle.** Readability and faction/terrain legibility always win.

### 1.3 Core palette (use these exact tokens everywhere)
```
BASE / ENVIRONMENT
  gunmetal      #2a2f3a    ash         #4b515c    olive-drab  #5c6347
  sand          #c9a14a    concrete    #8b8f96    dirt-brown  #6b5840
UI SURFACES
  panel-void    #0c1018    panel       #12161f    panel-2     #1a2030
  hairline      #232b3a    text-hi     #e6e9ef    text-lo     #8a92a3
SEMANTIC ACCENTS (high-chroma, used sparingly = "signal")
  amber/own     #f5b301   (owned land, economy, primary CTA, $WAR)
  blood/war     #9c2b2b   (warzone, combat, danger, enemy)
  teal/trade    #3f9aa6   (coastal, market, logistics, info)
  toxic/tech    #6ee7a8   (technology, EMP, research, "active")
  sky/ally      #4a90d9   (allegiance, defense, scouting)
  violet/rare   #8b5cf6   (rare/legendary, tech ruins, premium)
STATE
  success #34d399   warning #fbbf24   error #ef4444   disabled #3a4150
```
Rule of thumb: **≤ 2 accent colors per composition.** The map is gunmetal/sand/olive; amber
marks yours, red marks war, everything else is muted.

### 1.4 Typography
- **Display / headings:** a condensed, slightly industrial grotesque (stencil-adjacent but
  legible) — e.g. "Saira Condensed", "Oswald", or a military-stencil for big titles only.
- **UI / body:** a clean geometric/neo-grotesque sans (e.g. "Inter", "Geist") — high legibility.
- **Numbers / stats / readouts:** a monospace (e.g. "Geist Mono", "JetBrains Mono") — all
  resource counts, prices, timers, power ratings. Tabular figures, always.
- Hierarchy: ALL-CAPS condensed for section labels; sentence case for content.

### 1.5 Materials & texture language
Weathered painted steel, raw rusted iron, poured concrete, sandbag canvas, oil-stained dirt,
cracked asphalt, camo netting, hazard stripes (amber/black), stencil unit IDs, riveted plate,
exposed rebar, blast scoring. Subtle grain/noise overlay on everything; never clean vector flatness.

### 1.6 Lighting & atmosphere
- Primary: low-angle directional "recon" light (long shadows) for hero/key art.
- Map: soft top-down ambient with a faint warm key from the NW; readable shadows for relief.
- Atmosphere tools: diesel haze, dust, oil smoke, radar sweep glow, muzzle flash, EMP arc.
- Time-of-day variants for seasons: dawn amber, harsh noon, dusk red, overcast war-grey.

### 1.7 Readability & composition rules
- Hex tiles tile seamlessly; terrain identity lives in **silhouette + 1 signal color**, not clutter.
- Buildings sit in the hex with a consistent footprint, drop shadow, and a 3/4 "billboard" angle.
- Owned assets get a thin amber rim; enemy a red rim; neutral a hairline.
- Never rely on color alone (accessibility): pair color with icon/shape/pattern.

### 1.8 Anti-patterns (hard NOs)
No generic neon cyberpunk, no fantasy magic FX, no glossy mobile-cartoon gloss, no centered
floating subject on gradient, no lens-flare spam, no illegible over-detail, no five-accent
rainbows, no AI-melted text or hands, no stocky "hero pose" defaults.

---

## 2. DELIVERABLE MODULES

> Each module = a runnable task. For **every asset**, output: (a) a tight, model-ready image
> prompt (subject · angle · style · palette tokens · lighting · background · resolution &
> transparency), and (b) a one-line rationale for map/UI readability. Respect the Output
> Contract in §3.

### M1 — Brand & Identity
- Primary **logo lockup** (wordmark "WARLANDS" + mark) — horizontal, stacked, and icon-only.
- **App icon / favicon** (works at 16px to 1024px; must read as a single silhouette).
- **`$WAR` token mark** (coin/sigil; circular; mono and full-color; on-chain/explorer use).
- **Allegiance default crest** template; **season badge** frame template.
- Logo usage: clear space, min sizes, monochrome/inverse, on-dark/on-light, do/don'ts.

### M2 — World & Terrain (GDD §3–4)
Top-down, seamlessly tileable pointy-top hex tiles, consistent scale, subtle grain, soft NW key light.
For each: base tile + an "owned" amber-rim variant + a "contested/warzone overlay" variant.
1. **Plains/Basic** — dry grass, dirt tracks (neutral). 2. **Forest** — dense canopy, ambush cover.
3. **River** — flowing water, fords/banks, +trade. 4. **Mountain** — rock ridges, defensible.
5. **Oil Desert** — dunes, derrick spots, oil sheen. 6. **Coastal** — shoreline, docks, sea edge.
7. **Industrial** — slabs, pipes, smokestacks. 8. **Technology Ruins** — broken arcologies, violet glow.
9. **Warzone** — cratered, scorched, blood-red signal, wreckage.
Plus: **biome transition edges** (forest→plains, desert→coast, etc.), **rivers/ranges as
connected chains**, **fog-of-war** treatment (explored-but-dark vs unscouted), **road/trade-route
overlays**, **region/territory border styling** (allegiance-colored), **center→edge gradient**
(newbie ring muted → "the Crucible" center, intense red).

### M3 — Buildings (GDD §6, §10.3)
3/4 billboard angle, consistent footprint + drop shadow, **3 level tiers** each (L1 humble →
L3 fortified), plus **under-construction** and **damaged/raided** states.
Economy: Camp/HQ, Farm, Water Well, Lumber Camp, Quarry, Iron Mine, Mineral Mine, Oil Derrick,
Data Excavator, Refinery, Foundry, Arms Factory, Heavy Works, Electronics Lab, Warehouse.
Allegiance (regional, larger, imposing): Headquarters, Fortress, Trade Hub, Radar Network,
Research Center, Alliance Factory, Shield Network.
Each must telegraph its function via silhouette (derrick = pumpjack, radar = dish, foundry = smokestacks).

### M4 — Units (GDD §8)
Silhouette-first sprite sheets; **idle / move / attack / death** frames; top-down map token +
larger battle-card portrait; **3 quality tiers** (basic/veteran/elite via insignia, not recolor spam).
Classes: Infantry, Tanks, Artillery, Aircraft, Drones, Engineers. Each silhouette must be
distinguishable from the others at 24px (the counter system depends on instant ID). Include a
**counter-relationship cheat-sheet graphic** (who beats whom) using shape+arrow, not just color.

### M5 — Resource Icons (GDD §5)
Flat-with-grain, 2-tone + 1 accent, crisp at 24px, consistent grid/weight, rounded-square chips.
Raw (8): Food, Water, Wood, Stone, Iron, Rare Minerals, Oil, Data Chips.
Intermediate (6): Fuel, Steel, Electronics, Machine Parts, Ammunition, Chemicals.
Finished (6): Rifles, Tanks, Drones, Aircraft, Turrets, Building Components.
Tier is signaled by a consistent frame treatment (raw = plain, intermediate = bracketed,
finished = bordered/badged). Also a **supply-chain graph** infographic linking inputs→outputs.

### M6 — Combat & FX (GDD §8–9)
Explosions (small/large/oil-fire), tracer/muzzle flash, artillery impact, **EMP arc** (toxic-green),
**energy shield** (sky-blue hex shimmer), **ambush/critical** flash, **rout** (fleeing dust),
weather overlays (rain, fog, dust storm, snow), **scorched-earth raze** decal, scout/recon ping,
blockade marker, sabotage spark. Keep FX legible (additive but restrained), never obscuring units.

### M7 — UI/UX Design System (the product skin)
**Design tokens** (color/space/radius/elevation/typescale) → **component library** → **screens**.
- Tokens: spacing scale, radii (4/8/12), elevation/shadows, focus ring (amber), motion easing.
- Components: buttons (primary amber / secondary / danger / ghost), inputs/steppers, chips/badges,
  tabs, tables/order-book rows, cards, modals, tooltips, toasts, progress/upkeep bars, sliders,
  segmented controls, dropdowns, empty states, loading skeletons, confirmation dialogs.
- HUD: top resource/$WAR bar, tick/season clock, notifications, event log.
- Screens (desktop + mobile): World map view + plot inspector, Build/Upgrade panel, Factory/queue,
  Military/train + raid planner, **Battle Report**, **Marketplace order book**, Contracts,
  **Allegiance overview / treasury / governance vote**, **Season ladder & rewards**, Wallet/stake,
  Diplomacy, Profile, Settings (incl. accessibility).
Deliver as a Figma-style spec: states (default/hover/active/focus/disabled), responsive rules,
and a written component API per element.

### M8 — Map HUD, Minimap & Data-Viz
Minimap with region/allegiance coloring, ownership heatmap, threat/scout overlays, trade-route
lines, season-control choropleth. Charts for market price history, economy dashboards, power
ratings. All using the palette tokens, mono numerals, dark surfaces.

### M9 — Cosmetics & Allegiance Emblem System (GDD §13 C-tier, §10)
Non-P2W vanity: base skins, unit skins, victory animations, profile frames, banners, titles,
HQ throne-room decor, map-marker/emote packs, prestige nameplates. Plus a **procedural
Allegiance emblem generator** spec: shield shapes × charges (wolf/anvil/star/oil-drop/gear) ×
2-color schemes from the palette, with layout rules so any combo looks intentional.

### M10 — Commanders & Portraits (GDD §8.4, account-permanent)
Hero "commander" portraits (bust framing, recon-lit, gritty, diverse), rarity frames
(common→legendary via violet/gold), and a small set of **skill/ability icons**.

### M11 — Marketing & Key Art
- **Hero key art:** "the Crucible" — a contested central warzone hex, armies converging, oil
  fires, radar sweeps, amber dusk; cinematic, painterly-but-grounded.
- App-store screenshots (with UI), social cards (OG image 1200×630), banners, trailer keyframes,
  season-launch posters, "land rush" teaser. Each with headline-space composition (not centered).

### M12 — Landing / Web3 Site
Dark, tactical, conversion-focused landing page design: hero, "how it works" (stake→build→raid),
tokenomics/sink-flow infographic, live-world teaser, roadmap, FAQ, wallet-connect CTA. Section
layouts, component usage, and motion notes. Must feel like the game, not a generic crypto site.

### M13 — Onboarding & Tutorial
First-session flow visuals: tutorial sandbox plot, guided tooltips, "claim your first land"
moment, beginner-protection shield treatment, empty-state coaching, contextual hints.

### M14 — Motion & Animation
Micro-interactions (button press, resource tick, claim confirm), map transitions, march/caravan
movement, battle-report reveal, season-end ceremony, shield activation. Easing curves, durations,
and "juice" guidelines that stay tasteful and performant (mobile-first 60fps).

### M15 — Audio & Music Direction (brief, not assets)
Sonic identity: industrial-military ambient, diesel/metal foley, radar pings, distant artillery,
UI clicks (mechanical), tense strategic score with escalation for war windows, victory/defeat
stingers, season-launch theme. Provide a written audio style guide + per-event SFX list.

### M16 — Accessibility & Localization
Colorblind-safe variants (deuteranopia/protanopia/tritanopia) for all semantic colors paired with
shape/pattern; min contrast AA+; scalable text; reduced-motion mode; RTL-ready layouts; icon-first
labels so the UI survives long German/expanded strings; localization-safe component sizing.

---

## 3. OUTPUT CONTRACT (how to respond)

For each requested asset, return a table/row with:
1. **Asset name + ID** (e.g. `M4-tank-elite`).
2. **Model-ready prompt** — `subject · angle/framing · style cues · palette tokens · lighting ·
   background · negative prompt · resolution/aspect · transparency (PNG alpha y/n)`.
3. **Specs** — pixel size(s), safe area, file format, naming convention (`warlands_<module>_<asset>_<state>@2x.png`).
4. **Readability rationale** — one line: how it reads at map zoom / 24px / on dark UI.
5. When relevant, **variants** (states/tiers/themes) as sub-rows.

Default specs unless told otherwise: hex tiles 256×256 (and 512 @2x) seamless; building/unit
tokens 128×128 PNG-alpha; battle portraits 512×512; resource icons 48×48 (and 24 hinting);
key art 2560×1440; social 1200×630; UI at 8px grid, light-on-dark. Provide an **asset manifest**
(CSV-style list) at the end of each module for pipeline import.

---

## 4. GLOBAL CONSTRAINTS (repeat in every task)

- Stay inside the §1.3 palette; ≤ 2 accent colors per composition.
- Silhouette-readable at 32px; never rely on color alone.
- Consistent scale, footprint, light direction, and grain across a module.
- Material honesty; dieselpunk near-future; no fantasy/neon/cartoon gloss.
- Cohesion with sibling assets > individual flair.
- No P2W-signaling on gameplay assets; cosmetics may be flashier but stay on-brand.

---

## 5. QUICK-START RECIPES

- **Whole identity:** run §0 + §1, then M1 → M7 in order (brand → world → buildings → units →
  icons → FX → UI). That yields a shippable visual core.
- **Single image (e.g. Midjourney/DALL·E):** take §1.3 palette + §1.6 lighting + the specific
  asset line from a module, and ask only for the **model-ready prompt** (skip specs/manifest).
- **Marketing push:** §0 + §1 + M1 + M11 + M12.
- **Storefront/launch:** M1 + M9 (emblems) + M11 + M13.
