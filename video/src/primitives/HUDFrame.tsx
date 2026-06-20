import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/** Animated corner brackets that "draw in" — gives every scene a HUD framing. */
export const HUDFrame: React.FC<{ startFrame?: number; label?: string }> = ({
  startFrame = 0,
  label,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - startFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const len = 90 * t;
  const m = 56; // margin
  const stroke = COLORS.amber;
  const sw = 3;

  const Corner: React.FC<{ x: number; y: number; sx: number; sy: number }> = ({
    x,
    y,
    sx,
    sy,
  }) => (
    <>
      <div style={{ position: "absolute", left: x, top: y, width: len, height: sw, background: stroke, opacity: 0.85, transformOrigin: `${sx < 0 ? "right" : "left"} center`, transform: `scaleX(1) ${sx < 0 ? "translateX(-100%)" : ""}` }} />
      <div style={{ position: "absolute", left: x, top: y, width: sw, height: len, background: stroke, opacity: 0.85, transform: `${sy < 0 ? "translateY(-100%)" : ""}` }} />
    </>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Corner x={m} y={m} sx={1} sy={1} />
      <Corner x={1920 - m} y={m} sx={-1} sy={1} />
      <Corner x={m} y={1080 - m} sx={1} sy={-1} />
      <Corner x={1920 - m} y={1080 - m} sx={-1} sy={-1} />
      {label && (
        <div
          style={{
            position: "absolute",
            top: m - 4,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: COLORS.textLo,
            opacity: t,
          }}
        >
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};
