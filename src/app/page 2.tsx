import { Web3Provider } from "@/web3/Web3Provider";
import { GameShell } from "@/components/GameShell";

export default function Home() {
  return (
    <Web3Provider>
      <GameShell />
    </Web3Provider>
  );
}
