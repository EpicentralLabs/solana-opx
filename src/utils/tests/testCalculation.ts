import { calculateOption } from "@/lib/option-pricing-model/black-scholes-model";
import { OptionCalculation } from "@/types/options/optionCalculation";

/**
 * Runs an option pricing calculation using the given parameters.
 *
 * @param {Object} params - The parameters for the option calculation.
 * @param {boolean} params.isCall - Whether the option is a call (true) or put (false).
 * @param {number} params.strikePrice - The strike price of the option.
 * @param {number} params.spotPrice - The current price of the underlying asset.
 * @param {number} params.timeUntilExpirySeconds - Time until expiry in seconds.
 * @param {number} params.volatility - The implied volatility of the option.
 * @param {number} params.riskFreeRate - The risk-free interest rate.
 * @returns {OptionCalculation} The calculated option price and Greeks.
 */
export function testCalculation(params: {
  isCall: boolean;
  strikePrice: number;
  spotPrice: number;
  timeUntilExpirySeconds: number;
  volatility: number;
  riskFreeRate: number;
}): OptionCalculation {
  console.log("Running option test calculation with parameters:", params);
  
  const result = calculateOption(params);
  
  console.log("Option Calculation Result:", {
    price: result.price.toFixed(4),
    greeks: {
      delta: result.greeks.delta.toFixed(4),
      gamma: result.greeks.gamma.toFixed(6),
      theta: result.greeks.theta.toFixed(4),
      vega: result.greeks.vega.toFixed(4),
      rho: result.greeks.rho.toFixed(4),
    },
  });

  return result;
}
