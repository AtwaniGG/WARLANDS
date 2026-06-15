import * as React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  /** Optional leading emoji icon. */
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  tabs: TabItem<T>[];
  value: T;
  onChange?: (id: T) => void;
}

/** Primary view switcher — active tab is solid amber on near-black; scrolls on mobile. */
export function Tabs<T extends string = string>(props: TabsProps<T>): JSX.Element;
