import * as React from "react";

export type ProgressTone = "amber" | "blood" | "sky" | "emerald" | "violet";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 0 */
  value?: number;
  /** @default 100 */
  max?: number;
  /** @default "amber" */
  tone?: ProgressTone;
  /** Optional uppercase label above the track. */
  label?: React.ReactNode;
  /** Optional mono value text at the right of the label row. */
  valueText?: React.ReactNode;
  /** Track height in px. @default 8 */
  height?: number;
}

/** Thin progress track — season timer, upkeep, defense %, build / train queue. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
