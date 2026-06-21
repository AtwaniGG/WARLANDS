"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import bs58 from "bs58";
import { buildAuthMessage } from "@/sim/coc/auth";
import type { BattleReport, CocCommand, CocWorld } from "@/sim/coc";

export interface WalletAuth {
  /** base58 wallet pubkey, or null when no wallet is connected */
  pubkey: string | null;
  /** the wallet adapter's message signer (Phantom etc.) */
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

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

/** A persistent per-browser identity so a returning anonymous player reclaims their base (dev only;
 *  in production the server requires wallet-signature auth and uses the wallet pubkey as identity). */
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

export function useBaseSocket(url: string, auth?: WalletAuth): BaseSocket {
  const [state, setState] = useState<CocWorld | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<BattleReport | null>(null);
  const ref = useRef<WebSocket | null>(null);
  const authRef = useRef<WalletAuth | undefined>(auth);
  authRef.current = auth; // always read the freshest wallet on the next challenge
  const pendingNonce = useRef<string | null>(null);
  const authedRef = useRef(false);

  // Prove wallet control: sign the server's nonce and return the signature + pubkey.
  const sendAuth = useCallback((nonce: string) => {
    const a = authRef.current;
    const ws = ref.current;
    if (!a?.pubkey || !a.signMessage || !ws || ws.readyState !== ws.OPEN) return;
    a.signMessage(new TextEncoder().encode(buildAuthMessage(nonce)))
      .then((sig) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "auth", pubkey: a.pubkey, signature: bs58.encode(sig) }));
      })
      .catch(() => setError("Wallet sign-in was rejected — approve the signature request to play."));
  }, []);

  useEffect(() => {
    const id = getIdentity();
    const ws = new WebSocket(id ? `${url}?id=${encodeURIComponent(id)}` : url);
    ref.current = ws;
    authedRef.current = false;
    pendingNonce.current = null;
    let errTimer: ReturnType<typeof setTimeout> | undefined;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      let msg: { type?: string; playerId?: string; state?: CocWorld; message?: string; report?: BattleReport; nonce?: string };
      try {
        msg = JSON.parse(e.data); // a malformed frame must not throw out of the handler (it would surface
                                  // as a window 'error' that we'd then forward back to the server)
      } catch {
        return;
      }
      if (msg.type === "welcome") {
        authedRef.current = true;
        pendingNonce.current = null;
        setPlayerId(msg.playerId ?? null);
        setState(msg.state ?? null);
      } else if (msg.type === "challenge" && typeof msg.nonce === "string") {
        pendingNonce.current = msg.nonce; // remember it in case the wallet connects a moment later
        sendAuth(msg.nonce);
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
  }, [url, sendAuth]);

  // If the wallet becomes available AFTER the challenge arrived (e.g. token gate off), retry auth.
  useEffect(() => {
    if (!authedRef.current && pendingNonce.current && auth?.pubkey && auth.signMessage) sendAuth(pendingNonce.current);
  }, [auth?.pubkey, auth?.signMessage, sendAuth]);

  const send = useCallback((cmd: CocCommand) => {
    ref.current?.send(JSON.stringify({ type: "command", cmd }));
  }, []);
  const link = useCallback((wallet: string) => {
    ref.current?.send(JSON.stringify({ type: "link", wallet }));
  }, []);
  const clearReport = useCallback(() => setReport(null), []);

  return { state, playerId, connected, error, report, send, link, clearReport };
}
