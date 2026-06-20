import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/** Resource / defense bar. Animates fill, or drains from full → `value`. */
export const Bar: React.FC<{
  label?: string;
  value: number; // 0..1 target
  color?: string;
  width?: number;
  startFrame?: number;
  durationInFrames?: number;
  drain?: boolean; // start at 1 and fall to value
}> = ({
  label,
  value,
  color = COLORS.amber,
  width = 260,
  startFrame = 0,
  durationInFrames = 30,
  drain = false,
}) => {
  const frame = useCurrentFrame();
  const fill = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [drain ? 1 : 0, value],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ width }}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: COLORS.textLo,
            marginBottom: 5,
          }}
        >
          <span>{label}</span>
          <span style={{ fontFamily: FONTS.mono, color }}>
            {Math.round(fill * 100)}%
          </span>
        </div>
      )}
      <div
        style={{
          height: 9,
          borderRadius: 4,
          background: COLORS.surfaceSunken,
          border: `1px solid ${COLORS.hairline}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.max(0, fill) * 100}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
};
