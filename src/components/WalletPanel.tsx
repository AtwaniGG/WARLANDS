"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { HEXAR_MINT, HEXAR_SYMBOL, SOLANA_CONFIGURED, explorerAddress } from "@/web3/solana";
import { WalletButton } from "./WalletButton";
import { Panel, Stat, type StatAccent } from "./ui";

const MINT = SOLANA_CONFIGURED ? new PublicKey(HEXAR_MINT) : null;

function fmt(n: number | null): string {
  return n === null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function WalletPanel() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [hexar, setHexar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey || !MINT) return;
    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setSol(lamports / 1e9);
    } catch {
      setSol(null);
    }
    try {
      const ata = getAssociatedTokenAddressSync(MINT, publicKey, false, TOKEN_2022_PROGRAM_ID);
      const bal = await connection.getTokenAccountBalance(ata);
      setHexar(bal.value.uiAmount ?? 0);
    } catch {
      setHexar(0); // no $HEXAR token account yet
    }
    setLoading(false);
  }, [publicKey, connection]);

  useEffect(() => {
    // Subscribes balance state to the external wallet connection + a 12s polling timer.
    // Clearing balances on disconnect is part of that external sync (the wallet went away),
    // not a derived-state loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!connected) { setSol(null); setHexar(null); return; }
    refresh();
    const t = setInterval(refresh, 12000);
    return () => clearInterval(t);
  }, [connected, refresh]);

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Wallet &amp; On-Chain</h2>
        <WalletButton />
      </div>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        $HEXAR is an SPL token on <b>Solana devnet</b>. Connect a Solana wallet (Phantom) set to devnet to see
        your balance. This on-chain layer is separate from the in-browser mock economy.
      </p>

      <div className="mb-3 p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)", fontSize: "12px" }}>
        <Row label="Wallet" value={connected && publicKey ? publicKey.toBase58() : "not connected"} />
        <Row label="Network" value="Solana devnet" />
        <Row label="$HEXAR mint" value={HEXAR_MINT} link={explorerAddress(HEXAR_MINT)} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <ChainStat label={`Your ${HEXAR_SYMBOL}`} value={connected ? fmt(hexar) : "—"} accent="amber" />
        <ChainStat label="Your SOL" value={connected ? fmt(sol) : "—"} accent="sky" />
      </div>

      <Panel title="Solana devnet">
        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          ${HEXAR_SYMBOL} is live on devnet — Token-2022, 9 decimals, 1,000,000,000 supply.{" "}
          <a href={explorerAddress(HEXAR_MINT)} target="_blank" rel="noreferrer" style={{ color: "var(--teal-text)" }}>View the mint ↗</a>
        </div>
        <p className="mt-3" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          On-chain staking (an Anchor program with a principal-safe vault) is the next step. For now this panel
          reads your live devnet $HEXAR balance. {loading ? "Refreshing…" : ""}
        </p>
        <p className="mt-2" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Need test $HEXAR? Send some to your address from the deployer wallet, or import the deployer key into
          Phantom (it holds the supply). Get devnet SOL for gas from a faucet.
        </p>
      </Panel>
    </div>
  );
}

function Row({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="wl-num truncate" style={{ color: "var(--teal-text)", maxWidth: "70%" }}>{value} ↗</a>
      ) : (
        <span className="wl-num truncate" style={{ color: "var(--text-secondary)", maxWidth: "70%" }}>{value}</span>
      )}
    </div>
  );
}

function ChainStat({ label, value, accent }: { label: string; value: string; accent: StatAccent }) {
  return (
    <Panel padding="12px">
      <Stat label={label} value={value} accent={accent} align="stack" size="lg" />
    </Panel>
  );
}
