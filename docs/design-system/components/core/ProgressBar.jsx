import * as React from "react";

const TONES = {
  amber: "var(--amber)",
  blood: "var(--danger-strong)",
  sky: "var(--sky)",
  emerald: "var(--success)",
  violet: "var(--violet)",
};

/** Thin progress track — season timer, upkeep, defense %, build / train queue. */
export function ProgressBar({
  value = 0,
  max = 100,
  tone = "amber",
  label,
  valueText,
  height = 8,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: "100%", ...style }} {...rest}>
      {(label != null || valueText != null) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
          {label != null && <span className="wl-label">{label}</span>}
          {valueText != null && (
            <span className="wl-num" style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
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
            background: TONES[tone],
            borderRadius: "var(--radius-pill)",
            transition: "width var(--dur) var(--ease-out)",
          }}
        />
      </div>
    </div>
  );
}
