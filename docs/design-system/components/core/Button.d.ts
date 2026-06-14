import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight / intent. @default "primary" */
  variant?: "primary" | "secondary" | "danger" | "info" | "success" | "ghost" | "outline";
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Leading icon — an emoji string (WARLANDS uses emoji as functional icons) or node. */
  icon?: React.ReactNode;
  /** Stretch to full container width. @default false */
  full?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Primary tactical action control. Amber = the "Stake & Claim / $WAR" CTA.
 *
 * @startingPoint section="Core" subtitle="Buttons — primary, danger, ghost, sizes" viewport="700x180"
 */
export function Button(props: ButtonProps): JSX.Element;
