export const EDIT_REFRESH_INTERVAL = 1500; // 1.5 second debounce
export const AUTO_REFRESH_INTERVAL = 3000; // 3 seconds

export const COLLATERAL_TYPES = [
  { value: "USDC", label: "USDC", default: true }
  // Add more here that we wish to have as a collateral type
] as const;

// Financial constants
export const BASE_ANNUAL_INTEREST_RATE = 0.1456; // 14.56% annual interest rate
export const OPTION_CREATION_FEE_RATE = 0.01; // 0.01 SOL
export const BORROW_FEE_RATE = 0.00035; // 0.035% of the amount borrowed
export const TRANSACTION_COST_SOL = 0.02; // 0.02 SOL
export const MAX_LEVERAGE = 10; // 10x leverage
export const STANDARD_CONTRACT_SIZE = 100; // 100 units of the underlying 

// Get all bi-weekly expiration dates between two dates for the calendar
export function getBiWeeklyDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 14);
  }
  return dates;
}

export const startDate = new Date(2025, 0, 1); // January 1st, 2025
export const endDate = new Date(2026, 0, 1);   // January 1st, 2026
export const allowedDates = getBiWeeklyDates(startDate, endDate); 