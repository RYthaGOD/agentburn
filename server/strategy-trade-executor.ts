// Strategy Trade Executor - Handles execution of multi-strategy trades
// Simplified version of executeQuickTrade for strategy-specific positions

import type { StrategySignal } from "./multi-strategy";
import type { TokenMarketData } from "./grok-analysis";

export async function executeStrategyTrade(
  config: any,
  token: TokenMarketData,
  strategySignal: StrategySignal,
  botState: any,
  existingPositions: any[]
) {
  try {
    // Import required functions
    const { decrypt } = await import("./crypto");
    const { loadKeypairFromPrivateKey } = await import("./solana-sdk");
    const { getWalletBalance } = await import("./solana");
    const { buyTokenWithFallback } = await import("./jupiter");
    const { storage } = await import("./storage");
    const { analyzePortfolio, isTradingAllowed } = await import("./ai-bot-scheduler");
    const { deductPlatformFee } = await import("./transaction-fee");
    const { logActivity } = await import("./activity-logger");
    
    // Get treasury key
    if (!config.treasuryKeyCiphertext || !config.treasuryKeyIv || !config.treasuryKeyAuthTag) {
      console.log(`[Multi-Strategy] No treasury key configured for ${config.ownerWalletAddress.slice(0, 8)}...`);
      return;
    }
    
    const treasuryKeyBase58 = decrypt(
      config.treasuryKeyCiphertext,
      config.treasuryKeyIv,
      config.treasuryKeyAuthTag
    );
    
    const treasuryKeypair = loadKeypairFromPrivateKey(treasuryKeyBase58);
    const treasuryPublicKey = treasuryKeypair.publicKey.toString();
    
    // Check wallet balance and portfolio
    let actualBalance = await getWalletBalance(treasuryPublicKey);
    const portfolio = await analyzePortfolio(treasuryPublicKey, actualBalance);
    
    console.log(`[Multi-Strategy] 💼 Portfolio: ${portfolio.totalValueSOL.toFixed(4)} SOL total, ${portfolio.holdingCount} positions`);
    
    // Check if trading is allowed (drawdown protection, etc.)
    const tradingCheck = await isTradingAllowed(config.ownerWalletAddress, portfolio.totalValueSOL, config);
    if (!tradingCheck.allowed) {
      console.log(`[Multi-Strategy] 🛑 SKIP ${token.symbol}: ${tradingCheck.reason}`);
      return;
    }
    
    // Calculate trade amount based on strategy position size percent
    const FEE_BUFFER = Math.max(0.03, portfolio.totalValueSOL * 0.05);
    const availableBalance = Math.max(0, actualBalance - FEE_BUFFER);
    
    // Calculate position size from portfolio percentage
    const positionSizeDecimal = strategySignal.positionSizePercent / 100;
    let tradeAmount = portfolio.totalValueSOL * positionSizeDecimal;
    
    // Enforce maximum position size
    const maxPositionSize = availableBalance * 0.15; // Max 15% of available balance per trade
    tradeAmount = Math.min(tradeAmount, maxPositionSize);
    
    // Minimum trade size check
    if (tradeAmount < 0.01) {
      console.log(`[Multi-Strategy] ⏭️ ${token.symbol}: Trade amount ${tradeAmount.toFixed(4)} SOL too small (min 0.01 SOL)`);
      return;
    }
    
    console.log(`[Multi-Strategy] 💰 Trade size: ${tradeAmount.toFixed(4)} SOL (${strategySignal.positionSizePercent}% of ${portfolio.totalValueSOL.toFixed(4)} SOL portfolio)`);
    
    // Deduct platform fee (1% of trade amount, unless exempt)
    const { amountAfterFee, platformFee, feeTxSignature } = await deductPlatformFee(
      tradeAmount,
      config.ownerWalletAddress,
      treasuryKeypair
    );
    
    console.log(`[Multi-Strategy] 💸 Platform fee: ${platformFee.toFixed(4)} SOL (${(platformFee / tradeAmount * 100).toFixed(1)}%)`);
    console.log(`[Multi-Strategy] 📊 Net trade amount: ${amountAfterFee.toFixed(4)} SOL`);
    
    // Execute trade
    console.log(`[Multi-Strategy] 🔄 Executing ${strategySignal.strategy} trade: ${token.symbol}...`);
    
    const result = await buyTokenWithFallback(
      token.mint,
      amountAfterFee,
      treasuryKeypair,
      3 // 3% slippage for buys
    );
    
    if (result.success && result.signature) {
      const tokensReceived = result.tokensReceived ?? 0;
      const actualPrice = amountAfterFee / tokensReceived;
      
      console.log(`[Multi-Strategy] ✅ Trade successful: ${tokensReceived.toFixed(2)} tokens @ ${actualPrice.toFixed(9)} SOL`);
      
      // Record position with strategy metadata
      await storage.createAIBotPosition({
        ownerWalletAddress: config.ownerWalletAddress,
        tokenMint: token.mint,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        tokenDecimals: token.decimals ?? 6,
        entryPriceSOL: actualPrice.toString(),
        amountSOL: amountAfterFee.toString(),
        tokenAmount: tokensReceived.toString(),
        buyTxSignature: result.signature,
        aiConfidenceAtBuy: strategySignal.confidence,
        strategyType: strategySignal.strategy,
        strategyProfitTarget: strategySignal.profitTarget.toString(),
        strategyStopLoss: strategySignal.stopLoss.toString(),
      });
      
      // Update bot state
      botState.activePositions.set(token.mint, {
        mint: token.mint,
        entryPriceSOL: actualPrice,
        amountSOL: amountAfterFee,
      });
      
      // Update performance metrics
      const strategyField = strategySignal.strategy === "MEAN_REVERSION" ? "meanReversionTradeCount" :
                           strategySignal.strategy === "MOMENTUM_BREAKOUT" ? "momentumBreakoutTradeCount" :
                           "gridTradingTradeCount";
      
      await storage.updateAIBotConfig(config.ownerWalletAddress, {
        [strategyField]: (config[strategyField] ?? 0) + 1,
        totalTrades: (config.totalTrades ?? 0) + 1,
      });
      
      logActivity('multi_strategy', 'success', `✅ ${strategySignal.strategy}: Bought ${token.symbol} - ${tradeAmount.toFixed(4)} SOL`);
      
      console.log(`[Multi-Strategy] ✅ ${strategySignal.strategy} position opened: ${token.symbol}`);
      console.log(`[Multi-Strategy] 🎯 Targets: +${strategySignal.profitTarget}% profit, -${strategySignal.stopLoss}% stop loss`);
    } else {
      console.error(`[Multi-Strategy] ❌ Trade failed for ${token.symbol}:`, result.error);
    }
  } catch (error) {
    console.error(`[Multi-Strategy] Error executing strategy trade:`, error);
  }
}
