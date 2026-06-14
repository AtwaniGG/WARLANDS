"use client";

import * as React from "react";

export type StatAccent =
  | "amber"
  | "blood"
  | "sky"
  | "emerald"
  | "violet"
  | "teal"
  | "neutral";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  /** The readout — rendered mono + tabular via `.wl-num`. Pre-format numbers. */
  value: React.ReactNode;
  accent?: StatAccent;
  /** row = inline (HUD bar); stack = label above value (cards). */
  align?: "row" | "stack";
  size?: "sm" | "md" | "lg";
}

const ACCENTS: Record<StatAccent, string> = {
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
}: StatProps) {
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
