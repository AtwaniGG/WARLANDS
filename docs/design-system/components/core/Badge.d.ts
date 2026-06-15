import * as React from "react";

export type BadgeTone =
  | "amber"
  | "blood"
  | "sky"
  | "emerald"
  | "violet"
  | "teal"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status color role. @default "amber" */
  tone?: BadgeTone;
  /** soft = tinted bg + colored text; solid = filled. @default "soft" */
  variant?: "soft" | "solid";
  /** Optional leading emoji / node. */
  icon?: React.ReactNode;
}

/** Compact uppercase status / ownership tag (OWNED, PROTOTYPE, SHIELDED, TIER 3). */
export function Badge(props: BadgeProps): JSX.Element;
