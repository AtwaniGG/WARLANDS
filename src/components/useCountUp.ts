"use client";
import { useEffect, useRef, useState } from "react";

/** Smoothly tween a displayed number toward `value` (ease-out, rAF). Honors reduced-motion. */
export function useCountUp(value: number, ms = 550): number {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || ms <= 0 || from.current === value) { from.current = value; setDisplay(value); return; }
    const start = performance.now();
    const a = from.current;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(a + (value - a) * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else { from.current = value; setDisplay(value); }
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, ms]);
  return display;
}
