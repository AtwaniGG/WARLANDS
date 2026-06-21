# WARLANDS Launch Trailer (Remotion)

A ~34s, 1920×1080 launch trailer for WARLANDS, generated entirely in code with
[Remotion](https://www.remotion.dev/). No screen recordings — every visual is an
on-brand animated React/SVG recreation of the game. Isolated workspace: its own
`package.json`, decoupled from the Next app build.

Design spec: [`../docs/superpowers/specs/2026-06-21-launch-trailer-design.md`](../docs/superpowers/specs/2026-06-21-launch-trailer-design.md)

## Commands

```bash
cd video
npm install          # first time only

npm run studio       # live preview / scrub the timeline in the browser
npm run render       # → out/warlands-trailer.mp4  (H.264, 1080p, 30fps)
npm run still -- WarlandsTrailer out/frame.jpg --frame=110   # one frame
```

## Structure

```
src/
  index.ts            registerRoot
  Root.tsx            <Composition id="WarlandsTrailer">  (1920x1080, 30fps)
  Trailer.tsx         TransitionSeries composing the 6 scenes + audio slot
  theme.ts            WARLANDS brand tokens (mirrors src/app/globals.css)
  fonts.ts            Oswald (display) + Inter (UI) via @remotion/google-fonts
  audio.ts            audio slot (see below)
  primitives/         reusable building blocks (iso buildings, captions, HUD, ...)
  scenes/             S1ColdOpen → S6CTA
```

## Storyboard

| # | Scene | Beat | Message |
|---|-------|------|---------|
| 1 | Cold open | hook | "Clash of Clans had no stakes. WARLANDS does." |
| 2 | One live map | stakes | "Finite land. Stake $HEXAR to claim it." |
| 3 | Build | loop | "Build your economy." |
| 4 | Raid | loop | "Raid rivals. Take their $HEXAR." |
| 5 | Earn | payoff | "Real tokens. Real seasons." |
| 6 | CTA | action | "Build. Raid. Earn. For real." → warlands.xyz |

Scene durations live in `Trailer.tsx` (`SCENE_FRAMES`). Tweak there to retime.

## Music + SFX

Background music is **included**: `public/audio/warlands-trailer.mp3` (ElevenLabs, 34s) is wired
in `src/audio.ts` (`HAS_AUDIO = true`) at a low background level — `MUSIC_VOLUME = 0.25` — with a
0.5s fade-in / 1s fade-out (see `Trailer.tsx`). Measured quiet: mean −31 dB, peak −17.5 dB.

To swap the track: drop a new file in `public/audio/`, point `MUSIC_SRC` at it, tweak
`MUSIC_VOLUME` if needed, re-render. Beat-map for cuts (seconds @ 30fps):
S1→S2 ≈ 4.5s · S2→S3 ≈ 10.5s · S3→S4 ≈ 16.5s · S4→S5 ≈ 24s · S5→S6 ≈ 29.7s

The trailer also reads fully with sound **off** (captions carry it), so it works in
autoplay-muted feeds.

## Making a vertical (9:16) cut

Add a second `<Composition>` in `Root.tsx` with `width={1080} height={1920}` and
reuse the same scene components — they're layout-driven, so most reposition
cleanly; nudge a few absolute offsets per scene as needed.
```
