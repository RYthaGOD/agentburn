/**
 * Performance Tracking Service
 * 
 * Calculates and updates real-time performance metrics for AI trading bots:
 * - Win rate (% of profitable trades)
 * - ROI (return on investment)
 * - Average profit/loss percentages
 * - Trade statistics (SCALP vs SWING)
 * - Best/worst trades
 * 
 * Updates ai_bot_configs table with calculated metrics
 * Broadcasts updates via WebSocket for real-time UI
 */

import { db } from "./db";
import { aiBotConfigs, tradeJournal } from "../shared/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import type { SelectTradeJournal } from "../shared/schema";

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfitSOL: string;
  totalLossSOL: string;
  netProfitSOL: string;
  winRate: string;
  averageProfitPercent: string;
  averageLossPercent: string;
  roiPercent: string;
  bestTradePercent: string;
  worstTradePercent: string;
  averageHoldTimeMinutes: number;
  scalpTradeCount: number;
  swingTradeCount: number;
}

/**
 * Calculate performance metrics from trade journal
 */
export async function calculatePerformanceMetrics(
  walletAddress: string
): Promise<PerformanceMetrics> {
  // Query all completed trades from journal
  const completedTrades = await db
    .select()
    .from(tradeJournal)
    .where(
      and(
        eq(tradeJournal.ownerWalletAddress, walletAddress),
        isNotNull(tradeJournal.exitAt), // Only completed trades
        isNotNull(tradeJournal.profitLossSOL)
      )
    );

  // If no trades, return zeros
  if (completedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfitSOL: "0",
      totalLossSOL: "0",
      netProfitSOL: "0",
      winRate: "0",
      averageProfitPercent: "0",
      averageLossPercent: "0",
      roiPercent: "0",
      bestTradePercent: "0",
      worstTradePercent: "0",
      averageHoldTimeMinutes: 0,
      scalpTradeCount: 0,
      swingTradeCount: 0,
    };
  }

  // Separate winning and losing trades
  const winningTrades = completedTrades.filter((t: SelectTradeJournal) => 
    parseFloat(t.profitLossSOL || "0") > 0
  );
  const losingTrades = completedTrades.filter((t: SelectTradeJournal) => 
    parseFloat(t.profitLossSOL || "0") <= 0
  );

  // Calculate totals
  const totalProfitSOL = winningTrades.reduce(
    (sum: number, t: SelectTradeJournal) => sum + parseFloat(t.profitLossSOL || "0"), 
    0
  );
  const totalLossSOL = Math.abs(losingTrades.reduce(
    (sum: number, t: SelectTradeJournal) => sum + parseFloat(t.profitLossSOL || "0"), 
    0
  ));
  const netProfitSOL = totalProfitSOL - totalLossSOL;

  // Calculate total capital invested (sum of all trade amounts)
  const totalInvestedSOL = completedTrades.reduce(
    (sum: number, t: SelectTradeJournal) => sum + parseFloat(t.amountSOL || "0"),
    0
  );

  // Win rate
  const winRate = completedTrades.length > 0
    ? (winningTrades.length / completedTrades.length) * 100
    : 0;

  // Average profit/loss percentages
  const averageProfitPercent = winningTrades.length > 0
    ? winningTrades.reduce((sum: number, t: SelectTradeJournal) => sum + parseFloat(t.profitLossPercent || "0"), 0) / winningTrades.length
    : 0;
  
  const averageLossPercent = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum: number, t: SelectTradeJournal) => sum + parseFloat(t.profitLossPercent || "0"), 0) / losingTrades.length)
    : 0;

  // ROI = (net profit / total invested) * 100
  const roiPercent = totalInvestedSOL > 0
    ? (netProfitSOL / totalInvestedSOL) * 100
    : 0;

  // Best and worst trades
  const allProfitPercents = completedTrades.map((t: SelectTradeJournal) => parseFloat(t.profitLossPercent || "0"));
  const bestTradePercent = allProfitPercents.length > 0
    ? Math.max(...allProfitPercents)
    : 0;
  const worstTradePercent = allProfitPercents.length > 0
    ? Math.min(...allProfitPercents)
    : 0;

  // Average hold time
  const totalHoldTime = completedTrades.reduce(
    (sum: number, t: SelectTradeJournal) => sum + (t.holdDurationMinutes || 0),
    0
  );
  const averageHoldTimeMinutes = completedTrades.length > 0
    ? Math.round(totalHoldTime / completedTrades.length)
    : 0;

  // Trade mode counts
  const scalpTradeCount = completedTrades.filter((t: SelectTradeJournal) => t.tradeMode === "SCALP").length;
  const swingTradeCount = completedTrades.filter((t: SelectTradeJournal) => t.tradeMode === "SWING").length;

  return {
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    totalProfitSOL: totalProfitSOL.toFixed(9),
    totalLossSOL: totalLossSOL.toFixed(9),
    netProfitSOL: netProfitSOL.toFixed(9),
    winRate: winRate.toFixed(2),
    averageProfitPercent: averageProfitPercent.toFixed(2),
    averageLossPercent: averageLossPercent.toFixed(2),
    roiPercent: roiPercent.toFixed(2),
    bestTradePercent: bestTradePercent.toFixed(2),
    worstTradePercent: worstTradePercent.toFixed(2),
    averageHoldTimeMinutes,
    scalpTradeCount,
    swingTradeCount,
  };
}

/**
 * Update performance metrics in database and broadcast via WebSocket
 */
export async function updatePerformanceMetrics(
  walletAddress: string
): Promise<PerformanceMetrics> {
  console.log(`[Performance Tracker] Calculating metrics for ${walletAddress.slice(0, 8)}...`);

  // Calculate metrics from trade journal
  const metrics = await calculatePerformanceMetrics(walletAddress);

  // Update ai_bot_configs with calculated metrics
  await db
    .update(aiBotConfigs)
    .set({
      totalTrades: metrics.totalTrades,
      winningTrades: metrics.winningTrades,
      losingTrades: metrics.losingTrades,
      totalProfitSOL: metrics.totalProfitSOL,
      totalLossSOL: metrics.totalLossSOL,
      netProfitSOL: metrics.netProfitSOL,
      winRate: metrics.winRate,
      averageProfitPercent: metrics.averageProfitPercent,
      averageLossPercent: metrics.averageLossPercent,
      roiPercent: metrics.roiPercent,
      bestTradePercent: metrics.bestTradePercent,
      worstTradePercent: metrics.worstTradePercent,
      averageHoldTimeMinutes: metrics.averageHoldTimeMinutes,
      scalpTradeCount: metrics.scalpTradeCount,
      swingTradeCount: metrics.swingTradeCount,
      lastPerformanceUpdateAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(aiBotConfigs.ownerWalletAddress, walletAddress));

  console.log(`[Performance Tracker] ✅ Updated metrics:`, {
    totalTrades: metrics.totalTrades,
    winRate: `${metrics.winRate}%`,
    roi: `${metrics.roiPercent}%`,
    netProfit: `${metrics.netProfitSOL} SOL`,
  });

  // Broadcast update via WebSocket
  try {
    const { realtimeService } = await import("./realtime");
    realtimeService.emitPerformanceUpdate({
      walletAddress,
      ...metrics,
    });
  } catch (wsError) {
    console.error(`[Performance Tracker] ⚠️ Failed to broadcast WebSocket update:`, wsError);
  }

  return metrics;
}

/**
 * Update performance metrics after a trade is completed
 * Called automatically when a position is sold
 */
export async function updatePerformanceOnTrade(walletAddress: string): Promise<void> {
  try {
    await updatePerformanceMetrics(walletAddress);
  } catch (error) {
    console.error(`[Performance Tracker] Error updating metrics:`, error);
  }
}

/**
 * Recalculate performance metrics for all active AI bots
 * Can be run periodically to ensure data consistency
 */
export async function recalculateAllPerformanceMetrics(): Promise<void> {
  console.log("[Performance Tracker] Recalculating all bot performance metrics...");

  const allBots = await db
    .select({ ownerWalletAddress: aiBotConfigs.ownerWalletAddress })
    .from(aiBotConfigs)
    .where(eq(aiBotConfigs.enabled, true));

  for (const bot of allBots) {
    await updatePerformanceMetrics(bot.ownerWalletAddress);
  }

  console.log(`[Performance Tracker] ✅ Recalculated metrics for ${allBots.length} bots`);
}
