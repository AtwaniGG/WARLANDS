"use client";

import { useState } from "react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ADDRESSES, CONTRACTS_CONFIGURED } from "@/web3/addresses";
import { warTokenAbi, stakingManagerAbi, sinkRouterAbi, rewardDistributorAbi } from "@/web3/abis";
import { TERRAIN_IDS, PLOT_TYPES } from "@/game/plotTypes";
import { WalletButton } from "./WalletButton";
import { Button, Panel, Stat, type StatAccent } from "./ui";

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

  const inputStyle: React.CSSProperties = {
    borderRadius: "var(--radius-sm)",
    background: "var(--panel-2)",
    border: "1px solid var(--hairline)",
    color: "var(--text-hi)",
  };

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Wallet &amp; On-Chain</h2>
        <WalletButton />
      </div>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Real $WAR staking on an EVM L2 (GDD §20). Connect a wallet and point the app at deployed
        contracts via <code style={{ color: "var(--text-lo)" }}>NEXT_PUBLIC_*</code> env to leave mock mode.
      </p>

      {/* Connection status */}
      <div className="mb-4 p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)", fontSize: "12px" }}>
        <Row label="Wallet" value={isConnected && address ? address : "not connected"} />
        <Row label="Chain" value={isConnected ? `${chain?.name ?? "unknown"} (${chainId})` : "—"} />
        <Row label="Contracts" value={CONTRACTS_CONFIGURED ? "configured ✓" : "not deployed (mock mode)"} />
      </div>

      {!CONTRACTS_CONFIGURED && (
        <div
          className="mb-4 p-3"
          style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,179,1,0.3)", background: "rgba(245,179,1,0.08)", fontSize: "12px", color: "var(--amber-text)" }}
        >
          <div style={{ fontWeight: 600 }}>Mock mode active.</div>
          Deploy <code>contracts/</code> (see its README), then set:
          <pre
            className="wl-num mt-1 overflow-x-auto p-2"
            style={{ borderRadius: "var(--radius-sm)", background: "rgba(0,0,0,0.4)", fontSize: "10px", color: "var(--text-secondary)" }}
          >{`NEXT_PUBLIC_WAR_TOKEN=0x...
NEXT_PUBLIC_STAKING_MANAGER=0x...
NEXT_PUBLIC_SINK_ROUTER=0x...
NEXT_PUBLIC_REWARD_DISTRIBUTOR=0x...`}</pre>
          The game runs fully on the in-browser mock economy until then.
        </div>
      )}

      {/* On-chain reads */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ChainStat label="Your $WAR" value={fmt(balance as bigint | undefined)} accent="amber" />
        <ChainStat label="Total Staked (protocol)" value={fmt(totalStaked as bigint | undefined)} accent="amber" />
        <ChainStat label="Total Burned (sinks)" value={fmt(totalBurned as bigint | undefined)} accent="blood" />
        <ChainStat label="Reward Pool Funded" value={fmt(totalFunded as bigint | undefined)} accent="emerald" />
      </div>

      {/* Stake on-chain */}
      <Panel title="Stake a plot on-chain (GDD §4)">
        <div className="flex flex-wrap items-end gap-2">
          <label style={{ fontSize: "12px", color: "var(--text-lo)" }}>
            Plot ID
            <input value={plotId} onChange={(e) => setPlotId(e.target.value.replace(/\D/g, ""))}
              className="wl-num mt-1 block w-24 px-2 py-1" style={{ ...inputStyle, fontSize: "13px" }} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-lo)" }}>
            Plot type
            <select value={plotType} onChange={(e) => setPlotType(Number(e.target.value))}
              className="mt-1 block px-2 py-1" style={{ ...inputStyle, fontSize: "13px" }}>
              {TERRAIN_IDS.map((t, i) => (
                <option key={t} value={i}>{PLOT_TYPES[t].name} — {PLOT_TYPES[t].stake.toLocaleString()} WAR</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="info" size="sm" disabled={!isConnected || !enabled || isPending} onClick={approve}>
            1. Approve {PLOT_TYPES[TERRAIN_IDS[plotType]].stake.toLocaleString()} WAR
          </Button>
          <Button variant="primary" size="sm" disabled={!isConnected || !enabled || isPending} onClick={stake}>
            2. Stake &amp; Claim Plot
          </Button>
          <Button variant="secondary" size="sm" disabled={!isConnected || !enabled || isPending} onClick={claimRefund}
            title="Reclaim full principal credited by a conquest">
            Claim Refund {refund !== undefined && (refund as bigint) > BigInt(0) ? `(${fmt(refund as bigint)})` : ""}
          </Button>
        </div>
        {error && <p className="wl-num mt-2" style={{ fontSize: "11px", color: "var(--blood-text)" }}>{error.message.split("\n")[0]}</p>}
        <p className="mt-2" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Staked $WAR is locked, never spent, and can never be looted by another player — conquest
          returns your full principal (StakingManager invariant).
        </p>
      </Panel>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="wl-num truncate" style={{ color: "var(--text-secondary)" }}>{value}</span>
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
