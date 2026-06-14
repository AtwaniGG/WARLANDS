import React from "react";

/**
 * WARLANDS Tabs — the primary view switcher (World · Market · Allegiance ·
 * Season). Active tab is solid amber with near-black text; inactive tabs are
 * muted and lift on hover. Tabs carry an emoji icon.
 */
export function Tabs({ tabs = [], value, onChange, style, ...rest }) {
  const [hover, setHover] = React.useState(null);
  return (
    <nav
      style={{
        display: "flex",
        gap: "4px",
        padding: "6px 12px",
        borderBottom: "1px solid var(--border-default)",
        background: "var(--bg-app)",
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
            onClick={() => onChange && onChange(t.id)}
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
              fontWeight: "var(--fw-semibold)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: active ? "#0c0a04" : isHover ? "var(--text-primary)" : "var(--text-secondary)",
              background: active ? "var(--amber)" : isHover ? "var(--surface-raised)" : "transparent",
              transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)",
            }}
          >
            {t.icon && <span aria-hidden="true">{t.icon}</span>}
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
