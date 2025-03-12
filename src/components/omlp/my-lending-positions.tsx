'use client'

import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export type Position = {
  token: string
  amount: number
  apy: number
  earned: number
}

interface MyLendingPositionsProps {
  positions: Position[]
  isLoading?: boolean
  onRefresh?: () => Promise<void>
}

/**
 * Renders a card displaying lending and collateral positions.
 *
 * The component shows a summary of the total value and total earned from the positions.
 * It conditionally displays a loading message when data is being fetched, or a message indicating
 * no active lending positions if the positions array is empty. A refresh button is provided to
 * optionally trigger an asynchronous update via the onRefresh callback.
 *
 * @param positions - Array of lending positions.
 * @param isLoading - Optional flag indicating if the positions data is loading (defaults to false).
 * @param onRefresh - Optional callback function to asynchronously refresh the positions data.
 */
export function MyLendingPositions({ positions, isLoading = false, onRefresh }: MyLendingPositionsProps) {
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }

  const totalValue = positions.reduce((acc, pos) => acc + pos.amount, 0)
  const totalEarned = positions.reduce((acc, pos) => acc + pos.earned, 0)

  return (
    <div className="card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 rounded-lg shadow">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">My Lendings / Collateral</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#4a85ff' }}>
            TVL: ${totalValue.toFixed(2)}
          </span>
          <span className="text-sm" style={{ color: '#4a85ff' }}>
            Total earned: ${totalEarned.toFixed(2)}
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
              <th className="text-right p-4">Amount</th>
              <th className="text-right p-4">APY</th>
              <th className="text-right p-4">Earned</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground">
                  Loading positions...
                </td>
              </tr>
            ) : positions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-muted-foreground">
                  No active lending positions
                </td>
              </tr>
            ) : (
              positions.map((position, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-4">{position.token}</td>
                  <td className="text-right p-4">${position.amount.toFixed(2)}</td>
                  <td className="text-right p-4">{position.apy.toFixed(2)}%</td>
                  <td className="text-right p-4 text-green-500">${position.earned.toFixed(2)}</td>
                  <td className="p-4 flex justify-end gap-2">
                    <Button variant="outline">Withdraw</Button>
                    <Button>Deposit</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 