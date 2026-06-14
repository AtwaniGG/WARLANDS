"use client";

import { useGame } from "@/game/store";
import { UNITS, UNIT_IDS, armySize, type UnitId, type Army } from "@/game/units";
import { RESOURCES, type ResourceId } from "@/game/resources";
import { Badge, Button } from "./ui";
import { UnitIcon } from "./GameIcons";

/** A left-label / right-meta selectable row (train + construct share this shape). */
function MenuRow({
  onClick,
  disabled,
  title,
  left,
  right,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-between px-2 py-1.5 text-left"
      style={{
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--hairline)",
        background: "rgba(26,32,48,0.6)",
        fontSize: "12px",
        color: "var(--text-hi)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span>{left}</span>
      <span className="wl-num" style={{ fontSize: "10px", color: "var(--text-lo)" }}>{right}</span>
    </button>
  );
}

function UnitChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        borderRadius: "var(--radius-sm)",
        background: "var(--surface-raised)",
        padding: "4px 8px",
        fontSize: "12px",
        color: "var(--text-secondary)",
      }}
    >
      {children}
    </span>
  );
}

/** Military management for the selected owned plot: train units + show garrison. */
export function MilitaryPanel({ plotKey }: { plotKey: string }) {
  const plot = useGame((s) => s.plots[plotKey]);
  const trainUnit = useGame((s) => s.trainUnit);
  if (!plot) return null;

  const hasArmsLab = plot.buildings.some((b) => b.id === "armsFactory" || b.id === "heavyWorks" || b.id === "electronicsLab");

  return (
    <div className="space-y-2">
      <div className="wl-label">Garrison ({armySize(plot.army)} units)</div>
      {armySize(plot.army) > 0 ? (
        <div className="flex flex-wrap gap-1">
          {UNIT_IDS.filter((u) => (plot.army[u] ?? 0) > 0).map((u) => (
            <UnitChip key={u}>
              <UnitIcon id={u} size={14} /> {UNITS[u].name} ×{plot.army[u]}
            </UnitChip>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No troops. Train units below to defend or raid.</p>
      )}

      {plot.trainQueue.length > 0 && (
        <div className="wl-num" style={{ fontSize: "11px", color: "var(--amber-text)" }}>
          Training: {plot.trainQueue.map((t) => `${UNITS[t.unit].icon}${t.ticksLeft}s`).join(" · ")}
        </div>
      )}

      <div className="wl-label">Train Units</div>
      {!hasArmsLab && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Tip: build an Arms Factory / Heavy Works to produce unit inputs.</p>
      )}
      <div className="grid grid-cols-1 gap-1">
        {UNIT_IDS.map((u) => {
          const def = UNITS[u];
          const costStr = Object.entries(def.cost)
            .map(([k, v]) => `${v}${RESOURCES[k as ResourceId].icon}`)
            .join(" ");
          return (
            <MenuRow
              key={u}
              onClick={() => trainUnit(plotKey, u as UnitId)}
              title={def.desc}
              left={<><UnitIcon id={def.id} size={14} /> {def.name} <span style={{ color: "var(--text-muted)" }}>A{def.attack}/D{def.defense}</span></>}
              right={<>{def.costWar}$ {costStr}</>}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Raid planner shown when an NPC camp hex is selected. */
export function RaidPanel({ npcKey }: { npcKey: string }) {
  const npc = useGame((s) => s.npcs[npcKey]);
  const plots = useGame((s) => s.plots);
  const scoutNpc = useGame((s) => s.scoutNpc);
  const raidNpc = useGame((s) => s.raidNpc);

  // pick the player's strongest nearby plot as launch base (closest by hex distance)
  const owned = Object.entries(plots);
  if (!npc) return null;

  if (owned.length === 0) {
    return <p className="p-1" style={{ fontSize: "12px", color: "var(--text-muted)" }}>Claim and garrison a plot before raiding.</p>;
  }

  // launch base = owned plot with the most troops
  const [baseKey, base] = owned.sort((a, b) => armySize(b[1].army) - armySize(a[1].army))[0];

  const respawning = npc.defeatedAtTick !== null;

  return (
    <div
      className="space-y-2 p-3"
      style={{ borderRadius: "var(--radius-md)", border: "1px solid rgba(220,38,38,0.3)", background: "rgba(156,43,43,0.12)" }}
    >
      <div className="flex items-center justify-between">
        <span className="wl-title" style={{ fontSize: "14px", color: "var(--blood-text)" }}>⚔ Hostile Camp</span>
        <Badge tone="blood">Tier {npc.tier}</Badge>
      </div>

      {respawning ? (
        <p style={{ fontSize: "12px", color: "var(--text-lo)" }}>This camp was cleared. It will regroup shortly.</p>
      ) : (
        <>
          {npc.scouted ? (
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              <div className="mb-1" style={{ color: "var(--text-muted)" }}>Scouted garrison:</div>
              <div className="flex flex-wrap gap-1">
                {UNIT_IDS.filter((u) => (npc.army[u] ?? 0) > 0).map((u) => (
                  <UnitChip key={u}><UnitIcon id={u} size={13} />×{npc.army[u]}</UnitChip>
                ))}
              </div>
              <div className="mt-1" style={{ color: "var(--text-muted)" }}>Loot: {Object.entries(npc.stock).filter(([, v]) => (v as number) > 0).map(([k]) => RESOURCES[k as ResourceId].icon).join(" ")}</div>
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: "var(--text-lo)" }}>Unknown strength. Scout first (50 $WAR) to reveal the garrison.</p>
          )}

          <div className="flex gap-1">
            <Button variant="info" size="sm" full disabled={npc.scouted} onClick={() => scoutNpc(npcKey, baseKey)}>🔭 Scout (50$)</Button>
            <Button variant="primary" size="sm" full disabled={armySize(base.army) === 0} onClick={() => raidNpc(npcKey, baseKey, fullArmy(base.army), "raid")}>🗡️ Raid</Button>
            <Button variant="danger" size="sm" full disabled={armySize(base.army) === 0} onClick={() => raidNpc(npcKey, baseKey, fullArmy(base.army), "siege")}>🏰 Siege</Button>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Launching from <span style={{ color: "var(--text-secondary)" }}>{base.name}</span> with{" "}
            <span style={{ color: "var(--text-secondary)" }}>{armySize(base.army)}</span> troops.
            {armySize(base.army) === 0 && " Train troops there first."}
          </p>
        </>
      )}
    </div>
  );
}

function fullArmy(a: Army): Army {
  const out: Army = {};
  for (const id of UNIT_IDS) if (a[id]) out[id] = a[id];
  return out;
}

/** A small token-styled diplomacy / stance pill-button. */
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
        padding: "2px 8px",
        fontSize: "10px",
        fontWeight: 600,
        color: map.color,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/** Shown when a rival-empire territory hex is selected. */
export function EmpirePlotPanel({ hexKey }: { hexKey: string }) {
  const found = useGame((s) => s.empireAt)(hexKey);
  const plots = useGame((s) => s.plots);
  const setStance = useGame((s) => s.setStance);
  const scoutEmpire = useGame((s) => s.scoutEmpire);
  const raidEmpire = useGame((s) => s.raidEmpire);

  if (!found) return null;
  const { empire } = found;
  const owned = Object.entries(plots);
  if (owned.length === 0) {
    return (
      <div className="space-y-2 p-3" style={{ borderRadius: "var(--radius-md)", border: `1px solid ${empire.color}55` }}>
        <div className="wl-title" style={{ fontSize: "14px", color: empire.color }}>{empire.banner} {empire.name}</div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Claim and garrison a plot before engaging an empire.</p>
      </div>
    );
  }
  const [baseKey, base] = owned.sort((a, b) => armySize(b[1].army) - armySize(a[1].army))[0];
  const target = empire.plots[hexKey];
  const stanceTone = empire.stance === "war" ? "blood" : empire.stance === "ally" ? "sky" : "neutral";

  return (
    <div className="space-y-2 p-3" style={{ borderRadius: "var(--radius-md)", border: `1px solid ${empire.color}66`, background: `${empire.color}11` }}>
      <div className="flex items-center justify-between">
        <span className="wl-title" style={{ fontSize: "14px", color: empire.color }}>{empire.banner} {empire.name}</span>
        <Badge tone={stanceTone}>{empire.stance}</Badge>
      </div>

      {empire.scouted && target ? (
        <div className="flex flex-wrap items-center gap-1.5" style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-muted)" }}>Garrison: </span>
          {UNIT_IDS.filter((u) => (target.garrison[u] ?? 0) > 0).map((u) => (
            <span key={u} className="inline-flex items-center gap-0.5"><UnitIcon id={u} size={13} />{target.garrison[u]}</span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: "12px", color: "var(--text-lo)" }}>Strength unknown. Run espionage (80 $WAR) to reveal garrisons.</p>
      )}

      <div className="flex flex-wrap gap-1">
        <Button variant="secondary" size="sm" disabled={empire.scouted} onClick={() => scoutEmpire(empire.id, baseKey)} style={{ background: "var(--violet)", color: "#0c0a14", border: "none" }}>🕵️ Espionage</Button>
        <Button variant="primary" size="sm" disabled={armySize(base.army) === 0} onClick={() => raidEmpire(hexKey, baseKey, fullArmy(base.army), "raid")}>🗡️ Raid</Button>
        <Button variant="danger" size="sm" disabled={armySize(base.army) === 0} onClick={() => raidEmpire(hexKey, baseKey, fullArmy(base.army), "siege")}>🏰 Siege (conquer)</Button>
      </div>

      <div className="flex flex-wrap gap-1 pt-2" style={{ borderTop: "1px solid var(--hairline)" }}>
        {empire.stance !== "war" && <StanceButton tone="blood" onClick={() => setStance(empire.id, "war")}>Declare War</StanceButton>}
        {empire.stance === "war" && <StanceButton tone="neutral" onClick={() => setStance(empire.id, "neutral")}>Sue for Peace</StanceButton>}
        {empire.stance !== "ally" && <StanceButton tone="sky" onClick={() => setStance(empire.id, "ally")}>Propose Alliance</StanceButton>}
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Launching from <span style={{ color: "var(--text-secondary)" }}>{base.name}</span> · {armySize(base.army)} troops. Siege victories conquer the territory.</p>
    </div>
  );
}
