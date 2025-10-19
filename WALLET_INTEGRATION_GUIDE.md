# Solana Wallet Integration Guide

## Overview

BurnBot requires Solana Wallet Adapter integration for secure key management and wallet authentication. This guide explains how to complete the integration before production deployment.

## Current Status

✅ **Completed:**
- Backend wallet signature verification (using tweetnacl)
- Encrypted key storage with AES-256-GCM
- Secure API endpoints with replay attack prevention
- UI components for key management

⚠️ **Required for Production:**
- Solana Wallet Adapter integration in frontend
- Real wallet connection and signature generation
- Replace placeholder WalletButton component

## Integration Steps

### 1. Install Solana Wallet Adapter Packages

```bash
npm install @solana/wallet-adapter-react \
            @solana/wallet-adapter-react-ui \
            @solana/wallet-adapter-wallets \
            @solana/wallet-adapter-base
```

### 2. Set Up Wallet Provider

Update `client/src/App.tsx`:

```typescript
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  // Configure network (mainnet-beta for production)
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {/* Your existing app content */}
              <Router />
              <Toaster />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
```

### 3. Replace WalletButton Component

Update `client/src/components/wallet-button.tsx`:

```typescript
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton() {
  return <WalletMultiButton data-testid="wallet-button" />;
}
```

### 4. Implement Wallet Signature Function

Update `client/src/lib/wallet-signature.ts` with real implementation:

```typescript
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

export async function signMessageWithWallet(
  wallet: ReturnType<typeof useWallet>,
  message: string
): Promise<SignatureResult> {
  if (!wallet.connected || !wallet.publicKey || !wallet.signMessage) {
    throw new Error('Wallet not connected or does not support message signing');
  }

  try {
    // Encode message
    const encodedMessage = new TextEncoder().encode(message);
    
    // Sign with wallet
    const signature = await wallet.signMessage(encodedMessage);
    
    return {
      signature: bs58.encode(signature),
      message,
      publicKey: wallet.publicKey.toBase58(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'WalletSignMessageError') {
      throw new Error('User rejected signature request');
    }
    throw error;
  }
}
```

### 5. Update Settings Page to Use Real Wallet

Update the Settings page mutations to use the wallet hook:

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

export default function Settings() {
  const wallet = useWallet();
  
  // ... existing code ...
  
  const saveKeysMutation = useMutation({
    mutationFn: async ({ projectId, keys }) => {
      if (!wallet.connected) {
        throw new Error('Please connect your wallet first');
      }
      
      const message = createSignatureMessage("Set keys", projectId);
      const signatureResult = await signMessageWithWallet(wallet, message);
      
      // ... rest of the mutation
    },
  });
  
  // ... rest of component
}
```

## Security Checklist

Before deploying to production, verify:

- [ ] Wallet adapter is properly configured for mainnet
- [ ] All supported wallets are tested and working
- [ ] Signature generation and verification work end-to-end
- [ ] Master encryption key (`ENCRYPTION_MASTER_KEY`) is set in production environment
- [ ] No placeholder or test signatures remain in the codebase
- [ ] Error handling provides clear user feedback without exposing sensitive data
- [ ] All wallet-related UI states (connecting, connected, disconnected) are handled
- [ ] Users cannot submit forms without a connected wallet
- [ ] Signature expiration (5 minutes) is enforced correctly

## Environment Variables

Set these in production:

```bash
# Required: 32-byte (64 hex chars) master key for AES-256-GCM encryption
ENCRYPTION_MASTER_KEY=your-64-character-hex-key

# Example generation:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing

Test the complete flow:

1. Connect wallet in UI
2. Select a project in Settings
3. Enter private keys (use test wallets on devnet first!)
4. Click "Save Keys Securely"
5. Sign the message in wallet popup
6. Verify keys are saved and status shows "Configured"
7. Test that automated buyback can decrypt and use keys
8. Delete keys and verify they're removed

## Files to Update

- `client/src/App.tsx` - Add wallet providers
- `client/src/components/wallet-button.tsx` - Replace with WalletMultiButton
- `client/src/lib/wallet-signature.ts` - Implement real signing
- `client/src/pages/settings.tsx` - Use wallet hook
- `client/src/pages/new-project.tsx` - Use wallet for owner address

## Support

For issues or questions:
- Solana Wallet Adapter docs: https://github.com/solana-labs/wallet-adapter
- Phantom wallet docs: https://docs.phantom.app/
- Solana Web3.js docs: https://solana-labs.github.io/solana-web3.js/
