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

/**
 * Returns an array of dates occurring at 14-day intervals between the specified start and end dates.
 *
 * The function begins at the start date and increments by 14 days until the current date exceeds the end date.
 * Both the start date and any date equal to the end date are included if they fall on the bi-weekly schedule.
 *
 * @param startDate - The date marking the beginning of the interval.
 * @param endDate - The inclusive end date of the interval.
 * @returns An array of Date objects representing the bi-weekly dates.
 */
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