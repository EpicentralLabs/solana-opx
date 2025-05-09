import { type Position } from '@/components/omlp/my-lending-positions';
import { type PoolHistoricalData } from '@/components/omlp/omlp-pool-chart';
import { POOL_SUPPLY_LIMITS, DEFAULT_TOKEN_PRICES } from './config-omlp';

// Mock pool data for testing OMLP
export const mockPoolData = [
  {
    token: "SOL",
    supply: 0,
    supplyApy: 0,
    borrowed: 0,
    borrowApy: 0,
    utilization: 0,
    supplyLimit: POOL_SUPPLY_LIMITS.SOL,
    tokenPrice: DEFAULT_TOKEN_PRICES.SOL,
  },
  {
    token: "USDC",
    supply: 0,
    supplyApy: 0,
    borrowed: 0,
    borrowApy: 0,
    utilization: 0,
    supplyLimit: POOL_SUPPLY_LIMITS.USDC,
    tokenPrice: DEFAULT_TOKEN_PRICES.USDC,
  }
];

// Mock user lending positions
export const mockPositions: Position[] = [];

// Mock historical data for each pool
export const mockHistoricalData: Record<string, PoolHistoricalData[]> = {
  SOL: [],
  USDC: []
};
