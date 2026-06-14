---
name: warlands-design
description: Use this skill to generate well-branded interfaces and assets for WARLANDS — a gritty, militarized Web3 strategy MMO on a shared hex world map — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out
and create static HTML files for the user to view. If working on production code, you can
copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build
or design, ask some questions, and act as an expert designer who outputs HTML artifacts
_or_ production code, depending on the need.

## What's here

- `readme.md` — the full design guide: product context, **Content Fundamentals** (voice),
  **Visual Foundations** (motifs), **Iconography**, and a file index. Read this first.
- `styles.css` — the one stylesheet to link. It `@import`s everything in `tokens/`.
- `tokens/` — CSS custom properties: `colors.css`, `typography.css`, `spacing.css`,
  `fonts.css`, `base.css`. Use the semantic aliases (`--surface-card`, `--accent`,
  `--text-primary`, `--cta-bg`…) before raw values.
- `components/` — React (`.jsx`) primitives with `.d.ts` + `.prompt.md`: Button, Badge,
  Panel, Stat (core); ResourceChip, ProgressBar, Tabs (game). Each `.prompt.md` has a
  usage snippet.
- `ui_kits/warlands-game/` — an interactive recreation of the full game shell (world map,
  plot inspector, market order-book, allegiance, season). The best reference for how the
  pieces compose into a real screen.
- `guidelines/` — foundation specimen cards (colors, type, spacing, brand, icons).
- `assets/` — `favicon.ico` brand mark.

## Quick rules (the non-negotiables)

- Dark near-black panels; **color = information**, ≤ 2 accent colors per composition.
- Amber = owned/economy/$WAR/CTA · blood-red = war/danger · sky = ally/defense · teal =
  market · toxic-green = tech · violet = rare.
- Display = Oswald ALL-CAPS; body = Geist sentence case; **numbers always Geist Mono,
  tabular**.
- Emoji are the functional game icons — use them; Lucide (CDN) for UI chrome only.
- Voice: terse tactical briefing, second-person commander, concrete rule-traceable
  numbers. Never decorative emoji or marketing gloss.
- Tight radii (4/8/12), 1px hairline borders, deep shadows (no glow), fast restrained
  motion.

## Loading the system in standalone HTML

Link `styles.css`, load `_ds_bundle.js`, then read components off the global namespace
(run the design-system check to confirm the exact namespace string):

```html
<link rel="stylesheet" href="styles.css" />
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, Badge, Panel, Stat, ResourceChip, ProgressBar, Tabs } = window.WARLANDSDesignSystem_e0d283;
</script>
```
