"use client";

import { useGame } from "@/game/store";
import { eventById } from "@/game/events";

const TONE: Record<string, string> = {
  amber: "var(--amber)", blood: "var(--blood-text)", emerald: "var(--emerald-text)",
  teal: "var(--teal-text)", sky: "var(--sky-text)",
};

/** Slim strip announcing the active world event + a live countdown. */
export function EventBanner() {
  const id = useGame((s) => s.activeEventId);
  const endsAt = useGame((s) => s.eventEndsAt);
  const tick = useGame((s) => s.tick);
  const evt = eventById(id ?? undefined);
  if (!evt) return null;
  const remaining = Math.max(0, endsAt - tick);
  const color = TONE[evt.tone] ?? "var(--amber)";

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5"
      style={{ borderBottom: "1px solid var(--hairline)", background: "rgba(0,0,0,0.25)", fontSize: "12px" }}
    >
      <span style={{ fontSize: "14px" }}>{evt.icon}</span>
      <span style={{ fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.04em" }}>{evt.name}</span>
      <span style={{ color: "var(--text-lo)" }}>— {evt.desc}</span>
      <span className="wl-num ml-auto" style={{ color: "var(--text-muted)" }}>{remaining}s left</span>
    </div>
  );
}
