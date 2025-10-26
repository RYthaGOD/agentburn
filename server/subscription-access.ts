// Subscription and free trades access control for AI Trading Bot
// Everyone gets 20 free trades, then pays 0.15 SOL for 2 weeks unlimited access

const FREE_TRADES_LIMIT = 20;

/**
 * Check if a user has access to the AI Trading Bot
 * Returns true if:
 * 1. User has free trades remaining (< 20 trades), OR
 * 2. User has an active, non-expired subscription
 */
export function hasAIBotAccess(config: {
  freeTradesUsed: number;
  subscriptionActive: boolean;
  subscriptionExpiresAt: Date | null;
}): boolean {
  // Check if user has free trades remaining
  const hasFreeTradesRemaining = config.freeTradesUsed < FREE_TRADES_LIMIT;
  
  if (hasFreeTradesRemaining) {
    return true;
  }
  
  // Check if user has an active subscription that hasn't expired
  if (config.subscriptionActive && config.subscriptionExpiresAt) {
    const now = new Date();
    const isNotExpired = now < config.subscriptionExpiresAt;
    return isNotExpired;
  }
  
  return false;
}

/**
 * Get the number of free trades remaining for a user
 */
export function getFreeTradesRemaining(freeTradesUsed: number): number {
  return Math.max(0, FREE_TRADES_LIMIT - freeTradesUsed);
}

/**
 * Get a user-friendly access status message
 */
export function getAccessStatusMessage(config: {
  freeTradesUsed: number;
  subscriptionActive: boolean;
  subscriptionExpiresAt: Date | null;
}): {
  hasAccess: boolean;
  message: string;
  freeTradesRemaining: number;
} {
  const freeTradesRemaining = getFreeTradesRemaining(config.freeTradesUsed);
  const hasAccess = hasAIBotAccess(config);
  
  if (freeTradesRemaining > 0) {
    return {
      hasAccess: true,
      message: `${freeTradesRemaining} free trades remaining`,
      freeTradesRemaining,
    };
  }
  
  if (config.subscriptionActive && config.subscriptionExpiresAt) {
    const now = new Date();
    const isNotExpired = now < config.subscriptionExpiresAt;
    
    if (isNotExpired) {
      const daysRemaining = Math.ceil(
        (config.subscriptionExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        hasAccess: true,
        message: `Subscription active (${daysRemaining} days remaining)`,
        freeTradesRemaining: 0,
      };
    } else {
      return {
        hasAccess: false,
        message: "Subscription expired. Please renew for 0.15 SOL to continue trading.",
        freeTradesRemaining: 0,
      };
    }
  }
  
  return {
    hasAccess: false,
    message: "Free trades used. Pay 0.15 SOL for 2 weeks unlimited access.",
    freeTradesRemaining: 0,
  };
}
