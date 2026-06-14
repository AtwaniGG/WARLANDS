import React from "react";

/**
 * WARLANDS ProgressBar — season timer, upkeep, defense, build queue.
 * Thin track on a sunken surface; fill tinted by tone. Optional label row
 * with a mono value (e.g. "62%" or "48s remaining").
 */
const TONES = {
  amber: "var(--amber)",
  blood: "var(--danger-strong)",
  sky: "var(--sky)",
  emerald: "var(--success)",
  violet: "var(--violet)",
};

export function ProgressBar({ value = 0, max = 100, tone = "amber", label, valueText, height = 8, style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%", ...style }} {...rest}>
      {(label || valueText) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
          {label && (
            <span style={{ fontSize: "10px", fontWeight: "var(--fw-semibold)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
              {label}
            </span>
          )}
          {valueText != null && (
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: "11px", color: "var(--text-secondary)" }}>
              {valueText}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: `${height}px`,
          width: "100%",
          background: "var(--surface-sunken)",
          borderRadius: "var(--radius-pill)",
          overflow: "hidden",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: TONES[tone] || TONES.amber,
            borderRadius: "var(--radius-pill)",
            transition: "width var(--dur) var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}
