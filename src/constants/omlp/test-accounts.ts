// Mock pool data for testing OMLP
export const mockPoolData = [
  {
    token: "SOL",
    supply: 5000,
    supplyApy: 3.5,
    borrowed: 2000,
    borrowApy: 5.2,
    utilization: 40,
    supplyLimit: 10000,
    tokenPrice: 87.45,
  },
  {
    token: "USDC",
    supply: 1000000,
    supplyApy: 4.2,
    borrowed: 750000,
    borrowApy: 6.5,
    utilization: 75,
    supplyLimit: 2000000,
    tokenPrice: 1,
  },
  {
    token: "BONK",
    supply: 150000000,
    supplyApy: 8.5,
    borrowed: 100000000,
    borrowApy: 12.3,
    utilization: 66.67,
    supplyLimit: 300000000,
    tokenPrice: 0.00001,
  },
  {
    token: "JUP",
    supply: 250000,
    supplyApy: 5.8,
    borrowed: 125000,
    borrowApy: 8.7,
    utilization: 50,
    supplyLimit: 500000,
    tokenPrice: 0.75,
  },
];

// Mock user lending positions
export const mockPositions = [
  {
    token: "SOL",
    amount: 50 * 87.45, // Converting to USD
    apy: 3.5,
    earned: 8.75,
  },
  {
    token: "USDC",
    amount: 10000,
    apy: 4.2,
    earned: 210,
  },
];

// Mock historical data for each pool
export const mockHistoricalData = {
  SOL: [
    { timestamp: 1672531200, supplyApy: 2.8, borrowApy: 4.5, utilization: 35 },
    { timestamp: 1675209600, supplyApy: 3.0, borrowApy: 4.8, utilization: 38 },
    { timestamp: 1677628800, supplyApy: 3.2, borrowApy: 5.0, utilization: 40 },
    { timestamp: 1680307200, supplyApy: 3.4, borrowApy: 5.2, utilization: 42 },
    { timestamp: 1682899200, supplyApy: 3.5, borrowApy: 5.2, utilization: 40 },
  ],
  USDC: [
    { timestamp: 1672531200, supplyApy: 3.8, borrowApy: 5.8, utilization: 65 },
    { timestamp: 1675209600, supplyApy: 4.0, borrowApy: 6.0, utilization: 68 },
    { timestamp: 1677628800, supplyApy: 4.2, borrowApy: 6.3, utilization: 72 },
    { timestamp: 1680307200, supplyApy: 4.2, borrowApy: 6.5, utilization: 75 },
    { timestamp: 1682899200, supplyApy: 4.2, borrowApy: 6.5, utilization: 75 },
  ],
  BONK: [
    { timestamp: 1672531200, supplyApy: 7.0, borrowApy: 10.5, utilization: 55 },
    { timestamp: 1675209600, supplyApy: 7.5, borrowApy: 11.0, utilization: 58 },
    { timestamp: 1677628800, supplyApy: 8.0, borrowApy: 11.5, utilization: 62 },
    { timestamp: 1680307200, supplyApy: 8.2, borrowApy: 12.0, utilization: 65 },
    { timestamp: 1682899200, supplyApy: 8.5, borrowApy: 12.3, utilization: 66.67 },
  ],
  JUP: [
    { timestamp: 1672531200, supplyApy: 5.0, borrowApy: 7.5, utilization: 45 },
    { timestamp: 1675209600, supplyApy: 5.2, borrowApy: 7.8, utilization: 46 },
    { timestamp: 1677628800, supplyApy: 5.5, borrowApy: 8.2, utilization: 48 },
    { timestamp: 1680307200, supplyApy: 5.7, borrowApy: 8.5, utilization: 49 },
    { timestamp: 1682899200, supplyApy: 5.8, borrowApy: 8.7, utilization: 50 },
  ],
};
