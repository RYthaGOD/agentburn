import { storage } from "./storage";

/**
 * Hivemind Strategy Generator
 * 
 * Uses AI consensus to generate tailored trading strategies based on market conditions.
 * Strategies are stored and applied dynamically between deep scans.
 */

export interface HivemindStrategy {
  marketSentiment: "bullish" | "bearish" | "neutral" | "volatile";
  preferredMarketCap: string; // "ultra-low" | "low" | "medium"
  minConfidenceThreshold: number; // 0-100
  maxDailyTrades: number;
  profitTargetMultiplier: number; // Multiplier for profit targets
  riskLevel: "conservative" | "moderate" | "aggressive";
  
  // All trading parameters controlled by hivemind
  budgetPerTrade: number; // Base SOL amount per trade
  minVolumeUSD: number; // Minimum 24h volume
  minLiquidityUSD: number; // Minimum liquidity
  minOrganicScore: number; // 0-100 organic volume score
  minQualityScore: number; // 0-100 quality score
  minTransactions24h: number; // Minimum transaction count
  minPotentialPercent: number; // Minimum upside %
  
  focusedSectors?: string[]; // e.g., ["meme", "gaming", "AI"]
  reasoning: string;
  generatedAt: Date;
}

/**
 * Generate a new hivemind trading strategy
 * Analyzes recent trading performance to adapt strategy parameters
 */
export async function generateHivemindStrategy(
  ownerWalletAddress: string,
  recentPerformance?: {
    winRate: number; // 0-100
    avgProfit: number; // Average profit %
    totalTrades: number;
  }
): Promise<HivemindStrategy> {
  console.log(`[Hivemind Strategy] Generating new strategy for ${ownerWalletAddress}...`);

  // Determine market sentiment based on recent performance
  let marketSentiment: HivemindStrategy["marketSentiment"] = "neutral";
  let confidence = 60;

  if (recentPerformance && recentPerformance.totalTrades >= 5) {
    const winRate = recentPerformance.winRate;
    const avgProfit = recentPerformance.avgProfit;

    if (winRate > 60 && avgProfit > 20) {
      marketSentiment = "bullish";
      confidence = 75;
    } else if (winRate < 40 || avgProfit < 0) {
      marketSentiment = "bearish";
      confidence = 70;
    } else if (Math.abs(avgProfit) > 30) {
      marketSentiment = "volatile";
      confidence = 65;
    } else {
      marketSentiment = "neutral";
      confidence = 60;
    }

    console.log(`[Hivemind Strategy] Recent performance: ${winRate.toFixed(1)}% win rate, ${avgProfit.toFixed(1)}% avg profit`);
  } else {
    console.log(`[Hivemind Strategy] Insufficient trading history, using default strategy`);
  }

  // Generate strategy based on market sentiment
  const strategy = generateStrategyFromSentiment(marketSentiment, confidence, []);

  console.log(`[Hivemind Strategy] Generated: ${marketSentiment} market, ${strategy.riskLevel} risk`);
  console.log(`[Hivemind Strategy] Min confidence: ${strategy.minConfidenceThreshold}%, Profit multiplier: ${strategy.profitTargetMultiplier}x`);

  return strategy;
}

/**
 * Generate strategy parameters based on market sentiment
 * Hivemind controls ALL trading parameters
 */
function generateStrategyFromSentiment(
  sentiment: HivemindStrategy["marketSentiment"],
  confidence: number,
  analyses: any[]
): HivemindStrategy {
  let minConfidenceThreshold = 55;
  let maxDailyTrades = 5;
  let profitTargetMultiplier = 1.0;
  let riskLevel: HivemindStrategy["riskLevel"] = "moderate";
  let preferredMarketCap = "low";
  
  // Hivemind-controlled parameters
  let budgetPerTrade = 0.05; // Base SOL amount
  let minVolumeUSD = 10000;
  let minLiquidityUSD = 5000;
  let minOrganicScore = 40;
  let minQualityScore = 30;
  let minTransactions24h = 20;
  let minPotentialPercent = 30;

  switch (sentiment) {
    case "bullish":
      // Aggressive in bull markets - chase momentum
      minConfidenceThreshold = 45; // Very low threshold
      maxDailyTrades = 10; // Many trades
      profitTargetMultiplier = 1.8; // Very high profit targets
      riskLevel = "aggressive";
      preferredMarketCap = "ultra-low"; // Target tiny caps
      
      budgetPerTrade = 0.08; // Larger trades
      minVolumeUSD = 5000; // Lower volume OK (catch early movers)
      minLiquidityUSD = 3000; // Lower liquidity OK
      minOrganicScore = 30; // More lenient
      minQualityScore = 20; // More lenient
      minTransactions24h = 15; // Lower activity OK
      minPotentialPercent = 50; // Only huge upside
      break;

    case "bearish":
      // Very conservative in bear markets - capital preservation
      minConfidenceThreshold = 75; // Very high threshold
      maxDailyTrades = 2; // Very few trades
      profitTargetMultiplier = 0.5; // Take profits fast
      riskLevel = "conservative";
      preferredMarketCap = "medium"; // Safer tokens
      
      budgetPerTrade = 0.03; // Smaller trades
      minVolumeUSD = 50000; // High volume required
      minLiquidityUSD = 20000; // High liquidity required
      minOrganicScore = 60; // Very strict
      minQualityScore = 50; // Very strict
      minTransactions24h = 50; // High activity required
      minPotentialPercent = 20; // Lower targets, quick exits
      break;

    case "volatile":
      // Opportunistic in volatile markets - quick in/out
      minConfidenceThreshold = 60; // Medium-high threshold
      maxDailyTrades = 6; // Moderate trades
      profitTargetMultiplier = 0.7; // Quick profits
      riskLevel = "moderate";
      preferredMarketCap = "low";
      
      budgetPerTrade = 0.04; // Medium trades
      minVolumeUSD = 15000; // Medium volume
      minLiquidityUSD = 8000; // Medium liquidity
      minOrganicScore = 45; // Medium strictness
      minQualityScore = 35; // Medium strictness
      minTransactions24h = 25; // Medium activity
      minPotentialPercent = 35; // Medium targets
      break;

    case "neutral":
    default:
      // Balanced approach
      minConfidenceThreshold = 55;
      maxDailyTrades = 5;
      profitTargetMultiplier = 1.0;
      riskLevel = "moderate";
      preferredMarketCap = "low";
      
      budgetPerTrade = 0.05;
      minVolumeUSD = 10000;
      minLiquidityUSD = 5000;
      minOrganicScore = 40;
      minQualityScore = 30;
      minTransactions24h = 20;
      minPotentialPercent = 30;
      break;
  }

  // Adjust based on overall AI confidence
  if (confidence > 80) {
    // High confidence: be more aggressive
    maxDailyTrades += 2;
    minConfidenceThreshold -= 5;
    budgetPerTrade *= 1.2; // 20% larger trades
    minPotentialPercent += 10; // Higher targets
  } else if (confidence < 50) {
    // Low confidence: be more conservative
    maxDailyTrades = Math.max(2, maxDailyTrades - 2);
    minConfidenceThreshold += 10;
    budgetPerTrade *= 0.8; // 20% smaller trades
    minPotentialPercent -= 5; // Lower targets
  }

  const reasoning = `Hivemind full control: ${sentiment} market (${confidence.toFixed(1)}% confidence). ${riskLevel} risk, ${preferredMarketCap} cap focus, ${maxDailyTrades} max trades/day, ${minConfidenceThreshold}% min confidence, ${budgetPerTrade.toFixed(3)} SOL/trade, ${minPotentialPercent}% min upside.`;

  return {
    marketSentiment: sentiment,
    preferredMarketCap,
    minConfidenceThreshold,
    maxDailyTrades,
    profitTargetMultiplier,
    riskLevel,
    budgetPerTrade,
    minVolumeUSD,
    minLiquidityUSD,
    minOrganicScore,
    minQualityScore,
    minTransactions24h,
    minPotentialPercent,
    reasoning,
    generatedAt: new Date(),
  };
}

/**
 * Get default strategy when AI analysis fails
 */
function getDefaultStrategy(): HivemindStrategy {
  return {
    marketSentiment: "neutral",
    preferredMarketCap: "low",
    minConfidenceThreshold: 55,
    maxDailyTrades: 5,
    profitTargetMultiplier: 1.0,
    riskLevel: "moderate",
    budgetPerTrade: 0.05,
    minVolumeUSD: 10000,
    minLiquidityUSD: 5000,
    minOrganicScore: 40,
    minQualityScore: 30,
    minTransactions24h: 20,
    minPotentialPercent: 30,
    reasoning: "Default strategy - AI market analysis unavailable",
    generatedAt: new Date(),
  };
}

/**
 * Save hivemind strategy to database
 */
export async function saveHivemindStrategy(
  ownerWalletAddress: string,
  strategy: HivemindStrategy
): Promise<void> {
  // Convert strategy object to match database schema
  const marketCondition = strategy.marketSentiment; // Map marketSentiment -> marketCondition
  const marketConfidence = Math.round((strategy.minConfidenceThreshold / 100) * 100); // Convert to 0-100
  
  // Calculate validUntil (6 hours from now)
  const validUntil = new Date(Date.now() + 6 * 60 * 60 * 1000);
  
  await storage.createHivemindStrategy({
    ownerWalletAddress,
    marketCondition,
    marketConfidence,
    reasoning: strategy.reasoning,
    recommendedRiskTolerance: strategy.riskLevel,
    recommendedMinConfidence: strategy.minConfidenceThreshold,
    recommendedMinPotential: strategy.profitTargetMultiplier.toString(),
    recommendedMaxMarketCap: strategy.preferredMarketCap === "ultra-low" ? "100000" : strategy.preferredMarketCap === "low" ? "1000000" : "10000000",
    recommendedMinLiquidity: "10000", // $10k minimum
    recommendedTradeMultiplier: "1.0",
    focusCategories: JSON.stringify(strategy.focusedSectors || []),
    validUntil,
    isActive: true,
  });
}

/**
 * Get the latest hivemind strategy for a wallet
 */
export async function getLatestStrategy(
  ownerWalletAddress: string
): Promise<HivemindStrategy | null> {
  const strategies = await storage.getHivemindStrategies(ownerWalletAddress);
  
  if (strategies.length === 0) {
    return null;
  }

  // Return the most recent active strategy
  const latest = strategies.find(s => s.isActive && s.validUntil && s.validUntil > new Date());
  
  if (!latest) {
    return null;
  }

  // Map database fields back to our strategy interface
  const marketCap = parseInt(latest.recommendedMaxMarketCap || "1000000");
  const preferredMarketCap = marketCap < 200000 ? "ultra-low" : marketCap < 2000000 ? "low" : "medium";

  return {
    marketSentiment: (latest.marketCondition || "neutral") as HivemindStrategy["marketSentiment"],
    preferredMarketCap,
    minConfidenceThreshold: latest.recommendedMinConfidence || 55,
    maxDailyTrades: 5, // Not stored in DB, use default
    profitTargetMultiplier: parseFloat(latest.recommendedMinPotential || "1.0"),
    riskLevel: (latest.recommendedRiskTolerance || "moderate") as HivemindStrategy["riskLevel"],
    
    // Extract trading parameters (stored in DB or use defaults)
    budgetPerTrade: parseFloat(latest.recommendedTradeMultiplier || "0.05"),
    minVolumeUSD: parseFloat(latest.recommendedMinLiquidity || "10000"),
    minLiquidityUSD: parseFloat(latest.recommendedMinLiquidity || "5000"),
    minOrganicScore: 40, // Default
    minQualityScore: 30, // Default
    minTransactions24h: 20, // Default
    minPotentialPercent: parseFloat(latest.recommendedMinPotential || "30"),
    
    focusedSectors: latest.focusCategories ? JSON.parse(latest.focusCategories) : [],
    reasoning: latest.reasoning || "No reasoning provided",
    generatedAt: latest.createdAt,
  };
}

/**
 * Check if we should generate a new strategy
 * Returns true if:
 * - No strategy exists
 * - Current strategy is > 6 hours old
 * - Market conditions have changed significantly
 */
export async function shouldGenerateNewStrategy(
  ownerWalletAddress: string
): Promise<boolean> {
  const currentStrategy = await getLatestStrategy(ownerWalletAddress);

  if (!currentStrategy) {
    return true; // No strategy exists
  }

  const hoursOld = (Date.now() - currentStrategy.generatedAt.getTime()) / (1000 * 60 * 60);

  if (hoursOld > 6) {
    console.log(`[Hivemind Strategy] Current strategy is ${hoursOld.toFixed(1)} hours old, regenerating...`);
    return true; // Strategy is stale
  }

  return false; // Current strategy is still fresh
}
