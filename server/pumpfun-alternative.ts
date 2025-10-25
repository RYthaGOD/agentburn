/**
 * Alternative PumpFun token discovery using reliable APIs
 * Replaces broken pumpfunapi.org endpoints with DexScreener + on-chain analysis
 */

export interface TokenMarketData {
  mint: string;
  name: string;
  symbol: string;
  priceUSD: number;
  priceSOL: number;
  volumeUSD24h: number;
  marketCapUSD: number;
  liquidityUSD?: number;
  priceChange24h?: number;
  priceChange1h?: number;
  holderCount?: number;
}

/**
 * Fetch newly created/migrated pump.fun tokens
 * Uses DexScreener to find recent tokens with Raydium pairs (migrated from pump.fun)
 */
export async function fetchNewlyMigratedPumpTokens(maxTokens: number = 20): Promise<TokenMarketData[]> {
  try {
    console.log("[PumpFun Alt] 🚀 Scanning for recently migrated pump.fun tokens...");
    
    // Search for recently created Solana tokens with volume
    const response = await fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.log(`[PumpFun Alt] Token profiles API returned ${response.status}, trying search instead...`);
      // Fallback to search
      return fetchLowCapPumpTokensViaDexScreener(maxTokens);
    }

    const profiles = await response.json();
    const tokens: TokenMarketData[] = [];
    
    for (const profile of profiles.slice(0, 50)) {
      try {
        // Only process Solana tokens
        if (profile.chainId !== 'solana') continue;
        
        // Fetch trading pairs for this token
        const pairResponse = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${profile.tokenAddress}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!pairResponse.ok) continue;
        
        const pairData = await pairResponse.json();
        const pairs = pairData.pairs || [];
        
        // Look for Raydium pairs (indicates migration from pump.fun)
        const raydiumPair = pairs.find((p: any) => 
          p.dexId === 'raydium' || p.labels?.includes('v3') || p.labels?.includes('v4')
        );
        
        if (!raydiumPair) continue;
        
        // Check if token is relatively new (created within last 7 days)
        const pairAge = raydiumPair.pairCreatedAt ? Date.now() - raydiumPair.pairCreatedAt : Infinity;
        const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (pairAge > MAX_AGE_MS) continue;
        
        // Must have some volume to be tradeable
        if ((raydiumPair.volume?.h24 || 0) < 1000) continue;
        
        const tokenData: TokenMarketData = {
          mint: profile.tokenAddress,
          name: raydiumPair.baseToken?.name || 'Unknown',
          symbol: raydiumPair.baseToken?.symbol || 'UNKNOWN',
          priceUSD: parseFloat(raydiumPair.priceUsd || '0'),
          priceSOL: parseFloat(raydiumPair.priceNative || '0'),
          volumeUSD24h: raydiumPair.volume?.h24 || 0,
          marketCapUSD: raydiumPair.fdv || raydiumPair.marketCap || 0,
          liquidityUSD: raydiumPair.liquidity?.usd || 0,
          priceChange24h: raydiumPair.priceChange?.h24 || 0,
          priceChange1h: raydiumPair.priceChange?.h1 || 0,
          holderCount: undefined,
        };
        
        tokens.push(tokenData);
        
        if (tokens.length >= maxTokens) break;
      } catch (error) {
        continue; // Skip problematic tokens
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`[PumpFun Alt] ✅ Found ${tokens.length} newly migrated tokens`);
    return tokens;
  } catch (error) {
    console.error("[PumpFun Alt] Error fetching migrated tokens:", error);
    return [];
  }
}

/**
 * Fetch low market cap tokens via DexScreener search
 * Alternative to broken PumpFun new tokens API
 */
export async function fetchLowCapPumpTokensViaDexScreener(maxTokens: number = 15): Promise<TokenMarketData[]> {
  try {
    console.log("[PumpFun Alt] 🔥 Scanning for low-cap opportunities via DexScreener...");
    
    // Search queries that tend to catch pump.fun style tokens
    const queries = ['meme', 'pepe', 'doge', 'shib'];
    const tokens: TokenMarketData[] = [];
    const seenMints = new Set<string>();
    
    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${query}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const pairs = data.pairs || [];
        
        for (const pair of pairs) {
          // Only Solana pairs
          if (pair.chainId !== 'solana') continue;
          if (!pair.baseToken?.address) continue;
          if (seenMints.has(pair.baseToken.address)) continue;
          
          // Low market cap filter (under $500k)
          const marketCap = pair.fdv || pair.marketCap || 0;
          if (marketCap > 500000 || marketCap < 5000) continue;
          
          // Must have volume
          if ((pair.volume?.h24 || 0) < 2000) continue;
          
          // Must have liquidity
          if ((pair.liquidity?.usd || 0) < 3000) continue;
          
          seenMints.add(pair.baseToken.address);
          
          tokens.push({
            mint: pair.baseToken.address,
            name: pair.baseToken.name || 'Unknown',
            symbol: pair.baseToken.symbol || 'UNKNOWN',
            priceUSD: parseFloat(pair.priceUsd || '0'),
            priceSOL: parseFloat(pair.priceNative || '0'),
            volumeUSD24h: pair.volume?.h24 || 0,
            marketCapUSD: marketCap,
            liquidityUSD: pair.liquidity?.usd || 0,
            priceChange24h: pair.priceChange?.h24 || 0,
            priceChange1h: pair.priceChange?.h1 || 0,
            holderCount: undefined,
          });
          
          if (tokens.length >= maxTokens) break;
        }
        
        if (tokens.length >= maxTokens) break;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        continue;
      }
    }
    
    console.log(`[PumpFun Alt] ✅ Found ${tokens.length} low-cap tokens`);
    return tokens;
  } catch (error) {
    console.error("[PumpFun Alt] Error fetching low-cap tokens:", error);
    return [];
  }
}

/**
 * Fetch trending pump-style tokens via DexScreener
 * Looks for high volume, recent creation, meme-style tokens
 */
export async function fetchTrendingPumpStyleTokens(maxTokens: number = 15): Promise<TokenMarketData[]> {
  try {
    console.log("[PumpFun Alt] 🔥 Fetching trending pump-style tokens from DexScreener...");
    
    // Get trending pairs on Solana
    const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana/', {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`[PumpFun Alt] DexScreener API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const pairs = data.pairs || [];
    
    // Filter for pump-style characteristics:
    // - High volume relative to liquidity
    // - Relatively new (created in last 30 days)
    // - Small market cap (under $5M)
    const tokens: TokenMarketData[] = [];
    const now = Date.now();
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    for (const pair of pairs) {
      if (!pair.baseToken?.address) continue;
      
      // Age check
      const pairAge = pair.pairCreatedAt ? now - pair.pairCreatedAt : 0;
      if (pairAge > MAX_AGE_MS) continue;
      
      // Market cap check
      const marketCap = pair.fdv || pair.marketCap || 0;
      if (marketCap > 5000000 || marketCap < 10000) continue;
      
      // Volume check (must have decent volume)
      const volume = pair.volume?.h24 || 0;
      if (volume < 5000) continue;
      
      // Liquidity check
      const liquidity = pair.liquidity?.usd || 0;
      if (liquidity < 3000) continue;
      
      // Volume to liquidity ratio (pump tokens often have high volume/liquidity)
      const volumeToLiquidity = volume / liquidity;
      if (volumeToLiquidity < 0.5) continue; // At least 50% daily volume of liquidity
      
      tokens.push({
        mint: pair.baseToken.address,
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || 'UNKNOWN',
        priceUSD: parseFloat(pair.priceUsd || '0'),
        priceSOL: parseFloat(pair.priceNative || '0'),
        volumeUSD24h: volume,
        marketCapUSD: marketCap,
        liquidityUSD: liquidity,
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
        holderCount: undefined,
      });
      
      if (tokens.length >= maxTokens) break;
    }
    
    console.log(`[PumpFun Alt] ✅ Found ${tokens.length} trending pump-style tokens`);
    return tokens;
  } catch (error) {
    console.error("[PumpFun Alt] Error fetching trending tokens:", error);
    return [];
  }
}
