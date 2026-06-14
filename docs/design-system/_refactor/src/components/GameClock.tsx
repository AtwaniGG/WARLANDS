"use client";

import { useEffect } from "react";
import { useGame, TICK_MS } from "@/game/store";

/** Drives the production tick loop and rehydrates the saved game. Mount once. */
export function GameClock() {
  const doTick = useGame((s) => s.doTick);

  // Rehydrate persisted save on the client (store uses skipHydration for SSR safety).
  useEffect(() => {
    useGame.persist.rehydrate();
  }, []);

  useEffect(() => {
    const id = setInterval(doTick, TICK_MS);
    return () => clearInterval(id);
  }, [doTick]);
  return null;
}
