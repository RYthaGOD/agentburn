# AI Trading Bot Integration Guide

## Current Status

✅ **Completed Components:**
- Grok AI analysis service (analyzes token market data)
- PumpFun trading execution (buy/sell via PumpPortal API)
- AI bot scheduler (runs analysis + executes trades)
- API routes (configuration + manual trigger)
- Database schema (stores AI bot settings)
- Security (wallet authentication, replay protection)

⚠️ **Missing: Market Data Source**

The AI trading bot is **structurally complete** but cannot run because `fetchTrendingPumpFunTokens()` in `server/ai-bot-scheduler.ts` is a placeholder that returns an empty array.

## What You Need to Do

### Step 1: Choose a Market Data Provider

Select one of these APIs to fetch trending PumpFun tokens:

| Provider | Cost | Auth Required | Data Quality |
|----------|------|---------------|--------------|
| **DexScreener** | Free | No | Excellent - Real-time DEX data |
| **Birdeye** | Freemium | API Key | Excellent - Comprehensive analytics |
| **Jupiter** | Free | No | Good - Token lists only (combine with DexScreener for volume) |

### Step 2: Implement `fetchTrendingPumpFunTokens()`

Replace the placeholder function in `server/ai-bot-scheduler.ts` (line ~25) with actual API integration.

#### Option A: DexScreener (Recommended - No Auth Required)

```typescript
async function fetchTrendingPumpFunTokens(): Promise<TokenMarketData[]> {
  try {
    // Search for PumpFun tokens on Solana
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/search?q=pump'
    );
    
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for Solana chain and map to TokenMarketData format
    const tokens: TokenMarketData[] = data.pairs
      ?.filter((pair: any) => pair.chainId === 'solana')
      ?.slice(0, 20) // Limit to top 20 trending tokens
      ?.map((pair: any) => ({
        mint: pair.baseToken.address,
        name: pair.baseToken.name || 'Unknown',
        symbol: pair.baseToken.symbol || 'UNKNOWN',
        priceUSD: parseFloat(pair.priceUsd || '0'),
        priceSOL: parseFloat(pair.priceNative || '0'),
        volumeUSD24h: pair.volume?.h24 || 0,
        marketCapUSD: pair.fdv || 0,
        liquidityUSD: pair.liquidity?.usd || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange1h: pair.priceChange?.h1 || 0,
      })) || [];

    console.log(`[AI Bot] Fetched ${tokens.length} trending tokens from DexScreener`);
    return tokens;
  } catch (error) {
    console.error("[AI Bot] Failed to fetch trending tokens:", error);
    return [];
  }
}
```

**API Docs:** https://docs.dexscreener.com/api/reference

#### Option B: Birdeye API (Requires API Key)

1. **Get API Key:** Sign up at https://birdeye.so/
2. **Add to Secrets:** Set `BIRDEYE_API_KEY` in environment
3. **Implement:**

```typescript
async function fetchTrendingPumpFunTokens(): Promise<TokenMarketData[]> {
  try {
    const response = await fetch(
      'https://public-api.birdeye.so/defi/trending_tokens/solana?sort_by=v24h_usd&sort_type=desc&offset=0&limit=20',
      {
        headers: {
          'X-API-KEY': process.env.BIRDEYE_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tokens: TokenMarketData[] = data.data?.items?.map((token: any) => ({
      mint: token.address,
      name: token.name || 'Unknown',
      symbol: token.symbol || 'UNKNOWN',
      priceUSD: token.price || 0,
      priceSOL: token.price / (await getSolPrice()), // Convert USD to SOL
      volumeUSD24h: token.v24h || 0,
      marketCapUSD: token.mc || 0,
      priceChange24h: token.v24hChangePercent || 0,
      holderCount: token.holder || 0,
    })) || [];

    console.log(`[AI Bot] Fetched ${tokens.length} trending tokens from Birdeye`);
    return tokens;
  } catch (error) {
    console.error("[AI Bot] Failed to fetch trending tokens:", error);
    return [];
  }
}

// Helper to get SOL price in USD
async function getSolPrice(): Promise<number> {
  const SOL_MINT = "So11111111111111111111111111111111111111112";
  const response = await fetch(`https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`);
  const data = await response.json();
  return data[SOL_MINT]?.usdPrice || 100; // Fallback to $100 if error
}
```

**API Docs:** https://docs.birdeye.so/

### Step 3: Test the Integration

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Check logs for data fetching:**
   ```
   [AI Bot] Fetched 20 trending tokens from DexScreener
   ```

3. **Enable AI bot for a project via API:**
   ```bash
   curl -X PATCH http://localhost:5000/api/projects/{PROJECT_ID} \
     -H "Content-Type: application/json" \
     -d '{
       "aiBotEnabled": true,
       "aiBotBudgetPerTrade": "0.1",
       "aiBotAnalysisInterval": 30,
       "aiBotMinVolumeUSD": "5000",
       "aiBotMinPotentialPercent": "20",
       "aiBotMaxDailyTrades": 5,
       "aiBotRiskTolerance": "medium"
     }'
   ```

4. **Manually trigger AI bot:**
   ```bash
   POST /api/projects/{PROJECT_ID}/trigger-ai-bot
   Body: {
     "ownerWalletAddress": "...",
     "signature": "...",
     "message": "Trigger AI bot for project {id} at {timestamp}"
   }
   ```

5. **Verify transactions are recorded:**
   ```bash
   GET /api/transactions?projectId={PROJECT_ID}
   # Should show transactions with type: "ai_buy"
   ```

### Step 4: Production Considerations

1. **Rate Limiting:**
   - DexScreener: ~300 requests/minute (generous)
   - Birdeye: Varies by plan (check your tier)

2. **Error Handling:**
   - Current implementation returns `[]` on error (bot skips execution)
   - Consider retry logic for transient failures

3. **Data Freshness:**
   - DexScreener: Real-time (< 1 min delay)
   - Cache responses if querying frequently to avoid rate limits

4. **Filtering:**
   - Add additional filters (e.g., minimum liquidity, maximum market cap)
   - Exclude tokens with suspicious volume patterns

5. **XAI_API_KEY:**
   - Make sure you have added your Grok API key to environment secrets
   - Without it, AI bot will fail with "XAI_API_KEY not configured"

## How the AI Bot Works (After Integration)

1. **Scheduler runs every 5 minutes** (in production)
2. **Fetches trending tokens** via your integrated API
3. **Filters by volume** (>= `aiBotMinVolumeUSD`)
4. **Analyzes each token** with Grok AI:
   - Evaluates: volume, market cap, price momentum, liquidity, holder count
   - Returns: buy/sell/hold + confidence score + reasoning
5. **Executes trades** if:
   - Action = "buy"
   - Confidence >= 60%
   - Potential upside >= `aiBotMinPotentialPercent`
   - Daily trade limit not exceeded
6. **Records transaction** with type "ai_buy"
7. **Deducts 0.5% fee** (after 60th transaction)
8. **Broadcasts WebSocket update** for real-time monitoring

## Troubleshooting

**Bot not executing:**
- Check logs for "⚠️ WARNING: fetchTrendingPumpFunTokens() is not implemented"
- Verify XAI_API_KEY is set in environment secrets
- Ensure `aiBotEnabled: true` for the project

**No tokens found:**
- Verify API endpoint is returning data (test in browser/Postman)
- Check volume filter isn't too restrictive
- Ensure API key is valid (Birdeye only)

**Analysis errors:**
- Check Grok API quota/rate limits
- Verify XAI_API_KEY is valid
- Review logs for "Grok AI" error messages

**Trading errors:**
- Verify treasury wallet has encrypted private key stored
- Check SOL balance is sufficient (budget + 0.01 for fees)
- Review PumpPortal API errors in logs

## Next Steps

After integrating the market data source, the AI trading bot will be **fully operational**. You can then:

1. **Build the UI** at `/dashboard/ai-bot` for configuration management
2. **Monitor transactions** in the dashboard
3. **Fine-tune parameters** based on performance
4. **Add sell logic** to close positions based on take-profit/stop-loss

---

*Integration Status: Ready for data source implementation*
