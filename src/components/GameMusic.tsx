"use client";

// Low-volume looping background music for the live game (/world). Browsers block autoplay-with-sound
// until a user gesture, so we try to start on mount and, if blocked, on the first click/tap. A small
// toggle lets players mute; the choice persists in localStorage.
import { useEffect, useRef, useState, type CSSProperties } from "react";

const SRC = "/audio/warlands-theme.mp3";
const VOLUME = 0.15; // intentionally quiet — ambient, never loud

export function GameMusic() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(true);

  // restore mute preference
  useEffect(() => {
    try { if (localStorage.getItem("warlands.music") === "off") setOn(false); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = VOLUME;
    if (!on) { a.pause(); return; }
    a.play().catch(() => {
      // autoplay blocked → start on the first user gesture
      const start = () => { a.play().catch(() => {}); window.removeEventListener("pointerdown", start); };
      window.addEventListener("pointerdown", start, { once: true });
    });
  }, [on]);

  const toggle = () => setOn((v) => {
    const next = !v;
    try { localStorage.setItem("warlands.music", next ? "on" : "off"); } catch { /* ignore */ }
    return next;
  });

  return (
    <>
      <audio ref={ref} src={SRC} loop preload="none" />
      <button onClick={toggle} aria-label={on ? "Mute music" : "Play music"} title={on ? "Mute music" : "Play music"} style={btn}>
        {on ? "🔊" : "🔇"}
      </button>
    </>
  );
}

const btn: CSSProperties = {
  position: "fixed",
  right: 12,
  bottom: "max(12px, env(safe-area-inset-bottom))",
  zIndex: 48,
  width: 34,
  height: 34,
  borderRadius: 999,
  border: "1px solid var(--hairline)",
  background: "rgba(12,16,24,0.85)",
  color: "var(--text-secondary)",
  fontSize: 15,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(2px)",
};
