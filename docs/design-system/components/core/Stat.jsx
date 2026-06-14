import React from "react";

/**
 * WARLANDS Stat — a labelled numeric readout, as used in the top resource bar.
 * Micro uppercase label + a mono, tabular value tinted by accent. Numbers are
 * ALWAYS monospace in WARLANDS (resource counts, prices, timers, power).
 */
const ACCENTS = {
  amber: "var(--amber-text)",
  blood: "var(--blood-text)",
  sky: "var(--sky-text)",
  emerald: "var(--emerald-text)",
  violet: "var(--violet-text)",
  teal: "var(--teal-text)",
  neutral: "var(--text-secondary)",
};

export function Stat({ label, value, accent = "neutral", align = "row", size = "md", style, ...rest }) {
  const valueSize = size === "lg" ? "18px" : size === "sm" ? "12px" : "14px";
  const isStacked = align === "stack";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isStacked ? "column" : "row",
        alignItems: isStacked ? "flex-start" : "baseline",
        gap: isStacked ? "2px" : "6px",
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: "var(--fw-semibold)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: "var(--fw-semibold)",
          fontSize: valueSize,
          color: ACCENTS[accent] || ACCENTS.neutral,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
    </div>
  );
}
