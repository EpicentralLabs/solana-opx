import React, { useMemo, useRef } from 'react'
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  AreaChart,
  Area,
  Line
} from "recharts"
import { calculateLiquidationPrice } from '@/constants/option-lab/calculations'

interface OptionPosition {
  quantity: number
  strikePrice: string | number
  premium: string | number
  optionType: string
  asset: string
  expiryTimestamp?: number  // Optional expiry timestamp in seconds
  impliedVolatility?: number // Optional IV
}

interface MakerPnlChartProps {
  options: OptionPosition[]
  collateralProvided: number
  leverage: number
  riskFreeRate?: number // Optional risk-free rate for option calculations
  assetPrice?: number | null // Current asset price from AssetSelector
}

interface PnLDataPoint {
  name: string
  value: number
  price: number
}

// Add a custom tooltip component before the main component
const CustomTooltip = ({ active, payload, label, showExpiration }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const value = data.value; // Ensure this is the correct field from your data points

  // Format value for better readability
  const formattedValue = value >= 0
    ? `+$${value.toFixed(2)}`
    : `-$${Math.abs(value).toFixed(2)}`;

  // Determine color based on value
  const valueColor = value >= 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className="w-fit p-2 rounded-lg 
      bg-opacity-80 backdrop-blur-sm bg-black/70 dark:bg-black/90 
      shadow-lg border border-white/10 dark:border-white/5">
      <div className="text-xs text-gray-300 mb-1">
        {showExpiration ? 'Profit/Loss at Expiration' : 'Current Profit/Loss'}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-300 min-w-[70px]">Asset Price:</span>
          <span className="text-xs text-white font-medium">${data.price.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-300 min-w-[70px]">PnL:</span>
          <span className={`text-xs font-medium ${valueColor}`}>{formattedValue}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders an interactive profit and loss (PnL) chart for options trading.
 *
 * This React component computes and visualizes the PnL profile for a set of option positions. It calculates
 * data points over a range of asset prices by incorporating the premiums received, intrinsic option values at expiration,
 * leverage on losses, and collateral limits. The chart, built with Recharts, features reference lines for maximum profit,
 * maximum loss, the current market price, as well as strike prices for each option. If no option data is available, a message
 * is displayed instead of the chart.
 *
 * @param options - Array of option positions used to compute the PnL, each including details such as strike price, premium, quantity, and option type.
 * @param collateralProvided - The amount of collateral available, which also serves as the cap for potential losses.
 * @param leverage - The multiplier applied to losses, amplifying negative outcomes.
 * @param riskFreeRate - Optional risk-free rate for liquidation price calculations; defaults to 5% if not provided.
 * @param assetPrice - Optional current asset price; if absent, the component uses the first option's strike price as a fallback.
 *
 * @returns A JSX element that renders the PnL chart or displays a message when no option data is available.
 */
export function MakerPnlChart({ 
  options, 
  collateralProvided, 
  leverage,
  riskFreeRate = 0.05, // Default to 5% if not provided
  assetPrice = null // Default to null if not provided
}: MakerPnlChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  // Always use expiration view - no toggle needed
  const showExpiration = true
  
  // Calculate liquidation prices but don't display them on chart
  const liquidationPrices = useMemo(() => {
    if (!assetPrice || assetPrice <= 0 || options.length === 0) {
      return { upward: null, downward: null };
    }
    return calculateLiquidationPrice(
      options,
      collateralProvided,
      leverage,
      assetPrice
    );
  }, [options, collateralProvided, leverage, assetPrice]);

  const calculatePnLPoints = useMemo(() => {
    if (options.length === 0) return []

    // Calculate total premium received (this is our max profit at expiration)
    // Multiply by 100 since each contract represents 100 units
    const totalPremium = options.reduce((acc, opt) => 
      acc + (Number(opt.premium) * Number(opt.quantity) * 100), 0)

    // For the price range, we'll use the weighted average of strike prices as center point
    const totalQuantity = options.reduce((acc, opt) => acc + Number(opt.quantity), 0)
    const avgStrike = options.reduce(
      (acc, opt) => acc + (Number(opt.strikePrice) * Number(opt.quantity)), 0
    ) / totalQuantity

    // Create a wider price range for better visualization
    const priceRange = avgStrike * 0.3 // 30% range for better visualization
    const minPrice = Math.max(avgStrike - priceRange, 0)
    const maxPrice = avgStrike + priceRange
    const steps = 100 // Increased resolution for smoother curve
    const priceStep = (maxPrice - minPrice) / steps

    // Create points array
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const price = minPrice + (i * priceStep)
      
      // At expiration, P&L for a maker (seller) is:
      // For call options: Premium - max(0, market price - strike)
      // For put options: Premium - max(0, strike - market price)
      let pnl = totalPremium

      options.forEach(option => {
        const quantity = Number(option.quantity)
        const strike = Number(option.strikePrice)
        const premium = Number(option.premium)
        const contractSize = 100 // Each contract represents 100 units
        const isCall = option.optionType.toLowerCase() === 'call'
        
        // At expiration, calculate intrinsic value directly for accurate slope representation
        // For calls: intrinsic value = max(0, spot - strike)
        // For puts: intrinsic value = max(0, strike - spot)
        const intrinsicValue = isCall 
          ? Math.max(0, price - strike)
          : Math.max(0, strike - price)
          
        // For maker/seller, we lose money as option goes ITM
        pnl -= quantity * intrinsicValue * contractSize
      })

      // Apply leverage effect on losses (but not on profits)
      if (pnl < 0) {
        pnl = pnl * leverage
      }

      // Apply a floor to PnL based on collateral
      if (pnl < -collateralProvided) {
        pnl = -collateralProvided
      }

      return {
        price,
        name: `$${price.toFixed(2)}`,
        value: Number(pnl.toFixed(2))
      }
    })

    console.log(points); // Log to see the data structure and values
    return points
  }, [options, collateralProvided, leverage])

  // Calculate max profit - premium received
  const maxProfit = useMemo(() => {
    return options.reduce((acc, opt) => 
      acc + (Number(opt.premium) * Number(opt.quantity) * 100), 0)
  }, [options])

  // Calculate max loss - which is collateral required
  const maxLoss = useMemo(() => {
    let totalRisk = 0
    
    options.forEach(option => {
      const quantity = Number(option.quantity)
      const strike = Number(option.strikePrice)
      const contractSize = 100
      
      // For call options, theoretical max loss is infinite, but we'll use a more realistic value
      // For put options, max loss is strike price * quantity * contract size
      if (option.optionType.toLowerCase() === 'put') {
        // For puts, max loss is when underlying goes to zero
        totalRisk += strike * quantity * contractSize
      } else {
        // For calls, max loss depends on how far the underlying could realistically go up
        // Use 2x the strike price as a conservative estimate for max upside move
        // This shows a clearer slope for the loss potential
        const maxUpside = strike * 2
        totalRisk += (maxUpside - strike) * quantity * contractSize
      }
    })
    
    // Apply leverage
    totalRisk = totalRisk * leverage
    
    // Limited by collateral
    return Math.min(totalRisk, collateralProvided)
  }, [options, collateralProvided, leverage])

  // Get market price from the first option (could be improved with a weighted average)
  const currentMarketPrice = useMemo(() => {
    if (assetPrice && assetPrice > 0) {
      return assetPrice
    }
    if (options.length > 0) {
      // Fallback to the strike price if assetPrice is not available
      return Number(options[0].strikePrice)
    }
    return null
  }, [options, assetPrice])

  // Format X axis ticks for price
  const formatXTick = (value: any) => {
    const num = parseFloat(value)
    if (isNaN(num)) return ''
    
    // Format with K suffix for thousands
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    }
    
    // Don't show the $ for intermediate ticks to reduce clutter
    return `$${num.toFixed(0)}`
  }

  // Format Y axis ticks for profit/loss
  const formatYTick = (value: any) => {
    const num = parseFloat(value)
    if (isNaN(num)) return ''
    
    // Format with +/- sign and K suffix for thousands
    if (Math.abs(num) >= 1000) {
      return num >= 0 
        ? `+$${(num / 1000).toFixed(1)}K` 
        : `-$${(Math.abs(num) / 1000).toFixed(1)}K`
    }
    
    return num >= 0 ? `+$${num.toFixed(0)}` : `-$${Math.abs(num).toFixed(0)}`
  }

  // Calculate the domain for Y axis to ensure $0 is in the middle
  const yAxisDomain = useMemo(() => {
    const absMax = Math.max(maxProfit, maxLoss);
    // Make the domain symmetric around zero to center the $0 point
    return [-absMax, absMax];
  }, [maxProfit, maxLoss]);

  // Early return if no data yet
  if (calculatePnLPoints.length === 0) {
    return <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
      No option data available for chart
    </div>
  }

  return (
    <div 
      className="w-full h-[300px]" 
      ref={chartRef}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={calculatePnLPoints}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <defs>
            {/* Green gradient for profit region */}
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
            </linearGradient>
            
            {/* Red gradient for loss region */}
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
            </linearGradient>
          </defs>
          
          <XAxis
            dataKey="price"
            tickFormatter={formatXTick}
            tick={{ fontSize: 11, fill: '#666' }}
            tickLine={{ stroke: '#666' }}
            axisLine={{ stroke: '#666' }}
            domain={['dataMin', 'dataMax']}
            type="number"
          />
          
          <YAxis
            tickFormatter={formatYTick}
            tick={{ fontSize: 11, fill: '#666' }}
            tickLine={{ stroke: '#666' }}
            axisLine={{ stroke: '#666' }}
            domain={yAxisDomain}
            label={{
              value: 'Profit/Loss ($)', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
              fontSize: 11,
              fill: '#666'
            }}
          />
          <Tooltip
            content={<CustomTooltip showExpiration={showExpiration} />}
            cursor={{
              stroke: '#666',
              strokeDasharray: '3 3',
              strokeWidth: 1
            }}
          />
          <ReferenceLine 
            y={maxProfit} 
            stroke="#22c55e"
            strokeDasharray="3 3"
          >
            <Label
              value={`Max Profit: $${maxProfit.toFixed(2)}`}
              fill="#22c55e"
              fontSize={11}
              position="insideBottomRight"
              dx={10}
            />
          </ReferenceLine>
          <ReferenceLine 
            y={-maxLoss} 
            stroke="#ef4444"
            strokeDasharray="3 3"
          >
            <Label
              value={`Max Loss: -$${maxLoss.toFixed(2)}`}
              fill="#ef4444"
              fontSize={11}
              position="insideBottomRight"
              dx={10}
            />
          </ReferenceLine>
          
          {/* Add a reference line at $0 PnL */}
          <ReferenceLine 
            y={0} 
            stroke="#666"
            strokeDasharray="3 3"
          />
          
          {/* Current Price Reference Line - with label at top */}
          {currentMarketPrice && (
            <ReferenceLine
              x={currentMarketPrice}
              stroke="#4a85ff"
              strokeWidth={1.5}
              label={{
                value: `Current: $${currentMarketPrice.toFixed(2)}`,
                fill: '#4a85ff',
                fontSize: 11,
                position: 'insideTopLeft',
                dy: 5,
                dx: 5
              }}
              isFront={false}
            />
          )}
          
          {/* Add reference lines for each strike price */}
          {options.map((option, index) => {
            const strike = Number(option.strikePrice)
            const isCall = option.optionType.toLowerCase() === 'call'
            return (
              <ReferenceLine 
                key={`strike-${index}`}
                x={strike}
                stroke={isCall ? "#f97316" : "#06b6d4"} // Orange for calls, cyan for puts
                strokeDasharray="2 2"
                label={{ 
                  value: `${isCall ? "Call" : "Put"} Strike: $${strike.toFixed(2)}`,
                  position: 'insideBottomRight',
                  fontSize: 11,
                  fill: isCall ? "#f97316" : "#06b6d4"
                }}
                isFront={false}
              />
            )
          })}
          
          <CartesianGrid strokeDasharray="2 2" opacity={0.1} />
          
          {/* Positive value line */}
          <Line
            type="monotone"
            dataKey={(dataPoint: PnLDataPoint) => (dataPoint.value >= 0 ? dataPoint.value : null)}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: "#22c55e", 
              stroke: "white", 
              strokeWidth: 2 
            }}
            strokeWidth={1.5}
            stroke="#22c55e"
            isAnimationActive={false}
            connectNulls
          />
          
          {/* Negative value line */}
          <Line
            type="monotone"
            dataKey={(dataPoint: PnLDataPoint) => (dataPoint.value < 0 ? dataPoint.value : null)}
            dot={false}
            activeDot={{ 
              r: 4, 
              fill: "#ef4444", 
              stroke: "white", 
              strokeWidth: 2 
            }}
            strokeWidth={1.5}
            stroke="#ef4444"
            isAnimationActive={false}
            connectNulls
          />
          
          {/* Profit Area (green, only shows above 0) */}
          <Area
            type="monotone"
            dataKey={(dataPoint: PnLDataPoint) => (dataPoint.value >= 0 ? dataPoint.value : 0)}
            stroke="none"
            fillOpacity={0.2}
            fill="url(#profitGradient)"
            isAnimationActive={false}
            activeDot={false}
          />
          
          {/* Loss Area (red, only shows below 0) */}
          <Area
            type="monotone"
            dataKey={(dataPoint: PnLDataPoint) => (dataPoint.value < 0 ? dataPoint.value : 0)}
            stroke="none"
            fillOpacity={0.2}
            fill="url(#lossGradient)"
            isAnimationActive={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}