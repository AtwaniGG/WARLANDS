# WARLANDS — Design System

A field-console design system for **WARLANDS**, a persistent-world, PvP-first Web3 strategy MMO.
Players stake the native token **$WAR** to secure finite land on one shared live hex map, build
industrial-military supply chains, trade a player-driven economy, and wage war — solo or in
**Allegiances**.

The aesthetic is a **tactical command console / field map**: near-black gunmetal surfaces, an amber
command accent, blood-red hostility, teal intel, condensed stencil display type (Oswald), and
ammo-counter mono numerics. Avoid: cartoon medieval, pastel, glassy SaaS gradients, neumorphism.

> This system is reverse-engineered from the live WARLANDS codebase — tokens, fonts, components and
> screens are ported from the real app, not invented.

## Sources

- **GitHub:** [`AtwaniGG/WARLANDS`](https://github.com/AtwaniGG/WARLANDS) — Next.js 16 / React 19 /
  Tailwind v4 codebase. The design tokens here are vendored verbatim from `src/app/globals.css`;
  components are ported from `src/components/ui/*`; UI kits recreate `src/app/page.tsx` (landing) and
  `src/components/GameShell.tsx` + `HexMap` + `PlotPanel` (the game). Game data mirrors `src/game/*`.
  Icons are the project's own SVGs from `public/assets/`. **Explore this repo to go deeper** — the
  full game logic, GDD, and panel set live there.

Nothing from the repo is assumed to be accessible to the reader; everything needed is copied into
this project.

---

## CONTENT FUNDAMENTALS — how WARLANDS writes

**Voice.** Military-doctrinal, terse, confident. Reads like a field manual crossed with a tokenomics
whitepaper. Short declaratives, often fragments. *"Stake the land. Never spend it." · "Easy to
understand, brutal to master." · "The world is already at war."*

**Person.** Second person to the player as commander ("Claim your ground", "Your headquarters"),
third person for systems and factions ("Conquest transfers the right to the land"). Rarely first
person.

**Casing.**
- **Display headings & screen titles** → ALL CAPS, Oswald, tight tracking (`STAKE THE LAND`, `LIVE
  WORLD MAP`, `FINITE LAND · REAL SCARCITY`).
- **Micro-labels & stat captions** → ALL CAPS, wide tracking (`$WAR`, `STAKED`, `DEF ×1.3`, `SLOTS
  3/6`).
- **Badges / tags** → ALL CAPS (`OWNED`, `SHIELDED`, `UNDER ATTACK`, `PROTOTYPE`).
- **Body copy** → sentence case.

**Numbers.** Always mono + tabular (`48,210 $WAR`, `18d 04h 37m`, `×2.5`). Currency is suffixed
`$WAR`. Multipliers use `×`. Percentages for defense / destruction. Section markers use `01`, `02`
or `A`, `B`.

**Lexicon (use the real terms).** Stake · claim · plot · hex · Command Center / Camp (HQ) · builder ·
extractor · factory · Allegiance (clan) · raid · siege · scout · season · sink · burn · $WAR ·
trophies · shield · Crucible (high-risk center) · newbie ring (safe edge). Land is **staked, not
bought**; stake is **locked, never spent, never lootable**.

**Tone rules.** State stakes plainly ("No infinite emissions. No death spiral."). No hype emoji, no
exclamation spam. Punchy section ledes that promise depth ("Learnable in ten minutes; … take
years.").

**Emoji.** Used as **functional UI icons only** (resources, buildings, tabs, actions) — never as
decoration in prose. See ICONOGRAPHY.

---

## VISUAL FOUNDATIONS

**Color.** Dark theme only. Surfaces stack from `--panel-void` (#0C1018, app bg) → `--surface-sunken`
→ `--panel` (cards) → `--panel-2` (raised), separated by hairlines (`--hairline` #232B3A). One
**command accent: amber** (#F5B301) carries every primary CTA, selection rim, and $WAR readout.
Semantic roles: **blood** #9C2B2B (hostile/danger), **teal** #3F9AA6 (intel/info), **sky** #4A90D9
(ally/staked), **success** #34D399 (safe/shield), **warning** #FBBF24 (timer), **violet** #8B5CF6
(rare). Accent *text* colors are lifted a step for legibility on dark (`--amber-text` #FBBF24).
Nine terrain fills key the map; ownership rims (owned amber, enemy red, selected bright amber,
neutral near-black) ride the hex borders. A colorblind-safe remap (`html.cb`) swaps red→orange,
green→blue.

**Type.** Three families, no others. **Oswald** (condensed industrial grotesque) for display —
screen titles, building names, big resource readouts, the 3-star result; uppercase, tight tracking.
**Geist Sans** for body / interface. **Geist Mono** for all numerics, addresses, tx hashes —
tabular so ticking counters don't jitter. Scale runs dense: 10/11/12/13/14/16/18/20/24/32/48px.
Recipes: `.wl-label` (10px caps, wide track), `.wl-title` (uppercase Oswald), `.wl-num` (mono
tabular).

**Spacing & radii.** 8pt rhythm (4→64). Radii are **small and military** — 4px (buttons), 8px
(cards), 12px (panels), pill only for progress tracks. Nothing bubbly.

**Elevation.** Three tiers — `--shadow-1` (raised card), `--shadow-2` (floating), `--shadow-modal`
(dialog/sheet) — plus an **amber inner-glow** (`--glow-amber`) for selected/active hexes and a 2px
amber focus ring.

**Cards.** Dark `--panel` fill, 1px hairline border, 12px radius, `--shadow-1`. Optional colored
**rim** (amber/blood/sky/emerald) signals status. Header is a caps Oswald title on a slightly
darker strip; body is inset 16px.

**Backgrounds & texture.** No photography. Atmosphere is built from CSS: a faint **amber hex-grid**
overlay (`.wl-hexgrid`), a slow **radar scanline** sweep (`.wl-scanline`), a soft amber **glow**
bloom (`.wl-glow`), a 6% **film grain** (`.wl-grain`), a marching **hazard stripe** divider
(`.wl-hazard`), and a radial vignette to `#05070b` at the edges. Map terrain uses flat-fill clipped
hex SVG tiles.

**Motion & juice.** Fast and tactile — `--dur-fast` 120ms, `--dur` 200ms. `--ease-out`
cubic-bezier(.2,.8,.2,1) for most transitions; `--ease-snap` cubic-bezier(.34,1.4,.5,1) for
placement "snap" and pop. Counters count up (don't snap), timers sweep, hover lifts buttons −1px,
selected hexes lift + glow while neighbors dim. Every interactive element has tap feedback. All juice
has a `prefers-reduced-motion` / `html.rm` static fallback. **Entrance animations must keep the
visible state as the base** and animate only transform — never strand content at opacity 0.

**Hover / press.** Buttons: hover lightens fill + lifts 1px; disabled → `--disabled` grey, no
pointer. Tabs: active = solid amber on near-black, hover = raised surface. Ghost/outline use subtle
white/amber tints.

**Borders & transparency.** Hairlines everywhere (1px `--hairline`); strong borders `--border-strong`
for emphasis. Translucent dark scrims (`rgba(0,0,0,0.6)`) float map overlays; tinted accent fills
(e.g. `rgba(245,179,1,0.08)`) back amber chips. Blur is reserved for the glow bloom, not glass.

**Layout.** Mobile-first, touch-native (≥44px targets, iOS safe-area aware), scaling up to desktop
sidebars. The game shell is a fixed top HUD + horizontal tab rail + map/rail split. Explicit
zoom/recenter controls always present so map gestures never trap scroll.

---

## ICONOGRAPHY

WARLANDS uses **two cohesive icon systems**, both shipped in `assets/`:

1. **Flat-fill SVG art** (the project's own set) — gunmetal tones with a teal/amber accent, drawn on
   the same palette as the UI. Three families:
   - `assets/resources/*.svg` — **20** resource icons (raw → intermediate → finished), ~34–48px.
   - `assets/buildings/*.svg` — **15** building icons + `assets/buildings/allegiance/*.svg` (4 shared
     structures), ~34px, used as plot markers and in build menus.
   - `assets/units/*.svg` — **6** combat-unit map tokens (circular dark badge + teal rim), ~44px.
   - `assets/terrain/*.svg` — **9** pointy-top hex terrain tiles, clipped to the hex silhouette.
2. **Emoji as functional icons.** The codebase deliberately uses emoji for tabs (🗺️ 💱 🎖️ 🤝 🏆),
   actions (⚔️ ⬆ 🔭 ⚙️), and as the fallback when SVG art isn't present (`GameIcons.tsx` does exactly
   this — real art when available, emoji fallback otherwise). Emoji appear **only** in UI chrome,
   never in prose.

Map status glyphs are lightweight unicode/emoji: 🏕️ owned camp, 💀 hostile camp, ⚔ Crucible cell.
**Never hand-draw new icons** — reuse the SVG set or fall back to an emoji that matches the existing
vocabulary. There is no separate icon font.

**Brand mark.** No logo file ships in the repo — the wordmark is type: a "W" set in Oswald 800 on an
amber square, followed by `WARLANDS` in Oswald 700 with 0.2em tracking. Recreate it with markup
(see `guidelines/brand-logo.card.html`), don't rasterize.

---

## Index / manifest

**Foundations**
- `styles.css` — root entry point (import this one file). `@import`s everything below.
- `tokens/fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `terrain.css` — CSS custom
  properties + webfont loads (Oswald, Geist, Geist Mono via Google Fonts).
- `base.css` — body reset, focus ring, reduced-motion, colorblind remap, atmosphere utilities
  (`.wl-hexgrid` / `.wl-scanline` / `.wl-glow` / `.wl-grain` / `.wl-hazard`).

**Components** (`components/core/`) — ported React primitives, exposed on `window.<Namespace>`:
`Button` · `Badge` · `Panel` · `Stat` · `Tabs` · `ProgressBar` · `ResourceChip`. Each has a `.jsx`,
`.d.ts`, and `.prompt.md`; `core.card.html` is the showcase.

**UI kits**
- `ui_kits/landing/index.html` — the marketing landing page (hero, core loop, doctrine, land,
  $WAR tokenomics). Self-contained.
- `ui_kits/warroom/index.html` — the **War Room** game shell: top HUD, tab rail, interactive hex
  world map (drag/zoom/select), and the plot panel (claim land, build & upgrade, manage stockpile),
  plus Market and Army surfaces. Composes the DS primitives + `data.js` / `shell.js` / `panels.js` /
  `app.js`.

**Foundation cards** (`guidelines/*.card.html`) — specimen cards rendered in the Design System tab:
Colors (surfaces, accents, state, rims, terrain), Type (display, body, mono, recipes), Spacing
(scale, radii, elevation, motion), Brand (logo, atmosphere, resource/building/unit icons, terrain
tiles).

**Assets** (`assets/`) — resources, buildings (+ allegiance), units, terrain SVG sets. `SOURCE_README.md`
is the original repo's asset map.

---

*Built from the live WARLANDS codebase. Explore [`AtwaniGG/WARLANDS`](https://github.com/AtwaniGG/WARLANDS)
to build with deeper fidelity.*
