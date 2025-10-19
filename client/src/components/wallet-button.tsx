import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Placeholder component for Solana wallet connection
// Will be implemented once @solana/wallet-adapter packages are installed
export function WalletButton() {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const handleConnect = () => {
    // TODO: Implement actual Solana wallet connection
    // using @solana/wallet-adapter-react once packages are installed
    setConnected(true);
    setWalletAddress("A1B2...X9Z8"); // Placeholder
  };

  const handleDisconnect = () => {
    setConnected(false);
    setWalletAddress(null);
  };

  if (connected && walletAddress) {
    return (
      <Button
        variant="outline"
        onClick={handleDisconnect}
        data-testid="button-wallet-disconnect"
        className="font-mono"
      >
        {walletAddress}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      data-testid="button-wallet-connect"
      className="bg-primary hover-elevate active-elevate-2"
    >
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
}
