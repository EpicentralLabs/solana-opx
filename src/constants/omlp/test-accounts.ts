import { type Position } from '@/components/omlp/my-lending-positions';
import { type PoolHistoricalData } from '@/components/omlp/omlp-pool-chart';

// Mock pool data for testing OMLP
export const mockPoolData = [
  {
    token: "SOL",
    supply: 0,
    supplyApy: 0,
    borrowed: 0,
    borrowApy: 0,
    utilization: 0,
    supplyLimit: 10000,
    tokenPrice: 0, // Will be updated with real price
  },
  {
    token: "USDC",
    supply: 0,
    supplyApy: 0,
    borrowed: 0,
    borrowApy: 0,
    utilization: 0,
    supplyLimit: 100000,
    tokenPrice: 1, // USDC is a stablecoin
  }
];

// Mock user lending positions
export const mockPositions: Position[] = [];

// Mock historical data for each pool
export const mockHistoricalData: Record<string, PoolHistoricalData[]> = {
  SOL: [],
  USDC: []
};
