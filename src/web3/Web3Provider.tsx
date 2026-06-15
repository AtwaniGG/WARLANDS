"use client";

import { useMemo, type ReactNode } from "react";
import { Buffer } from "buffer";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SOLANA_RPC } from "./solana";

// web3.js / wallet-adapter expect a global Buffer in the browser.
if (typeof window !== "undefined" && !window.Buffer) {
  (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={SOLANA_RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
