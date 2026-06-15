"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui";

function truncate(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

export function WalletButton() {
  const { publicKey, connected, connecting, connect, disconnect, select, wallet, wallets } = useWallet();
  const [pending, setPending] = useState(false);

  // connect once a wallet has been selected (select() updates state asynchronously)
  useEffect(() => {
    if (pending && wallet && !connected && !connecting) {
      connect().catch(() => {}).finally(() => setPending(false));
    }
  }, [pending, wallet, connected, connecting, connect]);

  const onClick = useCallback(() => {
    if (connected) { disconnect().catch(() => {}); return; }
    const phantom = wallets.find((w) => w.adapter.name === "Phantom") ?? wallets[0];
    if (phantom) { select(phantom.adapter.name); setPending(true); }
  }, [connected, disconnect, wallets, select]);

  if (connected && publicKey) {
    return (
      <Button variant="success" size="sm" onClick={onClick} title="Disconnect">
        🟢 {truncate(publicKey.toBase58())}
      </Button>
    );
  }
  return (
    <Button variant="primary" size="sm" disabled={connecting || pending} onClick={onClick}>
      {connecting || pending ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
