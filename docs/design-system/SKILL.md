---
name: warlands-design
description: Use this skill to generate well-branded interfaces and assets for WARLANDS — a persistent-world Web3 strategy MMO — either for production or throwaway prototypes/mocks. Contains the essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping the game and its marketing surfaces.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

WARLANDS is a war-themed, command-console design system: near-black gunmetal surfaces, an amber
command accent, blood-red hostility, teal intel, condensed stencil display type (Oswald), and
tabular mono numerics (Geist Mono). It is reverse-engineered from the live codebase — use the real
tokens and components, don't invent new ones.

Key files:
- `styles.css` — the single global entry point. Link it (or `@import` it); it pulls in every token,
  font, and the atmosphere utilities.
- `tokens/` + `base.css` — color / type / spacing / terrain custom properties and effects.
- `components/core/` — React primitives (`Button`, `Badge`, `Panel`, `Stat`, `Tabs`, `ProgressBar`,
  `ResourceChip`). Read each `.prompt.md` for usage.
- `ui_kits/landing/` and `ui_kits/warroom/` — full-screen recreations (marketing site + game shell).
- `guidelines/*.card.html` — foundation specimens.
- `assets/` — the resource / building / unit / terrain SVG icon sets.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create
static HTML files that link `styles.css` for the user to view. If working on production code, copy
assets and read the rules here to become an expert in designing with this brand.

Honor the content & visual fundamentals in `readme.md`: ALL-CAPS Oswald display titles, sentence-case
body, mono+tabular numbers suffixed `$WAR`, emoji used **only** as functional UI icons, small military
radii, the amber/blood/teal/sky semantic roles, and motion that keeps the visible state as the base
(never strand content at opacity 0).

If the user invokes this skill without other guidance, ask them what they want to build or design,
ask a few focused questions, and act as an expert designer who outputs HTML artifacts *or* production
code, depending on the need.
