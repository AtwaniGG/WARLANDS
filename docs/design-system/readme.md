# WARLANDS — Design System

> Gritty, militarized near-future realism — lightly stylized for tactical readability.
> A weathered, lived-in war economy on a shared hex world map: rust, oil, concrete,
> sandbags, cold steel. Tense geopolitics and industrial scale, not heroic sci-fi.

**WARLANDS** is a persistent-world, PvP-first **Web3 strategy MMO**. Players stake a
native token (`$WAR`) to secure finite land on one shared live hex map, build
industrial-military supply chains, trade on a player-driven market, raid hostile camps,
and compete in Allegiances for top-heavy, sink-funded season rewards. The core loop:

```
STAKE → CLAIM → BUILD → FARM → MANUFACTURE → TRAIN → RAID → TRADE → ALLY → COMPETE FOR SEASON REWARDS
```

This design system is built from the **playable prototype** and the project's Art
Direction Bible, so any artifact you generate matches what the product actually looks
like: a dark, dense, tactical HUD where **color carries information** and numbers are
always monospace.

---

## Sources

The system was reverse-engineered from the live prototype. Explore these to do a
better job building WARLANDS-branded work:

- **GitHub — AtwaniGG/WARLANDS** · https://github.com/AtwaniGG/WARLANDS
  - Next.js 16 + React 19 + TypeScript + Tailwind v4 prototype of the full core loop.
  - Visual source of truth: `src/components/*` (GameShell, TopBar, HexMap, PlotPanel,
    MarketPanel, AllegiancePanel, SeasonPanel, BattleReport).
  - Game data (names, icons, stakes, recipes, colors) mirrored verbatim into this
    system: `src/game/{resources,plotTypes,buildings,units,allegiance}.ts`.
  - `docs/GDD.md` — the full 24-section design / tokenomics / architecture doc (referenced
    throughout the prototype as `GDD §N`; not all sections were accessible here).
- **Art Direction Bible** — the brand "constitution" (palette tokens, type, materials,
  lighting, anti-patterns). Its exact hex tokens match the terrain/accent values shipped
  in the prototype, so they are treated as canonical here.

> The current build is a single-player, client-side prototype demonstrating the complete
> economic + military + political + seasonal loop. On-chain `$WAR`, server-authoritative
> multiplayer, and PvP are modelled but not yet live.

---

## Content Fundamentals

How WARLANDS writes copy. Match this voice in any UI, marketing, or in-game text.

- **Voice: a terse tactical briefing.** Short, declarative, confident. Imperative CTAs:
  "Stake & Claim", "Scout (50$)", "End Season Now & Distribute Rewards". No fluff, no
  exclamation marks, no hype.
- **Second person, player-as-commander.** Copy addresses **"you"** ("Claim your first
  land", "your owned plots", "Train troops there first"). The player is a commander
  running a war economy.
- **Casing:** ALL-CAPS condensed for section labels and status (`STOCKPILE`, `TRAIN
  UNITS`, `OWNED`, `PROTOTYPE`, `VICTORY` / `DEFEAT`). **Sentence case** for body and
  descriptions. Title case for proper nouns (Allegiance, Trade Hub, the Crucible).
- **Numbers are concrete and rule-traceable.** Real figures everywhere — "10,000 $WAR",
  "×2.5", "+40% all yields", "4% transaction + 5 $WAR listing fees", "A32/D26". Mechanics
  are frequently footnoted to their design-doc section (`GDD §9.4`), which signals rigor.
- **Honest about state.** The product openly labels itself `PROTOTYPE` and says what is
  "mocked client-side" vs live. Tone is transparent, not marketing-glossy.
- **Domain lexicon (use consistently):** stake (locked, never spent), claim, plot, hex,
  the Crucible (intense red center), newbie ring (muted edge), Allegiance (never
  "guild"/"clan"), upkeep, sink, season pool, contribution score (CS), garrison, raid vs
  siege, scout, hostile camp.
- **Emoji** are used functionally as inline icons (resource/unit/building glyphs, tab
  icons), **never** decoratively in prose. Don't add celebratory/marketing emoji.
- **Vibe:** war-room telemetry. Every screen reads like a recon console — labels,
  readouts, and consequences, with the danger of the Crucible always implied.

Example copy, verbatim from the product:
> "Staked $WAR is locked, never spent. You get it back on unstake (minus a small
> early-unstake fee). It can never be looted by other players."
> "+40% all yields, season-point ×2.5. No protection. Highest risk."
> "Unknown strength. Scout first (50 $WAR) to reveal the garrison."

---

## Visual Foundations

The motifs and rules that make a screen read as WARLANDS.

**Mood & palette.** A desaturated gunmetal/sand/olive world where **saturation is a UI
signal, not decoration**. Surfaces are near-black, blue-tinted "recon screen" panels
(`--panel-void #0c1018` → `--panel #12161f` → `--panel-2 #1a2030`). Meaning rides on a
few high-chroma accents: **amber** = owned land / economy / `$WAR` / primary CTA;
**blood-red** = warzone / combat / danger / enemy; **teal** = market / coastal / info;
**sky** = allegiance / defense / scouting; **toxic-green** = tech / research / "active";
**violet** = rare / tech-ruins / premium. Hard rule: **≤ 2 accent colors per
composition**, and never rely on color alone — always pair it with an icon, shape, or
rim (accessibility + map legibility).

**Type.** Three roles. **Display** = Oswald, a condensed industrial grotesque, set
ALL-CAPS for section labels and big titles. **UI/body** = Geist (the prototype's real
face), high-legibility, sentence case. **Numbers** = Geist Mono with **tabular figures,
always** — every resource count, price, timer and power rating. The system is dense:
body is 13–14px, labels 10px uppercase with wide tracking, the wordmark is black-weight.

**Backgrounds.** Flat dark panels, not gradients or imagery — except the **map**, which
sits on `--panel-void` with a faint radial **Crucible glow** (blood-red, center) and a
center→edge risk gradient. No photographic hero imagery in the UI; the world map *is* the
hero. The Art Direction target for marketing/key art is painterly-but-grounded recon
light (long NW shadows, diesel haze), not flat vector.

**The hex map.** Pointy-top hexes tile seamlessly; terrain identity is a fill color +
one signal. Ownership is shown by **rim**: thin **amber rim** = yours (with a 🏕️ glyph),
**red rim** = hostile camp (💀), **hairline** = unclaimed, **bright amber 3px** =
selected. The Crucible center marks unclaimed tiles with ⚔.

**Cards & panels.** `--radius-lg` (12px) bordered surfaces with a 1px hairline border, a
subtle inset top-edge highlight (`--edge-inset`), and deep shadows on near-black (no
glow). Panels can take an accent **rim** — amber for "your" panels, blood for hostile
contexts. Header rows are ALL-CAPS condensed labels over a slightly darker strip.

**Buttons & controls.** Primary action is **solid amber with near-black text** (the
claim/$WAR CTA). Secondary recedes to a raised panel; danger is red; info is sky; ghost
is transparent. Radii are a tight **4 / 8 / 12** set; chips and buttons use 4px.

**Borders & dividers.** Everything is separated by 1px `--hairline (#232b3a)` rather than
spacing alone — reinforces the machined, instrument-panel feel. Stronger 2px rims signal
ownership/selection.

**Hover / press / motion.** Restrained and fast. Hover lifts buttons 1px and lightens the
fill; tabs swap to a raised surface; rows tint. Press uses `--ease-snap` for a touch of
"juice" on claims/confirms. Default easing `--ease-out (0.2,0.8,0.2,1)`, durations
120–200ms, `prefers-reduced-motion` respected. No infinite decorative loops; the only
ambient motion is the live tick clock and (in spec) a radar sweep.

**Transparency & blur.** Used sparingly — the map's info card is `rgba(0,0,0,0.6)` over
the world; modals dim the field with `bg-black/70`. No frosted-glass everywhere.

**Imagery tone (for generated art).** Warm-cool tension: amber dusk key light against
cold steel and blue shadow, with a subtle grain/noise overlay on everything. Material
honesty — metal reads as metal, concrete as concrete. Avoid: neon cyberpunk, fantasy
magic FX, glossy mobile-cartoon gloss, centered-subject-on-gradient, lens-flare spam,
five-accent rainbows.

---

## Iconography

WARLANDS uses **emoji as its functional icon set** — they are the real, shipped glyphs,
explicitly noted in code as "emoji placeholder; swap for sprite later." They carry game
identity and should be used as-is for fidelity:

- **Resources (20):** 🌾 Food · 💧 Water · 🪵 Wood · 🪨 Stone · ⛓️ Iron · 💎 Rare Minerals ·
  🛢️ Oil · 💽 Data Chips · ⛽ Fuel · 🔩 Steel · 🔌 Electronics · ⚙️ Machine Parts · 🧨 Ammunition ·
  🧪 Chemicals · 🔫 Rifles · 🛡️ Tanks · 🛸 Drones · ✈️ Aircraft · 🗼 Turrets · 🧱 Building Components.
- **Units (6):** 🪖 Infantry · 🛡️ Tanks · 💥 Artillery · ✈️ Aircraft · 🛸 Drones · 🔧 Engineers.
- **Buildings:** 🏕️ Camp · 🌾 Farm · 💧 Well · 🪵 Lumber Camp · 🪨 Quarry · ⛓️ Iron Mine · 💎 Mineral
  Mine · 🛢️ Oil Derrick · 💽 Data Excavator · 🏭 Refinery · ⚒️ Foundry · 🔫 Arms Factory · 🛠️ Heavy
  Works · 🔬 Electronics Lab · 📦 Warehouse.
- **Allegiance:** 🏛️ HQ · 🏰 Fortress · 🏪 Trade Hub · 📡 Radar Network · 🔬 Research Center · 🏭
  Alliance Factory · 🛡️ Shield Network.
- **Navigation & combat:** 🗺️ World · 💱 Market · 🤝 Allegiance · 🏆 Season · 💀 Hostile camp ·
  ⚔ Crucible · 🔭 Scout · 🗡️ Raid · 🏰 Siege.

**Rules.** Emoji are inline content glyphs, sized ~1em, never decorative in prose. They
satisfy the "never rely on color alone" rule — every terrain/resource/unit pairs its
color with a glyph. For **UI chrome** that emoji can't express (close ✕, chevrons, arrows,
external-link), use **[Lucide](https://lucide.dev) via CDN** — a thin-stroke line set that
sits quietly next to the emoji without competing. The **Art Direction target** is a custom
**silhouette-first sprite system** (identifiable as a black silhouette at 32px); when that
ships it replaces the emoji on map/unit/building tokens. There is no brand icon font in the
codebase; `assets/favicon.ico` is the only binary brand mark, and the wordmark is purely
typographic (black-weight amber "WARLANDS").

> **Substitution flagged:** **Oswald** (display) and the **Lucide** chrome icon set are
> design-system choices — Oswald is named as an approved display face in the Art Direction
> Bible; Lucide is the closest CDN line set for the missing chrome icons. Geist / Geist Mono
> are the product's real fonts. If you have licensed display fonts or a sprite/icon set,
> send them and they'll be swapped in.

---

## Index / Manifest

Root files:

| Path | What |
|---|---|
| `styles.css` | Global entry point — `@import` manifest only. Consumers link this. |
| `tokens/colors.css` | Base palette, accents, state, terrain fills, rims + semantic aliases. |
| `tokens/typography.css` | Font families, weights, type scale, tracking, text recipes. |
| `tokens/spacing.css` | Spacing scale, radii, elevation/shadows, focus ring, motion. |
| `tokens/fonts.css` | Webfont loading (Oswald, Geist, Geist Mono via Google Fonts). |
| `tokens/base.css` | Minimal element resets + focus ring + reduced-motion. |
| `assets/favicon.ico` | Imported brand mark from the prototype. |
| `SKILL.md` | Agent-Skills entry point (works in Claude Code). |

Components (`window.WARLANDSDesignSystem_e0d283`):

| Component | Dir | Role |
|---|---|---|
| `Button` | `components/core` | Tactical action — amber primary / danger / info / ghost / outline. |
| `Badge` | `components/core` | Uppercase status / ownership tag. |
| `Panel` | `components/core` | Bordered dark surface with optional rim + header. |
| `Stat` | `components/core` | Labelled mono numeric readout (resource bar). |
| `ResourceChip` | `components/game` | Icon + name + mono amount, tiered frame. |
| `ProgressBar` | `components/game` | Season / upkeep / defense / queue track. |
| `Tabs` | `components/game` | Primary view switcher (amber active). |

UI kit:

| Path | What |
|---|---|
| `ui_kits/warlands-game/index.html` | Interactive game shell — world map, plot inspector, market order-book, allegiance, season. Claim hexes, build, trade, raid. |

Specimen cards live in `guidelines/` (Colors, Type, Spacing, Brand) and the component
`*.card.html` files — all surfaced in the **Design System** tab.
