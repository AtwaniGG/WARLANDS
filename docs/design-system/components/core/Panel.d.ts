import * as React from "react";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** ALL-CAPS condensed title (13px). */
  title?: React.ReactNode;
  /** Smaller ALL-CAPS micro-label (10px) — use instead of title for dense headers. */
  label?: React.ReactNode;
  /** Tint the header text amber. @default false */
  accent?: boolean;
  /** Accent border rim color. */
  rim?: "amber" | "blood" | "sky" | "emerald";
  /** Body padding. @default "16px" */
  padding?: string;
  /** Node pinned to the right of the header. */
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}

/** Dark bordered surface that frames a group of HUD controls. */
export function Panel(props: PanelProps): JSX.Element;
