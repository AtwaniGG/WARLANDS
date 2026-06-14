import * as React from "react";

export interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Micro uppercase label, e.g. "$WAR", "Staked", "Pool". */
  label: React.ReactNode;
  /** The readout — rendered mono + tabular. Pre-format numbers (e.g. "12,480"). */
  value: React.ReactNode;
  /** Value tint. @default "neutral" */
  accent?: "amber" | "blood" | "sky" | "emerald" | "violet" | "teal" | "neutral";
  /** row = inline (HUD bar); stack = label above value (cards). @default "row" */
  align?: "row" | "stack";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
}

/** Labelled mono numeric readout for the resource bar & dashboards. */
export function Stat(props: StatProps): JSX.Element;
