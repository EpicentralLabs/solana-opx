/**
 * Calculates the utilization rate of a pool
 * @param borrowed The amount borrowed from the pool
 * @param supply The total supply in the pool
 * @returns The utilization rate as a percentage
 */
export function calculateUtilization(borrowed: number, supply: number): number {
  if (supply === 0) return 0;
  return (borrowed / supply) * 100;
}

/**
 * Calculates the supply APY based on utilization
 * @param utilization The pool utilization rate (0-100)
 * @returns The supply APY as a percentage
 */
export function calculateSupplyAPY(utilization: number): number {
  // Base rate plus a factor based on utilization
  const baseRate = 1.0;
  const utilizationFactor = 0.05;
  return baseRate + (utilization * utilizationFactor);
}

/**
 * Calculates the borrow APY based on utilization
 * @param utilization The pool utilization rate (0-100)
 * @returns The borrow APY as a percentage
 */
export function calculateBorrowAPY(utilization: number): number {
  // Base rate plus a factor based on utilization
  // As utilization increases, borrowing becomes more expensive
  const baseRate = 3.0;
  const utilizationFactor = 0.08;
  
  // Additional premium when utilization gets high
  const highUtilizationPremium = utilization > 80 ? (utilization - 80) * 0.2 : 0;
  
  return baseRate + (utilization * utilizationFactor) + highUtilizationPremium;
}

/**
 * Calculates earned interest for a lender
 * @param amount The amount lent to the pool
 * @param apy The current APY
 * @param daysElapsed The number of days since lending
 * @returns The amount earned in interest
 */
export function calculateEarnedInterest(amount: number, apy: number, daysElapsed: number): number {
  // Convert APY to daily rate
  const dailyRate = apy / 365 / 100;
  return amount * dailyRate * daysElapsed;
}

/**
 * Calculates the interest owed by a borrower
 * @param amount The amount borrowed from the pool
 * @param apy The current borrow APY
 * @param daysElapsed The number of days since borrowing
 * @returns The amount of interest owed
 */
export function calculateInterestOwed(amount: number, apy: number, daysElapsed: number): number {
  // Convert APY to daily rate
  const dailyRate = apy / 365 / 100;
  return amount * dailyRate * daysElapsed;
}

/**
 * Calculates the maximum borrow amount based on collateral
 * @param collateralAmount The amount of collateral provided
 * @param collateralPrice The price of the collateral token
 * @param borrowTokenPrice The price of the token to be borrowed
 * @param ltv The loan-to-value ratio (0-1)
 * @returns The maximum amount that can be borrowed
 */
export function calculateMaxBorrowAmount(
  collateralAmount: number,
  collateralPrice: number,
  borrowTokenPrice: number,
  ltv: number = 0.7 // Default LTV of 70%
): number {
  const collateralValue = collateralAmount * collateralPrice;
  const maxBorrowValue = collateralValue * ltv;
  return maxBorrowValue / borrowTokenPrice;
}

/**
 * Calculates the health factor of a position
 * @param collateralAmount The amount of collateral provided
 * @param collateralPrice The price of the collateral token
 * @param borrowedAmount The amount borrowed
 * @param borrowedPrice The price of the borrowed token
 * @param liquidationThreshold The threshold for liquidation (0-1)
 * @returns The health factor (>1 is healthy, <1 is subject to liquidation)
 */
export function calculateHealthFactor(
  collateralAmount: number,
  collateralPrice: number,
  borrowedAmount: number,
  borrowedPrice: number,
  liquidationThreshold: number = 0.8 // Default liquidation threshold of 80%
): number {
  const collateralValue = collateralAmount * collateralPrice;
  const borrowedValue = borrowedAmount * borrowedPrice;
  
  if (borrowedValue === 0) return Number.POSITIVE_INFINITY;
  
  return (collateralValue * liquidationThreshold) / borrowedValue;
}
