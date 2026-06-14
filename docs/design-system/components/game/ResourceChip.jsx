import React from "react";

/**
 * WARLANDS ResourceChip — an icon + name + mono amount, the atom of the
 * stockpile, recipes, loot and order-book. Tier sets a frame treatment:
 * raw = plain, intermediate = bracketed (hairline), finished = badged
 * (amber edge). Never rely on color alone — the emoji icon carries identity.
 */
export function ResourceChip({ icon, name, amount, tier = "raw", size = "md", style, ...rest }) {
  const frames = {
    raw: { border: "1px solid var(--hairline)", background: "rgba(255,255,255,0.03)" },
    intermediate: { border: "1px solid var(--border-strong)", background: "var(--surface-raised)" },
    finished: { border: "1px solid rgba(245,179,1,0.35)", background: "rgba(245,179,1,0.06)" },
  };
  const pad = size === "sm" ? "3px 7px" : "5px 9px";
  const fs = size === "sm" ? "11px" : "12px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: pad,
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-ui)",
        fontSize: fs,
        color: "var(--text-secondary)",
        ...(frames[tier] || frames.raw),
        ...style,
      }}
      {...rest}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
        <span aria-hidden="true" style={{ fontSize: "1.05em" }}>{icon}</span>
        {name && <span style={{ color: "var(--text-primary)" }}>{name}</span>}
      </span>
      {amount != null && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-hi)",
            fontWeight: "var(--fw-medium)",
          }}
        >
          {amount}
        </span>
      )}
    </span>
  );
}
