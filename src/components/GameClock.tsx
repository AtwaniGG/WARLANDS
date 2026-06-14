"use client";

import { useEffect } from "react";
import { useGame, TICK_MS } from "@/game/store";
import { useSettings } from "@/game/settings";

/** Drives the production tick loop (speed-adjustable) and rehydrates the saved game. */
export function GameClock() {
  const doTick = useGame((s) => s.doTick);
  const speed = useSettings((s) => s.speed);

  // Rehydrate persisted save on the client (store uses skipHydration for SSR safety).
  useEffect(() => {
    useGame.persist.rehydrate();
  }, []);

  useEffect(() => {
    const id = setInterval(doTick, TICK_MS / Math.max(0.25, speed));
    return () => clearInterval(id);
  }, [doTick, speed]);
  return null;
}
