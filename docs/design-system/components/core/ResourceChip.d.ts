import * as React from "react";

export type ResourceTier = "raw" | "intermediate" | "finished";

export interface ResourceChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Resource icon — an <img> of a resource SVG, or an emoji (functional icon). */
  icon: React.ReactNode;
  /** Resource name. Omit to render an icon-only count chip. */
  name?: React.ReactNode;
  /** Pre-formatted amount, mono + tabular via `.wl-num`. */
  amount?: React.ReactNode;
  /** Frame tier: raw (hairline) · intermediate (raised) · finished (amber rim). @default "raw" */
  tier?: ResourceTier;
  /** @default "md" */
  size?: "sm" | "md";
}

/** Resource pill — icon + name + mono amount. The atom of stockpile / recipes / loot. */
export function ResourceChip(props: ResourceChipProps): JSX.Element;
