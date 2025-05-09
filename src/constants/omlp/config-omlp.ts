/**
 * OMLP System Parameters
 * This file contains configurable parameters for the OMLP lending protocol
 */

// Pool supply limits by token
export const POOL_SUPPLY_LIMITS: Record<string, number> = {
  SOL: 10000,
  USDC: 100000,
};

// APY calculation parameters
export const SUPPLY_APY_PARAMS = {
  baseRate: 0.10,
  utilizationFactor: 0.05,
  protocolSpread: 0.50, // 0.10% spread
};

export const BORROW_APY_PARAMS = {
  baseRate: 0,
  utilizationFactor: 0.08,
  protocolSpread: 0.50, // 0.10% spread
  highUtilizationThreshold: 80, // percentage
  highUtilizationPremiumFactor: 0.2,
};

// Collateral and liquidation parameters
export const COLLATERAL_PARAMS = {
  defaultLTV: 0.7, // Default Loan-to-Value ratio (70%)
  liquidationThreshold: 0.9, // Default liquidation threshold (90%)
};

// Token price defaults (for testing purposes)
export const DEFAULT_TOKEN_PRICES: Record<string, number> = {
  SOL: 0, // Will be updated with real price
  USDC: 1, // USDC is a stablecoin
}; 