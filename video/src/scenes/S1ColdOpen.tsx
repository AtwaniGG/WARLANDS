import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../primitives/Scene";
import { CaptionStack } from "../primitives/CaptionStack";
import { COLORS, FONTS } from "../theme";

/** S1 — Cold open. Hook: Clash of Clans had no stakes; WARLANDS does. */
export const S1ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const ghost = interpolate(frame, [0, 40], [0, 0.05], { extrapolateRight: "clamp" });

  return (
    <Scene label="WARLANDS // INITIALIZING" intensity={1.15}>
      {/* giant ghost word behind */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 460,
            letterSpacing: "0.04em",
            color: COLORS.textHi,
            opacity: ghost,
            textTransform: "uppercase",
          }}
        >
          WAR
        </span>
      </AbsoluteFill>

      <CaptionStack
        position="center"
        align="center"
        kicker="REAL-TIME · ON-CHAIN · PVP"
        startFrame={4}
        lines={[
          { text: "Clash of Clans", size: 66, accent: COLORS.textLo },
          { text: "had no stakes.", size: 66, accent: COLORS.textLo, strike: true },
          { text: "WARLANDS does.", size: 104, accent: COLORS.amber },
        ]}
      />
    </Scene>
  );
};
