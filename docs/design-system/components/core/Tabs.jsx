import * as React from "react";

/** Primary view switcher — active tab is solid amber on near-black. */
export function Tabs({
  tabs,
  value,
  onChange,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  return (
    <nav
      style={{
        display: "flex",
        gap: "4px",
        padding: "6px 12px",
        borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-app)",
        overflowX: "auto",
        ...style,
      }}
      {...rest}
    >
      {tabs.map((t) => {
        const active = t.id === value;
        const isHover = hover === t.id && !active;
        return (
          <button
            key={t.id}
            onClick={() => onChange?.(t.id)}
            onMouseEnter={() => setHover(t.id)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              border: "none",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-ui)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: active ? "var(--cta-fg)" : isHover ? "var(--text-primary)" : "var(--text-secondary)",
              background: active ? "var(--cta-bg)" : isHover ? "var(--surface-raised)" : "transparent",
              transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
            }}
          >
            {t.icon != null && <span aria-hidden="true">{t.icon}</span>}
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
