import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

export type CaptionLine = {
  text: string;
  accent?: string; // color override for emphasis
  strike?: boolean; // strike-through (e.g. "had no stakes")
  size?: number;
};

/**
 * Kinetic uppercase caption block. Lines stagger in (spring slide + fade).
 * The story carrier — every scene uses this.
 */
export const CaptionStack: React.FC<{
  kicker?: string;
  lines: CaptionLine[];
  startFrame?: number;
  align?: "center" | "left";
  position?: "center" | "lower";
  baseSize?: number;
}> = ({
  kicker,
  lines,
  startFrame = 0,
  align = "center",
  position = "lower",
  baseSize = 64,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const wrap: React.CSSProperties =
    position === "center"
      ? { top: 0, bottom: 0, justifyContent: "center" }
      : { bottom: 120, justifyContent: "flex-end" };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        paddingLeft: align === "center" ? 0 : 120,
        gap: 6,
        ...wrap,
      }}
    >
      {kicker && (
        <Kicker text={kicker} startFrame={startFrame} />
      )}
      {lines.map((ln, i) => {
        const delay = startFrame + 8 + i * 7;
        const s = spring({
          frame: frame - delay,
          fps,
          config: { damping: 16, stiffness: 120, mass: 0.7 },
        });
        const y = interpolate(s, [0, 1], [26, 0]);
        const clip = interpolate(s, [0, 1], [100, 0]);
        return (
          <div
            key={i}
            style={{
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: ln.size ?? baseSize,
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: ln.accent ?? COLORS.textHi,
              opacity: s,
              transform: `translateY(${y}px)`,
              textShadow: "0 4px 20px rgba(0,0,0,0.6)",
              clipPath: `inset(0 ${clip}% 0 0)`,
              position: "relative",
              textAlign: align,
            }}
          >
            {ln.text}
            {ln.strike && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "52%",
                  height: 5,
                  background: COLORS.bloodStrong,
                  transformOrigin: "left center",
                  transform: `scaleX(${interpolate(frame - delay, [6, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
                  boxShadow: `0 0 12px ${COLORS.bloodStrong}`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Kicker: React.FC<{ text: string; startFrame: number }> = ({ text, startFrame }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - startFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
        opacity: o,
      }}
    >
      <span style={{ width: 28, height: 2, background: COLORS.amber }} />
      <span
        style={{
          fontFamily: FONTS.display,
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: COLORS.amberText,
        }}
      >
        {text}
      </span>
    </div>
  );
};
