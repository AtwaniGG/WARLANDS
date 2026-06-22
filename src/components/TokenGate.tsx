"use client";

// Token gate — players must hold ≥ MIN $HEXAR (SPL) in their connected Solana wallet to enter the game.
// Strictly enforced — no bypass. Connect a wallet that holds the required balance to play.
//
// Knobs (all optional, NEXT_PUBLIC_* so they reach the browser):
//   NEXT_PUBLIC_TOKEN_GATE      "off" disables the gate entirely (default: on)
//   NEXT_PUBLIC_TOKEN_GATE_MIN  required balance (default: 100)
//   NEXT_PUBLIC_HEXAR_MINT        the SPL mint to check (see src/web3/solana.ts)

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { HEXAR_MINT, HEXAR_SYMBOL, SOLANA_CONFIGURED, explorerAddress } from "@/web3/solana";
import { WalletButton } from "./WalletButton";
import { Button } from "./ui";

export const GATE_MIN = Number(process.env.NEXT_PUBLIC_TOKEN_GATE_MIN ?? 100);
const GATE_ON = (process.env.NEXT_PUBLIC_TOKEN_GATE ?? "on").toLowerCase() !== "off";

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function TokenGate({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [bal, setBal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // read the wallet's $HEXAR balance (program-agnostic: works for SPL & Token-2022)
  const refresh = useCallback(async () => {
    if (!publicKey || !SOLANA_CONFIGURED) { setBal(null); return; }
    setLoading(true);
    try {
      // Query BOTH token programs by program id, then sum accounts matching our mint. The {mint}
      // filter alone MISSES Token-2022 balances — $HEXAR is a Token-2022 (pump.fun) mint.
      const [legacy, t22] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID }),
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_2022_PROGRAM_ID }),
      ]);
      let total = 0;
      for (const { account } of [...legacy.value, ...t22.value]) {
        const info = account.data.parsed?.info;
        if (info?.mint === HEXAR_MINT) total += info?.tokenAmount?.uiAmount ?? 0;
      }
      setBal(total);
    } catch {
      setBal(0);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot balance fetch on connect
  useEffect(() => { refresh(); }, [refresh]);

  // --- pass conditions (no bypass) ---
  if (!GATE_ON) return <>{children}</>;
  if (connected && bal !== null && bal >= GATE_MIN) return <>{children}</>;

  const insufficient = connected && bal !== null && bal < GATE_MIN;

  return (
    <div style={wrap}>
      <div className="wl-hexgrid" style={{ position: "absolute", inset: 0, opacity: 0.4, pointerEvents: "none" }} />
      <div className="wl-scanline" />
      <div style={card}>
        {/* brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ width: 30, height: 30, borderRadius: 6, background: "var(--amber)", color: "#0c0a04", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18 }}>W</span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, letterSpacing: "0.2em", color: "var(--text-hi)" }}>WARLANDS</span>
        </div>

        <div className="wl-label" style={{ fontSize: 10, color: "var(--amber-text)", letterSpacing: "0.22em" }}>HOLDERS ONLY</div>
        <h1 className="wl-title" style={{ fontSize: 30, margin: "6px 0 0", color: "var(--text-hi)" }}>DEPLOYMENT LOCKED</h1>
        <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--text-secondary)" }}>
          The war is for the committed. Hold{" "}
          <span className="wl-num" style={{ color: "var(--amber-text)", fontWeight: 700 }}>{fmt(GATE_MIN)} ${HEXAR_SYMBOL}</span>{" "}
          in your wallet to claim land and command a base.
        </p>

        {/* requirement readout */}
        <div style={readout}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="wl-label" style={{ fontSize: 10 }}>REQUIRED</span>
            <span className="wl-num" style={{ fontSize: 14, color: "var(--text-hi)", fontWeight: 700 }}>{fmt(GATE_MIN)} ${HEXAR_SYMBOL}</span>
          </div>
          <div style={{ height: 1, background: "var(--hairline)", margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="wl-label" style={{ fontSize: 10 }}>YOUR HOLDINGS</span>
            <span className="wl-num" style={{ fontSize: 14, fontWeight: 700, color: insufficient ? "var(--blood-text)" : connected ? "var(--emerald-text)" : "var(--text-muted)" }}>
              {!connected ? "— WALLET NOT LINKED" : loading ? "VERIFYING…" : `${fmt(bal ?? 0)} $${HEXAR_SYMBOL}`}
            </span>
          </div>
        </div>

        {insufficient && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--blood-text)" }}>
            Insufficient holdings — you need {fmt(GATE_MIN - (bal ?? 0))} more ${HEXAR_SYMBOL}.
          </div>
        )}
        {!SOLANA_CONFIGURED && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--warning, #fbbf24)" }}>
            No $HEXAR mint configured (set NEXT_PUBLIC_HEXAR_MINT).
          </div>
        )}

        {/* actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <WalletButton />
            {connected && (
              <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>{loading ? "CHECKING…" : "RECHECK"}</Button>
            )}
            <a href={explorerAddress(HEXAR_MINT)} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
              Get ${HEXAR_SYMBOL} ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const wrap: CSSProperties = { position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "radial-gradient(120% 90% at 50% 14%, #11161f 0%, #070a10 72%)", overflow: "hidden" };
const card: CSSProperties = { position: "relative", width: "100%", maxWidth: 440, background: "var(--surface-card)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-modal)", padding: "26px 24px" };
const readout: CSSProperties = { marginTop: 20, padding: "14px 16px", background: "var(--surface-sunken)", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)" };
