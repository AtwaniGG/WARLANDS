"use client";

import { useGame } from "@/game/store";

export function EventLog() {
  const log = useGame((s) => s.log);
  return (
    <div
      className="px-3 py-2"
      style={{ borderTop: "1px solid var(--hairline)", background: "rgba(8,11,17,0.8)" }}
    >
      <div className="wl-label mb-1">Event Log</div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto" style={{ fontSize: "12px" }}>
        {log.map((line, i) => (
          <div key={i} style={{ color: i === 0 ? "var(--text-hi)" : "var(--text-lo)" }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
