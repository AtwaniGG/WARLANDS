import * as React from "react";

const ACCENTS = {
  amber: "var(--amber-text)",
  blood: "var(--blood-text)",
  sky: "var(--sky-text)",
  emerald: "var(--emerald-text)",
  violet: "var(--violet-text)",
  teal: "var(--teal-text)",
  neutral: "var(--text-secondary)",
};

/** Labelled mono numeric readout for the resource bar & dashboards. */
export function Stat({
  label,
  value,
  accent = "neutral",
  align = "row",
  size = "md",
  style,
  ...rest
}) {
  const valueSize = size === "lg" ? "18px" : size === "sm" ? "12px" : "14px";
  const stacked = align === "stack";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        alignItems: stacked ? "flex-start" : "baseline",
        gap: stacked ? "2px" : "6px",
        ...style,
      }}
      {...rest}
    >
      <span className="wl-label" style={{ whiteSpace: "nowrap" }}>
        {label}
      </span>
      <span
        className="wl-num"
        style={{ fontWeight: 600, fontSize: valueSize, color: ACCENTS[accent], lineHeight: 1.1 }}
      >
        {value}
      </span>
    </div>
  );
}
