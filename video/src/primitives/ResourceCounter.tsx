import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/** Count-up number with label + glyph. Frame-deterministic. */
export const ResourceCounter: React.FC<{
  from: number;
  to: number;
  startFrame: number;
  durationInFrames?: number;
  label: string;
  glyph?: React.ReactNode;
  accent?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}> = ({
  from,
  to,
  startFrame,
  durationInFrames = 36,
  label,
  glyph,
  accent = COLORS.amber,
  decimals = 0,
  prefix = "",
  suffix = "",
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame - startFrame, [0, durationInFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const display =
    prefix +
    v.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {glyph}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: 26,
            color: accent,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display}
        </span>
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.textLo,
            marginTop: 4,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
