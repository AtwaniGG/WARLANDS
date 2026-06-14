"use client";

import { useGame } from "@/game/store";
import { empirePower, type Stance } from "@/game/empire";
import { UNIT_IDS } from "@/game/units";
import { UnitIcon } from "./GameIcons";
import { Badge, type BadgeTone } from "./ui";

const STANCE_TONE: Record<Stance, BadgeTone> = {
  neutral: "neutral",
  ally: "sky",
  war: "blood",
};

/** Token-styled outline stance button (shared shape across diplomacy actions). */
function StanceButton({ onClick, tone, children }: { onClick: () => void; tone: "blood" | "sky" | "neutral"; children: React.ReactNode }) {
  const map = {
    blood: { color: "var(--blood-text)", border: "rgba(220,38,38,0.4)", hover: "rgba(220,38,38,0.1)" },
    sky: { color: "var(--sky-text)", border: "rgba(74,144,217,0.4)", hover: "rgba(74,144,217,0.1)" },
    neutral: { color: "var(--text-secondary)", border: "var(--border-strong)", hover: "rgba(255,255,255,0.05)" },
  }[tone];
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.background = map.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      style={{
        borderRadius: "var(--radius-sm)",
        border: `1px solid ${map.border}`,
        background: "transparent",
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: 600,
        color: map.color,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function DiplomacyPanel() {
  const empires = useGame((s) => s.empires);
  const setStance = useGame((s) => s.setStance);
  const list = Object.values(empires);

  return (
    <div className="mx-auto max-w-3xl p-5">
      <h2 className="wl-title mb-1" style={{ fontSize: "22px", color: "var(--amber)" }}>Diplomacy &amp; Rival Empires</h2>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Rival powers hold territory across the map (GDD §10.5–10.6). Make peace, ally, or wage war —
        empires at war will raid your richest plots, and siege victories conquer their land.
      </p>

      {list.length === 0 ? (
        <div
          className="p-6 text-center"
          style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)", fontSize: "14px", color: "var(--text-lo)" }}
        >
          🏆 All rival empires have been eliminated. The map is yours to contest.
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => {
            const territories = Object.keys(e.plots).length;
            return (
              <div key={e.id} className="p-4" style={{ borderRadius: "var(--radius-lg)", border: `1px solid ${e.color}44`, background: "var(--panel)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="wl-title" style={{ fontSize: "18px", color: e.color }}>{e.banner} {e.name}</div>
                    <div className="wl-num" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {territories} territories · power {empirePower(e)} · tier {e.tier}
                    </div>
                  </div>
                  <Badge tone={STANCE_TONE[e.stance]}>{e.stance}</Badge>
                </div>

                {e.scouted && (
                  <div className="mt-2 flex flex-wrap gap-1" style={{ fontSize: "11px", color: "var(--text-lo)" }}>
                    {UNIT_IDS.map((u) => {
                      const n = Object.values(e.plots).reduce((s, p) => s + (p.garrison[u] ?? 0), 0);
                      return n > 0 ? <span key={u} className="inline-flex items-center gap-1" style={{ borderRadius: "var(--radius-sm)", background: "var(--surface-raised)", padding: "2px 6px" }}><UnitIcon id={u} size={13} /> {n}</span> : null;
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-1">
                  {e.stance !== "war" && <StanceButton tone="blood" onClick={() => setStance(e.id, "war")}>Declare War</StanceButton>}
                  {e.stance === "war" && <StanceButton tone="neutral" onClick={() => setStance(e.id, "neutral")}>Sue for Peace</StanceButton>}
                  {e.stance !== "ally" && <StanceButton tone="sky" onClick={() => setStance(e.id, "ally")}>Propose Alliance</StanceButton>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
