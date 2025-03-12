import { calculateOption } from "@/lib/option-pricing-model/black-scholes-model";
import { convertTimeToYears } from "@/utils/math/convertTimeToYears";

const getExpectedValues = (optionType: "call" | "put") => {
  const commonGreeks = {
    gamma: 0.0620, 
    theta: -0.1978,
    vega: 0.5611
  };

  if (optionType === "call") {
    return {
      price: 5.2014,
      greeks: {
        delta: 0.6214, 
        rho: 0.0841, 
        ...commonGreeks
      }
    };
  } else {
    return {
      price: 28.3589,
      greeks: {
        delta: -0.3786, 
        rho: -0.0841, 
        ...commonGreeks
      }
    };
  }
};
const validateParams = (params: OptionParams) => {
    // Check if spot price and strike price are reasonable
    if (params.spotPrice <= 0 || params.strikePrice <= 0) {
      throw new Error("Spot price and strike price must be positive values.");
    }
  
    // Check if volatility is within a reasonable range (0-1 for most cases, but can be higher in some markets)
    if (params.volatility < 0 || params.volatility > 5) {
      throw new Error("Volatility must be between 0 and 5.");
    }
  
    // Check if risk-free rate is reasonable (e.g., not negative or too high)
    if (params.riskFreeRate < 0 || params.riskFreeRate > 1) {
      throw new Error("Risk-free rate must be between 0 and 1.");
    }
  
    // Check if time until expiry is a positive number
    if (params.timeUntilExpirySeconds <= 0) {
      throw new Error("Time until expiry must be a positive value.");
    }
  
    // Check for unrealistic scenarios where a call option price would be very low or negative
    if (params.isCall && params.strikePrice > params.spotPrice) {
      throw new Error("For call options, the strike price should not be significantly higher than the spot price.");
    }
  
    // Check for unrealistic scenarios where a put option price would be very high or negative
    if (!params.isCall && params.strikePrice < params.spotPrice) {
      throw new Error("For put options, the strike price should not be significantly lower than the spot price.");
    }
  };
describe("Option Pricing Calculation", () => {
  let params: OptionParams;

  beforeEach(() => {
    // Common parameters for both tests
    params = {
      strikePrice: 250,
      spotPrice: 265.14,
      timeUntilExpirySeconds: 716747, // 8.3 days in seconds
      volatility: 0.55,
      riskFreeRate: 0.08,
      isCall: true // Default to call option
    };
  });

  /**
   * Test case for calculating the price and Greeks of a call option.
   * The test compares the calculated option price and Greeks with the expected values.
   */
  it("should calculate call option correctly", () => {
    const timeToExpiryYears = convertTimeToYears(params.timeUntilExpirySeconds);
    const expected = getExpectedValues("call");

    const result = calculateOption({ ...params, isCall: true });

    expect(result.price).toBeCloseTo(expected.price, 4);
    expect(result.greeks.delta).toBeCloseTo(expected.greeks.delta, 4);
    expect(result.greeks.gamma).toBeCloseTo(expected.greeks.gamma, 4);
    expect(result.greeks.theta).toBeCloseTo(expected.greeks.theta, 4);
    expect(result.greeks.vega).toBeCloseTo(expected.greeks.vega, 4);
    expect(result.greeks.rho).toBeCloseTo(expected.greeks.rho, 4);
  });

  /**
   * Test case for calculating the price and Greeks of a put option.
   * The test compares the calculated option price and Greeks with the expected values.
   */
  it("should calculate put option correctly", () => {
    const timeToExpiryYears = convertTimeToYears(params.timeUntilExpirySeconds);
    const expected = getExpectedValues("put");

    const result = calculateOption({ ...params, isCall: false });

    expect(result.price).toBeCloseTo(expected.price, 4);
    expect(result.greeks.delta).toBeCloseTo(expected.greeks.delta, 4);
    expect(result.greeks.gamma).toBeCloseTo(expected.greeks.gamma, 4);
    expect(result.greeks.theta).toBeCloseTo(expected.greeks.theta, 4);
    expect(result.greeks.vega).toBeCloseTo(expected.greeks.vega, 4);
    expect(result.greeks.rho).toBeCloseTo(expected.greeks.rho, 4);
  });

  /**
   * Test case for handling expired options.
   * The test sets the time to expiry to 0 and checks that the price and Greeks are all 0.
   */
  it("should handle expired options correctly", () => {
    params.timeUntilExpirySeconds = 0; // Expired option
    const result = calculateOption({ ...params, isCall: true });

    expect(result.price).toBe(0);
    expect(result.greeks.delta).toBe(0);
    expect(result.greeks.gamma).toBe(0);
    expect(result.greeks.theta).toBe(0);
    expect(result.greeks.vega).toBe(0);
    expect(result.greeks.rho).toBe(0);
  });

  /**
   * Test case for handling options with very short expiry time.
   * The test sets the expiry time to 1 second and checks that the price and delta are close to 0.
   */it("should handle options with very short expiry time", () => {
  const expiryTimes = [5, 1, 0.5, 0.1]; // 5 seconds, 1 second, 500ms, 100ms
  expiryTimes.forEach(time => {
    params.timeUntilExpirySeconds = time;
    console.log(`Testing with expiry time: ${time} seconds`);
    const result = calculateOption({ ...params, isCall: true });
    console.log(`Result for expiry time ${time} seconds:`, result);
    expect(result.price).toBeCloseTo(0, 4);
    expect(result.greeks.delta).toBeCloseTo(0, 4);
  });
});


  /**
   * Test case for handling options with extremely high volatility.
   * The test sets the volatility to 5.0 and ensures that the price is greater than 0.
   */
  it("should handle options with very high volatility", () => {
    params.volatility = 5.0; // Extremely high volatility
    const result = calculateOption({ ...params, isCall: true });

    expect(result.price).toBeGreaterThan(0); // Should still be a valid price
  });
});
