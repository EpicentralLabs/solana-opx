'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../wallet/wallet-button'
import { MyLendingPositions, type Position } from './my-lending-positions'
import { LendingPools, type Pool } from './lending-pools'
import { type PoolHistoricalData } from './omlp-pool-chart'
import { useState, useEffect } from 'react'

/**
 * Renders the Option Margin Lending Pool interface.
 *
 * This React component displays lending pool and user lending position data once a wallet is connected.
 * It manages local state and asynchronous data fetching for both pools and positions, and passes refresh
 * callbacks to child components. If no wallet is connected, it prompts the user to connect their wallet.
 *
 * @returns A React element representing the Option Margin Lending Pool feature.
 */
export function OMLPFeature() {
  const { publicKey } = useWallet()
  const [pools, setPools] = useState<Pool[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoadingPools, setIsLoadingPools] = useState(true)
  const [isLoadingPositions, setIsLoadingPositions] = useState(true)

  // TODO: Replace with actual data fetching
  const fetchPools = async () => {
    try {
      setIsLoadingPools(true)
      // Add your actual data fetching logic here
      // const response = await fetch('/api/pools')
      // const data = await response.json()
      // setPools(data)
    } catch (error) {
      console.error('Failed to fetch pools:', error)
    } finally {
      setIsLoadingPools(false)
    }
  }

  // TODO: Replace with actual data fetching
  const fetchPositions = async () => {
    try {
      setIsLoadingPositions(true)
      // Add your actual data fetching logic here
      // This should fetch positions for the connected wallet
      // const response = await fetch(`/api/positions/${publicKey}`)
      // const data = await response.json()
      // setPositions(data)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
    } finally {
      setIsLoadingPositions(false)
    }
  }

  // TODO: Replace with actual historical data fetching
  const fetchHistoricalData = async (token: string): Promise<PoolHistoricalData[]> => {
    // Add your actual historical data fetching logic here
    // This should fetch historical APY and utilization data for the specified token
    // const response = await fetch(`/api/pools/${token}/history`)
    // const data = await response.json()
    // return data
    return []
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
            Connect wallet to access Option Margin Lending Pool
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
          Option Margin Lending Pool
        </h1>
        <p className="text-center text-muted-foreground mt-2">
          Lend tokens to provide liquidity for option market makers.
        </p>
      </div>
      
      <MyLendingPositions 
        positions={positions}
        isLoading={isLoadingPositions}
        onRefresh={fetchPositions}
      />
      <LendingPools 
        pools={pools}
        isLoading={isLoadingPools}
        onRefresh={fetchPools}
        onFetchHistoricalData={fetchHistoricalData}
      />
    </div>
  )
} 