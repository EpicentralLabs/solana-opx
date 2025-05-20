'use client'

import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/utils'
import { useOmlpService } from '@/solana/utils/useOmlpService'
import { getTokenDisplayDecimals } from '@/constants/token-list/token-list'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  emptyContent?: React.ReactNode
}

export function MyLendingPositions({ positions, isLoading = false, onRefresh, emptyContent }: MyLendingPositionsProps) {
  const { deposit, withdraw, isDepositing, isWithdrawing } = useOmlpService()
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false)
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false)
  const [currentToken, setCurrentToken] = useState('')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }

  const handleOpenDepositDialog = (token: string) => {
    setCurrentToken(token)
    setAmount('')
    setIsDepositDialogOpen(true)
  }

  const handleOpenWithdrawDialog = (token: string, maxAmount: number) => {
    setCurrentToken(token)
    setAmount(maxAmount.toString())
    setIsWithdrawDialogOpen(true)
  }

  const handleDeposit = async () => {
    try {
      setIsProcessing(true)
      const numericAmount = parseFloat(amount)
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        console.warn('Invalid amount entered:', amount)
        return
      }

      await deposit({
        tokenSymbol: currentToken,
        amount: numericAmount,
      })
      setIsDepositDialogOpen(false)
      if (onRefresh) await onRefresh()
    } catch (error) {
      console.error('Error depositing:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    try {
      setIsProcessing(true)
      const numericAmount = parseFloat(amount)
      // Find the current position to check the maximum available amount
      const selectedPosition = positions.find(p => p.token === currentToken)
      
      // Validate withdrawal amount
      if (!selectedPosition || numericAmount <= 0 || numericAmount > selectedPosition.amount) {
        throw new Error(`Invalid withdrawal amount. Maximum available: ${selectedPosition?.amount ?? 0}`)
      }
      
      await withdraw({
        tokenSymbol: currentToken,
        amount: numericAmount,
      })
      setIsWithdrawDialogOpen(false)
      if (onRefresh) await onRefresh()
    } catch (error) {
      console.error('Error withdrawing:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const totalValue = positions.reduce((acc, pos) => acc + pos.amount, 0)
  const totalEarned = positions.reduce((acc, pos) => acc + pos.earned, 0)

  return (
    <>
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
                emptyContent || (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                      No active lending positions
                    </td>
                  </tr>
                )
              ) : (
                positions.map((position, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-4">{position.token}</td>
                    <td className="text-right p-4">
                      ${position.amount.toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="text-right p-4">{position.apy.toFixed(2)}%</td>
                    <td className="text-right p-4 text-green-500">
                      ${position.earned.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2
                      })}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => handleOpenWithdrawDialog(position.token, position.amount)}
                        disabled={isWithdrawing}
                      >
                        Withdraw
                      </Button>
                      <Button
                        onClick={() => handleOpenDepositDialog(position.token)}
                        disabled={isDepositing}
                      >
                        Deposit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deposit to {currentToken} Pool</DialogTitle>
            <DialogDescription>
              Enter the amount you would like to deposit to the {currentToken} pool.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder={`Amount in ${currentToken}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleDeposit} 
              disabled={
                !amount || 
                isProcessing || 
                !Number.isFinite(parseFloat(amount)) ||
                parseFloat(amount) <= 0
              }
            >
              {isProcessing ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Withdraw from {currentToken} Pool</DialogTitle>
            <DialogDescription>
              Enter the amount you would like to withdraw from the {currentToken} pool.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdraw-amount" className="text-right">
                Amount
              </Label>
              <Input
                id="withdraw-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder={`Amount in ${currentToken}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleWithdraw} 
              disabled={
                !amount || 
                isProcessing || 
                parseFloat(amount) <= 0 || 
                parseFloat(amount) > (positions.find(p => p.token === currentToken)?.amount ?? 0)
              }
            >
              {isProcessing ? "Processing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 