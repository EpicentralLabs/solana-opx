interface OptionCalculation {
  price: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
}

/**
 * Calculates the cumulative distribution function (CDF) of a standard normal distribution.
 * 
 * This function returns the probability that a standard normal random variable is less than or equal to a given value.
 * 
 * @param x - The value for which the CDF is calculated.
 * @returns {number} - The cumulative probability corresponding to the given value `x`.
 * 
 * @example
 * const probability = normalCDF(1.96);
 * console.log(probability); // ~0.975
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/**
 * Calculates the probability density function (PDF) of a standard normal distribution.
 * 
 * This function returns the probability density at a given value for a standard normal random variable.
 * 
 * @param x - The value for which the PDF is calculated.
 * @returns {number} - The probability density corresponding to the given value `x`.
 * 
 * @example
 * const density = normalPDF(1.96);
 * console.log(density); // ~0.058
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculates the option price and Greeks (delta, gamma, theta, vega, rho) using the Black-Scholes model.
 *
 * Given whether the option is a call or put, along with the strike and spot prices, time until expiry (in seconds),
 * volatility, and the risk-free interest rate, this function computes the option price and its sensitivity measures.
 * If the time until expiry is zero or negative, it returns zero for both the price and Greeks.
 *
 * @param params - The parameters for option pricing.
 * @param params.isCall - Indicates if the option is a call (true) or a put (false).
 * @param params.strikePrice - Strike price of the option.
 * @param params.spotPrice - Current price of the underlying asset.
 * @param params.timeUntilExpirySeconds - Time remaining until expiry in seconds.
 * @param params.volatility - Volatility of the underlying asset (e.g., 0.2 for 20%).
 * @param params.riskFreeRate - Annual risk-free interest rate (e.g., 0.05 for 5%).
 *
 * @returns The calculated option price and Greeks.
 *
 * @example
 * const optionResult = calculateOption({
 *   isCall: true,
 *   strikePrice: 100,
 *   spotPrice: 105,
 *   timeUntilExpirySeconds: 3600 * 24 * 30, // 30 days
 *   volatility: 0.2,
 *   riskFreeRate: 0.05
 * });
 * console.log(optionResult.price); // Option price
 * console.log(optionResult.greeks.delta); // Option delta
 */

export function calculateOption(params: {
  isCall: boolean;
  strikePrice: number;
  spotPrice: number;
  timeUntilExpirySeconds: number;
  volatility: number;
  riskFreeRate: number;
}): OptionCalculation {
  // TODO: Uncomment this when we have a way to display the results
  //console.log('Input Parameters:', {
  //  type: params.isCall ? 'CALL' : 'PUT',
  //  strike: params.strikePrice.toFixed(2),
  //  spot: params.spotPrice.toFixed(2),
  //  timeToExpiryDays: (params.timeUntilExpirySeconds / (24 * 60 * 60)).toFixed(1),
  //  volatility: (params.volatility * 100).toFixed(1) + '%',
  //  riskFreeRate: (params.riskFreeRate * 100).toFixed(1) + '%'
  //});

  const timeToExpiry = convertTimeToYears(params.timeUntilExpirySeconds);
  
  if (timeToExpiry <= 0) {
    //console.log('Option Expired');
    return {
      price: 0,
      greeks: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }
    };
  }

  const S = params.spotPrice;
  const K = params.strikePrice;
  const T = timeToExpiry;
  const r = params.riskFreeRate;
  const v = params.volatility;
  const sqrtT = Math.sqrt(T);

  // Calculate d1 and d2 exactly as in Rust implementation
  const d1 = (Math.log(S / K) + (r + 0.5 * v * v) * T) / (v * sqrtT);
  const d2 = d1 - v * sqrtT;

  // TODO: Uncomment this when we have a way to display the results
  //console.log('Calculation Variables:', {
  //  timeToExpiryYears: T.toFixed(3),
  //  d1: d1.toFixed(4),
  //  d2: d2.toFixed(4),
  //  S, K, r, v
  //});

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const NNd1 = normalPDF(d1);

  let price: number;
  let delta: number;
  let gamma: number;
  let theta: number;
  let vega: number;
  let rho: number;

  // Match Rust implementation exactly
  if (params.isCall) {
    price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
    delta = Nd1;
    gamma = NNd1 / (S * v * sqrtT);
    theta = -(S * v * NNd1) / (2 * sqrtT) - r * K * Math.exp(-r * T) * Nd2;
    vega = S * sqrtT * NNd1;
    rho = K * T * Math.exp(-r * T) * Nd2;
  } else {
    const NegNd1 = normalCDF(-d1);
    const NegNd2 = normalCDF(-d2);
    price = K * Math.exp(-r * T) * NegNd2 - S * NegNd1;
    delta = -NegNd1;
    gamma = NNd1 / (S * v * sqrtT);
    theta = -(S * v * NNd1) / (2 * sqrtT) + r * K * Math.exp(-r * T) * NegNd2;
    vega = S * sqrtT * NNd1;
    rho = -K * T * Math.exp(-r * T) * NegNd2;
  }

  const result = {
    price: Math.max(0, price),
    greeks: {
      delta,
      gamma,
      theta,
      vega,
      rho
    }
  };
  // TODO: Uncomment this when we have a way to display the results
  //console.log('Option Calculation Result:', {
  //  price: result.price.toFixed(4),
  //  greeks: {
  //    delta: result.greeks.delta.toFixed(4),
  //    gamma: result.greeks.gamma.toFixed(6),
  //    theta: result.greeks.theta.toFixed(4),
  //    vega: result.greeks.vega.toFixed(4),
  //    rho: result.greeks.rho.toFixed(4)
  //  }
  //});

  return result;
}

/**
 * Executes a test run of the Black-Scholes option pricing calculation.
 *
 * This function invokes `calculateOption` with a predefined set of parameters—derived from a Rust test case—to compute the option price and corresponding Greeks for a call option. It serves as a basic validation of the pricing logic.
 *
 * @example
 * const result = testCalculation();
 * // Access result.price and result.greeks to inspect the computed values.
 *
 * @returns An object containing the calculated option price and Greeks.
 */
function testCalculation() {
  // Using the same values as in Rust test
  const testParams = {
    isCall: true, // Set by the user
    strikePrice: 110, // Set by the user
    spotPrice: 100, // Number fetched from an API
    timeUntilExpirySeconds: 716747, // 8.3 days in seconds
    volatility: 0.35, // Number fetched from an API
    riskFreeRate: 0.08 // Number fetched from an API
  };

  return calculateOption(testParams);
}

/**
 * Helper function to convert time from seconds to years
 * @param seconds Time in seconds
 * @returns Time in years
 */
function convertTimeToYears(seconds: number): number {
  return seconds / (365 * 24 * 60 * 60);
}

export { testCalculation };