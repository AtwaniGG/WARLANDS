import React from "react";

/**
 * WARLANDS Button — the tactical action control.
 * Primary actions are amber with near-black text (the "$WAR / claim" CTA);
 * secondary/ghost recede; danger is blood-red; info is sky.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  disabled = false,
  full = false,
  type = "button",
  onClick,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);

  const sizes = {
    sm: { padding: "4px 10px", fontSize: "11px", gap: "5px", radius: "var(--radius-sm)" },
    md: { padding: "8px 14px", fontSize: "13px", gap: "6px", radius: "var(--radius-sm)" },
    lg: { padding: "11px 18px", fontSize: "14px", gap: "8px", radius: "var(--radius-md)" },
  };

  const palettes = {
    primary: { bg: "var(--amber)", bgHover: "var(--cta-bg-hover)", fg: "var(--cta-fg)", border: "transparent" },
    secondary: { bg: "var(--surface-raised)", bgHover: "#222b3d", fg: "var(--text-primary)", border: "var(--hairline)" },
    danger: { bg: "var(--danger-strong)", bgHover: "#ef4444", fg: "#fff", border: "transparent" },
    info: { bg: "var(--sky)", bgHover: "#5a9ee0", fg: "#06121f", border: "transparent" },
    success: { bg: "#15803d", bgHover: "#16a34a", fg: "#eafff2", border: "transparent" },
    ghost: { bg: "transparent", bgHover: "rgba(255,255,255,0.05)", fg: "var(--text-secondary)", border: "transparent" },
    outline: { bg: "transparent", bgHover: "rgba(245,179,1,0.08)", fg: "var(--amber-text)", border: "rgba(245,179,1,0.4)" },
  };

  const s = sizes[size] || sizes.md;
  const p = palettes[variant] || palettes.primary;

  const base = {
    display: full ? "flex" : "inline-flex",
    width: full ? "100%" : "auto",
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    padding: s.padding,
    fontFamily: "var(--font-ui)",
    fontSize: s.fontSize,
    fontWeight: "var(--fw-semibold)",
    lineHeight: 1,
    letterSpacing: "0.01em",
    color: disabled ? "var(--text-muted)" : p.fg,
    background: disabled ? "var(--disabled)" : hover ? p.bgHover : p.bg,
    border: `1px solid ${disabled ? "transparent" : p.border}`,
    borderRadius: s.radius,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out)",
    transform: hover && !disabled ? "translateY(-1px)" : "none",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={base}
      {...rest}
    >
      {icon && <span style={{ fontSize: "1.05em", lineHeight: 1 }} aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
