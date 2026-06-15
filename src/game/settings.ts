// Player settings — sound, accessibility, game speed. Persisted separately from the game save.
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export interface Settings {
  sound: boolean;
  volume: number; // 0..1
  reducedMotion: boolean;
  colorblind: boolean;
  speed: number; // tick-rate multiplier (0.5 .. 4)
  tutorialDone: boolean;
  tutorialStep: number; // resume point for the guided tutorial
  set: <K extends keyof Omit<Settings, "set">>(key: K, value: Settings[K]) => void;
}

const noopStorage: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      sound: true,
      volume: 0.5,
      reducedMotion: false,
      colorblind: false,
      speed: 1,
      tutorialDone: false,
      tutorialStep: 0,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
    }),
    {
      name: "warlands-settings-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : noopStorage)),
      skipHydration: true,
    },
  ),
);
