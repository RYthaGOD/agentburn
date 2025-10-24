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
 * 
 * CONSERVATIVE COMPOUNDING STRATEGY:
 * - Focus on high-probability trades with smaller position sizes
 * - Only increase aggression when AI confidence is VERY HIGH (85%+)
 * - Stricter quality filters to maximize win rate
 * - Smaller trades allow for better compounding over time
 */
function generateStrategyFromSentiment(
  sentiment: HivemindStrategy["marketSentiment"],
  confidence: number,
  analyses: any[]
): HivemindStrategy {
  let minConfidenceThreshold = 68; // Conservative default
  let maxDailyTrades = 3; // Quality over quantity
  let profitTargetMultiplier = 0.8; // Take profits consistently
  let riskLevel: HivemindStrategy["riskLevel"] = "conservative";
  let preferredMarketCap = "low";
  
  // Hivemind-controlled parameters - CONSERVATIVE FOR COMPOUNDING
  let budgetPerTrade = 0.03; // Smaller trades for capital preservation
  let minVolumeUSD = 15000; // Higher volume required
  let minLiquidityUSD = 8000; // Higher liquidity required
  let minOrganicScore = 50; // Strict quality
  let minQualityScore = 40; // Strict quality
  let minTransactions24h = 30; // Active tokens only
  let minPotentialPercent = 25; // Reasonable upside

  switch (sentiment) {
    case "bullish":
      // Conservative even in bull markets - let profits compound
      minConfidenceThreshold = 65; // Still high threshold
      maxDailyTrades = 5; // Limited trades
      profitTargetMultiplier = 1.2; // Moderate profit targets
      riskLevel = "moderate"; // Not aggressive
      preferredMarketCap = "low"; // Quality tokens
      
      budgetPerTrade = 0.04; // Moderate trades
      minVolumeUSD = 10000; // Good volume
      minLiquidityUSD = 6000; // Good liquidity
      minOrganicScore = 45; // Quality focus
      minQualityScore = 35; // Quality focus
      minTransactions24h = 25; // Active required
      minPotentialPercent = 35; // Good upside
      break;

    case "bearish":
      // Very conservative in bear markets - capital preservation
      minConfidenceThreshold = 80; // Very high threshold
      maxDailyTrades = 2; // Very few trades
      profitTargetMultiplier = 0.4; // Take profits fast
      riskLevel = "conservative";
      preferredMarketCap = "medium"; // Safer tokens
      
      budgetPerTrade = 0.02; // Very small trades
      minVolumeUSD = 50000; // High volume required
      minLiquidityUSD = 25000; // High liquidity required
      minOrganicScore = 65; // Very strict
      minQualityScore = 55; // Very strict
      minTransactions24h = 60; // High activity required
      minPotentialPercent = 20; // Lower targets, quick exits
      break;

    case "volatile":
      // Conservative in volatile markets - protect capital
      minConfidenceThreshold = 72; // High threshold
      maxDailyTrades = 3; // Few trades
      profitTargetMultiplier = 0.6; // Quick profits
      riskLevel = "conservative";
      preferredMarketCap = "low";
      
      budgetPerTrade = 0.03; // Small trades
      minVolumeUSD = 20000; // High volume
      minLiquidityUSD = 10000; // High liquidity
      minOrganicScore = 55; // Strict
      minQualityScore = 45; // Strict
      minTransactions24h = 35; // Good activity
      minPotentialPercent = 30; // Moderate targets
      break;

    case "neutral":
    default:
      // Conservative by default - compounding strategy
      minConfidenceThreshold = 68;
      maxDailyTrades = 3;
      profitTargetMultiplier = 0.8;
      riskLevel = "conservative";
      preferredMarketCap = "low";
      
      budgetPerTrade = 0.03;
      minVolumeUSD = 15000;
      minLiquidityUSD = 8000;
      minOrganicScore = 50;
      minQualityScore = 40;
      minTransactions24h = 30;
      minPotentialPercent = 25;
      break;
  }

  // ONLY become aggressive when confidence is VERY HIGH (85%+)
  // This aligns with the compounding strategy
  if (confidence >= 85) {
    // VERY HIGH confidence: increase position size and frequency
    console.log(`[Hivemind Strategy] Very high confidence (${confidence}%) - increasing aggression`);
    maxDailyTrades = Math.min(8, maxDailyTrades + 3); // More trades allowed
    minConfidenceThreshold = Math.max(55, minConfidenceThreshold - 10); // Lower threshold
    budgetPerTrade *= 1.5; // 50% larger trades
    profitTargetMultiplier *= 1.3; // Higher targets
    riskLevel = sentiment === "bearish" ? "moderate" : "aggressive";
  } else if (confidence < 55) {
    // Low confidence: be even more conservative
    maxDailyTrades = Math.max(1, maxDailyTrades - 1);
    minConfidenceThreshold = Math.min(85, minConfidenceThreshold + 10);
    budgetPerTrade *= 0.7; // 30% smaller trades
    profitTargetMultiplier *= 0.8; // Lower targets
  }

  const reasoning = `CONSERVATIVE COMPOUNDING: ${sentiment} market (${confidence.toFixed(1)}% confidence). ${riskLevel} risk, ${preferredMarketCap} cap focus, ${maxDailyTrades} max trades/day, ${minConfidenceThreshold}% min confidence, ${budgetPerTrade.toFixed(3)} SOL/trade. Focus: High-probability trades with strict quality filters for consistent gains that compound over time. Only aggressive when confidence ≥85%.`;

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
 * Conservative compounding approach by default
 */
function getDefaultStrategy(): HivemindStrategy {
  return {
    marketSentiment: "neutral",
    preferredMarketCap: "low",
    minConfidenceThreshold: 68, // Conservative
    maxDailyTrades: 3, // Quality over quantity
    profitTargetMultiplier: 0.8, // Take profits consistently
    riskLevel: "conservative",
    budgetPerTrade: 0.03, // Small trades for compounding
    minVolumeUSD: 15000, // Higher volume required
    minLiquidityUSD: 8000, // Higher liquidity required
    minOrganicScore: 50, // Strict quality
    minQualityScore: 40, // Strict quality
    minTransactions24h: 30, // Active tokens only
    minPotentialPercent: 25, // Reasonable upside
    reasoning: "Default conservative compounding strategy - High-probability trades with strict quality filters",
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
    recommendedMinLiquidity: strategy.minLiquidityUSD.toString(),
    recommendedTradeMultiplier: "1.0",
    
    // All complete trading parameters
    budgetPerTrade: strategy.budgetPerTrade.toString(),
    minVolumeUSD: strategy.minVolumeUSD.toString(),
    minLiquidityUSD: strategy.minLiquidityUSD.toString(),
    minOrganicScore: strategy.minOrganicScore,
    minQualityScore: strategy.minQualityScore,
    minTransactions24h: strategy.minTransactions24h,
    minPotentialPercent: strategy.minPotentialPercent.toString(),
    maxDailyTrades: strategy.maxDailyTrades,
    profitTargetMultiplier: strategy.profitTargetMultiplier.toString(),
    
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
    maxDailyTrades: latest.maxDailyTrades || 5,
    profitTargetMultiplier: parseFloat(latest.profitTargetMultiplier || latest.recommendedMinPotential || "1.0"),
    riskLevel: (latest.recommendedRiskTolerance || "moderate") as HivemindStrategy["riskLevel"],
    
    // Extract complete trading parameters from database
    budgetPerTrade: parseFloat(latest.budgetPerTrade || "0.03"),
    minVolumeUSD: parseFloat(latest.minVolumeUSD || "15000"),
    minLiquidityUSD: parseFloat(latest.minLiquidityUSD || "8000"),
    minOrganicScore: latest.minOrganicScore || 50,
    minQualityScore: latest.minQualityScore || 40,
    minTransactions24h: latest.minTransactions24h || 30,
    minPotentialPercent: parseFloat(latest.minPotentialPercent || "25"),
    
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
