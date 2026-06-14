"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { RESOURCES, RAW_RESOURCES, INTERMEDIATE_RESOURCES, FINISHED_RESOURCES, type ResourceId } from "@/game/resources";

function bestPrices(book: ReturnType<typeof useGame.getState>["book"], item: ResourceId) {
  const buys = book.filter((o) => o.side === "buy" && o.item === item).map((o) => o.price);
  const sells = book.filter((o) => o.side === "sell" && o.item === item).map((o) => o.price);
  return {
    bestBid: buys.length ? Math.max(...buys) : null,
    bestAsk: sells.length ? Math.min(...sells) : null,
  };
}

export function MarketPanel() {
  const book = useGame((s) => s.book);
  const ref = useGame((s) => s.refPrices);
  const buy = useGame((s) => s.marketBuy);
  const sell = useGame((s) => s.marketSell);
  const list = useGame((s) => s.placeSellOrder);
  const resourceTotal = useGame((s) => s.resourceTotal);
  const hasPlots = useGame((s) => Object.keys(s.plots).length > 0);

  const [qty, setQty] = useState(50);
  const [tab, setTab] = useState<"raw" | "intermediate" | "finished">("raw");

  const items = tab === "raw" ? RAW_RESOURCES : tab === "intermediate" ? INTERMEDIATE_RESOURCES : FINISHED_RESOURCES;

  if (!hasPlots) {
    return <div className="p-6 text-sm text-zinc-400">Claim a plot first — you need somewhere to store and source goods before trading.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-bold text-amber-400">Open Marketplace</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Trade size</span>
          <input
            type="number"
            value={qty}
            min={1}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded bg-zinc-800 px-2 py-1 text-right font-mono"
          />
        </div>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        Player-driven order book. 4% transaction fee + 5 $WAR listing fee are token sinks (½ burned, ½ to the season reward pool).
      </p>

      <div className="mb-3 flex gap-1">
        {(["raw", "intermediate", "finished"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs font-semibold capitalize ${tab === t ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-[11px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-2 py-2 text-right">You hold</th>
              <th className="px-2 py-2 text-right">Bid</th>
              <th className="px-2 py-2 text-right">Ref</th>
              <th className="px-2 py-2 text-right">Ask</th>
              <th className="px-3 py-2 text-right">Trade</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const { bestBid, bestAsk } = bestPrices(book, item);
              const hold = Math.floor(resourceTotal(item));
              return (
                <tr key={item} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                  <td className="px-3 py-2">{RESOURCES[item].icon} {RESOURCES[item].name}</td>
                  <td className="px-2 py-2 text-right font-mono text-zinc-400">{hold.toLocaleString()}</td>
                  <td className="px-2 py-2 text-right font-mono text-emerald-400">{bestBid?.toFixed(2) ?? "—"}</td>
                  <td className="px-2 py-2 text-right font-mono text-zinc-500">{ref[item].toFixed(2)}</td>
                  <td className="px-2 py-2 text-right font-mono text-red-400">{bestAsk?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => buy(item, qty)} className="rounded bg-emerald-700 px-2 py-1 text-[11px] font-semibold hover:bg-emerald-600">Buy</button>
                      <button onClick={() => sell(item, qty)} disabled={hold <= 0} className="rounded bg-red-700 px-2 py-1 text-[11px] font-semibold hover:bg-red-600 disabled:opacity-40">Sell</button>
                      <button onClick={() => list(item, qty, (bestBid ?? ref[item]) * 1.0)} disabled={hold < qty} className="rounded bg-sky-700 px-2 py-1 text-[11px] font-semibold hover:bg-sky-600 disabled:opacity-40" title="List a limit sell order at market">List</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-zinc-600">
        Buy fills the cheapest asks; Sell hits the best bids; List posts a limit order that fills passively over time.
        Prices drift each tick and AI liquidity refreshes — in the full game these orders are other players (GDD §7).
      </p>
    </div>
  );
}
