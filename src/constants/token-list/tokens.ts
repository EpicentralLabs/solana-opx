/**
 * A constant object storing token details, including their blockchain address and decimals.
 * 
 * Each token symbol maps to an object containing:
 * - `address`: The Solana blockchain address of the token.
 * - `decimals`: The number of decimal places the token uses.
 */
export const TOKENS = {
    SOL: {
      address: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana'
    },
    LABS: {
      address: 'LABSh5DTebUcUbEoLzXKCiXFJLecDFiDWiBGUU1GpxR',
      decimals: 9,
      symbol: 'LABS',
      name: 'Epicentral Labs'
    },
    // Add more tokens here that we wish to list on the exchange.
  } as const
  