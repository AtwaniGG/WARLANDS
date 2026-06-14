"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "./ui";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Button variant="success" size="sm" onClick={() => disconnect()} title="Disconnect">
        🟢 {truncate(address)}
      </Button>
    );
  }

  return (
    <Button variant="primary" size="sm" disabled={isPending} onClick={() => connect({ connector: injected() })}>
      {isPending ? "Connecting…" : "Connect Wallet"}
    </Button>
  );
}
