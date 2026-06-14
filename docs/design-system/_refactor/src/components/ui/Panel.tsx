"use client";

import * as React from "react";

export type PanelRim = "amber" | "blood" | "sky" | "emerald";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** ALL-CAPS condensed title (13px). */
  title?: React.ReactNode;
  /** Smaller ALL-CAPS micro-label (10px) — use instead of title for dense headers. */
  label?: React.ReactNode;
  /** Tint the header text amber. */
  accent?: boolean;
  /** Accent border rim color. */
  rim?: PanelRim;
  /** Body padding. */
  padding?: string;
  /** Node pinned to the right of the header. */
  headerRight?: React.ReactNode;
}

const RIMS: Record<PanelRim, string> = {
  amber: "rgba(245,179,1,0.3)",
  blood: "rgba(220,38,38,0.3)",
  sky: "rgba(74,144,217,0.3)",
  emerald: "rgba(52,211,153,0.3)",
};

/** Dark bordered surface that frames a group of HUD controls. */
export function Panel({
  children,
  title,
  label,
  accent,
  rim,
  padding = "16px",
  headerRight,
  style,
  ...rest
}: PanelProps) {
  const rimColor = rim ? RIMS[rim] : undefined;
  return (
    <section
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${rimColor || "var(--border-default)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-1)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {(title || label) && (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-default)",
            background: "rgba(0,0,0,0.18)",
          }}
        >
          <span
            className="wl-title"
            style={{
              fontSize: title ? "13px" : "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: accent ? "var(--amber-text)" : "var(--text-secondary)",
            }}
          >
            {title || label}
          </span>
          {headerRight}
        </header>
      )}
      <div style={{ padding }}>{children}</div>
    </section>
  );
}
