import React from "react";
import { AbsoluteFill } from "remotion";
import { SCENE_BG } from "../theme";
import { ScanlineOverlay } from "./ScanlineOverlay";
import { HUDFrame } from "./HUDFrame";

/** Common scene chrome: brand background + HUD frame + scanline atmosphere. */
export const Scene: React.FC<{
  label?: string;
  children: React.ReactNode;
  intensity?: number;
  sweep?: boolean;
  bg?: string;
}> = ({ label, children, intensity = 1, sweep = true, bg = SCENE_BG }) => (
  <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
    {children}
    <ScanlineOverlay intensity={intensity} sweep={sweep} />
    <HUDFrame label={label} />
  </AbsoluteFill>
);
