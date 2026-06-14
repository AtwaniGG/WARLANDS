import * as React from "react";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  /** Optional emoji icon. */
  icon?: React.ReactNode;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  tabs: TabItem[];
  /** Active tab id. */
  value: string;
  onChange?: (id: string) => void;
}

/** Primary view switcher — active tab is solid amber on near-black. */
export function Tabs(props: TabsProps): JSX.Element;
