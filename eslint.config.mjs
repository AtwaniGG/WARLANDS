import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Test files parse dynamic JSON/WS payloads — `any` is appropriate there.
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Remotion sub-project — own tsconfig/eslint/node_modules.
    "video/**",
    // Claude config + stale git worktrees (duplicate source copies).
    ".claude/**",
    // Documentation + generated design-system bundles (not app source).
    "docs/**",
  ]),
]);

export default eslintConfig;
