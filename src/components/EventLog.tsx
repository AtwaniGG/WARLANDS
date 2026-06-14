"use client";

import { useGame } from "@/game/store";

export function EventLog() {
  const log = useGame((s) => s.log);
  return (
    <div className="border-t border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Event Log</div>
      <div className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-zinc-400">
        {log.map((line, i) => (
          <div key={i} className={i === 0 ? "text-zinc-200" : ""}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
