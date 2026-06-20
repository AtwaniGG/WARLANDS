import React from "react";
import { COLORS, FONTS } from "../theme";

/** Small military HUD pill: label + value, hairline border, accent edge. */
export const HUDChip: React.FC<{
  label: string;
  value: React.ReactNode;
  accent?: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, value, accent = COLORS.amber, icon, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 18px",
      background: "rgba(18,22,31,0.86)",
      border: `1px solid ${COLORS.hairline}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 8,
      backdropFilter: "blur(2px)",
      boxShadow: "0 6px 18px rgba(0,0,0,0.45)",
      ...style,
    }}
  >
    {icon}
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
      <span
        style={{
          fontFamily: FONTS.display,
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: COLORS.textLo,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontWeight: 700,
          fontSize: 22,
          color: COLORS.textHi,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  </div>
);
