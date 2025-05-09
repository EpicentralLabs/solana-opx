'use client'

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DepositDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  tokenPrice: number
  supplyApy: number
  onDeposit?: (amount: number) => Promise<void>
}

export function DepositDialog({
  open,
  onOpenChange,
  token,
  tokenPrice,
  supplyApy,
  onDeposit
}: DepositDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [isDepositing, setIsDepositing] = useState(false)
  const [sliderValue, setSliderValue] = useState([25])
  
  // Mock maximum token balance
  const maxTokenBalance = token === 'SOL' ? 10 : token === 'USDC' ? 1000 : 100000

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      const numValue = parseFloat(value || '0')
      const percentage = (numValue / maxTokenBalance) * 100
      setSliderValue([Math.min(percentage, 100)])
    }
  }

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value)
    const tokenAmount = (maxTokenBalance * value[0]) / 100
    setAmount(tokenAmount.toFixed(token === 'SOL' ? 9 : token === 'USDC' ? 6 : 2))
  }

  const handleMaxClick = () => {
    setAmount(maxTokenBalance.toString())
    setSliderValue([100])
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    
    try {
      setIsDepositing(true)
      if (onDeposit) {
        await onDeposit(parseFloat(amount))
      }
      // Simulate successful deposit
      await new Promise(resolve => setTimeout(resolve, 1500))
      onOpenChange(false)
      setAmount('')
      setSliderValue([25])
    } catch (error) {
      console.error('Failed to deposit:', error)
    } finally {
      setIsDepositing(false)
    }
  }

  const dollarValue = parseFloat(amount || '0') * tokenPrice
  const estimatedAPY = (parseFloat(amount || '0') * supplyApy) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 rounded-lg shadow">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Deposit {token}</DialogTitle>
          <DialogDescription>
            Provide liquidity to the {token} pool and earn {supplyApy}% APY
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount</Label>
              <span className="text-xs text-muted-foreground">
                Balance: {maxTokenBalance} {token}
              </span>
            </div>
            <div className="flex space-x-2">
              <Input
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`0 ${token}`}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMaxClick}
                className="whitespace-nowrap"
              >
                MAX
              </Button>
            </div>
            <div className="text-xs text-muted-foreground text-right">
              ≈ ${dollarValue.toFixed(2)} USD
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Amount</Label>
            <Slider 
              value={sliderValue} 
              onValueChange={handleSliderChange}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <Alert className="bg-muted/50 border border-border">
            <InfoCircledIcon className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Estimated earnings: ${estimatedAPY.toFixed(2)} per year at current rates
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) <= 0 || isDepositing}
            className={isDepositing ? 'opacity-80' : ''}
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 