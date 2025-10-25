/**
 * Bundle Activity Detection System
 * Detects coordinated buy/sell activity (pump and dump schemes)
 * that often leads to losses for traders
 */

export interface BundleDetectionResult {
  isSuspicious: boolean;
  score: number; // 0-100, higher = more suspicious
  suspiciousWalletCount: number;
  avgTimeBetweenTxs: number; // milliseconds
  reasons: string[];
  severity: 'warning' | 'critical';
}

export interface TokenTransactionPattern {
  txCount: number;
  uniqueWallets: number;
  avgTxInterval: number; // milliseconds
  volumeConcentration: number; // 0-1, how concentrated volume is in top wallets
  organicScore: number; // 0-100 from DexScreener
  qualityScore: number; // 0-100 from DexScreener
}

/**
 * Analyze token for bundle activity patterns
 * Uses available data from DexScreener and trading patterns
 */
export async function detectBundleActivity(
  tokenMint: string,
  tokenData?: any
): Promise<BundleDetectionResult> {
  const reasons: string[] = [];
  let score = 0;
  let suspiciousWalletCount = 0;
  let avgTimeBetweenTxs = 0;

  try {
    // Fetch detailed token data from DexScreener if not provided
    if (!tokenData) {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        tokenData = data.pairs?.[0]; // Use first (most liquid) pair
      }
    }

    if (!tokenData) {
      // Cannot analyze without data - return low confidence
      return {
        isSuspicious: false,
        score: 0,
        suspiciousWalletCount: 0,
        avgTimeBetweenTxs: 0,
        reasons: ['Insufficient data for bundle analysis'],
        severity: 'warning',
      };
    }

    // SIGNAL 1: Very low organic score indicates wash trading / bundle activity
    const organicScore = tokenData.profile?.organicScore ?? 50;
    if (organicScore < 30) {
      score += 40;
      reasons.push(`Very low organic trading (${organicScore}%) - likely wash trading`);
    } else if (organicScore < 50) {
      score += 20;
      reasons.push(`Low organic trading (${organicScore}%) - possible coordination`);
    }

    // SIGNAL 2: Very low quality score
    const qualityScore = tokenData.profile?.qualityScore ?? 50;
    if (qualityScore < 30) {
      score += 30;
      reasons.push(`Very low quality score (${qualityScore}%) - red flag`);
    } else if (qualityScore < 50) {
      score += 15;
      reasons.push(`Low quality score (${qualityScore}%) - concerning`);
    }

    // SIGNAL 3: Suspicious transaction patterns
    const txns24h = tokenData.txns?.h24 || {};
    const buys = txns24h.buys || 0;
    const sells = txns24h.sells || 0;
    const totalTxs = buys + sells;

    // High transaction count but low organic score = bundle activity
    if (totalTxs > 1000 && organicScore < 40) {
      score += 25;
      suspiciousWalletCount = Math.floor(totalTxs * 0.3); // Estimate
      reasons.push(`High tx count (${totalTxs}) with low organic score - likely bundles`);
    }

    // Extremely skewed buy/sell ratio can indicate coordination
    if (totalTxs > 100) {
      const buyRatio = buys / totalTxs;
      if (buyRatio > 0.85 || buyRatio < 0.15) {
        score += 20;
        reasons.push(`Extremely skewed buy/sell ratio (${(buyRatio * 100).toFixed(1)}% buys) - coordinated activity`);
      }
    }

    // SIGNAL 4: Liquidity manipulation
    const liquidityUSD = tokenData.liquidity?.usd || 0;
    const volume24h = tokenData.volume?.h24 || 0;
    
    if (liquidityUSD > 0 && volume24h > 0) {
      const volumeToLiquidityRatio = volume24h / liquidityUSD;
      
      // Very high volume relative to liquidity can indicate bot trading
      if (volumeToLiquidityRatio > 20) {
        score += 20;
        reasons.push(`Extremely high volume/liquidity ratio (${volumeToLiquidityRatio.toFixed(1)}x) - possible bot activity`);
      }
    }

    // SIGNAL 5: New token with instant high volume (classic pump pattern)
    const pairAge = tokenData.pairCreatedAt ? Date.now() - tokenData.pairCreatedAt : Infinity;
    const isVeryNew = pairAge < 24 * 60 * 60 * 1000; // Less than 24 hours old
    
    if (isVeryNew && volume24h > 100000 && organicScore < 50) {
      score += 25;
      reasons.push('New token with instant high volume and low organic score - pump pattern');
    }

    // SIGNAL 6: Price manipulation patterns
    const priceChange1h = tokenData.priceChange?.h1 || 0;
    const priceChange24h = tokenData.priceChange?.h24 || 0;
    
    // Extreme price movements can indicate coordination
    if (Math.abs(priceChange1h) > 50 || Math.abs(priceChange24h) > 100) {
      score += 15;
      reasons.push(`Extreme price volatility (1h: ${priceChange1h.toFixed(1)}%, 24h: ${priceChange24h.toFixed(1)}%)`);
    }

    // Calculate average time between transactions (estimate based on 24h data)
    if (totalTxs > 0) {
      const millisIn24h = 24 * 60 * 60 * 1000;
      avgTimeBetweenTxs = Math.floor(millisIn24h / totalTxs);
      
      // Very frequent transactions (< 5 seconds apart on average) = bot activity
      if (avgTimeBetweenTxs < 5000 && totalTxs > 500) {
        score += 20;
        suspiciousWalletCount = Math.max(suspiciousWalletCount, Math.floor(totalTxs * 0.4));
        reasons.push(`Very high frequency trading (avg ${(avgTimeBetweenTxs / 1000).toFixed(1)}s between txs) - bot bundles`);
      }
    }

    // Cap score at 100
    score = Math.min(100, score);

    // Determine severity based on score
    const severity: 'warning' | 'critical' = score >= 70 ? 'critical' : 'warning';

    // Token is suspicious if score >= 60
    const isSuspicious = score >= 60;

    return {
      isSuspicious,
      score,
      suspiciousWalletCount,
      avgTimeBetweenTxs,
      reasons,
      severity,
    };

  } catch (error) {
    console.error('[Bundle Detection] Error analyzing token:', error);
    return {
      isSuspicious: false,
      score: 0,
      suspiciousWalletCount: 0,
      avgTimeBetweenTxs: 0,
      reasons: ['Analysis failed - proceeding with caution'],
      severity: 'warning',
    };
  }
}

/**
 * Check if a token is in the blacklist
 */
export async function isTokenBlacklisted(tokenMint: string): Promise<boolean> {
  try {
    const { db } = await import('./db');
    const { tokenBlacklist } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const result = await db.select()
      .from(tokenBlacklist)
      .where(eq(tokenBlacklist.tokenMint, tokenMint))
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('[Bundle Detection] Error checking blacklist:', error);
    return false; // Fail open to avoid blocking legitimate tokens
  }
}

/**
 * Add token to blacklist with bundle detection metadata
 */
export async function addToBlacklist(
  tokenMint: string,
  tokenSymbol: string | null,
  tokenName: string | null,
  reason: string,
  severity: 'warning' | 'critical',
  addedBy: string,
  notes: string | null,
  bundleData?: {
    score: number;
    suspiciousWalletCount: number;
    avgTimeBetweenTxs: number;
  }
): Promise<void> {
  try {
    const { db } = await import('./db');
    const { tokenBlacklist } = await import('@shared/schema');
    
    await db.insert(tokenBlacklist).values({
      tokenMint,
      tokenSymbol,
      tokenName,
      reason,
      severity,
      addedBy,
      notes,
      bundleDetectionScore: bundleData?.score,
      suspiciousWalletCount: bundleData?.suspiciousWalletCount,
      avgTimeBetweenTxs: bundleData?.avgTimeBetweenTxs,
    }).onConflictDoUpdate({
      target: tokenBlacklist.tokenMint,
      set: {
        tokenSymbol,
        tokenName,
        reason,
        severity,
        notes,
        bundleDetectionScore: bundleData?.score,
        suspiciousWalletCount: bundleData?.suspiciousWalletCount,
        avgTimeBetweenTxs: bundleData?.avgTimeBetweenTxs,
      },
    });
    
    console.log(`[Bundle Detection] ⚠️ Added ${tokenSymbol || tokenMint} to blacklist: ${reason}`);
  } catch (error) {
    console.error('[Bundle Detection] Error adding to blacklist:', error);
    throw error;
  }
}
