// Multi-Strategy Trading System - Complementary strategies alongside AI-driven SCALP/SWING
// Strategy 1: Mean Reversion - Buy oversold (RSI < 30), sell overbought (RSI > 70)
// Strategy 2: Momentum Breakout - Catch explosive price + volume moves early
// Strategy 3: Grid Trading - Multiple entry/exit levels for ranging markets

import type { TokenMarketData } from "./grok-analysis";

export interface StrategySignal {
  strategy: "MEAN_REVERSION" | "MOMENTUM_BREAKOUT" | "GRID_TRADING";
  action: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0-100
  reasoning: string;
  positionSizePercent: number; // % of portfolio
  profitTarget: number; // % profit target
  stopLoss: number; // % stop loss
}

export interface StrategyConfig {
  // Mean Reversion
  meanReversionEnabled: boolean;
  meanReversionRSIOversold: number;
  meanReversionRSIOverbought: number;
  meanReversionPositionSizePercent: number;
  meanReversionProfitTargetPercent: number;
  meanReversionStopLossPercent: number;
  
  // Momentum Breakout
  momentumBreakoutEnabled: boolean;
  momentumBreakoutPriceChangePercent: number;
  momentumBreakoutVolumeMultiplier: number;
  momentumBreakoutPositionSizePercent: number;
  momentumBreakoutProfitTargetPercent: number;
  momentumBreakoutStopLossPercent: number;
  
  // Grid Trading
  gridTradingEnabled: boolean;
  gridTradingLevels: number;
  gridTradingPriceGapPercent: number;
  gridTradingPerLevelSizePercent: number;
}

/**
 * Strategy 1: Mean Reversion (Enhanced with Bollinger Band filter)
 * Buy when RSI is oversold (<30) AND near lower Bollinger Band (support)
 * Sell when RSI is overbought (>70) AND near upper Bollinger Band (resistance)
 * Works well for volatile tokens that bounce back from extremes
 * 
 * Key Enhancement: Bollinger Bands ensure we buy at SUPPORT (LOW) and sell at RESISTANCE (HIGH)
 */
export function evaluateMeanReversion(
  token: TokenMarketData,
  config: StrategyConfig,
  currentPosition?: any
): StrategySignal | null {
  if (!config.meanReversionEnabled) return null;
  
  const rsi = token.rsi ?? 50; // Default to neutral if RSI not available
  const currentPrice = token.priceSOL ?? 0;
  const bollingerLower = token.bollingerLower ?? 0;
  const bollingerUpper = token.bollingerUpper ?? 0;
  
  // 🔥 BOLLINGER BAND FILTER: ENFORCE buying at SUPPORT (LOW) and selling at RESISTANCE (HIGH)
  // Price must be within ±15% window around lower/upper Bollinger Band (safe for microprice tokens)
  // If Bollinger data unavailable/invalid, fall back to RSI-only (maintain backward compatibility)
  const BOLLINGER_TOLERANCE = 0.15; // 15% tolerance from band (configurable)
  const MIN_VALID_PRICE = 1e-9; // Minimum valid price to avoid division-by-zero (protects against microprice edge cases)
  
  // Check if Bollinger data is valid and usable
  const hasBollingerData = bollingerLower >= MIN_VALID_PRICE && 
                           bollingerUpper >= MIN_VALID_PRICE && 
                           currentPrice >= MIN_VALID_PRICE &&
                           bollingerUpper > bollingerLower; // Upper must be > Lower
  
  // TRUE PROXIMITY CHECK: Price must be within ±15% window around band
  // Example: Lower band $1.00, tolerance 15% → Accept $0.85-$1.15 range
  // Uses multiplicative bounds to avoid division-by-zero for microprice tokens
  const lowerBandMin = bollingerLower * (1 - BOLLINGER_TOLERANCE); // $0.85 for $1.00 band
  const lowerBandMax = bollingerLower * (1 + BOLLINGER_TOLERANCE); // $1.15 for $1.00 band
  const upperBandMin = bollingerUpper * (1 - BOLLINGER_TOLERANCE); // $0.85 for $1.00 band
  const upperBandMax = bollingerUpper * (1 + BOLLINGER_TOLERANCE); // $1.15 for $1.00 band
  
  const nearLowerBand = hasBollingerData && currentPrice >= lowerBandMin && currentPrice <= lowerBandMax;
  const nearUpperBand = hasBollingerData && currentPrice >= upperBandMin && currentPrice <= upperBandMax;
  
  // BUY Signal: RSI oversold + REQUIRED near lower Bollinger Band (buying at SUPPORT = LOW)
  // Falls back to RSI-only if Bollinger data unavailable
  if (rsi < config.meanReversionRSIOversold && !currentPosition) {
    // ENFORCEMENT: If Bollinger data exists, MUST be near lower band (support)
    if (hasBollingerData && !nearLowerBand) {
      return null; // 🚨 BLOCKED: RSI oversold but NOT at support - wait for better entry
    }
    
    const oversoldSeverity = (config.meanReversionRSIOversold - rsi) / config.meanReversionRSIOversold;
    const atSupportBonus = nearLowerBand ? 10 : 0; // Extra confidence if at support
    const confidence = Math.min(95, 60 + (oversoldSeverity * 35) + atSupportBonus); // 60-95% confidence
    
    const supportInfo = nearLowerBand ? ' at support (lower BB)' : '';
    const fallbackInfo = !hasBollingerData ? ' (BB unavailable, RSI-only)' : '';
    
    return {
      strategy: "MEAN_REVERSION",
      action: "BUY",
      confidence,
      reasoning: `RSI ${rsi.toFixed(1)} oversold${supportInfo}${fallbackInfo} - buying LOW, expecting bounce`,
      positionSizePercent: config.meanReversionPositionSizePercent,
      profitTarget: config.meanReversionProfitTargetPercent,
      stopLoss: config.meanReversionStopLossPercent,
    };
  }
  
  // SELL Signal: RSI overbought + REQUIRED near upper Bollinger Band (selling at RESISTANCE = HIGH)
  // Falls back to RSI-only if Bollinger data unavailable
  if (rsi > config.meanReversionRSIOverbought && currentPosition) {
    // ENFORCEMENT: If Bollinger data exists, MUST be near upper band (resistance)
    if (hasBollingerData && !nearUpperBand) {
      return null; // 🚨 BLOCKED: RSI overbought but NOT at resistance - wait for better exit
    }
    
    const overboughtSeverity = (rsi - config.meanReversionRSIOverbought) / (100 - config.meanReversionRSIOverbought);
    const atResistanceBonus = nearUpperBand ? 10 : 0; // Extra confidence if at resistance
    const confidence = Math.min(95, 65 + (overboughtSeverity * 30) + atResistanceBonus); // 65-95% confidence
    
    const resistanceInfo = nearUpperBand ? ' at resistance (upper BB)' : '';
    const fallbackInfo = !hasBollingerData ? ' (BB unavailable, RSI-only)' : '';
    
    return {
      strategy: "MEAN_REVERSION",
      action: "SELL",
      confidence,
      reasoning: `RSI ${rsi.toFixed(1)} overbought${resistanceInfo}${fallbackInfo} - selling HIGH, taking profit`,
      positionSizePercent: 100, // Sell entire position
      profitTarget: 0,
      stopLoss: 0,
    };
  }
  
  return null; // No signal
}

/**
 * Strategy 2: Momentum Breakout (Enhanced with "Buy the Dip" filter)
 * Detect explosive price + volume moves early AFTER a dip
 * Catches pumps at the START, not after they're already pumped
 * 
 * Key Enhancement: Only buys momentum if token previously dipped
 * This ensures we're buying LOW before the pump, not HIGH during the pump
 */
export function evaluateMomentumBreakout(
  token: TokenMarketData,
  config: StrategyConfig,
  currentPosition?: any
): StrategySignal | null {
  if (!config.momentumBreakoutEnabled) return null;
  
  const priceChange1h = token.priceChange1h ?? 0;
  const volume24h = token.volume24h ?? 0;
  const priceChange24h = token.priceChange24h ?? 0;
  
  // Calculate volume threshold based on config multiplier
  // Base volume: $50k, then scale by multiplier (default 2.0x)
  const baseVolume = 50000; // $50k baseline
  const volumeThreshold = baseVolume * config.momentumBreakoutVolumeMultiplier;
  const volumeIsHigh = volume24h >= volumeThreshold;
  
  // 🔥 BUY THE DIP FILTER: Ensure we're buying LOW, not HIGH
  // Only buy momentum if:
  // 1. Strong 1h momentum (+15%)
  // 2. Token previously dipped (24h change is negative OR less than 1h change)
  // 3. Not buying at peak (24h change < +30%)
  //
  // This ensures we catch the RECOVERY after a dip, not the PEAK of a pump
  const hadPreviousDip = priceChange24h < priceChange1h; // Token dipped before recovering
  const notAtPeak = priceChange24h < 30; // Not already massively pumped in 24h
  
  // BUY Signal: Strong 1h price movement + good volume + buying after dip (LOW)
  if (
    priceChange1h >= config.momentumBreakoutPriceChangePercent &&
    volumeIsHigh &&
    hadPreviousDip && // 🚨 NEW: Only buy if token dipped first
    notAtPeak && // 🚨 NEW: Don't buy if already up 30%+ in 24h
    !currentPosition
  ) {
    // Confidence based on strength of move AND dip recovery
    const momentumStrength = priceChange1h / config.momentumBreakoutPriceChangePercent;
    const dipRecoveryBonus = hadPreviousDip ? 5 : 0; // Extra confidence if buying the dip
    const confidence = Math.min(95, 65 + (momentumStrength * 15) + dipRecoveryBonus); // 65-95% confidence
    
    return {
      strategy: "MOMENTUM_BREAKOUT",
      action: "BUY",
      confidence,
      reasoning: `Momentum after dip: +${priceChange1h.toFixed(1)}% in 1h (24h: ${priceChange24h.toFixed(1)}%) with $${(volume24h / 1000).toFixed(1)}k volume - buying recovery LOW`,
      positionSizePercent: config.momentumBreakoutPositionSizePercent,
      profitTarget: config.momentumBreakoutProfitTargetPercent,
      stopLoss: config.momentumBreakoutStopLossPercent,
    };
  }
  
  // 🔥 SELL Signal: Trailing stop to capture peak profits (sell HIGH)
  if (currentPosition && currentPosition.strategyType === "MOMENTUM_BREAKOUT") {
    const peakProfit = currentPosition.peakProfitPercent ?? 0;
    const currentProfit = currentPosition.lastCheckProfitPercent ?? 0;
    
    // ENHANCED SELL LOGIC: Multiple profit protection levels
    // 1. If we hit +20% profit target, take profit at HIGH
    if (currentProfit >= config.momentumBreakoutProfitTargetPercent) {
      return {
        strategy: "MOMENTUM_BREAKOUT",
        action: "SELL",
        confidence: 95,
        reasoning: `Momentum profit target HIT: ${currentProfit.toFixed(1)}% - selling at HIGH`,
        positionSizePercent: 100,
        profitTarget: 0,
        stopLoss: 0,
      };
    }
    
    // 2. Trailing stop: If we peaked at +15% but now down to +5%, sell (don't be greedy)
    if (peakProfit >= 15 && currentProfit < peakProfit * 0.5) {
      return {
        strategy: "MOMENTUM_BREAKOUT",
        action: "SELL",
        confidence: 90,
        reasoning: `Momentum fading: Peaked at ${peakProfit.toFixed(1)}%, now ${currentProfit.toFixed(1)}% - selling before reversal`,
        positionSizePercent: 100,
        profitTarget: 0,
        stopLoss: 0,
      };
    }
    
    // 3. If momentum is reversing (1h price change is negative), exit
    if (priceChange1h < -5) {
      return {
        strategy: "MOMENTUM_BREAKOUT",
        action: "SELL",
        confidence: 85,
        reasoning: `Momentum reversed: ${priceChange1h.toFixed(1)}% in 1h - exiting before bigger loss`,
        positionSizePercent: 100,
        profitTarget: 0,
        stopLoss: 0,
      };
    }
  }
  
  return null; // No signal
}

/**
 * Strategy 3: Grid Trading
 * Place multiple orders at intervals for ranging markets
 * Good for sideways price action, reduces timing risk
 * 
 * Note: For PumpFun's volatile tokens, this is adapted to work with
 * price zones rather than static grid levels
 */
export function evaluateGridTrading(
  token: TokenMarketData,
  config: StrategyConfig,
  currentPosition?: any,
  currentPrice?: number
): StrategySignal | null {
  if (!config.gridTradingEnabled) return null;
  
  // Grid trading works by defining price zones
  // For BUY: We want to buy when price drops into lower zones
  // For SELL: We want to sell when price rises into upper zones
  
  const priceChange1h = token.priceChange1h ?? 0;
  const priceChange24h = token.priceChange24h ?? 0;
  
  // Grid strategy is best for ranging (not trending) markets
  // Detect ranging: low volatility in both 1h and 24h
  const isRanging = Math.abs(priceChange1h) < 5 && Math.abs(priceChange24h) < 15;
  
  if (!isRanging) {
    return null; // Grid trading not suitable for trending markets
  }
  
  // BUY Signal: Price in lower grid zone (recent dip in ranging market)
  if (priceChange1h < -2 && priceChange1h > -8 && !currentPosition) {
    return {
      strategy: "GRID_TRADING",
      action: "BUY",
      confidence: 75, // Moderate confidence for grid trades
      reasoning: `Grid entry: Price dipped ${priceChange1h.toFixed(1)}% in ranging market`,
      positionSizePercent: config.gridTradingPerLevelSizePercent,
      profitTarget: config.gridTradingPriceGapPercent, // Small profit target
      stopLoss: config.gridTradingPriceGapPercent * 1.5, // Slightly wider stop loss
    };
  }
  
  // SELL Signal: Price rose to upper grid zone
  if (currentPosition && currentPosition.strategyType === "GRID_TRADING") {
    const currentProfit = currentPosition.lastCheckProfitPercent ?? 0;
    
    // Take profit at grid level
    if (currentProfit >= config.gridTradingPriceGapPercent) {
      return {
        strategy: "GRID_TRADING",
        action: "SELL",
        confidence: 80,
        reasoning: `Grid exit: Hit ${config.gridTradingPriceGapPercent}% profit target`,
        positionSizePercent: 100,
        profitTarget: 0,
        stopLoss: 0,
      };
    }
  }
  
  return null; // No signal
}

/**
 * Evaluate all enabled strategies and return the best signal
 * Prioritizes based on confidence and strategy appropriateness
 */
export function evaluateAllStrategies(
  token: TokenMarketData,
  config: StrategyConfig,
  currentPosition?: any,
  currentPrice?: number
): StrategySignal | null {
  const signals: StrategySignal[] = [];
  
  // Evaluate each strategy
  const meanReversionSignal = evaluateMeanReversion(token, config, currentPosition);
  if (meanReversionSignal) signals.push(meanReversionSignal);
  
  const momentumSignal = evaluateMomentumBreakout(token, config, currentPosition);
  if (momentumSignal) signals.push(momentumSignal);
  
  const gridSignal = evaluateGridTrading(token, config, currentPosition, currentPrice);
  if (gridSignal) signals.push(gridSignal);
  
  // No signals
  if (signals.length === 0) return null;
  
  // If we have a position, prioritize SELL signals
  if (currentPosition) {
    const sellSignals = signals.filter(s => s.action === "SELL");
    if (sellSignals.length > 0) {
      // Return highest confidence sell signal
      return sellSignals.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
    }
  }
  
  // For BUY signals, return highest confidence
  const buySignals = signals.filter(s => s.action === "BUY");
  if (buySignals.length > 0) {
    return buySignals.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );
  }
  
  return null;
}

/**
 * Check if a position should be sold based on strategy-specific rules
 * Called by position monitor for non-AI positions
 */
export function shouldSellPosition(
  position: any,
  currentPrice: number,
  token: TokenMarketData
): { shouldSell: boolean; reason?: string; confidence?: number } {
  const entryPrice = parseFloat(position.entryPriceSOL);
  const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
  
  const profitTarget = position.strategyProfitTarget ? parseFloat(position.strategyProfitTarget) : null;
  const stopLoss = position.strategyStopLoss ? parseFloat(position.strategyStopLoss) : null;
  
  // Check profit target
  if (profitTarget && profitPercent >= profitTarget) {
    return {
      shouldSell: true,
      reason: `${position.strategyType} profit target hit: ${profitPercent.toFixed(2)}% >= ${profitTarget}%`,
      confidence: 90,
    };
  }
  
  // Check stop loss
  if (stopLoss && profitPercent <= -stopLoss) {
    return {
      shouldSell: true,
      reason: `${position.strategyType} stop loss hit: ${profitPercent.toFixed(2)}% <= -${stopLoss}%`,
      confidence: 95,
    };
  }
  
  // Strategy-specific sell logic
  if (position.strategyType === "MEAN_REVERSION") {
    // Mean reversion also sells on overbought RSI
    const rsi = token.rsi ?? 50;
    if (rsi > 70) {
      return {
        shouldSell: true,
        reason: `Mean reversion: RSI ${rsi.toFixed(1)} overbought (>70)`,
        confidence: 85,
      };
    }
  }
  
  if (position.strategyType === "MOMENTUM_BREAKOUT") {
    // Momentum breakout sells if momentum reverses
    const priceChange1h = token.priceChange1h ?? 0;
    if (priceChange1h < -5) {
      return {
        shouldSell: true,
        reason: `Momentum breakout: Momentum reversed ${priceChange1h.toFixed(1)}% in 1h`,
        confidence: 80,
      };
    }
  }
  
  return { shouldSell: false };
}
