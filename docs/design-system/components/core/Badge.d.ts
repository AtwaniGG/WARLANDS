import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color signal. @default "amber" */
  tone?: "amber" | "blood" | "sky" | "emerald" | "violet" | "teal" | "neutral";
  /** soft = tinted bg + colored text; solid = filled. @default "soft" */
  variant?: "soft" | "solid";
  /** Optional leading emoji/icon. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/** Compact uppercase status / ownership tag (OWNED, PROTOTYPE, TIER 3, PASSED). */
export function Badge(props: BadgeProps): JSX.Element;
