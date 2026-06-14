"use client";

import * as React from "react";

export type ResourceTier = "raw" | "intermediate" | "finished";

export interface ResourceChipProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Resource emoji (functional icon). */
  icon: React.ReactNode;
  /** Resource name. Omit to render an icon-only count chip. */
  name?: React.ReactNode;
  /** Pre-formatted amount, mono + tabular via `.wl-num`. */
  amount?: React.ReactNode;
  tier?: ResourceTier;
  size?: "sm" | "md";
}

const FRAMES: Record<ResourceTier, React.CSSProperties> = {
  raw: { border: "1px solid var(--hairline)", background: "rgba(255,255,255,0.03)" },
  intermediate: { border: "1px solid var(--border-strong)", background: "var(--surface-raised)" },
  finished: { border: "1px solid rgba(245,179,1,0.35)", background: "rgba(245,179,1,0.06)" },
};

/** Resource pill — icon + name + mono amount. The atom of stockpile / recipes / loot. */
export function ResourceChip({
  icon,
  name,
  amount,
  tier = "raw",
  size = "md",
  style,
  ...rest
}: ResourceChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: size === "sm" ? "3px 7px" : "5px 9px",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-ui)",
        fontSize: size === "sm" ? "11px" : "12px",
        color: "var(--text-secondary)",
        ...FRAMES[tier],
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
        <span aria-hidden="true" style={{ fontSize: "1.05em" }}>
          {icon}
        </span>
        {name != null && <span style={{ color: "var(--text-primary)" }}>{name}</span>}
      </span>
      {amount != null && (
        <span className="wl-num" style={{ color: "var(--text-hi)", fontWeight: 500 }}>
          {amount}
        </span>
      )}
    </span>
  );
}
