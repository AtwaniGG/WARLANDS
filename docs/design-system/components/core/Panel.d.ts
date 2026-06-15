import * as React from "react";

export type PanelRim = "amber" | "blood" | "sky" | "emerald";

export interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** ALL-CAPS condensed title (13px). */
  title?: React.ReactNode;
  /** Smaller ALL-CAPS micro-label (10px) — use instead of title for dense headers. */
  label?: React.ReactNode;
  /** Tint the header text amber. */
  accent?: boolean;
  /** Accent border rim color. */
  rim?: PanelRim;
  /** Body padding. @default "16px" */
  padding?: string;
  /** Node pinned to the right of the header. */
  headerRight?: React.ReactNode;
}

/**
 * Dark bordered surface that frames a group of HUD controls.
 * @startingPoint section="Core" subtitle="Titled HUD surface / card" viewport="700x200"
 */
export function Panel(props: PanelProps): JSX.Element;
