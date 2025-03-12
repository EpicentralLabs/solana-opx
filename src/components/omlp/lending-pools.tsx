'use client'

import { Button } from '../ui/button'
import { RefreshCw, DollarSign, Coins, BarChart } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { OmlpChart, type PoolHistoricalData } from './omlp-pool-chart'

export type Pool = {
  token: string
  supply: number
  supplyApy: number
  borrowed: number
  borrowApy: number
  utilization: number
  supplyLimit: number
  tokenPrice: number
}

interface LendingPoolsProps {
  pools: Pool[]
  isLoading?: boolean
  onRefresh?: () => Promise<void>
  onFetchHistoricalData?: (token: string) => Promise<PoolHistoricalData[]>
}

/**
 * Renders a card interface displaying a list of lending pools with details such as supply, APY, borrowed amounts, and utilization.
 *
 * This component calculates the total value locked (TVL) by summing the USD value of each pool's supply. It also
 * provides interactive controls that allow users to toggle between USD and token display formats, refresh pool data,
 * and open a chart to view historical data for a selected pool.
 *
 * @param pools - An array of lending pool objects to be displayed.
 * @param isLoading - Indicates whether the pool data is currently loading.
 * @param onRefresh - Optional callback invoked to refresh pool data.
 * @param onFetchHistoricalData - Optional callback invoked to fetch historical data for a selected pool.
 *
 * @returns A React element that renders the lending pools interface.
 */
export function LendingPools({ 
  pools, 
  isLoading = false, 
  onRefresh,
  onFetchHistoricalData 
}: LendingPoolsProps) {
  const [showUSD, setShowUSD] = useState(true)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [graphOpen, setGraphOpen] = useState(false)
  const [historicalData, setHistoricalData] = useState<PoolHistoricalData[]>([])
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  
  const tvl = pools.reduce((acc, pool) => {
    const poolValueUSD = pool.supply * pool.tokenPrice
    return acc + poolValueUSD
  }, 0)

  const calculateUtilization = (borrowed: number, supply: number) => {
    return ((borrowed / supply) * 100).toFixed(2)
  }

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }

  const formatValue = (value: number, tokenPrice: number, token: string) => {
    if (showUSD) {
      return `$${Math.round(value * tokenPrice).toLocaleString()}`
    }
    return `${Math.round(value).toLocaleString()} ${token}`
  }

  const handleOpenChart = (pool: Pool) => {
    setSelectedPool(pool)
    setGraphOpen(true)
  }

  const handleChartOpen = async () => {
    if (selectedPool && onFetchHistoricalData) {
      try {
        setIsLoadingHistorical(true)
        const data = await onFetchHistoricalData(selectedPool.token)
        setHistoricalData(data)
      } catch (error) {
        console.error('Failed to fetch historical data:', error)
        setHistoricalData([])
      } finally {
        setIsLoadingHistorical(false)
      }
    }
  }

  return (
    <div className="card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 rounded-lg shadow">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Option Margin Liquidity Pool</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 border border-gray-800 hover:border-gray-600 transition-all",
              "hover:bg-gray-800/50"
            )}
            onClick={() => setShowUSD(!showUSD)}
          >
            {showUSD ? (
              <>
                <DollarSign className="h-4 w-4" />
                <span>USD</span>
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                <span>Tokens</span>
              </>
            )}
          </Button>
          <span className="text-sm" style={{ color: '#4a85ff' }}>
            TVL: ${Math.round(tvl).toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 text-muted-foreground',
                isLoading && 'animate-spin'
              )}
            />
          </Button>
        </div>
      </div>
      
      <div className="border-t">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4">Pool</th>
              <th className="text-right p-4">Supply</th>
              <th className="text-right p-4">Supply APY</th>
              <th className="text-right p-4">Borrowed</th>
              <th className="text-right p-4">Borrow APY</th>
              <th className="text-right p-4">Utilization</th>
              <th className="text-right p-4">Supply limit</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-muted-foreground">
                  Loading pools...
                </td>
              </tr>
            ) : pools.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center p-8 text-muted-foreground">
                  No pools available
                </td>
              </tr>
            ) : (
              pools.map((pool, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-4">{pool.token}</td>
                  <td className="text-right p-4">
                    {formatValue(pool.supply, pool.tokenPrice, pool.token)}
                  </td>
                  <td className="text-right p-4 text-green-500">{pool.supplyApy}%</td>
                  <td className="text-right p-4">
                    {formatValue(pool.borrowed, pool.tokenPrice, pool.token)}
                  </td>
                  <td className="text-right p-4">{pool.borrowApy}%</td>
                  <td className="text-right p-4">
                    {calculateUtilization(pool.borrowed, pool.supply)}%
                  </td>
                  <td className="text-right p-4">
                    {formatValue(pool.supplyLimit, pool.tokenPrice, pool.token)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button>Deposit</Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="bg-black hover:bg-black/80"
                        onClick={() => handleOpenChart(pool)}
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {selectedPool && (
        <OmlpChart 
          open={graphOpen} 
          onOpenChange={setGraphOpen} 
          poolData={selectedPool}
          historicalData={historicalData}
          isLoading={isLoadingHistorical}
          onChartOpen={handleChartOpen}
        />
      )}
    </div>
  )
} 