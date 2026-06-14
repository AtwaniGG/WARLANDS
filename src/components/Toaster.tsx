"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { play } from "@/game/sound";

interface Toast { id: number; text: string; tone: string }

// Surface only meaningful log lines as toasts.
const IMPORTANT = ["🏆", "💀", "✅", "🔬", "World Event", "⚠️", "Achievement", "eliminated", "VICTORY"];
function toneFor(text: string): string {
  if (text.includes("✅") || text.includes("Achievement")) return "var(--emerald-text)";
  if (text.includes("⚠️") || text.includes("💀")) return "var(--blood-text)";
  if (text.includes("World Event")) return "var(--amber-text)";
  if (text.includes("🔬")) return "var(--sky-text)";
  return "var(--text-hi)";
}

export function Toaster() {
  const top = useGame((s) => s.log[0]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeen = useRef<string | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (!top || top === lastSeen.current) return;
    lastSeen.current = top;
    if (!IMPORTANT.some((k) => top.includes(k))) return;
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text: top, tone: toneFor(top) }].slice(-4));
    if (top.includes("✅") || top.includes("🏆")) play("chime");
    const timer = setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
    return () => clearTimeout(timer);
  }, [top]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 340 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto px-3 py-2"
          style={{
            borderRadius: "var(--radius-md)",
            border: `1px solid ${t.tone}`,
            background: "var(--panel)",
            boxShadow: "var(--shadow-2)",
            fontSize: "12px",
            color: "var(--text-hi)",
            borderLeft: `3px solid ${t.tone}`,
            animation: "wl-rise 0.3s var(--ease-out, ease) both",
          }}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
