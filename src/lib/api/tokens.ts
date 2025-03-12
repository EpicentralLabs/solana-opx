import { TOKENS as CONST_TOKENS } from '@/constants/token-list/tokens'

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}

export const TOKENS: { [key: string]: Token } = CONST_TOKENS