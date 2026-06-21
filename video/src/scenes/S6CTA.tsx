import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../primitives/Scene";
import { Logo } from "../primitives/Logo";
import { COLORS, FONTS } from "../theme";

export const S6CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tagline = interpolate(frame, [22, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cta = spring({ frame: frame - 40, fps, config: { damping: 14, stiffness: 110 } });
  const pulse = 1 + Math.sin(frame * 0.12) * 0.02;

  return (
    <Scene label="ENLIST NOW" intensity={0.9}>
      <AbsoluteFill style={{ background: "radial-gradient(60% 50% at 50% 45%, rgba(245,179,1,0.10) 0%, transparent 70%)" }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 44 }}>
        <Logo startFrame={2} size={120} />

        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: COLORS.textHi,
            opacity: tagline,
            transform: `translateY(${interpolate(tagline, [0, 1], [16, 0])}px)`,
          }}
        >
          Build. Raid. <span style={{ color: COLORS.amber }}>Earn.</span> For real.
        </div>

        {/* CTA button + url */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, opacity: cta, transform: `translateY(${interpolate(cta, [0, 1], [20, 0])}px)` }}>
          <div
            style={{
              transform: `scale(${pulse})`,
              padding: "20px 56px",
              borderRadius: 12,
              background: `linear-gradient(180deg, ${COLORS.amberHi}, ${COLORS.amber})`,
              color: "#0c0a04",
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              boxShadow: `0 0 30px rgba(245,179,1,0.45)`,
            }}
          >
            Play now
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 30, color: COLORS.textHi, letterSpacing: "0.06em" }}>
            warlands.net
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: COLORS.toxic, boxShadow: `0 0 8px ${COLORS.toxic}` }} />
            <span style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 16, letterSpacing: "0.2em", color: COLORS.toxic, textTransform: "uppercase" }}>
              $HEXAR live on Solana
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </Scene>
  );
};
