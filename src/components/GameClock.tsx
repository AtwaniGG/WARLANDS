"use client";

import { useEffect } from "react";
import { useGame, TICK_MS } from "@/game/store";

/** Drives the production tick loop. Mount once. */
export function GameClock() {
  const doTick = useGame((s) => s.doTick);
  useEffect(() => {
    const id = setInterval(doTick, TICK_MS);
    return () => clearInterval(id);
  }, [doTick]);
  return null;
}
