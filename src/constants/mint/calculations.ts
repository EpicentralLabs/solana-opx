import { 
  BASE_ANNUAL_INTEREST_RATE,
  OPTION_CREATION_FEE_RATE,
  BORROW_FEE_RATE,
  TRANSACTION_COST_SOL,
  MAX_LEVERAGE
} from "@/constants/mint/constants";

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