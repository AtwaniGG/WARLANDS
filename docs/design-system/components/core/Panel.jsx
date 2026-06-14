import React from "react";

/**
 * WARLANDS Panel — the bordered dark surface that frames every group of
 * controls (the rounded-lg border + panel background used across the HUD).
 * Optional ALL-CAPS title and an accent rim (e.g. amber for "your" panels,
 * blood for hostile-camp panels).
 */
export function Panel({ children, title, label, accent, rim, padding = "16px", style, headerRight, ...rest }) {
  const rimColor = {
    amber: "rgba(245,179,1,0.3)",
    blood: "rgba(220,38,38,0.3)",
    sky: "rgba(74,144,217,0.3)",
    emerald: "rgba(52,211,153,0.3)",
  }[rim];

  return (
    <section
      style={{
        background: "var(--surface-card)",
        border: `1px solid ${rimColor || "var(--border-default)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-1), var(--edge-inset)",
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
            style={{
              fontFamily: "var(--font-display)",
              fontSize: title ? "13px" : "10px",
              fontWeight: "var(--fw-semibold)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
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
