import * as React from "react";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  /** @default 100 */
  max?: number;
  /** Fill tint. @default "amber" */
  tone?: "amber" | "blood" | "sky" | "emerald" | "violet";
  /** Optional uppercase label above the track. */
  label?: React.ReactNode;
  /** Optional mono value text shown at the right of the label row. */
  valueText?: React.ReactNode;
  /** Track height in px. @default 8 */
  height?: number;
}

/** Thin progress track — season timer, upkeep, defense %, train queue. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
