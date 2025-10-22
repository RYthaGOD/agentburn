// AI Trading Bot Scheduler - Grok-powered PumpFun trading automation
// Scans PumpFun trending tokens, analyzes with Grok AI, and executes trades

import cron from "node-cron";
import { storage } from "./storage";
import { analyzeTokenWithGrok, isGrokConfigured, type TokenMarketData } from "./grok-analysis";
import { buyTokenOnPumpFun, sellTokenOnPumpFun } from "./pumpfun";
import { getTreasuryKey } from "./key-manager";
import { getWalletBalance } from "./solana";
import { deductTransactionFee } from "./transaction-fee";
import { realtimeService } from "./realtime";
import { Keypair } from "@solana/web3.js";
import { loadKeypairFromPrivateKey } from "./solana-sdk";
import type { Project } from "@shared/schema";

interface AIBotState {
  projectId: string;
  dailyTradesExecuted: number;
  lastResetDate: string; // YYYY-MM-DD
  activePositions: Map<string, { mint: string; entryPriceSOL: number; amountSOL: number }>;
}

const aiBotStates = new Map<string, AIBotState>();

/**
 * Fetch trending PumpFun tokens
 * 
 * ⚠️ INTEGRATION REQUIRED: This is a placeholder function
 * 
 * To activate the AI trading bot, you must integrate a market data provider.
 * Recommended APIs:
 * 
 * 1. **DexScreener API** (Free, no auth required)
 *    - Get trending tokens: GET https://api.dexscreener.com/latest/dex/tokens/solana
 *    - Docs: https://docs.dexscreener.com/api/reference
 * 
 * 2. **Birdeye API** (Requires API key)
 *    - Get trending tokens: GET https://public-api.birdeye.so/defi/trending_tokens/solana
 *    - Docs: https://docs.birdeye.so/
 * 
 * 3. **Jupiter API** (Free, comprehensive)
 *    - Token list: https://token.jup.ag/all
 *    - Combine with DexScreener for volume data
 * 
 * Example implementation with DexScreener:
 * ```typescript
 * const response = await fetch(
 *   'https://api.dexscreener.com/latest/dex/search?q=pump'
 * );
 * const data = await response.json();
 * return data.pairs
 *   .filter(pair => pair.chainId === 'solana')
 *   .map(pair => ({
 *     mint: pair.baseToken.address,
 *     name: pair.baseToken.name,
 *     symbol: pair.baseToken.symbol,
 *     priceUSD: parseFloat(pair.priceUsd),
 *     priceSOL: parseFloat(pair.priceNative),
 *     volumeUSD24h: pair.volume.h24,
 *     marketCapUSD: pair.fdv,
 *     liquidityUSD: pair.liquidity.usd,
 *     priceChange24h: pair.priceChange.h24,
 *   }));
 * ```
 */
async function fetchTrendingPumpFunTokens(): Promise<TokenMarketData[]> {
  console.log("[AI Bot] ⚠️ WARNING: fetchTrendingPumpFunTokens() is not implemented");
  console.log("[AI Bot] To activate AI trading, integrate DexScreener, Birdeye, or Jupiter API");
  console.log("[AI Bot] See function comments for integration examples");
  
  // TODO: Replace this placeholder with actual API integration
  // Uncomment and modify one of the examples above
  
  return []; // Currently returns empty - bot will not execute until data source is connected
}

/**
 * Execute AI trading bot for a single project
 */
async function executeAITradingBot(project: Project) {
  try {
    console.log(`[AI Bot] Running for project ${project.id} (${project.name})`);

    // Check if AI bot is enabled
    if (!project.aiBotEnabled) {
      console.log(`[AI Bot] Disabled for project ${project.id}`);
      return;
    }

    // Validate Grok API key
    if (!isGrokConfigured()) {
      console.error("[AI Bot] XAI_API_KEY not configured");
      await storage.updateProject(project.id, {
        lastBotStatus: "failed",
        lastBotRunAt: new Date(),
      });
      return;
    }

    // Get or initialize bot state
    let botState = aiBotStates.get(project.id);
    const today = new Date().toISOString().split("T")[0];

    if (!botState || botState.lastResetDate !== today) {
      botState = {
        projectId: project.id,
        dailyTradesExecuted: 0,
        lastResetDate: today,
        activePositions: new Map(),
      };
      aiBotStates.set(project.id, botState);
    }

    // Check daily trade limit
    const maxDailyTrades = project.aiBotMaxDailyTrades || 10;
    if (botState.dailyTradesExecuted >= maxDailyTrades) {
      console.log(`[AI Bot] Daily trade limit reached (${maxDailyTrades})`);
      await storage.updateProject(project.id, {
        lastBotStatus: "skipped",
        lastBotRunAt: new Date(),
      });
      return;
    }

    // Get wallet keypair
    const treasuryKeyBase58 = await getTreasuryKey(project.id);
    if (!treasuryKeyBase58) {
      console.error(`[AI Bot] No treasury key configured for project ${project.id}`);
      await storage.updateProject(project.id, {
        lastBotStatus: "failed",
        lastBotRunAt: new Date(),
      });
      return;
    }

    const treasuryKeypair = loadKeypairFromPrivateKey(treasuryKeyBase58);

    // Check SOL balance
    const solBalance = await getWalletBalance(treasuryKeypair.publicKey.toString());
    const budgetPerTrade = parseFloat(project.aiBotBudgetPerTrade || "0");
    
    if (solBalance < budgetPerTrade + 0.01) { // +0.01 for fees
      console.log(`[AI Bot] Insufficient SOL balance: ${solBalance} SOL`);
      await storage.updateProject(project.id, {
        lastBotStatus: "failed",
        lastBotRunAt: new Date(),
      });
      return;
    }

    // Fetch trending tokens
    const trendingTokens = await fetchTrendingPumpFunTokens();
    
    // Filter by volume threshold
    const minVolumeUSD = parseFloat(project.aiBotMinVolumeUSD || "1000");
    const filteredTokens = trendingTokens.filter((t) => t.volumeUSD24h >= minVolumeUSD);

    if (filteredTokens.length === 0) {
      console.log("[AI Bot] No tokens meet volume criteria");
      await storage.updateProject(project.id, {
        lastBotStatus: "skipped",
        lastBotRunAt: new Date(),
      });
      return;
    }

    console.log(`[AI Bot] Analyzing ${filteredTokens.length} tokens...`);

    // Analyze tokens with Grok AI
    const riskTolerance = (project.aiBotRiskTolerance || "medium") as "low" | "medium" | "high";
    
    for (const token of filteredTokens) {
      // Check if we've hit daily limit
      if (botState.dailyTradesExecuted >= maxDailyTrades) {
        break;
      }

      const analysis = await analyzeTokenWithGrok(token, riskTolerance, budgetPerTrade);

      // Check minimum potential threshold
      const minPotential = parseFloat(project.aiBotMinPotentialPercent || "20");
      if (analysis.potentialUpsidePercent < minPotential) {
        console.log(`[AI Bot] ${token.symbol}: Potential ${analysis.potentialUpsidePercent}% below threshold ${minPotential}%`);
        continue;
      }

      // Execute trade based on AI recommendation
      if (analysis.action === "buy" && analysis.confidence >= 0.6) {
        const amountSOL = analysis.suggestedBuyAmountSOL || budgetPerTrade;
        
        console.log(`[AI Bot] BUY signal: ${token.symbol} - ${amountSOL} SOL (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`);
        console.log(`[AI Bot] Reasoning: ${analysis.reasoning}`);

        const result = await buyTokenOnPumpFun(
          treasuryKeypair,
          token.mint,
          amountSOL,
          10, // 10% slippage
          0.00001 // Priority fee
        );

        if (result.success && result.signature) {
          // Record transaction
          await storage.createTransaction({
            projectId: project.id,
            type: "ai_buy",
            amount: amountSOL.toString(),
            tokenAmount: "0", // Would need to calculate from tx
            txSignature: result.signature,
            status: "completed",
            expectedPriceSOL: token.priceSOL.toString(),
            actualPriceSOL: token.priceSOL.toString(),
          });

          // Deduct transaction fee (0.5% after 60 transactions)
          const feeResult = await deductTransactionFee(
            project.id,
            amountSOL,
            treasuryKeypair
          );

          if (feeResult.feeDeducted > 0) {
            console.log(`[AI Bot] Transaction fee deducted: ${feeResult.feeDeducted} SOL`);
          }

          // Broadcast real-time update
          realtimeService.broadcast({
            type: "transaction_event",
            data: {
              projectId: project.id,
              transactionType: "ai_buy",
              signature: result.signature,
              amount: amountSOL,
              token: token.symbol,
              analysis: analysis.reasoning,
            },
            timestamp: Date.now(),
          });

          // Track position
          botState.activePositions.set(token.mint, {
            mint: token.mint,
            entryPriceSOL: token.priceSOL,
            amountSOL,
          });

          botState.dailyTradesExecuted++;
          console.log(`[AI Bot] Trade executed successfully (${botState.dailyTradesExecuted}/${maxDailyTrades})`);
        } else {
          console.error(`[AI Bot] Trade failed: ${result.error}`);
        }
      }
    }

    // Update project status
    await storage.updateProject(project.id, {
      lastBotStatus: "success",
      lastBotRunAt: new Date(),
    });

    console.log(`[AI Bot] Run complete for project ${project.id}`);
  } catch (error) {
    console.error(`[AI Bot] Error for project ${project.id}:`, error);
    await storage.updateProject(project.id, {
      lastBotStatus: "failed",
      lastBotRunAt: new Date(),
    });
  }
}

/**
 * Run AI trading bot for all enabled projects
 */
async function runAITradingBots() {
  try {
    console.log("[AI Bot Scheduler] Scanning for active projects...");

    const projects = await storage.getAllProjects();
    const enabledProjects = projects.filter((p) => p.aiBotEnabled);

    if (enabledProjects.length === 0) {
      console.log("[AI Bot Scheduler] No projects with AI bot enabled");
      return;
    }

    console.log(`[AI Bot Scheduler] Running for ${enabledProjects.length} projects`);

    // Run bots in parallel (with reasonable concurrency)
    await Promise.all(enabledProjects.map((p) => executeAITradingBot(p)));

    console.log("[AI Bot Scheduler] All bots completed");
  } catch (error) {
    console.error("[AI Bot Scheduler] Error:", error);
  }
}

/**
 * Start AI trading bot scheduler
 * Runs based on project-specific intervals
 */
export function startAITradingBotScheduler() {
  if (process.env.NODE_ENV === "development") {
    console.log("[AI Bot Scheduler] Disabled in development mode");
    return;
  }

  if (!isGrokConfigured()) {
    console.warn("[AI Bot Scheduler] XAI_API_KEY not configured - AI bot disabled");
    return;
  }

  console.log("[AI Bot Scheduler] Starting...");

  // Run every 5 minutes (projects control their own intervals via aiBotAnalysisInterval)
  cron.schedule("*/5 * * * *", () => {
    runAITradingBots().catch((error) => {
      console.error("[AI Bot Scheduler] Unexpected error:", error);
    });
  });

  console.log("[AI Bot Scheduler] Active (checks every 5 minutes)");
}

/**
 * Manual trigger for testing
 */
export async function triggerAIBotManually(projectId: string) {
  const project = await storage.getProject(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  await executeAITradingBot(project);
}
