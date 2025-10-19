// Solana SDK integration for transaction signing and execution
// This module handles all blockchain writes: swaps, transfers, and burns

import {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";

// Solana RPC endpoint
const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");

/**
 * Load a keypair from a base58-encoded private key
 */
export function loadKeypairFromPrivateKey(privateKeyBase58: string): Keypair {
  try {
    const privateKeyBytes = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error(`Invalid private key format: ${error}`);
  }
}

/**
 * Sign and send a versioned transaction (used by Jupiter Ultra and PumpFun)
 */
export async function signAndSendVersionedTransaction(
  transactionBase64: string,
  signerKeypair: Keypair,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed"
): Promise<string> {
  try {
    // Deserialize the transaction
    const transactionBuffer = Buffer.from(transactionBase64, "base64");
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Sign the transaction
    transaction.sign([signerKeypair]);

    // Send and confirm the transaction
    const signature = await connection.sendTransaction(transaction, {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, commitment);

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log(`Transaction confirmed: ${signature}`);
    return signature;
  } catch (error) {
    console.error("Error signing and sending transaction:", error);
    throw error;
  }
}

/**
 * Sign and send a legacy transaction
 */
export async function signAndSendTransaction(
  transaction: Transaction,
  signerKeypair: Keypair,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed"
): Promise<string> {
  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [signerKeypair],
      {
        commitment,
        skipPreflight: false,
      }
    );

    console.log(`Transaction confirmed: ${signature}`);
    return signature;
  } catch (error) {
    console.error("Error signing and sending transaction:", error);
    throw error;
  }
}

/**
 * Transfer SPL tokens to a destination address (e.g., incinerator)
 */
export async function transferTokens(
  tokenMintAddress: string,
  fromWalletKeypair: Keypair,
  toAddress: string,
  amount: number,
  decimals: number = 9
): Promise<string> {
  try {
    const mintPublicKey = new PublicKey(tokenMintAddress);
    const fromPublicKey = fromWalletKeypair.publicKey;
    const toPublicKey = new PublicKey(toAddress);

    // Get token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromPublicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPublicKey,
      amount * Math.pow(10, decimals), // Convert to smallest unit
      [],
      TOKEN_PROGRAM_ID
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    // Sign and send
    const signature = await signAndSendTransaction(transaction, fromWalletKeypair);

    console.log(`Token transfer completed: ${signature}`);
    return signature;
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
}

/**
 * Burn tokens by transferring them to the Solana incinerator
 */
export async function burnTokens(
  tokenMintAddress: string,
  walletKeypair: Keypair,
  amount: number,
  decimals: number = 9
): Promise<string> {
  const SOLANA_INCINERATOR = "1nc1nerator11111111111111111111111111111111";
  
  console.log(`Burning ${amount} tokens to incinerator: ${SOLANA_INCINERATOR}`);
  
  return transferTokens(
    tokenMintAddress,
    walletKeypair,
    SOLANA_INCINERATOR,
    amount,
    decimals
  );
}

/**
 * Get SOL balance for a public key
 */
export async function getSolBalance(publicKeyString: string): Promise<number> {
  try {
    const publicKey = new PublicKey(publicKeyString);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error getting SOL balance:", error);
    throw error;
  }
}

/**
 * Get token balance for a wallet
 */
export async function getTokenBalance(
  tokenMintAddress: string,
  walletAddress: string
): Promise<number> {
  try {
    const mintPublicKey = new PublicKey(tokenMintAddress);
    const walletPublicKey = new PublicKey(walletAddress);

    const tokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      walletPublicKey
    );

    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
  } catch (error) {
    console.error("Error getting token balance:", error);
    return 0; // Return 0 if account doesn't exist
  }
}

/**
 * Validate that a string is a valid Solana public key
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get connection instance (useful for advanced operations)
 */
export function getConnection(): Connection {
  return connection;
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForConfirmation(
  signature: string,
  commitment: "processed" | "confirmed" | "finalized" = "confirmed",
  timeoutMs: number = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await connection.getSignatureStatus(signature);
    
    if (status.value?.confirmationStatus === commitment || 
        status.value?.confirmationStatus === "finalized") {
      if (status.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
      }
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Transaction confirmation timeout after ${timeoutMs}ms`);
}
