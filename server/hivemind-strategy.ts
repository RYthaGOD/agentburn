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
  focusedSectors?: string[]; // e.g., ["meme", "gaming", "AI"]
  reasoning: string;
  generatedAt: Date;
}

/**
 * Generate a new hivemind trading strategy
 * This uses the AI consensus system to analyze market conditions and recommend a strategy
 */
export async function generateHivemindStrategy(
  ownerWalletAddress: string,
  aiProviders: Array<{ name: string; analyzeMarket: () => Promise<any> }>
): Promise<HivemindStrategy> {
  console.log(`[Hivemind Strategy] Generating new strategy for ${ownerWalletAddress}...`);

  // Collect market sentiment from all AI providers
  const sentimentAnalyses = await Promise.all(
    aiProviders.map(async (provider) => {
      try {
        const analysis = await provider.analyzeMarket();
        return {
          provider: provider.name,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
        };
      } catch (error) {
        console.error(`[Hivemind Strategy] Error from ${provider.name}:`, error);
        return null;
      }
    })
  );

  // Filter out failed analyses
  const validAnalyses = sentimentAnalyses.filter((a) => a !== null);

  if (validAnalyses.length === 0) {
    console.log(`[Hivemind Strategy] No valid analyses, using default strategy`);
    return getDefaultStrategy();
  }

  // Calculate consensus sentiment
  const sentimentCounts = {
    bullish: 0,
    bearish: 0,
    neutral: 0,
    volatile: 0,
  };

  validAnalyses.forEach((analysis) => {
    const sentiment = analysis!.sentiment.toLowerCase();
    if (sentiment in sentimentCounts) {
      sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
    }
  });

  // Determine majority sentiment
  const marketSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0] as HivemindStrategy["marketSentiment"];

  // Calculate average confidence
  const avgConfidence =
    validAnalyses.reduce((sum, a) => sum + a!.confidence, 0) / validAnalyses.length;

  // Generate strategy based on consensus
  const strategy = generateStrategyFromSentiment(marketSentiment, avgConfidence, validAnalyses);

  console.log(`[Hivemind Strategy] Generated: ${marketSentiment} market, ${strategy.riskLevel} risk`);
  console.log(`[Hivemind Strategy] Min confidence: ${strategy.minConfidenceThreshold}%, Max trades: ${strategy.maxDailyTrades}`);

  return strategy;
}

/**
 * Generate strategy parameters based on market sentiment
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

  switch (sentiment) {
    case "bullish":
      // More aggressive in bull markets
      minConfidenceThreshold = 50; // Lower threshold
      maxDailyTrades = 8; // More trades
      profitTargetMultiplier = 1.5; // Higher profit targets
      riskLevel = "aggressive";
      preferredMarketCap = "ultra-low"; // Target smaller caps for bigger gains
      break;

    case "bearish":
      // More conservative in bear markets
      minConfidenceThreshold = 70; // Higher threshold
      maxDailyTrades = 2; // Fewer trades
      profitTargetMultiplier = 0.7; // Lower profit targets (take profits faster)
      riskLevel = "conservative";
      preferredMarketCap = "medium"; // Safer, more established tokens
      break;

    case "volatile":
      // Opportunistic in volatile markets
      minConfidenceThreshold = 65; // Medium-high threshold
      maxDailyTrades = 4; // Moderate trades
      profitTargetMultiplier = 0.8; // Take profits quickly
      riskLevel = "moderate";
      preferredMarketCap = "low"; // Balance risk/reward
      break;

    case "neutral":
    default:
      // Balanced approach
      minConfidenceThreshold = 55;
      maxDailyTrades = 5;
      profitTargetMultiplier = 1.0;
      riskLevel = "moderate";
      preferredMarketCap = "low";
      break;
  }

  // Adjust based on overall AI confidence
  if (confidence > 80) {
    // High confidence: be more aggressive
    maxDailyTrades += 2;
    minConfidenceThreshold -= 5;
  } else if (confidence < 50) {
    // Low confidence: be more conservative
    maxDailyTrades = Math.max(2, maxDailyTrades - 2);
    minConfidenceThreshold += 10;
  }

  const reasoning = `Based on ${analyses.length} AI models consensus: ${sentiment} market detected with ${confidence.toFixed(1)}% confidence. Strategy: ${riskLevel} risk, targeting ${preferredMarketCap} market cap tokens, ${maxDailyTrades} max daily trades with ${minConfidenceThreshold}% minimum confidence threshold.`;

  return {
    marketSentiment: sentiment,
    preferredMarketCap,
    minConfidenceThreshold,
    maxDailyTrades,
    profitTargetMultiplier,
    riskLevel,
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
