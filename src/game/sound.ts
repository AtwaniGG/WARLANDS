// Procedural SFX via the Web Audio API — no asset files. Respects player settings.
import { useSettings } from "./settings";

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export type Sfx = "click" | "build" | "train" | "coin" | "victory" | "defeat" | "error" | "chime";

interface Tone { freq: number; dur: number; type?: OscillatorType; delay?: number; sweepTo?: number; }

const PATCHES: Record<Sfx, Tone[]> = {
  click: [{ freq: 420, dur: 0.04, type: "square" }],
  build: [{ freq: 180, dur: 0.08, type: "triangle" }, { freq: 240, dur: 0.1, type: "triangle", delay: 0.06 }],
  train: [{ freq: 140, dur: 0.12, type: "sawtooth", sweepTo: 220 }],
  coin: [{ freq: 880, dur: 0.06, type: "square" }, { freq: 1320, dur: 0.08, type: "square", delay: 0.05 }],
  victory: [{ freq: 523, dur: 0.12, type: "square" }, { freq: 659, dur: 0.12, type: "square", delay: 0.1 }, { freq: 784, dur: 0.2, type: "square", delay: 0.2 }],
  defeat: [{ freq: 392, dur: 0.16, type: "sawtooth", sweepTo: 180 }, { freq: 196, dur: 0.3, type: "sawtooth", delay: 0.15, sweepTo: 110 }],
  error: [{ freq: 160, dur: 0.16, type: "square", sweepTo: 120 }],
  chime: [{ freq: 988, dur: 0.1, type: "sine" }, { freq: 1319, dur: 0.16, type: "sine", delay: 0.08 }],
};

export function play(sfx: Sfx) {
  const { sound, volume } = useSettings.getState();
  if (!sound) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const now = ac.currentTime;
  for (const t of PATCHES[sfx]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const start = now + (t.delay ?? 0);
    osc.type = t.type ?? "square";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.sweepTo) osc.frequency.exponentialRampToValueAtTime(t.sweepTo, start + t.dur);
    const vol = Math.max(0, Math.min(1, volume)) * 0.18;
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + t.dur + 0.02);
  }
}
