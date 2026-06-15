"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { ADDRESSES, CONTRACTS_CONFIGURED } from "@/web3/addresses";
import { DEFAULT_CHAIN } from "@/web3/config";
import { warTokenAbi, stakingManagerAbi, sinkRouterAbi, rewardDistributorAbi } from "@/web3/abis";
import { TERRAIN_IDS, PLOT_TYPES } from "@/game/plotTypes";
import { WalletButton } from "./WalletButton";
import { Button, Panel, Stat, type StatAccent } from "./ui";

const CHAIN_ID = DEFAULT_CHAIN.id; // Base Sepolia (84532)
const EXPLORER = "https://sepolia.basescan.org";
const STATUS = ["Unclaimed", "Active", "Unbonding"] as const;
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function fmt(v: bigint | undefined, decimals = 18) {
  if (v === undefined) return "—";
  const n = Number(formatUnits(v, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function short(a?: string) {
  return a && a !== ZERO_ADDR ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
}

export function WalletPanel() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const wrongChain = isConnected && chainId !== CHAIN_ID;

  const [plotId, setPlotId] = useState("1");
  const [plotType, setPlotType] = useState(0);
  const stakeAmount = parseUnits(String(PLOT_TYPES[TERRAIN_IDS[plotType]].stake), 18);

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const enabled = CONTRACTS_CONFIGURED;
  const me = address ? ([address] as const) : undefined;

  const balanceR = useReadContract({ address: ADDRESSES.warToken, abi: warTokenAbi, functionName: "balanceOf", args: me, query: { enabled: enabled && !!address } });
  const allowanceR = useReadContract({ address: ADDRESSES.warToken, abi: warTokenAbi, functionName: "allowance", args: address ? [address, ADDRESSES.stakingManager] : undefined, query: { enabled: enabled && !!address } });
  const totalStakedR = useReadContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "totalStaked", query: { enabled } });
  const totalBurnedR = useReadContract({ address: ADDRESSES.sinkRouter, abi: sinkRouterAbi, functionName: "totalBurned", query: { enabled } });
  const totalFundedR = useReadContract({ address: ADDRESSES.rewardDistributor, abi: rewardDistributorAbi, functionName: "totalFunded", query: { enabled } });
  const refundR = useReadContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "refunds", args: me, query: { enabled: enabled && !!address } });
  const plotStakerR = useReadContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "stakerOf", args: [BigInt(plotId || "0")], query: { enabled } });
  const plotStatusR = useReadContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "plotStatus", args: [BigInt(plotId || "0")], query: { enabled } });

  const allowance = allowanceR.data as bigint | undefined;
  const balance = balanceR.data as bigint | undefined;
  const needsApproval = allowance === undefined || allowance < stakeAmount;
  const lowBalance = balance !== undefined && balance < stakeAmount;
  const plotStaker = plotStakerR.data as string | undefined;
  const plotStatus = plotStatusR.data as number | undefined;
  const refund = refundR.data as bigint | undefined;
  const mineHere = !!address && !!plotStaker && plotStaker.toLowerCase() === address.toLowerCase();

  // Re-read on-chain state whenever a tx confirms.
  useEffect(() => {
    if (!confirmed) return;
    balanceR.refetch(); allowanceR.refetch(); totalStakedR.refetch(); totalBurnedR.refetch();
    totalFundedR.refetch(); refundR.refetch(); plotStakerR.refetch(); plotStatusR.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, hash]);

  const busy = isPending || confirming || wrongChain || !enabled || !isConnected;

  function approve() { reset(); writeContract({ address: ADDRESSES.warToken, abi: warTokenAbi, functionName: "approve", args: [ADDRESSES.stakingManager, stakeAmount] }); }
  function stake() { reset(); writeContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "stakeForPlot", args: [BigInt(plotId || "0"), plotType] }); }
  function requestUnstake() { reset(); writeContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "requestUnstake", args: [BigInt(plotId || "0")] }); }
  function claimRefund() { reset(); writeContract({ address: ADDRESSES.stakingManager, abi: stakingManagerAbi, functionName: "claimRefund", args: [] }); }

  const inputStyle: React.CSSProperties = { borderRadius: "var(--radius-sm)", background: "var(--panel-2)", border: "1px solid var(--hairline)", color: "var(--text-hi)" };

  return (
    <div className="mx-auto max-w-2xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Wallet &amp; On-Chain</h2>
        <WalletButton />
      </div>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Real $WAR staking on <b>Base Sepolia</b> (testnet). Connect a wallet on Base Sepolia, approve, and
        stake against the live StakingManager. This is separate from the in-browser mock economy.
      </p>

      {/* Connection status */}
      <div className="mb-3 p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)", background: "var(--panel)", fontSize: "12px" }}>
        <Row label="Wallet" value={isConnected && address ? address : "not connected"} />
        <Row label="Network" value={isConnected ? `${chain?.name ?? "unknown"} (${chainId})` : "—"} />
        <Row label="Contracts" value={CONTRACTS_CONFIGURED ? "Base Sepolia ✓" : "not configured"} />
      </div>

      {/* wrong-network guard */}
      {wrongChain && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--blood)", background: "rgba(156,43,43,0.12)", fontSize: "12px", color: "var(--blood-text)" }}>
          <span>Wrong network. Switch your wallet to <b>Base Sepolia</b> to stake.</span>
          <Button variant="primary" size="sm" disabled={switching} onClick={() => switchChain({ chainId: CHAIN_ID })}>
            {switching ? "Switching…" : "Switch to Base Sepolia"}
          </Button>
        </div>
      )}

      {!CONTRACTS_CONFIGURED && (
        <div className="mb-4 p-3" style={{ borderRadius: "var(--radius-lg)", border: "1px solid rgba(245,179,1,0.3)", background: "rgba(245,179,1,0.08)", fontSize: "12px", color: "var(--amber-text)" }}>
          Contracts not configured — set <code>NEXT_PUBLIC_*</code> addresses to enable on-chain mode.
        </div>
      )}

      {/* On-chain reads */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <ChainStat label="Your $WAR" value={fmt(balance)} accent="amber" />
        <ChainStat label="Total Staked (protocol)" value={fmt(totalStakedR.data as bigint | undefined)} accent="amber" />
        <ChainStat label="Total Burned (sinks)" value={fmt(totalBurnedR.data as bigint | undefined)} accent="blood" />
        <ChainStat label="Reward Pool Funded" value={fmt(totalFundedR.data as bigint | undefined)} accent="emerald" />
      </div>

      {/* Stake on-chain */}
      <Panel title="Stake a plot on-chain (Base Sepolia)">
        <div className="flex flex-wrap items-end gap-2">
          <label style={{ fontSize: "12px", color: "var(--text-lo)" }}>
            Plot ID
            <input value={plotId} onChange={(e) => setPlotId(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric" className="wl-num mt-1 block w-24 px-2 py-2" style={{ ...inputStyle, fontSize: "13px" }} />
          </label>
          <label style={{ fontSize: "12px", color: "var(--text-lo)" }}>
            Plot type
            <select value={plotType} onChange={(e) => setPlotType(Number(e.target.value))}
              className="mt-1 block px-2 py-2" style={{ ...inputStyle, fontSize: "13px" }}>
              {TERRAIN_IDS.map((t, i) => (
                <option key={t} value={i}>{PLOT_TYPES[t].name} — {PLOT_TYPES[t].stake.toLocaleString()} WAR</option>
              ))}
            </select>
          </label>
        </div>

        {/* live on-chain status for this plot id */}
        <div className="mt-2" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Plot {plotId || "0"} on-chain: <b style={{ color: "var(--text-secondary)" }}>{plotStatus !== undefined ? STATUS[plotStatus] ?? "?" : "…"}</b>
          {plotStaker && plotStaker !== ZERO_ADDR && <> · staker {short(plotStaker)}{mineHere ? " (you)" : ""}</>}
          {" · "}allowance {fmt(allowance)} {!needsApproval && <span style={{ color: "var(--emerald-text)" }}>✓ approved</span>}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="info" size="sm" disabled={busy || !needsApproval} onClick={approve}
            title={needsApproval ? "Approve the StakingManager to pull your $WAR" : "Already approved"}>
            {needsApproval ? `1. Approve ${PLOT_TYPES[TERRAIN_IDS[plotType]].stake.toLocaleString()} WAR` : "1. Approved ✓"}
          </Button>
          <Button variant="primary" size="sm" disabled={busy || needsApproval || lowBalance} onClick={stake}
            title={needsApproval ? "Approve first" : lowBalance ? "Not enough $WAR" : "Stake & claim this plot"}>
            2. Stake &amp; Claim Plot
          </Button>
          {mineHere && plotStatus === 1 && (
            <Button variant="secondary" size="sm" disabled={busy} onClick={requestUnstake}
              title="Begin the 7-day unbonding period">
              Request Unstake
            </Button>
          )}
          <Button variant="secondary" size="sm" disabled={busy || !(refund && refund > BigInt(0))} onClick={claimRefund}
            title="Reclaim full principal credited by a conquest">
            Claim Refund {refund !== undefined && refund > BigInt(0) ? `(${fmt(refund)})` : ""}
          </Button>
        </div>

        {lowBalance && <p className="mt-2" style={{ fontSize: "11px", color: "var(--amber-text)" }}>Not enough $WAR for this plot type. Use a wallet funded with test $WAR.</p>}

        {/* tx feedback */}
        {hash && (
          <div className="mt-3 p-2" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--hairline)", background: "var(--panel)", fontSize: "11px" }}>
            <span style={{ color: confirmed ? "var(--emerald-text)" : "var(--amber-text)" }}>
              {confirming ? "⏳ Confirming…" : confirmed ? "✓ Confirmed" : "Submitted"}
            </span>{" "}
            <a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer" style={{ color: "var(--teal-text)" }}>
              {hash.slice(0, 10)}…{hash.slice(-8)} ↗
            </a>
          </div>
        )}
        {error && <p className="wl-num mt-2" style={{ fontSize: "11px", color: "var(--blood-text)" }}>{(error as Error).message.split("\n")[0].slice(0, 160)}</p>}

        <p className="mt-3" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Need test $WAR? Import the throwaway deployer key into your wallet (it holds the supply), or send
          $WAR to your address. Staked $WAR is locked, never spent, and conquest returns full principal.
          Withdrawing after <code>Request Unstake</code> needs a 7-day unbond.
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
