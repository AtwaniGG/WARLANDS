import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../primitives/Scene";
import { CaptionStack } from "../primitives/CaptionStack";
import { ResourceCounter } from "../primitives/ResourceCounter";
import { IsoTile } from "../primitives/IsoTile";
import { IsoBuilding, BuildingKind } from "../primitives/IsoBuilding";
import { Pt } from "../primitives/iso";
import { COLORS, FONTS } from "../theme";

const ORIGIN: Pt = { x: 940, y: 330 };
const GRID = 4;

const PLACEMENTS: { kind: BuildingKind; col: number; row: number; at: number }[] = [
  { kind: "hq", col: 2, row: 1, at: 18 },
  { kind: "factory", col: 1, row: 1, at: 30 },
  { kind: "extractor", col: 3, row: 1, at: 42 },
  { kind: "storage", col: 1, row: 0, at: 54 },
  { kind: "barracks", col: 2, row: 3, at: 66 },
  { kind: "extractor", col: 0, row: 2, at: 78 },
].sort((a, b) => a.col + a.row - (b.col + b.row));

const TABS = ["BASE", "ARMY", "DEFENSE", "MARKET"];

export const S3Build: React.FC = () => {
  const frame = useCurrentFrame();

  const tiles: React.ReactNode[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      tiles.push(
        <IsoTile
          key={`${col},${row}`}
          col={col}
          row={row}
          origin={ORIGIN}
          fill={COLORS.oliveDrab}
          rim="owned"
          appearAtFrame={2 + (col + row) * 2}
        />
      );
    }
  }

  return (
    <Scene label="YOUR BASE // SECTOR 7" intensity={0.7}>
      <AbsoluteFill style={{ transform: "translateY(40px)" }}>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {tiles}
          {PLACEMENTS.map((p, i) => (
            <IsoBuilding key={i} {...p} origin={ORIGIN} appearAtFrame={p.at} scale={1.15} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* segmented BUILD tabs */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          padding: 5,
          background: "rgba(12,16,24,0.85)",
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 10,
          opacity: interpolate(frame, [4, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {TABS.map((t, i) => (
          <div
            key={t}
            style={{
              padding: "10px 24px",
              borderRadius: 7,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: i === 0 ? "#0c0a04" : COLORS.textLo,
              background: i === 0 ? COLORS.amber : "transparent",
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* resource HUD */}
      <div style={{ position: "absolute", top: 240, left: 110, display: "flex", flexDirection: "column", gap: 22 }}>
        <ResourceCounter from={0} to={4200} startFrame={36} label="Gold" accent={COLORS.amber} glyph={<Dot c={COLORS.amber} />} />
        <ResourceCounter from={0} to={1150} startFrame={48} label="Oil" accent={COLORS.toxic} glyph={<Dot c={COLORS.toxic} />} />
        <ResourceCounter from={0} to={760} startFrame={60} label="Steel" accent={COLORS.skyText} glyph={<Dot c={COLORS.skyText} />} />
      </div>

      <CaptionStack
        kicker="Build"
        startFrame={70}
        lines={[
          { text: "Build your economy.", size: 60 },
          { text: "Extract. Refine. Fortify.", size: 40, accent: COLORS.textLo },
        ]}
      />
    </Scene>
  );
};

const Dot: React.FC<{ c: string }> = ({ c }) => (
  <span style={{ width: 14, height: 14, borderRadius: 3, background: c, boxShadow: `0 0 8px ${c}` }} />
);
