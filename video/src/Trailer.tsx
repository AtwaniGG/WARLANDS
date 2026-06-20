import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

import { S1ColdOpen } from "./scenes/S1ColdOpen";
import { S2OneMap } from "./scenes/S2OneMap";
import { S3Build } from "./scenes/S3Build";
import { S4Raid } from "./scenes/S4Raid";
import { S5Earn } from "./scenes/S5Earn";
import { S6CTA } from "./scenes/S6CTA";
import { HAS_AUDIO, MUSIC_SRC, MUSIC_VOLUME } from "./audio";

// scene durations (frames @ 30fps)
export const SCENE_FRAMES = { s1: 150, s2: 180, s3: 210, s4: 240, s5: 180, s6: 130 };
const T = 14; // transition length
export const TOTAL_FRAMES =
  Object.values(SCENE_FRAMES).reduce((a, b) => a + b, 0) - 5 * T;

const timing = linearTiming({ durationInFrames: T });

export const Trailer: React.FC = () => (
  <AbsoluteFill style={{ background: "#070a10" }}>
    {HAS_AUDIO && <Audio src={staticFile(MUSIC_SRC)} volume={MUSIC_VOLUME} />}
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s1}>
        <S1ColdOpen />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s2}>
        <S2OneMap />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s3}>
        <S3Build />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s4}>
        <S4Raid />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slide({ direction: "from-bottom" })} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s5}>
        <S5Earn />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.s6}>
        <S6CTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
