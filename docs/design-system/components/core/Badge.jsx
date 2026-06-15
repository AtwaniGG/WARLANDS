import * as React from "react";

const TONES = {
  amber: { solid: ["var(--amber)", "#0c0a04"], soft: ["rgba(245,179,1,0.16)", "var(--amber-text)"] },
  blood: { solid: ["var(--danger-strong)", "#fff"], soft: ["rgba(156,43,43,0.28)", "var(--blood-text)"] },
  sky: { solid: ["var(--sky)", "#06121f"], soft: ["rgba(74,144,217,0.18)", "var(--sky-text)"] },
  emerald: { solid: ["#15803d", "#eafff2"], soft: ["rgba(52,211,153,0.16)", "var(--emerald-text)"] },
  violet: { solid: ["var(--violet)", "#0c0a14"], soft: ["rgba(139,92,246,0.2)", "var(--violet-text)"] },
  teal: { solid: ["var(--teal)", "#04161a"], soft: ["rgba(63,154,166,0.2)", "var(--teal-text)"] },
  neutral: { solid: ["var(--surface-raised)", "var(--text-primary)"], soft: ["rgba(255,255,255,0.06)", "var(--text-secondary)"] },
};

/** Compact uppercase status / ownership tag (OWNED, PROTOTYPE, TIER 3, SHIELDED). */
export function Badge({
  children,
  tone = "amber",
  variant = "soft",
  icon,
  style,
  ...rest
}) {
  const [bg, fg] = TONES[tone][variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 7px",
        fontFamily: "var(--font-ui)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        lineHeight: 1.4,
        color: fg,
        background: bg,
        borderRadius: "var(--radius-sm)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon != null && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}
