/**
 * Load brand fonts via @remotion/google-fonts so renders are deterministic
 * (no FOUT, no network race at frame time).
 */
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const oswald = loadOswald("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const inter = loadInter("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const fontFamilyDisplay = oswald.fontFamily;
export const fontFamilyUI = inter.fontFamily;

/** Awaitable so delayRender can gate on font readiness if needed. */
export const fontsReady = Promise.all([oswald.waitUntilDone(), inter.waitUntilDone()]);
