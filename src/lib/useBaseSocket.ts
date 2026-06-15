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
  clearReport: () => void;
}

export function useBaseSocket(url: string): BaseSocket {
  const [state, setState] = useState<CocWorld | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BattleReport | null>(null);
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    ref.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "welcome") {
        setPlayerId(msg.playerId);
        setState(msg.state);
      } else if (msg.type === "state") {
        setState(msg.state);
      } else if (msg.type === "error") {
        setError(msg.message);
        setTimeout(() => setError(null), 4000);
      } else if (msg.type === "report") {
        setReport(msg.report);
      }
    };
    return () => ws.close();
  }, [url]);

  const send = useCallback((cmd: CocCommand) => {
    ref.current?.send(JSON.stringify({ type: "command", cmd }));
  }, []);
  const clearReport = useCallback(() => setReport(null), []);

  return { state, playerId, connected, error, report, send, clearReport };
}
