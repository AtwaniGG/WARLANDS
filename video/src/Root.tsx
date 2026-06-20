import React from "react";
import { Composition } from "remotion";
import { Trailer, TOTAL_FRAMES } from "./Trailer";
import { VIDEO } from "./theme";
import "./fonts";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WarlandsTrailer"
      component={Trailer}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
  );
};
