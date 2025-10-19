/**
 * Wallet signature utilities for authenticating key management operations
 * 
 * TODO: This module needs to be integrated with Solana Wallet Adapter
 * before production deployment. Current implementation is a placeholder.
 * 
 * Required steps for production:
 * 1. Install @solana/wallet-adapter-react and related packages
 * 2. Set up WalletProvider in App.tsx
 * 3. Implement signMessage using wallet.signMessage()
 * 4. Replace placeholder WalletButton with actual wallet connection UI
 */

import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

export interface SignatureResult {
  signature: string;
  message: string;
  publicKey: string;
}

/**
 * DEVELOPMENT MODE: Uses simulated wallet signatures for testing
 * PRODUCTION: Replace with real Solana Wallet Adapter implementation
 * 
 * In production, this should:
 * 1. Check if wallet is connected via useWallet() hook
 * 2. Call wallet.signMessage(encodedMessage)
 * 3. Return base58-encoded signature
 */
export async function signMessageWithWallet(message: string): Promise<SignatureResult> {
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  if (isProduction) {
    // In production, wallet adapter MUST be integrated
    throw new Error(
      "Wallet signature required: Solana Wallet Adapter not integrated. " +
      "See client/src/lib/wallet-signature.ts and WALLET_INTEGRATION_GUIDE.md"
    );
  }
  
  // DEVELOPMENT MODE: Generate test signature
  console.warn(
    "⚠️  DEVELOPMENT MODE: Using simulated wallet signature.\n" +
    "This is NOT SECURE for production. Integrate Solana Wallet Adapter before deploying.\n" +
    "See WALLET_INTEGRATION_GUIDE.md for instructions."
  );
  
  // Use a development test keypair (stored in localStorage for consistency)
  let devWalletAddress = localStorage.getItem('dev_wallet_address');
  let devPrivateKey = localStorage.getItem('dev_wallet_private_key');
  
  if (!devWalletAddress || !devPrivateKey) {
    // Generate new development keypair
    const keypair = nacl.sign.keyPair();
    const publicKey = new PublicKey(keypair.publicKey);
    devWalletAddress = publicKey.toBase58();
    devPrivateKey = bs58.encode(keypair.secretKey);
    
    localStorage.setItem('dev_wallet_address', devWalletAddress);
    localStorage.setItem('dev_wallet_private_key', devPrivateKey);
    
    console.log(`📝 Generated development wallet: ${devWalletAddress}`);
    console.log("Use this address when creating projects for testing");
  }
  
  // Sign the message with development keypair
  const secretKey = bs58.decode(devPrivateKey);
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  
  return {
    signature: bs58.encode(signature),
    message,
    publicKey: devWalletAddress,
  };
}

/**
 * Helper to verify a signature locally (optional, backend also verifies)
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Format message for wallet signing
 */
export function createSignatureMessage(action: string, projectId: string): string {
  return `${action} for project ${projectId} at ${Date.now()}`;
}
