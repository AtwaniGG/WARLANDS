"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { RESOURCES, RAW_RESOURCES, INTERMEDIATE_RESOURCES, FINISHED_RESOURCES, type ResourceId } from "@/game/resources";
import { Button, Tabs, type TabItem } from "./ui";

function bestPrices(book: ReturnType<typeof useGame.getState>["book"], item: ResourceId) {
  const buys = book.filter((o) => o.side === "buy" && o.item === item).map((o) => o.price);
  const sells = book.filter((o) => o.side === "sell" && o.item === item).map((o) => o.price);
  return {
    bestBid: buys.length ? Math.max(...buys) : null,
    bestAsk: sells.length ? Math.min(...sells) : null,
  };
}

type MarketTab = "raw" | "intermediate" | "finished";
const MARKET_TABS: TabItem<MarketTab>[] = [
  { id: "raw", label: "Raw" },
  { id: "intermediate", label: "Intermediate" },
  { id: "finished", label: "Finished" },
];

export function MarketPanel() {
  const book = useGame((s) => s.book);
  const ref = useGame((s) => s.refPrices);
  const buy = useGame((s) => s.marketBuy);
  const sell = useGame((s) => s.marketSell);
  const list = useGame((s) => s.placeSellOrder);
  const resourceTotal = useGame((s) => s.resourceTotal);
  const hasPlots = useGame((s) => Object.keys(s.plots).length > 0);

  const [qty, setQty] = useState(50);
  const [tab, setTab] = useState<MarketTab>("raw");

  const items = tab === "raw" ? RAW_RESOURCES : tab === "intermediate" ? INTERMEDIATE_RESOURCES : FINISHED_RESOURCES;

  if (!hasPlots) {
    return <div className="p-6" style={{ fontSize: "14px", color: "var(--text-lo)" }}>Claim a plot first — you need somewhere to store and source goods before trading.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="wl-title" style={{ fontSize: "22px", color: "var(--amber)" }}>Open Marketplace</h2>
        <div className="flex items-center gap-2" style={{ fontSize: "12px" }}>
          <span style={{ color: "var(--text-muted)" }}>Trade size</span>
          <input
            type="number"
            value={qty}
            min={1}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="wl-num w-20 px-2 py-1 text-right"
            style={{ borderRadius: "var(--radius-sm)", background: "var(--panel-2)", border: "1px solid var(--hairline)", color: "var(--text-hi)" }}
          />
        </div>
      </div>
      <p className="mb-4" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        Player-driven order book. 4% transaction fee + 5 $WAR listing fee are token sinks (½ burned, ½ to the season reward pool).
      </p>

      <div className="mb-3">
        <Tabs
          tabs={MARKET_TABS}
          value={tab}
          onChange={setTab}
          style={{ display: "inline-flex", border: "1px solid var(--hairline)", borderRadius: "var(--radius-md)" }}
        />
      </div>

      <div className="overflow-hidden" style={{ borderRadius: "var(--radius-lg)", border: "1px solid var(--hairline)" }}>
        <table className="w-full" style={{ fontSize: "13px" }}>
          <thead style={{ background: "var(--panel)" }}>
            <tr className="wl-label">
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
                <tr key={item} style={{ borderTop: "1px solid var(--hairline)" }}>
                  <td className="px-3 py-2">{RESOURCES[item].icon} {RESOURCES[item].name}</td>
                  <td className="wl-num px-2 py-2 text-right" style={{ color: "var(--text-lo)" }}>{hold.toLocaleString()}</td>
                  <td className="wl-num px-2 py-2 text-right" style={{ color: "var(--emerald-text)" }}>{bestBid?.toFixed(2) ?? "—"}</td>
                  <td className="wl-num px-2 py-2 text-right" style={{ color: "var(--text-muted)" }}>{ref[item].toFixed(2)}</td>
                  <td className="wl-num px-2 py-2 text-right" style={{ color: "var(--blood-text)" }}>{bestAsk?.toFixed(2) ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="success" size="sm" onClick={() => buy(item, qty)}>Buy</Button>
                      <Button variant="danger" size="sm" disabled={hold <= 0} onClick={() => sell(item, qty)}>Sell</Button>
                      <Button variant="info" size="sm" disabled={hold < qty} onClick={() => list(item, qty, (bestBid ?? ref[item]) * 1.0)} title="List a limit sell order at market">List</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3" style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        Buy fills the cheapest asks; Sell hits the best bids; List posts a limit order that fills passively over time.
        Prices drift each tick and AI liquidity refreshes — in the full game these orders are other players (GDD §7).
      </p>
    </div>
  );
}
