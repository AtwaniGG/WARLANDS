"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { BattleReport, CocCommand, CocWorld } from "@/sim/coc";

export interface BaseSocket {
  state: CocWorld | null;
  playerId: string | null;
  connected: boolean;
  error: string | null;
  report: BattleReport | null;
  send: (cmd: CocCommand) => void;
  link: (wallet: string) => void;
  clearReport: () => void;
}

/** A persistent per-browser identity so a returning player reclaims their existing base. */
function getIdentity(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("warlands.id");
    if (!id) { id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/-/g, ""); localStorage.setItem("warlands.id", id); }
    return id;
  } catch {
    return "";
  }
}

export function useBaseSocket(url: string): BaseSocket {
  const [state, setState] = useState<CocWorld | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BattleReport | null>(null);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    const id = getIdentity();
    const ws = new WebSocket(id ? `${url}?id=${encodeURIComponent(id)}` : url);
    ref.current = ws;
    let errTimer: ReturnType<typeof setTimeout> | undefined;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      let msg: { type?: string; playerId?: string; state?: CocWorld; message?: string; report?: BattleReport };
      try {
        msg = JSON.parse(e.data); // a malformed frame must not throw out of the handler (it would surface
                                  // as a window 'error' that we'd then forward back to the server)
      } catch {
        return;
      }
      if (msg.type === "welcome") {
        setPlayerId(msg.playerId ?? null);
        setState(msg.state ?? null);
      } else if (msg.type === "state") {
        setState(msg.state ?? null);
      } else if (msg.type === "error") {
        setError(msg.message ?? "error");
        clearTimeout(errTimer);
        errTimer = setTimeout(() => setError(null), 4000);
      } else if (msg.type === "report") {
        setReport(msg.report ?? null);
      }
    };

    // telemetry: forward client crashes to the server (logged + persisted)
    const reportErr = (message: string) => { try { if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "clientError", message: message.slice(0, 500) })); } catch { /* ignore */ } };
    const onErr = (e: ErrorEvent) => reportErr(`${e.message} @ ${e.filename}:${e.lineno}`);
    const onRej = (e: PromiseRejectionEvent) => reportErr(`unhandledrejection: ${String(e.reason?.message ?? e.reason)}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    return () => {
      clearTimeout(errTimer);
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
      ws.close();
    };
  }, [url]);

  const send = useCallback((cmd: CocCommand) => {
    ref.current?.send(JSON.stringify({ type: "command", cmd }));
  }, []);
  const link = useCallback((wallet: string) => {
    ref.current?.send(JSON.stringify({ type: "link", wallet }));
  }, []);
  const clearReport = useCallback(() => setReport(null), []);

  return { state, playerId, connected, error, report, send, link, clearReport };
}
