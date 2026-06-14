"use client";

import { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ADDRESSES, CONTRACTS_CONFIGURED } from "@/web3/addresses";
import { warTokenAbi, stakingManagerAbi, sinkRouterAbi, rewardDistributorAbi } from "@/web3/abis";
import { TERRAIN_IDS, PLOT_TYPES } from "@/game/plotTypes";
import { WalletButton } from "./WalletButton";

function fmt(v: bigint | undefined, decimals = 18) {
  if (v === undefined) return "—";
  const n = Number(formatUnits(v, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function WalletPanel() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const [plotId, setPlotId] = useState("1");
  const [plotType, setPlotType] = useState(0); // 0 = plains
  const { writeContract, isPending, error } = useWriteContract();

  const enabled = CONTRACTS_CONFIGURED;

  const { data: balance } = useReadContract({
    address: ADDRESSES.warToken, abi: warTokenAbi, functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });
  const { data: totalStaked } = useReadContract({
    address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "totalStaked",
    query: { enabled },
  });
  const { data: totalBurned } = useReadContract({
    address: ADDRESSES.sinkRouter, abi: sinkRouterAbi, functionName: "totalBurned",
    query: { enabled },
  });
  const { data: totalFunded } = useReadContract({
    address: ADDRESSES.rewardDistributor, abi: rewardDistributorAbi, functionName: "totalFunded",
    query: { enabled },
  });
  const { data: refund } = useReadContract({
    address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "refunds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && !!address },
  });

  const stakeAmount = parseUnits(String(PLOT_TYPES[TERRAIN_IDS[plotType]].stake), 18);

  function approve() {
    writeContract({ address: ADDRESSES.warToken, abi: warTokenAbi, functionName: "approve", args: [ADDRESSES.stakingManager, stakeAmount] });
  }
  function stake() {
    writeContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "stakeForPlot", args: [BigInt(plotId || "0"), plotType] });
  }
  function claimRefund() {
    writeContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "claimRefund", args: [] });
  }

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-bold text-amber-400">Wallet &amp; On-Chain</h2>
        <WalletButton />
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Real $WAR staking on an EVM L2 (GDD §20). Connect a wallet and point the app at deployed
        contracts via <code className="text-zinc-400">NEXT_PUBLIC_*</code> env to leave mock mode.
      </p>

      {/* Connection status */}
      <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
        <Row label="Wallet" value={isConnected && address ? address : "not connected"} />
        <Row label="Chain" value={isConnected ? `${chain?.name ?? "unknown"} (${chainId})` : "—"} />
        <Row label="Contracts" value={CONTRACTS_CONFIGURED ? "configured ✓" : "not deployed (mock mode)"} />
      </div>

      {!CONTRACTS_CONFIGURED && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200">
          <div className="font-semibold">Mock mode active.</div>
          Deploy <code>contracts/</code> (see its README), then set:
          <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2 text-[10px] text-zinc-300">{`NEXT_PUBLIC_WAR_TOKEN=0x...
NEXT_PUBLIC_STAKING_MANAGER=0x...
NEXT_PUBLIC_SINK_ROUTER=0x...
NEXT_PUBLIC_REWARD_DISTRIBUTOR=0x...`}</pre>
          The game runs fully on the in-browser mock economy until then.
        </div>
      )}

      {/* On-chain reads */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Stat label="Your $WAR" value={fmt(balance as bigint | undefined)} />
        <Stat label="Total Staked (protocol)" value={fmt(totalStaked as bigint | undefined)} />
        <Stat label="Total Burned (sinks)" value={fmt(totalBurned as bigint | undefined)} accent="text-red-400" />
        <Stat label="Reward Pool Funded" value={fmt(totalFunded as bigint | undefined)} accent="text-emerald-400" />
      </div>

      {/* Stake on-chain */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-200">Stake a plot on-chain (GDD §4)</h3>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-zinc-400">
            Plot ID
            <input value={plotId} onChange={(e) => setPlotId(e.target.value.replace(/\D/g, ""))}
              className="mt-1 block w-24 rounded bg-zinc-800 px-2 py-1 font-mono text-sm" />
          </label>
          <label className="text-xs text-zinc-400">
            Plot type
            <select value={plotType} onChange={(e) => setPlotType(Number(e.target.value))}
              className="mt-1 block rounded bg-zinc-800 px-2 py-1 text-sm">
              {TERRAIN_IDS.map((t, i) => (
                <option key={t} value={i}>{PLOT_TYPES[t].name} — {PLOT_TYPES[t].stake.toLocaleString()} WAR</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={approve} disabled={!isConnected || !enabled || isPending}
            className="rounded bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600 disabled:opacity-40">
            1. Approve {PLOT_TYPES[TERRAIN_IDS[plotType]].stake.toLocaleString()} WAR
          </button>
          <button onClick={stake} disabled={!isConnected || !enabled || isPending}
            className="rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-40">
            2. Stake &amp; Claim Plot
          </button>
          <button onClick={claimRefund} disabled={!isConnected || !enabled || isPending}
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
            title="Reclaim full principal credited by a conquest">
            Claim Refund {refund !== undefined && (refund as bigint) > BigInt(0) ? `(${fmt(refund as bigint)})` : ""}
          </button>
        </div>
        {error && <p className="mt-2 text-[11px] text-red-400">{error.message.split("\n")[0]}</p>}
        <p className="mt-2 text-[11px] text-zinc-600">
          Staked $WAR is locked, never spent, and can never be looted by another player — conquest
          returns your full principal (StakingManager invariant).
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-zinc-500">{label}</span>
      <span className="truncate font-mono text-zinc-300">{value}</span>
    </div>
  );
}

function Stat({ label, value, accent = "text-amber-300" }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className={`mt-1 font-mono text-lg font-bold ${accent}`}>{value}</div>
    </div>
  );
}
