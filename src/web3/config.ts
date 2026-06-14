// wagmi + viem configuration — GDD §20 (EVM L2). Defaults to Base Sepolia testnet.
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "viem/chains";
import { injected } from "wagmi/connectors";

export const SUPPORTED_CHAINS = [baseSepolia, base] as const;
export const DEFAULT_CHAIN = baseSepolia;

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
