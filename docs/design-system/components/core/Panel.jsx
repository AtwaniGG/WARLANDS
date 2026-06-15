import * as React from "react";

const RIMS = {
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
}) {
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
