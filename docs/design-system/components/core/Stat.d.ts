import * as React from "react";

export type StatAccent =
  | "amber"
  | "blood"
  | "sky"
  | "emerald"
  | "violet"
  | "teal"
  | "neutral";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  /** The readout — rendered mono + tabular via `.wl-num`. Pre-format numbers. */
  value: React.ReactNode;
  /** @default "neutral" */
  accent?: StatAccent;
  /** row = inline (HUD bar); stack = label above value (cards). @default "row" */
  align?: "row" | "stack";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}

/** Labelled mono numeric readout for the top resource bar & dashboards. */
export function Stat(props: StatProps): JSX.Element;
