'use client'

import { 
  Dialog, 
  DialogContent as ShadcnDialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogClose,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { cn } from '@/lib/utils'
import React from 'react'

// Custom DialogContent without the default close button
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className='bg-black/40'/>
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 transition-all rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export type PoolHistoricalData = {
  timestamp: number // Unix timestamp
  supplyApy: number
  borrowApy: number
  utilization: number
}

interface OmlpChartProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  poolData: {
    token: string
    supply: number
    supplyApy: number
    borrowed: number
    borrowApy: number
    utilization: number
  }
  historicalData?: PoolHistoricalData[]
  isLoading?: boolean
  onChartOpen?: () => Promise<void>
}

/**
 * Renders a dialog containing a responsive line chart that visualizes historical pool performance data.
 *
 * When the dialog is open, this component optionally triggers the onChartOpen callback. It processes the provided
 * historical data by mapping Unix timestamps to abbreviated month labels and displaying trends for supply APY, borrow APY,
 * and utilization. If the data is still loading or unavailable, it shows appropriate feedback messages. The dialog also
 * displays current pool performance metrics from the poolData object.
 *
 * @param open - Indicates whether the dialog is currently open.
 * @param onOpenChange - Callback to update the dialog's open state.
 * @param poolData - Object containing current pool performance information including the token name, supply APY, borrow APY, and utilization.
 * @param historicalData - Optional array of historical data entries, where each entry includes a Unix timestamp and corresponding APY and utilization values.
 * @param isLoading - Optional flag that, when true, displays a loading state for the historical data.
 * @param onChartOpen - Optional callback that is invoked when the dialog opens.
 */
export function OmlpChart({ 
  open, 
  onOpenChange, 
  poolData,
  historicalData = [],
  isLoading = false,
  onChartOpen
}: OmlpChartProps) {
  React.useEffect(() => {
    if (open && onChartOpen) {
      onChartOpen()
    }
  }, [open, onChartOpen])

  const chartData = historicalData.map(data => ({
    name: new Date(data.timestamp * 1000).toLocaleDateString('en-US', { month: 'short' }),
    supplyApy: data.supplyApy,
    borrowApy: data.borrowApy,
    utilization: data.utilization
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 rounded-lg shadow">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {poolData.token} Pool Performance
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            Historical APY and utilization rates for the {poolData.token} pool
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[400px] w-full mt-4">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              Loading historical data...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              No historical data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  orientation="left"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111', 
                    border: '1px solid #333',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`${value}%`, '']}
                />
                <Legend />
                <Line 
                  type="monotone"
                  dataKey="supplyApy" 
                  name="Supply APY" 
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone"
                  dataKey="borrowApy" 
                  name="Borrow APY" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone"
                  dataKey="utilization" 
                  name="Utilization" 
                  stroke="#4a85ff" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-black/20 p-4 text-center">
            <div className="text-sm text-muted-foreground">Current Supply APY</div>
            <div className="text-xl font-semibold text-green-500">{poolData.supplyApy}%</div>
          </div>
          <div className="rounded-lg bg-black/20 p-4 text-center">
            <div className="text-sm text-muted-foreground">Current Borrow APY</div>
            <div className="text-xl font-semibold text-red-500">{poolData.borrowApy}%</div>
          </div>
          <div className="rounded-lg bg-black/20 p-4 text-center">
            <div className="text-sm text-muted-foreground">Current Utilization</div>
            <div className="text-xl font-semibold text-blue-500">{poolData.utilization}%</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 