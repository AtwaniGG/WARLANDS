"use client";

import { useEffect, useState, type ReactNode, type CSSProperties } from "react";

type Status = "loading" | "ok" | "error";
const cache = new Map<string, Status>();
const waiters = new Map<string, Set<(s: Status) => void>>();

/** Probe an image URL once (cached). Returns 'loading' | 'ok' | 'error'. */
export function useImageReady(url: string | null): Status {
  const [, force] = useState(0);
  const status = url ? cache.get(url) ?? "loading" : "error";

  useEffect(() => {
    if (!url) return;
    const cached = cache.get(url);
    if (cached === "ok" || cached === "error") return;

    const cb = () => force((n) => n + 1);
    let set = waiters.get(url);
    if (!set) {
      set = new Set();
      waiters.set(url, set);
      // kick off the actual load only once per url
      const img = new Image();
      img.onload = () => finish(url, "ok");
      img.onerror = () => finish(url, "error");
      img.src = url;
    }
    set.add(cb);
    return () => { set?.delete(cb); };
  }, [url]);

  return status;
}

function finish(url: string, s: Status) {
  cache.set(url, s);
  waiters.get(url)?.forEach((cb) => cb(s));
  waiters.delete(url);
}

/**
 * Renders the image once confirmed loadable; otherwise renders `fallback`
 * (an emoji/colored node). No broken-image flash, no failed-request spam.
 */
export function Sprite({
  url, fallback, size = 20, alt = "", style, rounded,
}: {
  url: string;
  fallback: ReactNode;
  size?: number;
  alt?: string;
  style?: CSSProperties;
  rounded?: boolean;
}) {
  const status = useImageReady(url);
  if (status !== "ok") return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny game sprites with custom preload/fallback; next/image adds no value here
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "contain", borderRadius: rounded ? "var(--radius-sm)" : undefined, ...style }}
    />
  );
}
