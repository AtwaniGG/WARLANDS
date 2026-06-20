# WARLANDS Launch Trailer — Design Spec

**Date:** 2026-06-21
**Status:** Approved (design), pending implementation plan
**Author:** brainstormed with Claude Code

## Goal

A ~35-second, 16:9 landscape launch trailer for WARLANDS, generated entirely in
code with [Remotion](https://www.remotion.dev/) (React-based video). No screen
recordings — every visual is an on-brand animated React/SVG recreation of the
game's UI. The output is a rendered `.mp4` suitable for the landing page,
Product Hunt, YouTube, and X/Twitter.

**Core hook:** "Clash of Clans, but the stakes are real." Lead with the
crypto-native angle (stake `$WAR`, claim finite land on ONE shared live map,
raid for real tokens), then walk the gameplay loop **build → raid → earn**, then
a clear CTA to play.

**Inspiration / method:** the "code becomes a video" Remotion + Claude Code
workflow — each scene is a reusable React component; brand tokens live in one
place so scenes are recyclable for future reels.

## Non-goals (YAGNI)

- No voiceover / TTS pipeline. Captions carry the message.
- No screen-capture / Playwright tooling. Pure code-built visuals.
- No vertical (9:16) or square cut in this pass (can be derived later from the
  same scene components by changing composition dimensions).
- No bundled music track committed to the repo (licensing). The build leaves a
  documented audio slot; the user drops in a royalty-free track + SFX.
- No changes to the Next.js app, game, or contracts.

## Decisions (locked during brainstorming)

| Decision | Choice |
|----------|--------|
| Format | 16:9 landscape, 1920×1080, 30fps |
| Duration | ~35s (target ≈ 1050 frames; final tuned to scene timing) |
| Visual source | Pure Remotion (code-built SVG/React), no recordings |
| Narrative | Crypto hook ("real stakes, one map") + build→raid→earn loop |
| Audio | Music + SFX added by user; captions carry the story; must read silent |
| Project structure | **Approach A** — isolated `video/` workspace |

## Project structure (Approach A — isolated workspace)

Remotion lives in its own `video/` directory with its **own** `package.json` and
`node_modules`, fully decoupled from the Next 16 / React 19 app build. Rationale:

- The repo's absolute path contains a space (`Red Agent MMO`); Remotion tolerates
  it but the main Next toolchain has been fragile with it. Isolation removes risk.
- Keeps Remotion deps out of the production app install.
- Still "lives next to the product," and brand tokens are copied into a shared
  `theme.ts` so the trailer stays on-brand.

```
video/
  package.json            # remotion, @remotion/cli, @remotion/transitions,
                          # @remotion/google-fonts, react, react-dom
  remotion.config.ts      # output, codec, image format
  tsconfig.json
  src/
    Root.tsx              # registers <Composition id="WarlandsTrailer" .../>
    Trailer.tsx           # top-level TransitionSeries composing the 6 scenes
    theme.ts              # WARLANDS design tokens (colors, fonts, type scale)
    fonts.ts             # Oswald (display) + Inter/Geist (UI) via google-fonts
    audio.ts             # documented audio slot (no file committed)
    primitives/
      ScanlineOverlay.tsx
      HUDChip.tsx
      CaptionStack.tsx     # kinetic on-screen text
      ResourceCounter.tsx  # count-up number
      Bar.tsx              # resource / defense bar
      IsoTile.tsx          # isometric ground tile / plot w/ ownership rim
      IsoBuilding.tsx      # parametric isometric building (HQ, extractor, ...)
      UnitMarch.tsx        # marching army row
      TokenStream.tsx      # $WAR tokens flying to a balance
      Logo.tsx             # WARLANDS wordmark lockup
    scenes/
      S1ColdOpen.tsx
      S2OneMap.tsx
      S3Build.tsx
      S4Raid.tsx
      S5Earn.tsx
      S6CTA.tsx
  out/                     # rendered output (gitignored)
```

NPM scripts in `video/package.json`:
- `studio` → `remotion studio` (live preview)
- `render` → `remotion render WarlandsTrailer out/warlands-trailer.mp4`
- `still` → `remotion still` (per-scene frame export for verification)

`out/` added to `.gitignore`.

## Brand system (from `src/app/globals.css`)

Copied into `video/src/theme.ts` as a typed object:

- **Surfaces:** `panel-void #0c1018`, `panel #12161f`, `panel-2 #1a2030`,
  hairline `#232b3a`.
- **Accents:** amber `#f5b301` (primary CTA), blood `#9c2b2b` / `#dc2626`
  (enemy/combat), teal `#3f9aa6` (info), toxic-green `#6ee7a8` (tech/on-chain),
  sky `#4a90d9` (ally).
- **Text:** hi `#e6e9ef`, lo `#8a92a3`, faint `#5a6273`.
- **Ownership rims:** owned `#facc15`, enemy `#dc2626`, neutral `#1c2433`.
- **Fonts:** display = Oswald (condensed, uppercase, military), UI = Inter/Geist.
- **Motion:** ease-out `cubic-bezier(0.2,0.8,0.2,1)`, snap
  `cubic-bezier(0.34,1.4,0.5,1)`.

## Storyboard (6 scenes, ~35s @ 30fps)

Frame budgets are targets; final timing tuned in Studio. Transitions
(slide/wipe/fade) overlap ~12–15 frames between scenes via `TransitionSeries`.

### S1 — Cold open (0–5s)
Black screen → amber scanlines sweep + thin HUD corner brackets draw in. Kinetic
caption: "CLASH OF CLANS HAD NO STAKES." beat → strike-through → "WARLANDS DOES."
Logo glint at the end. Establishes brand + tension.

### S2 — One live map (5–11s)
Isometric / hex world reveals from dark; slow camera push-in. Plots illuminate
with ownership rims — amber (yours) vs red (enemy) vs neutral. A `$WAR` stake
pulse lands on a plot to claim it. Caption: "ONE live map. Finite land. Stake
$WAR to claim it."

### S3 — BUILD (11–18s)
Push into a single base. Isometric buildings pop in with snap easing in sequence
(HQ → extractors → barracks). Segmented BUILD tabs animate (matching the live
UI's BUILD flow). Resource counters tick up (`ResourceCounter`). Caption: "BUILD
your economy."

### S4 — RAID (18–26s)
Tone shift to combat (blood-red accents). An army (`UnitMarch`) deploys onto an
enemy base; impact flashes; defense `Bar`s drain; loot resolves into a
`TokenStream` of `$WAR` flowing to your balance. A battle-report stamp hits.
Caption: "RAID rivals. Take their $WAR."

### S5 — EARN (26–32s)
Leaderboard rows climb/reorder; allegiance banner unfurls; season timer ticks;
a large `$WAR` balance counts up; a toxic-green "ON-CHAIN · SOLANA" badge
settles. Caption: "EARN real tokens. Climb the season."

### S6 — CTA (32–35s)
Full-bleed `Logo` lockup, amber on gunmetal. Tagline: "Build. Raid. Earn. For
real." URL chip: `warlands-nine.vercel.app/world`. Optional "$WAR on Solana".

## Component contracts

Each primitive is independently understandable, prop-driven, and reused across
scenes:

- **`IsoBuilding`** — `{ kind, x, y, scale, appearAtFrame }`. Renders a
  parametric isometric building via SVG polygons; pops in (snap ease) at
  `appearAtFrame`. Used in S2, S3, S4.
- **`IsoTile`** — `{ col, row, rim, fill, appearAtFrame }`. One iso ground tile
  with optional ownership rim. Composed into the map grid (S2) and base ground
  (S3, S4).
- **`ResourceCounter`** — `{ from, to, startFrame, durationInFrames, label,
  icon }`. Count-up using `interpolate` + `spring`. S3, S5.
- **`Bar`** — `{ value0to1, color, drain? }`. Resource/defense bar; can animate
  draining. S4.
- **`CaptionStack`** — `{ lines, startFrame, style }`. Kinetic uppercase Oswald
  text, staggered word/line reveal. Every scene.
- **`ScanlineOverlay`**, **`HUDChip`**, **`UnitMarch`**, **`TokenStream`**,
  **`Logo`** — atmosphere / motif primitives.

All animation is driven by `useCurrentFrame()` + `interpolate`/`spring` (frame-
deterministic — required for Remotion's render to be reproducible). No wall-clock
time, no `Math.random()` without a seed.

## Audio

`video/src/audio.ts` documents the slot and (when a file is present at
`video/public/audio/track.mp3`) wires it via Remotion `<Audio>`. No audio file is
committed. README in `video/` explains how to drop in a royalty-free track + SFX
and where beat hits map to scene cuts (S1→S2, S3→S4, S5→S6).

## Verification

Remotion has no meaningful unit-test surface; verification is visual + a render:

1. `npm run studio` in `video/` — scrub the timeline, confirm each scene reads.
2. `npm run still` — export one representative frame per scene to `out/` and
   eyeball brand fidelity (colors, font, layout).
3. `npm run render` — produce `out/warlands-trailer.mp4`; confirm it plays end to
   end, transitions are clean, total duration ≈ 35s, and it reads with sound off.
4. Sanity: trailer references the correct live URL and `$WAR` / Solana framing.

## Risks / mitigations

- **Path has a space** → isolated `video/` workspace; always quote paths in
  scripts. Verify `remotion render` completes from the spaced path early.
- **Render needs Chrome Headless Shell** (Remotion downloads it on first render)
  → first `render` may be slow; note in README. If sandboxed/offline, fall back
  to `still` exports + Studio preview for verification.
- **React 19 peer ranges** → `video/` pins its own React; not coupled to the
  app. Use the React version Remotion's installer selects.
- **Scope creep on illustration detail** → buildings/units are stylized
  iso/SVG, not pixel-accurate game art; "reads as WARLANDS," not 1:1.
```
