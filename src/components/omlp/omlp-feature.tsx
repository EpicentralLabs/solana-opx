'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { MyLendingPositions, type Position } from './my-lending-positions'
import { LendingPools, type Pool } from './lending-pools'
import { type PoolHistoricalData } from './omlp-pool-chart'
import { useState, useEffect, useCallback } from 'react'
import { useOmlpService } from '@/solana/utils/useOmlpService'
import dynamic from 'next/dynamic'

// Dynamically import wallet button with ssr disabled to prevent hydration mismatch
const WalletButton = dynamic(
  () => import('../solana/user-wallet/wallet-button').then(mod => mod.WalletButton),
  { ssr: false }
)

export function OMLPFeature() {
  const { publicKey } = useWallet()
  const { 
    pools, 
    positions, 
    isLoadingPools, 
    isLoadingPositions, 
    refetchPools, 
    refetchPositions, 
    fetchHistoricalData
  } = useOmlpService()

  // Create wrapper functions with correct return type for components
  const handleRefreshPools = useCallback(async (): Promise<void> => {
    await refetchPools()
  }, [refetchPools])

  const handleRefreshPositions = useCallback(async (): Promise<void> => {
    await refetchPositions()
  }, [refetchPositions])

  // Custom content to display when wallet is not connected
  const walletConnectContent = !publicKey ? (
    <tr>
      <td colSpan={5} className="text-center p-8">
        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-muted-foreground">
            Connect wallet to access your lending positions
          </p>
          <WalletButton />
        </div>
      </td>
    </tr>
  ) : null

  return (
    <div className="container max-w-6xl mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-center">
          Option Margin Liquidity Pool
        </h1>
        <p className="text-center text-muted-foreground mt-2">
          Lend tokens to provide liquidity for option market makers.
        </p>
      </div>
      
      <MyLendingPositions 
        positions={positions}
        isLoading={isLoadingPositions}
        onRefresh={handleRefreshPositions}
        emptyContent={walletConnectContent}
      />
      
      <LendingPools 
        pools={pools}
        isLoading={isLoadingPools}
        onRefresh={handleRefreshPools}
        onFetchHistoricalData={fetchHistoricalData}
      />
    </div>
  )
} 