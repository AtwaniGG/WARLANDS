# WARLANDS UI → Design-System refactor

Drop-in replacement for `src/` in the Next.js repo. Copy `_refactor/src/components/`
over `src/components/` and `_refactor/src/app/page.tsx` over `src/app/page.tsx`.
`globals.css` / `layout.tsx` are unchanged and intentionally not included.

## What changed

### NEW — shared primitives (`src/components/ui/`)
Typed, token-backed React primitives mirroring the design-system reference components
(`docs/design-system/components/core` + `/game`). All styling is driven by the vendored
CSS variables and the `.wl-label` / `.wl-title` / `.wl-num` recipes — no new raw hex.

- `Button.tsx` — `primary | secondary | danger | info | success | ghost | outline`, sizes `sm|md|lg`, `icon`, `full`. Amber primary = `--cta-bg` on `--cta-fg`. Hover lift; global amber focus-ring.
- `Panel.tsx` — bordered `--surface-card`, optional ALL-CAPS header + accent `rim`.
- `Badge.tsx` — uppercase status tag, tones `amber|blood|sky|emerald|violet|teal|neutral`, `soft|solid`.
- `Stat.tsx` — labelled mono readout (`.wl-num`), `row|stack`.
- `Tabs.tsx` — generic view switcher, active tab solid amber.
- `ResourceChip.tsx` — icon + name + mono amount, tier frame `raw|intermediate|finished`.
- `ProgressBar.tsx` — token-tinted track with optional label / mono value row.
- `index.ts` — barrel (`import { Button, … } from "@/components/ui"`).

### REFACTORED panels (presentation only — store/props/logic untouched)
- **TopBar** — wordmark → `.wl-title`, PROTOTYPE → `Badge`, readouts → `Stat`, surfaces → tokens.
- **GameShell** — ad-hoc `<nav>` tab row → `Tabs`; `bg-zinc-*` → `--panel-void` / `--panel` / `--hairline`.
- **EventLog** — labels → `.wl-label`, zinc → tokens.
- **PlotPanel** — claim/unstake CTAs → `Button`; OWNED → `Badge`; stockpile → `ResourceChip`; upgrade → `Button(info)`; labels/numbers → recipes; factory toggle token-styled.
- **MilitaryPanel** — train/raid/siege/scout → `Button`; TIER → `Badge`; raid box → blood-rim card; diplomacy stance pills token-styled; empire colors kept (data-driven).
- **MarketPanel** — tab row → `Tabs`; Buy/Sell/List → `Button(success/danger/info)`; numeric cells → `.wl-num`; surfaces → tokens.
- **AllegiancePanel** — cards → `Panel`; buffs/status → `Badge`; all CTAs → `Button`; gov-model picker & member rows token-styled.
- **DiplomacyPanel** — stance → `Badge`; war/peace/ally → token outline buttons; empire colors kept.
- **SeasonPanel** — season bar → `ProgressBar`; pool/burn → `Panel`+`Stat`; CTAs → `Button`.
- **WalletPanel** — on-chain reads → `Panel`+`Stat`; approve/stake/refund → `Button`; mock-mode box & inputs token-styled.
- **WalletButton** — connect/disconnect → `Button(primary/success)`.
- **BattleReport** — modal → `--shadow-modal` + token surfaces; VICTORY/DEFEAT → `.wl-title`; Close → `Button`.
- **HexMap** — map rim/selection/`panel-void` literals → `--rim-*` / `--panel-void` tokens (moved to `style` so `var()` resolves on SVG); terrain & empire fills stay data-driven.
- **page.tsx** (landing) — brand-accent literals (`#f5b301/#9c2b2b/#3f9aa6`) and `#0c1018` surfaces → tokens. Bespoke atmospheric near-blacks (`#0a0d12`, `#13100a`, …) and Tailwind `amber-*` utilities left as-is (decorative marketing chrome, not game panels).

## Acceptance criteria — RUN THESE LOCALLY
This environment can't execute your toolchain. After copying the files in, run:

```bash
npx tsc --noEmit
npx eslint src
npm run build
npm run dev   # check / and /play render 200 with no console/hydration errors
```

`grep -rE "#f5b301|#9c2b2b|#3f9aa6|#4a90d9|#6ee7a8|#8b5cf6|#facc15|#dc2626" src/components` → no matches (verified here).

## Notes / intentional remainders
- Remaining hex literals inside `ui/*` are **contrast/on-colors & hover shades** intrinsic to each primitive (e.g. near-black text on amber `#0c0a04`, white on danger, `#15803d` success green), exactly as the DS reference `.jsx` components define them — not accent tokens.
- `empire.color` and `PLOT_TYPES[*].color` remain inline — they're per-entity game data, not brand tokens.
- If your tsconfig does NOT expose a global `React` namespace, add `import * as React from "react"` to the panels that reference `React.ReactNode` / `React.CSSProperties` (`MilitaryPanel`, `DiplomacyPanel`, `AllegiancePanel`, `WalletPanel`, `BattleReport`). The original `HexMap` used `React.WheelEvent` un-imported, so the global is assumed present.
