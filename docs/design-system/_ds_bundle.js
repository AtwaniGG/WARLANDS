/* @ds-bundle: {"format":3,"namespace":"WARLANDSDesignSystem_2e7699","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Panel","sourcePath":"components/core/Panel.jsx"},{"name":"ProgressBar","sourcePath":"components/core/ProgressBar.jsx"},{"name":"ResourceChip","sourcePath":"components/core/ResourceChip.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"Tabs","sourcePath":"components/core/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"d95fe2984bbb","components/core/Button.jsx":"5aa3af8c9573","components/core/Panel.jsx":"f8cef3810cfa","components/core/ProgressBar.jsx":"d1ab8e81b7c8","components/core/ResourceChip.jsx":"c7bfe89e10a7","components/core/Stat.jsx":"0df19590beb6","components/core/Tabs.jsx":"e74f70722fa5","ui_kits/warroom/app.js":"3c798d94d742","ui_kits/warroom/data.js":"0bba06564738","ui_kits/warroom/panels.js":"90fe5a099af3","ui_kits/warroom/shell.js":"4303fe4b91f7"},"inlinedExternals":[],"unexposedExports":[]} */

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

// ui_kits/warroom/app.js
try { (() => {
// WARLANDS War Room — root shell: state, toasts, resource tick, tab routing.
const DSr = window.WARLANDSDesignSystem_2e7699;
const {
  Tabs: TabsR
} = DSr;
const {
  TopBar,
  HexMap
} = window.WL_SCREENS;
const {
  PlotPanel,
  MarketPanel,
  ArmyPanel,
  PlaceholderPanel
} = window.WL_PANELS;
const {
  buildWorld,
  TERRAIN: TT,
  BUILDINGS: BB
} = window.WL_DATA;
const {
  useState: uS,
  useEffect: uE,
  useMemo: uM,
  useRef: uR
} = React;
const TABS = [{
  id: "map",
  label: "World",
  icon: "🗺️"
}, {
  id: "market",
  label: "Market",
  icon: "💱"
}, {
  id: "army",
  label: "Army",
  icon: "🎖️"
}, {
  id: "allegiance",
  label: "Allegiance",
  icon: "🤝"
}, {
  id: "season",
  label: "Season",
  icon: "🏆"
}, {
  id: "shop",
  label: "Shop",
  icon: "🔗"
}];
function WarRoom() {
  const hexes0 = uM(() => {
    const hs = buildWorld(4);
    // mark a couple inner hexes hostile
    const enemyKeys = new Set(["1,-2", "-1,1", "2,0"]);
    hs.forEach(h => {
      if (enemyKeys.has(h.key)) h.enemy = true;
    });
    return hs;
  }, []);

  // starting owned cluster on the safe outer rings
  const startPlots = uM(() => {
    const ring3 = hexes0.filter(h => h.ring === 3 && !h.enemy).slice(0, 2);
    const out = {};
    ring3.forEach((h, i) => {
      out[h.key] = {
        terrain: h.terrain,
        buildings: i === 0 ? [{
          id: "farm",
          level: 2
        }, {
          id: "lumberCamp",
          level: 1
        }] : [{
          id: "ironMine",
          level: 1
        }],
        resources: i === 0 ? {
          food: 340,
          wood: 120
        } : {
          iron: 86
        },
        defensePct: i === 0 ? 72 : 48
      };
    });
    return out;
  }, [hexes0]);
  const [war, setWar] = uS(80000);
  const [staked, setStaked] = uS(45000);
  const [burned, setBurned] = uS(6540);
  const [pool] = uS(312900);
  const [plots, setPlots] = uS(startPlots);
  const [army, setArmy] = uS({
    infantry: 12,
    tanks: 3
  });
  const [selected, setSelected] = uS(Object.keys(startPlots)[0] || null);
  const [view, setView] = uS("map");
  const [toast, setToast] = uS(null);
  const flash = (msg, tone = "amber") => {
    setToast({
      msg,
      tone
    });
    clearTimeout(window.__wlt);
    window.__wlt = setTimeout(() => setToast(null), 2200);
  };

  // resource tick — collectors fill up (juice)
  uE(() => {
    const id = setInterval(() => {
      setPlots(p => {
        const next = {
          ...p
        };
        for (const k of Object.keys(next)) {
          const pl = next[k];
          if (!pl.buildings.length) continue;
          const res = {
            ...pl.resources
          };
          pl.buildings.forEach(b => {
            const bd = BB.find(x => x.id === b.id);
            if (bd && bd.makes) res[bd.makes] = Math.min(2000, (res[bd.makes] || 0) + b.level * 1.5);
          });
          next[k] = {
            ...pl,
            resources: res
          };
        }
        return next;
      });
    }, 1200);
    return () => clearInterval(id);
  }, []);
  const selHex = hexes0.find(h => h.key === selected);
  const selPlot = selected ? plots[selected] : null;
  const claim = hex => {
    const def = TT[hex.terrain];
    if (war < def.stake) return;
    setWar(w => w - def.stake);
    setStaked(s => s + def.stake);
    setPlots(p => ({
      ...p,
      [hex.key]: {
        terrain: hex.terrain,
        buildings: [],
        resources: {},
        defensePct: 50
      }
    }));
    flash(`Claimed ${def.name} · staked ${Math.floor(def.stake).toLocaleString()} $WAR`);
  };
  const build = (key, bd) => {
    if (war < bd.cost) return;
    setWar(w => w - bd.cost);
    setBurned(b => b + Math.round(bd.cost * 0.2));
    setPlots(p => ({
      ...p,
      [key]: {
        ...p[key],
        buildings: [...p[key].buildings, {
          id: bd.id,
          level: 1
        }]
      }
    }));
    flash(`Built ${bd.name}`, "emerald");
  };
  const upgrade = (key, i) => {
    setPlots(p => {
      const pl = p[key];
      const b = pl.buildings[i];
      const bd = BB.find(x => x.id === b.id);
      const cost = Math.round(bd.cost * Math.pow(1.6, b.level));
      if (war < cost) return p;
      setWar(w => w - cost);
      setBurned(x => x + Math.round(cost * 0.2));
      const buildings = pl.buildings.map((x, j) => j === i ? {
        ...x,
        level: x.level + 1
      } : x);
      flash(`Upgraded ${bd.name} → L${b.level + 1}`, "sky");
      return {
        ...p,
        [key]: {
          ...pl,
          buildings
        }
      };
    });
  };
  const collect = key => {
    let gained = 0;
    setPlots(p => {
      const pl = p[key];
      gained = Object.values(pl.resources).reduce((a, b) => a + b, 0);
      return {
        ...p,
        [key]: {
          ...pl,
          resources: {}
        }
      };
    });
    flash(`Collected ${Math.floor(gained).toLocaleString()} resources`, "emerald");
  };
  const train = id => {
    const u = window.WL_DATA.UNITS[id];
    if (war < u.war) return;
    setWar(w => w - u.war);
    setArmy(a => ({
      ...a,
      [id]: (a[id] || 0) + 1
    }));
    flash(`Trained 1× ${u.name}`, "amber");
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--panel-void)",
      color: "var(--text-hi)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    war: war,
    staked: staked,
    burned: burned,
    pool: pool,
    plots: Object.keys(plots).length
  }), /*#__PURE__*/React.createElement(TabsR, {
    tabs: TABS,
    value: view,
    onChange: setView
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "row"
    }
  }, view === "map" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("main", {
    style: {
      position: "relative",
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(HexMap, {
    hexes: hexes0,
    plots: plots,
    selected: selected,
    onSelect: setSelected
  })), /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 360,
      flexShrink: 0,
      borderLeft: "1px solid var(--hairline)",
      background: "var(--panel)",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement(PlotPanel, {
    hex: selHex,
    plot: selPlot,
    war: war,
    onClaim: claim,
    onBuild: build,
    onCollect: collect,
    onUpgrade: upgrade
  }))), view === "market" && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement(MarketPanel, null)), view === "army" && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement(ArmyPanel, {
    war: war,
    army: army,
    onTrain: train
  })), view === "allegiance" && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PlaceholderPanel, {
    icon: "\uD83E\uDD1D",
    title: "Allegiance",
    note: "Found or join an Allegiance to pool treasury, build shared buffs, and govern territory together."
  })), view === "season" && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PlaceholderPanel, {
    icon: "\uD83C\uDFC6",
    title: "Season 4",
    note: "18d 04h remaining. Ranked rewards funded entirely by sinks \u2014 payouts never exceed what was collected."
  })), view === "shop" && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(PlaceholderPanel, {
    icon: "\uD83D\uDD17",
    title: "$WAR Shop",
    note: "Buy builders, instant-finishes, shield extensions and cosmetics. Earn $WAR from raids and league finishes."
  }))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 16px",
      borderRadius: "var(--radius-md)",
      background: "var(--panel-2)",
      border: "1px solid var(--border-strong)",
      boxShadow: "var(--shadow-2)",
      animation: "wl-toast 0.2s var(--ease-snap)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 8,
      width: 8,
      borderRadius: 999,
      background: `var(--${toast.tone === "emerald" ? "success" : toast.tone === "sky" ? "sky" : toast.tone === "blood" ? "danger-strong" : "amber"})`
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-hi)"
    }
  }, toast.msg)));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(WarRoom, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warroom/app.js", error: String((e && e.message) || e) }); }

// ui_kits/warroom/data.js
try { (() => {
// WARLANDS War Room — game data (mirrors src/game/* from the codebase, trimmed for the kit).
// Exposed on window for the babel screen scripts.

const TERRAIN = {
  plains: {
    name: "Basic Plot",
    stake: 10000,
    color: "var(--terrain-plains)",
    def: 1.0,
    reward: 1.0,
    blurb: "Balanced starter land. +5% build speed."
  },
  forest: {
    name: "Forest Plot",
    stake: 12500,
    color: "var(--terrain-forest)",
    def: 1.1,
    reward: 1.1,
    blurb: "+15% wood, defender ambush bonus."
  },
  river: {
    name: "River Plot",
    stake: 15000,
    color: "var(--terrain-river)",
    def: 1.0,
    reward: 1.15,
    blurb: "+20% food, +15% water, −10% market fees."
  },
  mountain: {
    name: "Mountain Plot",
    stake: 20000,
    color: "var(--terrain-mountain)",
    def: 1.3,
    reward: 1.25,
    blurb: "+25% iron, +20% stone, +30% defense."
  },
  desert: {
    name: "Oil Desert Plot",
    stake: 25000,
    color: "var(--terrain-desert)",
    def: 0.9,
    reward: 1.3,
    blurb: "+30% oil, exposed (weak natural defense)."
  },
  coastal: {
    name: "Coastal Trade Plot",
    stake: 30000,
    color: "var(--terrain-coastal)",
    def: 1.0,
    reward: 1.4,
    blurb: "−20% transport cost, sea routes, trade hub."
  },
  industrial: {
    name: "Industrial Plot",
    stake: 40000,
    color: "var(--terrain-industrial)",
    def: 1.0,
    reward: 1.6,
    blurb: "+25% factory efficiency, +1 factory slot."
  },
  techRuins: {
    name: "Technology Ruins Plot",
    stake: 50000,
    color: "var(--terrain-techruins)",
    def: 1.0,
    reward: 1.8,
    blurb: "+30% research, unlocks rare blueprints."
  },
  warzone: {
    name: "Warzone Plot",
    stake: 60000,
    color: "var(--terrain-warzone)",
    def: 0.9,
    reward: 2.5,
    blurb: "+40% all yields, season ×2.5. No protection."
  }
};
const R = id => `../../assets/resources/${id}.svg`;
const B = id => `../../assets/buildings/${id}.svg`;
const U = id => `../../assets/units/${id}.svg`;
const RESOURCES = {
  food: {
    name: "Food",
    tier: "raw",
    art: R("food")
  },
  water: {
    name: "Water",
    tier: "raw",
    art: R("water")
  },
  wood: {
    name: "Wood",
    tier: "raw",
    art: R("wood")
  },
  stone: {
    name: "Stone",
    tier: "raw",
    art: R("stone")
  },
  iron: {
    name: "Iron",
    tier: "raw",
    art: R("iron")
  },
  oil: {
    name: "Oil",
    tier: "raw",
    art: R("oil")
  },
  fuel: {
    name: "Fuel",
    tier: "intermediate",
    art: R("fuel")
  },
  steel: {
    name: "Steel",
    tier: "intermediate",
    art: R("steel")
  },
  electronics: {
    name: "Electronics",
    tier: "intermediate",
    art: R("electronics")
  },
  rifles: {
    name: "Rifles",
    tier: "finished",
    art: R("rifles")
  },
  tanks: {
    name: "Tanks",
    tier: "finished",
    art: R("tanks")
  },
  aircraft: {
    name: "Aircraft",
    tier: "finished",
    art: R("aircraft")
  }
};

// Buildings buildable on a generic plot (subset; full set gated by terrain in the real game).
const BUILDINGS = [{
  id: "farm",
  name: "Farm",
  cost: 200,
  art: B("farm"),
  makes: "food",
  kind: "extractor"
}, {
  id: "lumberCamp",
  name: "Lumber Camp",
  cost: 200,
  art: B("lumberCamp"),
  makes: "wood",
  kind: "extractor"
}, {
  id: "quarry",
  name: "Quarry",
  cost: 250,
  art: B("quarry"),
  makes: "stone",
  kind: "extractor"
}, {
  id: "ironMine",
  name: "Iron Mine",
  cost: 400,
  art: B("ironMine"),
  makes: "iron",
  kind: "extractor"
}, {
  id: "oilDerrick",
  name: "Oil Derrick",
  cost: 800,
  art: B("oilDerrick"),
  makes: "oil",
  kind: "extractor"
}, {
  id: "refinery",
  name: "Refinery",
  cost: 1000,
  art: B("refinery"),
  makes: "fuel",
  kind: "factory"
}, {
  id: "foundry",
  name: "Foundry",
  cost: 1400,
  art: B("foundry"),
  makes: "steel",
  kind: "factory"
}, {
  id: "armsFactory",
  name: "Arms Factory",
  cost: 2200,
  art: B("armsFactory"),
  makes: "rifles",
  kind: "factory"
}, {
  id: "warehouse",
  name: "Warehouse",
  cost: 500,
  art: B("warehouse"),
  makes: null,
  kind: "storage"
}];
const UNITS = {
  infantry: {
    name: "Infantry",
    art: U("infantry"),
    atk: 10,
    def: 12,
    war: 20,
    desc: "Cheap, durable garrison. Strong vs Engineers."
  },
  tanks: {
    name: "Tanks",
    art: U("tanks"),
    atk: 32,
    def: 26,
    war: 120,
    desc: "Armored spearhead. Strong vs Infantry/Turrets."
  },
  artillery: {
    name: "Artillery",
    art: U("artillery"),
    atk: 40,
    def: 8,
    war: 110,
    desc: "Siege & area damage. Strong vs Tanks/Structures."
  },
  aircraft: {
    name: "Aircraft",
    art: U("aircraft"),
    atk: 38,
    def: 14,
    war: 200,
    desc: "Fast strike. Strong vs ground; weak vs Drones."
  },
  drones: {
    name: "Drones",
    art: U("drones"),
    atk: 22,
    def: 10,
    war: 90,
    desc: "Interceptor / recon. Strong vs Aircraft."
  },
  engineers: {
    name: "Engineers",
    art: U("engineers"),
    atk: 6,
    def: 8,
    war: 50,
    desc: "Sabotage, repair, traps. Strong vs Structures."
  }
};

// ---- Build a small pointy-top hex world (axial coords, ring-based terrain) ----
const HEX_SIZE = 30;
function axialToPixel(q, r, size) {
  return {
    x: size * Math.sqrt(3) * (q + r / 2),
    y: size * 1.5 * r
  };
}
function hexRing(q, r) {
  return (Math.abs(q) + Math.abs(r) + Math.abs(-q - r)) / 2;
}

// Deterministic pseudo-random from coords
function rng(q, r) {
  const s = Math.sin(q * 127.1 + r * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function buildWorld(radius) {
  const hexes = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const ring = hexRing(q, r);
      const v = rng(q, r);
      // inner rings = higher-tier / more hostile terrain
      let terrain;
      if (ring >= radius - 0) terrain = v < 0.5 ? "plains" : "forest";else if (ring >= 3) terrain = v < 0.3 ? "river" : v < 0.6 ? "forest" : "mountain";else if (ring === 2) terrain = v < 0.3 ? "mountain" : v < 0.55 ? "desert" : v < 0.8 ? "coastal" : "industrial";else if (ring === 1) terrain = v < 0.4 ? "industrial" : v < 0.75 ? "techRuins" : "warzone";else terrain = "warzone";
      const {
        x,
        y
      } = axialToPixel(q, r, HEX_SIZE);
      hexes.push({
        key: `${q},${r}`,
        q,
        r,
        x,
        y,
        ring,
        terrain
      });
    }
  }
  return hexes;
}
window.WL_DATA = {
  TERRAIN,
  RESOURCES,
  BUILDINGS,
  UNITS,
  HEX_SIZE,
  axialToPixel,
  buildWorld
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warroom/data.js", error: String((e && e.message) || e) }); }

// ui_kits/warroom/panels.js
try { (() => {
// WARLANDS War Room — side-rail panels (Plot management, Market, Army).
const DSp = window.WARLANDSDesignSystem_2e7699;
const {
  Button: Btn,
  Badge: Bdg,
  Stat: St,
  Panel: Pnl,
  ProgressBar: Prog,
  ResourceChip: Chip
} = DSp;
const {
  TERRAIN: T,
  RESOURCES: RES,
  BUILDINGS: BLD,
  UNITS: UN
} = window.WL_DATA;
const {
  Icon: Ic,
  fmt: f
} = window.WL_SCREENS;
function Row({
  label,
  value,
  valColor
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: valColor || "var(--text-primary)"
    }
  }, value));
}
function PlotPanel({
  hex,
  plot,
  war,
  onClaim,
  onBuild,
  onCollect,
  onUpgrade
}) {
  if (!hex) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      fontSize: 13,
      color: "var(--text-lo)"
    }
  }, "Select a hex on the map to inspect or claim it.");
  const def = T[hex.terrain];

  // Enemy hex
  if (hex.enemy && !plot) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wl-title",
      style: {
        fontSize: 18,
        color: def.color
      }
    }, def.name), /*#__PURE__*/React.createElement(Bdg, {
      tone: "blood",
      variant: "solid"
    }, "Hostile")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-lo)"
      }
    }, "Hex (", hex.q, ", ", hex.r, ") \xB7 ring ", hex.ring, " \xB7 held by Iron Syndicate"), /*#__PURE__*/React.createElement(Pnl, {
      label: "Scouted defenses",
      rim: "blood",
      padding: "12px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "Est. lootable Gold",
      value: `${f(4200)} $WAR`,
      valColor: "var(--amber-text)"
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Defense power",
      value: "2,840"
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Garrison",
      value: "Infantry \xD718 \xB7 Tanks \xD74"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(Btn, {
      variant: "secondary",
      full: true,
      icon: "\uD83D\uDD2D"
    }, "Scout"), /*#__PURE__*/React.createElement(Btn, {
      variant: "danger",
      full: true,
      icon: "\u2694\uFE0F"
    }, "Siege")));
  }

  // Unclaimed
  if (!plot) {
    const canAfford = war >= def.stake;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "wl-title",
      style: {
        fontSize: 18,
        color: def.color
      }
    }, def.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--text-lo)"
      }
    }, "Hex (", hex.q, ", ", hex.r, ") \xB7 ring ", hex.ring)), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 14,
        color: "var(--text-secondary)",
        margin: 0,
        lineHeight: 1.5
      }
    }, def.blurb), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 5,
        padding: 12,
        borderRadius: "var(--radius-md)",
        background: "rgba(26,32,48,0.5)"
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "Stake to claim",
      value: `${f(def.stake)} $WAR`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Defense mult",
      value: `×${def.def}`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Reward mult",
      value: `×${def.reward}`
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Protection",
      value: hex.terrain === "warzone" ? "never (warzone)" : "eligible"
    })), /*#__PURE__*/React.createElement(Btn, {
      variant: "primary",
      full: true,
      icon: "\u2694\uFE0F",
      disabled: !canAfford,
      onClick: () => onClaim(hex)
    }, canAfford ? `Stake ${f(def.stake)} $WAR & Claim` : "Insufficient $WAR"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 11,
        color: "var(--text-muted)",
        margin: 0,
        lineHeight: 1.5
      }
    }, "Staked $WAR is ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-secondary)"
      }
    }, "locked, never spent"), ". Returned on unstake minus a 3% fee. Never lootable."));
  }

  // Owned
  const slotCap = 6;
  const used = plot.buildings.length;
  const ready = Object.values(plot.resources).some(v => v > 1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wl-title",
    style: {
      fontSize: 18,
      color: def.color
    }
  }, def.name), /*#__PURE__*/React.createElement(Bdg, {
    tone: "amber"
  }, "Owned")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-lo)"
    }
  }, "staked ", f(def.stake), " $WAR \xB7 ring ", hex.ring), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Prog, {
    value: plot.defensePct,
    max: 100,
    tone: plot.defensePct < 60 ? "blood" : "emerald",
    label: "Defense",
    valueText: `${plot.defensePct}%`
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wl-label",
    style: {
      marginBottom: 6,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Stockpile \xB7 cap 2,000"), ready && /*#__PURE__*/React.createElement(Btn, {
    variant: "success",
    size: "sm",
    onClick: () => onCollect(hex.key)
  }, "Collect")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6
    }
  }, Object.entries(plot.resources).filter(([, v]) => v > 0.01).map(([id, v]) => /*#__PURE__*/React.createElement(Chip, {
    key: id,
    icon: /*#__PURE__*/React.createElement(Ic, {
      src: RES[id].art,
      size: 15
    }),
    name: RES[id].name,
    amount: f(v),
    tier: RES[id].tier,
    size: "sm"
  })), Object.keys(plot.resources).length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-muted)",
      gridColumn: "1/3"
    }
  }, "Empty \u2014 build an extractor to start production."))), plot.buildings.length > 0 && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wl-label",
    style: {
      marginBottom: 6,
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Buildings"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "slots ", used, "/", slotCap)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, plot.buildings.map((b, i) => {
    const bd = BLD.find(x => x.id === b.id);
    const cost = Math.round(bd.cost * Math.pow(1.6, b.level));
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 8,
        borderRadius: "var(--radius-sm)",
        background: "rgba(26,32,48,0.5)",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Ic, {
      src: bd.art,
      size: 18
    }), " ", bd.name, " ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-muted)"
      }
    }, "L", b.level)), /*#__PURE__*/React.createElement(Btn, {
      variant: "info",
      size: "sm",
      disabled: war < cost,
      onClick: () => onUpgrade(hex.key, i)
    }, "\u2B06 ", f(cost)));
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wl-label",
    style: {
      marginBottom: 6
    }
  }, "Construct"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5
    }
  }, BLD.map(bd => {
    const blocked = used >= slotCap || war < bd.cost;
    return /*#__PURE__*/React.createElement("button", {
      key: bd.id,
      onClick: () => !blocked && onBuild(hex.key, bd),
      disabled: blocked,
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 8px",
        textAlign: "left",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--hairline)",
        background: "rgba(26,32,48,0.6)",
        fontSize: 12,
        color: "var(--text-hi)",
        cursor: blocked ? "not-allowed" : "pointer",
        opacity: blocked ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Ic, {
      src: bd.art,
      size: 18
    }), " ", bd.name), /*#__PURE__*/React.createElement("span", {
      className: "wl-num",
      style: {
        fontSize: 10,
        color: "var(--text-lo)"
      }
    }, f(bd.cost), " $WAR"));
  }))));
}
function MarketPanel() {
  const orders = [{
    side: "BUY",
    res: "steel",
    qty: 240,
    px: 12,
    who: "Vanguard"
  }, {
    side: "SELL",
    res: "oil",
    qty: 600,
    px: 7,
    who: "Cartel-9"
  }, {
    side: "SELL",
    res: "rifles",
    qty: 80,
    px: 34,
    who: "you"
  }, {
    side: "BUY",
    res: "electronics",
    qty: 120,
    px: 41,
    who: "TechRuin DAO"
  }, {
    side: "SELL",
    res: "iron",
    qty: 1200,
    px: 4,
    who: "Northwall"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      maxWidth: 760,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Pnl, {
    title: "Player Marketplace",
    accent: true,
    headerRight: /*#__PURE__*/React.createElement(Bdg, {
      tone: "teal"
    }, "P2P order book")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, orders.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "grid",
      gridTemplateColumns: "56px 1fr auto auto",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: "var(--radius-sm)",
      background: "rgba(26,32,48,0.5)"
    }
  }, /*#__PURE__*/React.createElement(Bdg, {
    tone: o.side === "BUY" ? "emerald" : "blood",
    variant: "solid"
  }, o.side), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: "var(--text-hi)"
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    src: RES[o.res] ? RES[o.res].art : RES.iron.art,
    size: 16
  }), " ", RES[o.res] ? RES[o.res].name : o.res, " ", /*#__PURE__*/React.createElement("span", {
    className: "wl-num",
    style: {
      color: "var(--text-muted)",
      fontSize: 11
    }
  }, "\xD7", o.qty)), /*#__PURE__*/React.createElement("span", {
    className: "wl-num",
    style: {
      fontSize: 13,
      color: "var(--amber-text)"
    }
  }, o.px, " $WAR"), /*#__PURE__*/React.createElement(Btn, {
    variant: o.who === "you" ? "ghost" : "secondary",
    size: "sm"
  }, o.who === "you" ? "Cancel" : "Fill"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-muted)"
    }
  }, "Market fees are a token sink \u2014 every fill burns a slice of $WAR."));
}
function ArmyPanel({
  war,
  army,
  onTrain
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      maxWidth: 760,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Pnl, {
    title: "Barracks \xB7 Train Units",
    accent: true,
    headerRight: /*#__PURE__*/React.createElement(St, {
      label: "Housing",
      value: `${Object.values(army).reduce((a, b) => a + b, 0)}/120`,
      accent: "amber"
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
      gap: 10
    }
  }, Object.entries(UN).map(([id, u]) => /*#__PURE__*/React.createElement("div", {
    key: id,
    style: {
      padding: 12,
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--hairline)",
      background: "rgba(26,32,48,0.5)",
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Ic, {
    src: u.art,
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wl-title",
    style: {
      fontSize: 14
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    className: "wl-num",
    style: {
      fontSize: 11,
      color: "var(--text-muted)"
    }
  }, "ATK ", u.atk, " \xB7 DEF ", u.def)), /*#__PURE__*/React.createElement(Bdg, {
    tone: "neutral"
  }, "\xD7", army[id] || 0)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "var(--text-secondary)",
      lineHeight: 1.4,
      minHeight: 30
    }
  }, u.desc), /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    size: "sm",
    full: true,
    icon: "\uD83C\uDF96\uFE0F",
    disabled: war < u.war,
    onClick: () => onTrain(id)
  }, "Train \xB7 ", f(u.war), " $WAR"))))));
}
function PlaceholderPanel({
  icon,
  title,
  note
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      height: "100%",
      textAlign: "center",
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      opacity: 0.5
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    className: "wl-title",
    style: {
      fontSize: 20,
      marginTop: 10
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 6,
      maxWidth: 320
    }
  }, note)));
}
window.WL_PANELS = {
  PlotPanel,
  MarketPanel,
  ArmyPanel,
  PlaceholderPanel
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warroom/panels.js", error: String((e && e.message) || e) }); }

// ui_kits/warroom/shell.js
try { (() => {
// WARLANDS War Room — interactive game shell.
// Recreates GameShell + TopBar + HexMap + PlotPanel from the codebase using DS primitives.
const DS = window.WARLANDSDesignSystem_2e7699;
const {
  Button,
  Badge,
  Stat,
  Tabs,
  Panel,
  ProgressBar,
  ResourceChip
} = DS;
const {
  TERRAIN,
  RESOURCES,
  BUILDINGS,
  UNITS,
  HEX_SIZE,
  buildWorld
} = window.WL_DATA;
const {
  useState,
  useMemo,
  useRef,
  useEffect
} = React;
const fmt = n => Math.floor(n).toLocaleString();
const Icon = ({
  src,
  size = 16
}) => /*#__PURE__*/React.createElement("img", {
  src: src,
  width: size,
  height: size,
  alt: "",
  style: {
    display: "block"
  }
});
function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 90);
    pts.push(`${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`);
  }
  return pts.join(" ");
}

// ---------------- Top HUD ----------------
function TopBar({
  war,
  staked,
  burned,
  pool,
  plots
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 14px",
      borderBottom: "1px solid var(--hairline)",
      background: "var(--panel-void)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "grid",
      placeItems: "center",
      height: 24,
      width: 24,
      background: "var(--amber)",
      color: "#000",
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 15
    }
  }, "W"), /*#__PURE__*/React.createElement("span", {
    className: "wl-title",
    style: {
      fontSize: 17,
      color: "var(--amber)",
      letterSpacing: "0.04em"
    }
  }, "WARLANDS"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "none"
    },
    className: "sm-show"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "blood",
    variant: "solid"
  }, "Prototype"))), /*#__PURE__*/React.createElement("div", {
    className: "no-scrollbar",
    style: {
      display: "flex",
      minWidth: 0,
      flex: 1,
      alignItems: "center",
      gap: 16,
      overflowX: "auto"
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "$WAR",
    value: fmt(war),
    accent: "amber"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Staked",
    value: fmt(staked),
    accent: "sky"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Burned",
    value: fmt(burned),
    accent: "blood"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Pool",
    value: fmt(pool),
    accent: "emerald"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Plots",
    value: String(plots),
    accent: "emerald"
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "S4\xB7t",
    value: "14,920",
    accent: "neutral"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 10px",
      borderRadius: "var(--radius-sm)",
      border: "1px solid rgba(245,179,1,0.4)",
      background: "rgba(245,179,1,0.08)",
      color: "var(--amber-text)",
      fontSize: 12,
      fontWeight: 600,
      fontFamily: "var(--font-ui)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      height: 6,
      width: 6,
      borderRadius: 999,
      background: "var(--success)"
    }
  }), "7a3f\u20269c2b"), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Settings",
    style: {
      background: "none",
      border: "none",
      color: "var(--text-lo)",
      fontSize: 17,
      cursor: "pointer",
      minWidth: 32
    }
  }, "\u2699\uFE0F")));
}

// ---------------- Hex world map ----------------
function HexMap({
  hexes,
  plots,
  selected,
  onSelect
}) {
  const [view, setView] = useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const drag = useRef(null);
  const bounds = useMemo(() => {
    let a = Infinity,
      b = Infinity,
      c = -Infinity,
      d = -Infinity;
    hexes.forEach(h => {
      a = Math.min(a, h.x);
      b = Math.min(b, h.y);
      c = Math.max(c, h.x);
      d = Math.max(d, h.y);
    });
    return {
      minX: a,
      minY: b,
      maxX: c,
      maxY: d
    };
  }, [hexes]);
  const W = bounds.maxX - bounds.minX + HEX_SIZE * 4;
  const H = bounds.maxY - bounds.minY + HEX_SIZE * 4;
  const offX = -bounds.minX + HEX_SIZE * 2;
  const offY = -bounds.minY + HEX_SIZE * 2;
  const down = e => {
    drag.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: view.x,
      oy: view.y,
      moved: false
    };
  };
  const move = e => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.sx,
      dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true;
    setView(v => ({
      ...v,
      x: drag.current.ox + dx,
      y: drag.current.oy + dy
    }));
  };
  const up = () => {
    drag.current = null;
  };
  const zoom = f => setView(v => ({
    ...v,
    scale: Math.min(2.4, Math.max(0.55, v.scale * f))
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      height: "100%",
      width: "100%",
      overflow: "hidden",
      background: "var(--panel-void)",
      cursor: drag.current ? "grabbing" : "grab",
      touchAction: "none"
    },
    onMouseDown: down,
    onMouseMove: move,
    onMouseUp: up,
    onMouseLeave: up
  }, /*#__PURE__*/React.createElement("svg", {
    width: "100%",
    height: "100%",
    viewBox: `0 0 ${W} ${H}`,
    style: {
      transform: `translate(${view.x}px,${view.y}px) scale(${view.scale})`,
      transition: "transform 60ms linear"
    }
  }, hexes.map(h => {
    const owned = plots[h.key];
    const isSel = selected === h.key;
    const enemy = h.enemy;
    const cx = h.x + offX,
      cy = h.y + offY;
    const stroke = isSel ? "var(--rim-selected)" : owned ? "var(--rim-owned)" : enemy ? "var(--rim-enemy)" : "var(--rim-neutral)";
    const sw = isSel ? 3 : owned || enemy ? 2 : 1;
    return /*#__PURE__*/React.createElement("g", {
      key: h.key,
      onClick: e => {
        e.stopPropagation();
        if (!drag.current?.moved) onSelect(h.key);
      },
      style: {
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("polygon", {
      points: hexPoints(cx, cy, HEX_SIZE - 1),
      style: {
        fill: TERRAIN[h.terrain].color,
        fillOpacity: owned ? 1 : enemy ? 0.85 : 0.62,
        stroke,
        strokeWidth: sw,
        filter: isSel ? "drop-shadow(0 0 6px rgba(255,210,74,0.7))" : "none"
      }
    }), owned && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 6,
      textAnchor: "middle",
      fontSize: 17,
      style: {
        pointerEvents: "none"
      }
    }, "\uD83C\uDFD5\uFE0F"), enemy && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 5,
      textAnchor: "middle",
      fontSize: 14,
      style: {
        pointerEvents: "none"
      }
    }, "\uD83D\uDC80"), !owned && !enemy && h.ring <= 1 && /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 4,
      textAnchor: "middle",
      fontSize: 12,
      fill: "#fff",
      fillOpacity: 0.45,
      style: {
        pointerEvents: "none"
      }
    }, "\u2694"));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 12,
      top: 12,
      padding: "8px 12px",
      borderRadius: "var(--radius-md)",
      background: "rgba(0,0,0,0.6)",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wl-title",
    style: {
      fontSize: 13,
      color: "var(--amber-text)"
    }
  }, "Live World Map"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-secondary)"
    }
  }, "Drag to explore \xB7 click a hex"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 10,
      color: "var(--text-muted)"
    }
  }, "\u2694 Crucible (center, high risk) \xB7 edge = newbie ring")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 12,
      left: 12,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, [["＋", () => zoom(1.3)], ["－", () => zoom(1 / 1.3)], ["⟳", () => setView({
    x: 0,
    y: 0,
    scale: 1
  })]].map(([t, fn]) => /*#__PURE__*/React.createElement("button", {
    key: t,
    onClick: fn,
    style: {
      width: 38,
      height: 38,
      display: "grid",
      placeItems: "center",
      borderRadius: "var(--radius-md)",
      background: "rgba(0,0,0,0.62)",
      border: "1px solid var(--hairline)",
      color: "var(--amber-text)",
      fontSize: 18,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, t))));
}
window.WL_SCREENS = {
  TopBar,
  HexMap,
  Icon,
  fmt
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/warroom/shell.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.ResourceChip = __ds_scope.ResourceChip;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
