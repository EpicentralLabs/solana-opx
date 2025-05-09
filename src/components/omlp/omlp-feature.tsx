'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'
import { MyLendingPositions, type Position } from './my-lending-positions'
import { LendingPools, type Pool } from './lending-pools'
import { type PoolHistoricalData } from './omlp-pool-chart'
import { useState, useEffect } from 'react'
import { mockPoolData, mockPositions, mockHistoricalData } from '@/constants/omlp/test-accounts'
import { calculateUtilization, calculateSupplyAPY, calculateBorrowAPY } from '@/constants/omlp/calculations'
import { toast } from 'sonner'
import { getTokenPrice } from '@/lib/api/getTokenPrice'

// Dynamically import the WalletButton with SSR disabled to prevent hydration issues
const WalletButton = dynamic(
  () => import('../wallet/wallet-button').then(mod => mod.WalletButton),
  { ssr: false }
)

export function OMLPFeature() {
  const { publicKey } = useWallet()
  const [pools, setPools] = useState<Pool[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoadingPools, setIsLoadingPools] = useState(true)
  const [isLoadingPositions, setIsLoadingPositions] = useState(true)

  // Fetch pools with real SOL price data
  const fetchPools = async () => {
    try {
      setIsLoadingPools(true)
      // Get real SOL price
      const solPriceData = await getTokenPrice('SOL')
      
      // Update the mock data with real SOL price
      const updatedPools = mockPoolData.map(pool => {
        if (pool.token === 'SOL') {
          // Update SOL token price with real data
          pool.tokenPrice = solPriceData.price
        }
        
        const utilization = calculateUtilization(pool.borrowed, pool.supply)
        return {
          ...pool,
          utilization,
          supplyApy: calculateSupplyAPY(utilization),
          borrowApy: calculateBorrowAPY(utilization)
        }
      })
      
      setPools(updatedPools)
    } catch (error) {
      console.error('Failed to fetch pools:', error)
    } finally {
      setIsLoadingPools(false)
    }
  }

  // Fetch positions with empty data initially
  const fetchPositions = async () => {
    try {
      setIsLoadingPositions(true)
      setPositions(mockPositions)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
    } finally {
      setIsLoadingPositions(false)
    }
  }

  // Fetch historical data with empty data initially
  const fetchHistoricalData = async (token: string): Promise<PoolHistoricalData[]> => {
    return mockHistoricalData[token as keyof typeof mockHistoricalData] || []
  }

  // Handle deposits to the liquidity pool
  const handleDeposit = async (token: string, amount: number) => {
    try {
      // In a real implementation, this would call a Solana program to deposit funds
      console.log(`Depositing ${amount} ${token} to the liquidity pool`)
      
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Find the token's pool and price safely
      const targetPool = pools.find(p => p.token === token)
      const tokenPrice = targetPool?.tokenPrice || (token === 'USDC' ? 1 : 0)
      const poolApy = targetPool?.supplyApy || 0
      
      // Update the pools after successful deposit
      setPools(prevPools => 
        prevPools.map(pool => 
          pool.token === token 
            ? { ...pool, supply: pool.supply + amount }
            : pool
        )
      )
      
      // Add to user positions
      const existingPosition = positions.find(pos => pos.token === token)
      if (existingPosition) {
        setPositions(prevPositions => 
          prevPositions.map(pos => 
            pos.token === token 
              ? { ...pos, amount: pos.amount + (amount * tokenPrice) }
              : pos
          )
        )
      } else {
        const newPosition = {
          token,
          amount: amount * tokenPrice,
          apy: poolApy,
          earned: 0
        }
        setPositions(prevPositions => [...prevPositions, newPosition])
      }
      
      toast.success(`Successfully deposited ${amount} ${token} to the liquidity pool`)
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error(`Failed to deposit: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle withdrawals from the liquidity pool
  const handleWithdraw = async (token: string, amountUSD: number) => {
    try {
      // Find the token's pool and price safely
      const targetPool = pools.find(p => p.token === token)
      if (!targetPool) {
        throw new Error(`Pool for ${token} not found`)
      }
      
      // Convert USD amount to token amount
      const tokenAmount = amountUSD / targetPool.tokenPrice
      
      console.log(`Withdrawing ${tokenAmount} ${token} from the liquidity pool (${amountUSD} USD)`)
      
      // In a real implementation, this would call a Solana program to withdraw funds
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update the pools after successful withdrawal
      setPools(prevPools => 
        prevPools.map(pool => 
          pool.token === token 
            ? { ...pool, supply: Math.max(0, pool.supply - tokenAmount) }
            : pool
        )
      )
      
      // Remove from user positions
      setPositions(prevPositions => {
        const updatedPositions = prevPositions.filter(pos => pos.token !== token)
        return updatedPositions
      })
      
      toast.success(`Successfully withdrew ${tokenAmount.toFixed(4)} ${token} from the liquidity pool`)
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast.error(`Failed to withdraw: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (publicKey) {
      fetchPools()
      fetchPositions()
    }
  }, [publicKey])

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
        <div className="flex flex-col items-center gap-6">
          <p className="text-lg text-muted-foreground">
            Connect wallet to access Option Margin Liquidity Pool
          </p>
          <div className="flex justify-center">
            <WalletButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-center">
          Option Margin Liquidity Pool
        </h1>
        <p className="text-center text-muted-foreground mt-2">
          Lend tokens to provide liquidity for option market makers and earn interest.
        </p>
      </div>
      
      <MyLendingPositions 
        positions={positions}
        isLoading={isLoadingPositions}
        onRefresh={fetchPositions}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
      />
      
      <LendingPools 
        pools={pools}
        isLoading={isLoadingPools}
        onRefresh={fetchPools}
        onFetchHistoricalData={fetchHistoricalData}
        onDeposit={handleDeposit}
      />
    </div>
  )
} 