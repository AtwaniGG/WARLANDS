"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/game/settings";
import { useGame } from "@/game/store";
import { play } from "@/game/sound";
import { Button } from "./ui";

const SAVE_KEY = "warlands-save-v1";

function exportSave() {
  const data = typeof window !== "undefined" ? window.localStorage.getItem(SAVE_KEY) : null;
  if (!data) return;
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `warlands-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importSave(file: File, onDone: () => void) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result);
      JSON.parse(text); // validate
      window.localStorage.setItem(SAVE_KEY, text);
      useGame.persist.rehydrate();
      onDone();
    } catch {
      alert("Invalid save file.");
    }
  };
  reader.readAsText(file);
}

/** Applies settings side-effects (classes on <html>) and rehydrates persisted settings. */
export function SettingsEffects() {
  const reducedMotion = useSettings((s) => s.reducedMotion);
  const colorblind = useSettings((s) => s.colorblind);

  useEffect(() => { useSettings.persist.rehydrate(); }, []);
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("rm", reducedMotion);
    el.classList.toggle("cb", colorblind);
  }, [reducedMotion, colorblind]);

  return null;
}

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div
        className="w-full max-w-md p-5"
        style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)", boxShadow: "var(--shadow-modal)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="wl-title" style={{ fontSize: "20px", color: "var(--amber)" }}>Settings</h2>

        <div className="mt-4 space-y-3">
          <Toggle label="Sound effects" value={s.sound} onChange={(v) => { s.set("sound", v); if (v) play("click"); }} />
          <div>
            <div className="wl-label">Volume</div>
            <input type="range" min={0} max={1} step={0.05} value={s.volume}
              onChange={(e) => s.set("volume", Number(e.target.value))}
              onMouseUp={() => play("coin")}
              className="w-full" style={{ accentColor: "var(--amber)" }} />
          </div>
          <div>
            <div className="wl-label">Game speed: <span className="wl-num" style={{ color: "var(--amber-text)" }}>{s.speed}×</span></div>
            <input type="range" min={0.5} max={4} step={0.5} value={s.speed}
              onChange={(e) => s.set("speed", Number(e.target.value))}
              className="w-full" style={{ accentColor: "var(--amber)" }} />
          </div>
          <Toggle label="Reduced motion" value={s.reducedMotion} onChange={(v) => s.set("reducedMotion", v)} />
          <Toggle label="Colorblind-safe palette" value={s.colorblind} onChange={(v) => s.set("colorblind", v)} />
        </div>

        {/* Save data */}
        <div className="mt-4">
          <div className="wl-label mb-1">Save data</div>
          <div className="flex gap-2">
            <Button variant="info" size="sm" onClick={exportSave}>⬇ Export save</Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>⬆ Import save</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importSave(f, onClose); }} />
          </div>
        </div>

        {/* Shortcuts hint */}
        <div className="mt-4" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          <div className="wl-label">Keyboard</div>
          <div className="wl-num mt-1">1–0 switch tabs · Esc close · S settings</div>
        </div>

        <Button variant="primary" full className="mt-5" onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between px-3 py-2"
      style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--hairline)", background: "var(--panel-2)", fontSize: "13px", color: "var(--text-hi)" }}
    >
      <span>{label}</span>
      <span
        className="relative inline-block"
        style={{ width: 38, height: 20, borderRadius: 999, background: value ? "var(--amber)" : "var(--surface-sunken)", transition: "background 120ms" }}
      >
        <span style={{ position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16, borderRadius: 999, background: value ? "#0c0a04" : "var(--text-muted)", transition: "left 120ms" }} />
      </span>
    </button>
  );
}
