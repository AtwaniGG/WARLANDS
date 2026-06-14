import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this app (multiple lockfiles exist on the machine).
    root: path.join(__dirname),
  },
};

export default nextConfig;
