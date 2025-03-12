import { 
  BASE_ANNUAL_INTEREST_RATE,
  OPTION_CREATION_FEE_RATE,
  BORROW_FEE_RATE,
  TRANSACTION_COST_SOL,
  MAX_LEVERAGE
} from "@/constants/option-lab/constants";

export const calculateTotalPremium = (options: any[]) => {
  return options.reduce((total, option) => {
    return total + (Number(option.premium) * option.quantity * 100)
  }, 0)
}

export const calculateCollateralNeeded = (options: any[]) => {
  return options.reduce((total, option) => {
    // For calls, collateral is 100% of strike price
    if (option.optionType.toLowerCase() === 'call') {
      return total + (Number(option.strikePrice) * option.quantity * 100)
    }
    // For puts, collateral is strike price in USD
    return total + (Number(option.strikePrice) * option.quantity * 100)
  }, 0)
}

export const calculateRequiredCollateral = (
  collateralNeeded: number,
  positionSize: number
) => {
  // If position size is greater than collateral needed, reduce the required collateral proportionally
  if (positionSize > 0) {
    const coverage = Math.min(positionSize / collateralNeeded, 1)
    return collateralNeeded * (1 - coverage)
  }
  return collateralNeeded
}

export const hasEnoughCollateral = (
  collateralNeeded: number,
  collateralProvided: number,
  leverage: number
) => {
  const totalAvailable = collateralProvided * leverage
  return totalAvailable >= collateralNeeded
}

export const calculateOptimalLeverage = (
  collateralNeeded: number,
  collateralProvided: number,
  maxLeverage: number = MAX_LEVERAGE
): number => {
  if (collateralProvided <= 0) return 1;
  
  // Calculate the leverage needed to exactly meet the collateral requirement
  const requiredLeverage = collateralNeeded / collateralProvided;
  
  // Round to 2 decimal places and ensure the leverage is within bounds
  return Number(Math.min(Math.max(1, requiredLeverage), maxLeverage).toFixed(2));
}

// Calculate hourly interest rate from annual rate
export const calculateHourlyInterestRate = (annualRate: number = BASE_ANNUAL_INTEREST_RATE): number => {
  return annualRate / (365 * 24);
}

// Calculate borrowing cost
export const calculateBorrowCost = (
  amountBorrowed: number,
  hourlyRate: number,
  hours: number
): number => {
  return amountBorrowed * hourlyRate * hours;
}

// Calculate option creation fee (uses OPTION_CREATION_FEE_RATE from constants)
export const calculateOptionCreationFee = (): number => {
  return OPTION_CREATION_FEE_RATE;
}

// Calculate borrow fee (uses BORROW_FEE_RATE from constants)
export const calculateBorrowFee = (amountBorrowed: number): number => {
  return amountBorrowed * BORROW_FEE_RATE;
}

// Calculate maximum profit potential
export const calculateMaxProfitPotential = (
  totalPremium: number,
  borrowCost: number,
  optionCreationFee: number,
  transactionCost: number = TRANSACTION_COST_SOL,
  solPrice: number = 1 // Default SOL price in USD if not provided
): number => {
  const transactionCostInUSD = transactionCost * solPrice;
  return totalPremium - borrowCost - optionCreationFee - transactionCostInUSD;
}

/**
 * Calculate the liquidation price for an option seller based on their collateral and leverage
 * 
 * @param options Array of option positions
 * @param collateralProvided Amount of collateral provided by the seller
 * @param leverage Leverage used by the seller
 * @param currentPrice Current price of the underlying asset
 * @returns An object containing liquidation prices: {upward: number|null, downward: number|null}
 */
export const calculateLiquidationPrice = (
  options: any[], 
  collateralProvided: number,
  leverage: number,
  currentPrice: number
): { upward: number | null, downward: number | null } => {
  if (options.length === 0 || collateralProvided <= 0 || currentPrice <= 0) {
    return { upward: null, downward: null };
  }

  // Total premium received (this is our max profit at expiration)
  const totalPremium = calculateTotalPremium(options);
  
  // Liquidation occurs when losses exceed collateral provided
  // We need to find prices where: totalPremium - optionPayout = -collateralProvided
  
  // Initialize liquidation prices
  let upwardLiquidationPrice: number | null = null;
  let downwardLiquidationPrice: number | null = null;
  
  // Separate calls and puts for easier analysis
  const calls = options.filter(opt => opt.optionType.toLowerCase() === 'call');
  const puts = options.filter(opt => opt.optionType.toLowerCase() === 'put');
  
  // Check for upward liquidation (relevant when selling calls)
  if (calls.length > 0) {
    // For each call option, calculate at what higher price we hit liquidation
    // For simplicity, we'll use a linear approximation for the worst-case call
    const worstCall = calls.reduce((worst, current) => {
      const currentRisk = Number(current.quantity) * 100; // 100 units per contract
      const worstRisk = Number(worst?.quantity || 0) * 100;
      return currentRisk > worstRisk ? current : worst;
    }, null);
    
    if (worstCall) {
      const strikePrice = Number(worstCall.strikePrice);
      // At liquidation: totalPremium - leverage * (price - strike) * quantity * 100 = -collateralProvided
      // Solve for price:
      const price = strikePrice + (totalPremium + collateralProvided) / (leverage * Number(worstCall.quantity) * 100);
      upwardLiquidationPrice = price > strikePrice ? price : null;
    }
  }
  
  // Check for downward liquidation (relevant when selling puts)
  if (puts.length > 0) {
    // For each put option, calculate at what lower price we hit liquidation
    // For simplicity, we'll use a linear approximation for the worst-case put
    const worstPut = puts.reduce((worst, current) => {
      const currentRisk = Number(current.quantity) * 100; // 100 units per contract
      const worstRisk = Number(worst?.quantity || 0) * 100;
      return currentRisk > worstRisk ? current : worst;
    }, null);
    
    if (worstPut) {
      const strikePrice = Number(worstPut.strikePrice);
      // At liquidation: totalPremium - leverage * (strike - price) * quantity * 100 = -collateralProvided
      // Solve for price:
      const price = strikePrice - (totalPremium + collateralProvided) / (leverage * Number(worstPut.quantity) * 100);
      downwardLiquidationPrice = price < strikePrice && price > 0 ? price : null;
    }
  }
  
  return { upward: upwardLiquidationPrice, downward: downwardLiquidationPrice };
}; 