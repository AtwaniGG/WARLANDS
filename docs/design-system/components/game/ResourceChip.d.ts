import * as React from "react";

export interface ResourceChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Resource emoji (e.g. "🌾", "🔩", "🛡️") — WARLANDS uses emoji as functional resource icons. */
  icon: React.ReactNode;
  /** Resource name. Omit to render an icon-only count chip. */
  name?: React.ReactNode;
  /** Pre-formatted amount, mono + tabular. Omit for a plain label chip. */
  amount?: React.ReactNode;
  /** Supply-chain tier sets the frame treatment. @default "raw" */
  tier?: "raw" | "intermediate" | "finished";
  /** @default "md" */
  size?: "sm" | "md";
}

/**
 * Resource pill — icon + name + mono amount. The atom of stockpile/recipes/loot.
 *
 * @startingPoint section="Game" subtitle="Resource chips across raw/intermediate/finished tiers" viewport="700x150"
 */
export function ResourceChip(props: ResourceChipProps): JSX.Element;
