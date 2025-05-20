import { format } from 'date-fns'

/**
 * The BirdEye API base URL.
 * Typically provided by the NEXT_PUBLIC_BIRDEYE_API_URL environment variable,
 * and defaults to an empty string if not set.
 *
 * @constant {string}
 */
export const BIRDEYE_API_URL: string = process.env.NEXT_PUBLIC_BIRDEYE_API_URL || ''

/**
 * The key used for storing prices in local storage.
 *
 * @constant {string}
 */
export const PRICE_STORAGE_KEY: string = 'stored-prices'

/**
 * Formats a given date string into a human-readable format.
 *
 * This function creates a Date object from the provided date string and then
 * formats it using the "MMMM do, yyyy" pattern (e.g., "January 31st, 2025").
 *
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date string.
 */
const formatExpirationDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return format(date, "MMMM do, yyyy")
}

/**
 * Formats a given date string into a compact format for option expiration dates.
 *
 * This function creates a Date object from the provided date string and then
 * formats it using the "MMM-dd-yyyy" pattern (e.g., "Jan-01-2025").
 *
 * @param {string} dateStr - The date string to format.
 * @returns {string} The formatted date string.
 */
export const formatOptionExpirationDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return format(utcDate, "MMM-dd-yyyy")
}

/**
 * Represents an expiration date option.
 *
 * @typedef {Object} ExpirationDate
 * @property {string} value - The expiration date value in ISO format (e.g., "2025-01-31").
 * @property {string} label - The formatted expiration date label (e.g., "January 31st, 2025").
 * @property {boolean} isMonthly - Indicates whether the expiration date is a monthly expiration.
 */
export type ExpirationDate = {
  value: string
  label: string
  isMonthly: boolean
}

// Asset Price Refresh Interval
export const ASSET_PRICE_REFRESH_INTERVAL = 1500; // 1.5 seconds

// SOL PH Volatility
export const SOL_PH_VOLATILITY = 1.16;

// SOL PH Risk Free Rate
export const SOL_PH_RISK_FREE_RATE = 0.08;

// Option Chain Constants
export const OPTION_SPREAD_PERCENTAGE = 0.01; // 1% bid-ask spread
export const DEFAULT_OPTION_VOLUME = 0;
export const DEFAULT_OPTION_OPEN_INTEREST = 0;

// Maximum number of option legs allowed in an order
export const MAX_OPTION_LEGS = 4;

// Test expiration dates array for development
export const EMPTY_EXPIRATION_DATES: ExpirationDate[] = [];

// Option formatting constants
export const OPTION_POSITION_TYPE = {
  BID: 'Long',
  ASK: 'Short'
} as const;

/**
 * Formats a selected option into a standardized display format.
 * 
 * Format: {AssetType}-{Call/Put}-{StrikePrice}-{ExpirationDate}
 * The Long/Short indicator is now handled by the Badge component.
 * 
 * @param {object} params - The parameters for formatting the option.
 * @param {string} params.asset - The asset symbol (e.g., 'SOL').
 * @param {string} params.side - The option side ('call' or 'put').
 * @param {number} params.strike - The strike price.
 * @param {string} params.expiry - The expiration date string.
 * @returns {string} The formatted option string.
 */
export const formatSelectedOption = ({
  asset,
  side,
  strike,
  expiry
}: {
  type?: 'bid' | 'ask',
  asset: string,
  side: 'call' | 'put',
  strike: number,
  expiry: string
}): string => {
  const optionType = side.charAt(0).toUpperCase() + side.slice(1);
  const formattedExpiry = formatOptionExpirationDate(expiry);
  const formattedStrike = strike.toFixed(2);
  
  return `${asset} ${optionType} $${formattedStrike} ${formattedExpiry}`;
}

// Option Lab Constants
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