import * as React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "info"
  | "success"
  | "ghost"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary = amber command CTA (claim / stake $WAR) · secondary = raised neutral ·
   * danger = blood · info = sky · success = green · ghost / outline = low-emphasis.
   * @default "primary"
   */
  variant?: ButtonVariant;
  /** @default "md" */
  size?: ButtonSize;
  /** Leading icon — an emoji string (WARLANDS uses emoji as functional icons) or node. */
  icon?: React.ReactNode;
  /** Stretch to full container width. */
  full?: boolean;
}

/**
 * Tactical action control. Amber `primary` is the primary claim / $WAR CTA.
 * @startingPoint section="Core" subtitle="Button variants, sizes & states" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
