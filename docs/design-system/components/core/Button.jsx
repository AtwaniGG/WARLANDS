import * as React from "react";

const SIZES = {
  sm: { padding: "4px 10px", fontSize: "11px", gap: "5px", borderRadius: "var(--radius-sm)" },
  md: { padding: "8px 14px", fontSize: "13px", gap: "6px", borderRadius: "var(--radius-sm)" },
  lg: { padding: "11px 18px", fontSize: "14px", gap: "8px", borderRadius: "var(--radius-md)" },
};

const PALETTES = {
  primary: { bg: "var(--cta-bg)", bgHover: "var(--cta-bg-hover)", fg: "var(--cta-fg)", border: "transparent" },
  secondary: { bg: "var(--surface-raised)", bgHover: "#222b3d", fg: "var(--text-primary)", border: "var(--hairline)" },
  danger: { bg: "var(--danger-strong)", bgHover: "#ef4444", fg: "#fff", border: "transparent" },
  info: { bg: "var(--sky)", bgHover: "#5a9ee0", fg: "#06121f", border: "transparent" },
  success: { bg: "#15803d", bgHover: "#16a34a", fg: "#eafff2", border: "transparent" },
  ghost: { bg: "transparent", bgHover: "rgba(255,255,255,0.05)", fg: "var(--text-secondary)", border: "transparent" },
  outline: { bg: "transparent", bgHover: "rgba(245,179,1,0.08)", fg: "var(--amber-text)", border: "rgba(245,179,1,0.4)" },
};

/**
 * Tactical action control. Amber `primary` is the claim / $WAR CTA.
 * WARLANDS uses emoji as functional icons — pass one to `icon`.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  full = false,
  disabled = false,
  type = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size];
  const p = PALETTES[variant];

  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: full ? "flex" : "inline-flex",
        width: full ? "100%" : "auto",
        alignItems: "center",
        justifyContent: "center",
        ...s,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "0.01em",
        color: disabled ? "var(--text-muted)" : p.fg,
        background: disabled ? "var(--disabled)" : hover ? p.bgHover : p.bg,
        border: `1px solid ${disabled ? "transparent" : p.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
        transform: hover && !disabled ? "translateY(-1px)" : "none",
        userSelect: "none",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {icon != null && (
        <span aria-hidden="true" style={{ fontSize: "1.05em", lineHeight: 1 }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
