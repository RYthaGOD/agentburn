/**
 * Direct script to close all AI bot positions
 * - Scans wallet on-chain for all tokens
 * - Sells each token to SOL
 * - Cleans up database
 * - Resets bot state
 */

import { storage } from "./storage";
import { decrypt } from "./crypto";
import { getAllTokenAccounts } from "./solana";
import { sellTokenWithFallback } from "./jupiter";

async function closeAllPositions(ownerWalletAddress: string) {
  console.log(`\n=== CLOSING ALL POSITIONS FOR ${ownerWalletAddress} ===\n`);

  // Get bot config
  const config = await storage.getAIBotConfig(ownerWalletAddress);
  if (!config || !config.treasuryKeyCiphertext || !config.treasuryKeyIv || !config.treasuryKeyAuthTag) {
    throw new Error("AI bot config or treasury key not found");
  }

  // Decrypt treasury key
  const treasuryKeyBase58 = decrypt(
    config.treasuryKeyCiphertext,
    config.treasuryKeyIv,
    config.treasuryKeyAuthTag
  );

  // Get treasury wallet address from config
  const { loadKeypairFromPrivateKey } = await import("./solana-sdk");
  const treasuryKeypair = loadKeypairFromPrivateKey(treasuryKeyBase58);
  const treasuryWallet = treasuryKeypair.publicKey.toString();

  console.log(`📍 Treasury wallet: ${treasuryWallet}`);
  console.log(`\n🔍 Scanning on-chain wallet for all tokens...\n`);

  // Get ALL token accounts from on-chain wallet
  const tokenAccounts = await getAllTokenAccounts(treasuryWallet);
  console.log(`Found ${tokenAccounts.length} token accounts on-chain`);

  if (tokenAccounts.length === 0) {
    console.log("\n✅ No tokens found in wallet - nothing to sell\n");
  }

  const results = [];
  const errors = [];

  // Sell each token
  for (const account of tokenAccounts) {
    try {
      const parsed = account.account.data.parsed;
      const tokenMint = parsed.info.mint;
      const tokenAmount = parsed.info.tokenAmount.amount;
      const uiAmount = parsed.info.tokenAmount.uiAmount;
      const decimals = parsed.info.tokenAmount.decimals;

      // Skip if zero balance
      if (uiAmount === 0 || parseInt(tokenAmount) === 0) {
        console.log(`⏭️  Skipping ${tokenMint.slice(0, 8)}... (zero balance)`);
        continue;
      }

      console.log(`\n💰 Selling token: ${tokenMint.slice(0, 8)}...`);
      console.log(`   Amount: ${uiAmount} tokens (${tokenAmount} raw)`);

      // Sell with 5% slippage
      const sellResult = await sellTokenWithFallback(
        treasuryKeyBase58,
        tokenMint,
        parseInt(tokenAmount),
        500 // 5% slippage
      );

      if (sellResult.success && sellResult.signature) {
        console.log(`   ✅ SOLD: ${sellResult.signature}`);
        results.push({
          tokenMint: tokenMint.slice(0, 8),
          amount: uiAmount,
          success: true,
          signature: sellResult.signature
        });
      } else {
        console.error(`   ❌ FAILED: ${sellResult.error}`);
        errors.push({
          tokenMint: tokenMint.slice(0, 8),
          error: sellResult.error || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error(`   ❌ ERROR: ${error.message}`);
      errors.push({
        tokenMint: "unknown",
        error: error.message
      });
    }
  }

  // Clean up database positions
  console.log(`\n🧹 Cleaning up database...`);
  const dbPositions = await storage.getAIBotPositions(ownerWalletAddress);
  for (const position of dbPositions) {
    await storage.deleteAIBotPosition(position.id);
  }
  console.log(`   Removed ${dbPositions.length} database positions`);

  // Reset bot state
  console.log(`\n♻️  Resetting bot state...`);
  await storage.createOrUpdateAIBotConfig({
    ownerWalletAddress,
    portfolioPeakSOL: "0",
    budgetUsed: "0",
  });

  console.log(`\n=== SUMMARY ===`);
  console.log(`✅ Positions sold: ${results.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`🗑️  Database positions removed: ${dbPositions.length}`);
  
  if (results.length > 0) {
    console.log(`\nSuccessful sales:`);
    results.forEach(r => console.log(`  - ${r.tokenMint}: ${r.amount} tokens (tx: ${r.signature?.slice(0, 8)}...)`));
  }
  
  if (errors.length > 0) {
    console.log(`\nErrors:`);
    errors.forEach(e => console.log(`  - ${e.tokenMint}: ${e.error}`));
  }

  console.log(`\n✅ ALL POSITIONS CLOSED - BOT RESET COMPLETE\n`);

  return {
    success: true,
    positionsSold: results.length,
    errors: errors.length,
    results,
    errorDetails: errors
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const ownerWallet = process.argv[2] || "4D5a61DsihdeEV2SbfkpYsZemTrrczxAwyBfR47xF5uS";
  closeAllPositions(ownerWallet)
    .then(result => {
      console.log("\n✅ Script completed successfully");
      process.exit(0);
    })
    .catch(error => {
      console.error("\n❌ Script failed:", error);
      process.exit(1);
    });
}

export { closeAllPositions };
