/* @ds-bundle: {"format":3,"namespace":"WARLANDSDesignSystem_2e7699","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"ResourceChip","sourcePath":"components/core/ResourceChip.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"d95fe2984bbb","components/core/Button.jsx":"5aa3af8c9573","components/core/Panel.jsx":"f8cef3810cfa","components/core/ProgressBar.jsx":"d1ab8e81b7c8","components/core/ResourceChip.jsx":"c7bfe89e10a7","components/core/Stat.jsx":"0df19590beb6","components/core/Tabs.jsx":"e74f70722fa5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.WARLANDSDesignSystem_2e7699 = window.WARLANDSDesignSystem_2e7699 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  amber: {
    solid: ["var(--amber)", "#0c0a04"],
    soft: ["rgba(245,179,1,0.16)", "var(--amber-text)"]
  },
  blood: {
    solid: ["var(--danger-strong)", "#fff"],
    soft: ["rgba(156,43,43,0.28)", "var(--blood-text)"]
  },
  sky: {
    solid: ["var(--sky)", "#06121f"],
    soft: ["rgba(74,144,217,0.18)", "var(--sky-text)"]
  },
  emerald: {
    solid: ["#15803d", "#eafff2"],
    soft: ["rgba(52,211,153,0.16)", "var(--emerald-text)"]
  },
  violet: {
    solid: ["var(--violet)", "#0c0a14"],
    soft: ["rgba(139,92,246,0.2)", "var(--violet-text)"]
  },
  teal: {
    solid: ["var(--teal)", "#04161a"],
    soft: ["rgba(63,154,166,0.2)", "var(--teal-text)"]
  },
  neutral: {
    solid: ["var(--surface-raised)", "var(--text-primary)"],
    soft: ["rgba(255,255,255,0.06)", "var(--text-secondary)"]
  }
};

/** Compact uppercase status / ownership tag (OWNED, PROTOTYPE, TIER 3, SHIELDED). */
function Badge({
  children,
  tone = "amber",
  variant = "soft",
  icon,
  style,
  ...rest
}) {
  const [bg, fg] = TONES[tone][variant];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
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
      ...style
    }
  }, rest), icon != null && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, icon), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    padding: "4px 10px",
    fontSize: "11px",
    gap: "5px",
    borderRadius: "var(--radius-sm)"
  },
  md: {
    padding: "8px 14px",
    fontSize: "13px",
    gap: "6px",
    borderRadius: "var(--radius-sm)"
  },
  lg: {
    padding: "11px 18px",
    fontSize: "14px",
    gap: "8px",
    borderRadius: "var(--radius-md)"
  }
};
const PALETTES = {
  primary: {
    bg: "var(--cta-bg)",
    bgHover: "var(--cta-bg-hover)",
    fg: "var(--cta-fg)",
    border: "transparent"
  },
  secondary: {
    bg: "var(--surface-raised)",
    bgHover: "#222b3d",
    fg: "var(--text-primary)",
    border: "var(--hairline)"
  },
  danger: {
    bg: "var(--danger-strong)",
    bgHover: "#ef4444",
    fg: "#fff",
    border: "transparent"
  },
  info: {
    bg: "var(--sky)",
    bgHover: "#5a9ee0",
    fg: "#06121f",
    border: "transparent"
  },
  success: {
    bg: "#15803d",
    bgHover: "#16a34a",
    fg: "#eafff2",
    border: "transparent"
  },
  ghost: {
    bg: "transparent",
    bgHover: "rgba(255,255,255,0.05)",
    fg: "var(--text-secondary)",
    border: "transparent"
  },
  outline: {
    bg: "transparent",
    bgHover: "rgba(245,179,1,0.08)",
    fg: "var(--amber-text)",
    border: "rgba(245,179,1,0.4)"
  }
};

/**
 * Tactical action control. Amber `primary` is the claim / $WAR CTA.
 * WARLANDS uses emoji as functional icons — pass one to `icon`.
 */
function Button({
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
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
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
      ...style
    }
  }, rest), icon != null && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em",
      lineHeight: 1
    }
  }, icon), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Panel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const RIMS = {
  amber: "rgba(245,179,1,0.3)",
  blood: "rgba(220,38,38,0.3)",
  sky: "rgba(74,144,217,0.3)",
  emerald: "rgba(52,211,153,0.3)"
};

/** Dark bordered surface that frames a group of HUD controls. */
function Panel({
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
  return /*#__PURE__*/React.createElement("section", _extends({
    style: {
      background: "var(--surface-card)",
      border: `1px solid ${rimColor || "var(--border-default)"}`,
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-1)",
      overflow: "hidden",
      ...style
    }
  }, rest), (title || label) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      borderBottom: "1px solid var(--border-default)",
      background: "rgba(0,0,0,0.18)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wl-title",
    style: {
      fontSize: title ? "13px" : "10px",
      fontWeight: 600,
      letterSpacing: "0.1em",
      color: accent ? "var(--amber-text)" : "var(--text-secondary)"
    }
  }, title || label), headerRight), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Panel.jsx", error: String((e && e.message) || e) }); }

// components/core/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  amber: "var(--amber)",
  blood: "var(--danger-strong)",
  sky: "var(--sky)",
  emerald: "var(--success)",
  violet: "var(--violet)"
};

/** Thin progress track — season timer, upkeep, defense %, build / train queue. */
function ProgressBar({
  value = 0,
  max = 100,
  tone = "amber",
  label,
  valueText,
  height = 8,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: "100%",
      ...style
    }
  }, rest), (label != null || valueText != null) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: "5px"
    }
  }, label != null && /*#__PURE__*/React.createElement("span", {
    className: "wl-label"
  }, label), valueText != null && /*#__PURE__*/React.createElement("span", {
    className: "wl-num",
    style: {
      fontSize: "11px",
      color: "var(--text-secondary)"
    }
  }, valueText)), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuenow": Math.round(pct),
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    style: {
      height: `${height}px`,
      width: "100%",
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-pill)",
      overflow: "hidden",
      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      background: TONES[tone],
      borderRadius: "var(--radius-pill)",
      transition: "width var(--dur) var(--ease-out)"
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/core/ResourceChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const FRAMES = {
  raw: {
    border: "1px solid var(--hairline)",
    background: "rgba(255,255,255,0.03)"
  },
  intermediate: {
    border: "1px solid var(--border-strong)",
    background: "var(--surface-raised)"
  },
  finished: {
    border: "1px solid rgba(245,179,1,0.35)",
    background: "rgba(245,179,1,0.06)"
  }
};

/** Resource pill — icon + name + mono amount. The atom of stockpile / recipes / loot. */
function ResourceChip({
  icon,
  name,
  amount,
  tier = "raw",
  size = "md",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "8px",
      padding: size === "sm" ? "3px 7px" : "5px 9px",
      borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-ui)",
      fontSize: size === "sm" ? "11px" : "12px",
      color: "var(--text-secondary)",
      ...FRAMES[tier],
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "1.05em",
      display: "inline-flex",
      alignItems: "center"
    }
  }, icon), name != null && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-primary)"
    }
  }, name)), amount != null && /*#__PURE__*/React.createElement("span", {
    className: "wl-num",
    style: {
      color: "var(--text-hi)",
      fontWeight: 500
    }
  }, amount));
}
Object.assign(__ds_scope, { ResourceChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ResourceChip.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ACCENTS = {
  amber: "var(--amber-text)",
  blood: "var(--blood-text)",
  sky: "var(--sky-text)",
  emerald: "var(--emerald-text)",
  violet: "var(--violet-text)",
  teal: "var(--teal-text)",
  neutral: "var(--text-secondary)"
};

/** Labelled mono numeric readout for the resource bar & dashboards. */
function Stat({
  label,
  value,
  accent = "neutral",
  align = "row",
  size = "md",
  style,
  ...rest
}) {
  const valueSize = size === "lg" ? "18px" : size === "sm" ? "12px" : "14px";
  const stacked = align === "stack";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: stacked ? "column" : "row",
      alignItems: stacked ? "flex-start" : "baseline",
      gap: stacked ? "2px" : "6px",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "wl-label",
    style: {
      whiteSpace: "nowrap"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "wl-num",
    style: {
      fontWeight: 600,
      fontSize: valueSize,
      color: ACCENTS[accent],
      lineHeight: 1.1
    }
  }, value));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/core/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Primary view switcher — active tab is solid amber on near-black. */
function Tabs({
  tabs,
  value,
  onChange,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      gap: "4px",
      padding: "6px 12px",
      borderBottom: "1px solid var(--border-default)",
      background: "var(--bg-app)",
      overflowX: "auto",
      ...style
    }
  }, rest), tabs.map(t => {
    const active = t.id === value;
    const isHover = hover === t.id && !active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange?.(t.id),
      onMouseEnter: () => setHover(t.id),
      onMouseLeave: () => setHover(null),
      style: {
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
        transition: "background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)"
      }
    }, t.icon != null && /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true"
    }, t.icon), t.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tabs.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ResourceChip = __ds_scope.ResourceChip;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
