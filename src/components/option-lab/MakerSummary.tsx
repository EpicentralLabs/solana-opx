import { Card, CardContent } from "@/components/ui/card"
import { calculateTotalPremium, calculateLiquidationPrice } from "@/constants/option-lab/calculations"
import { MakerPnlChart } from "./MakerPnlChart"
import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
export interface OptionPosition {
  quantity: number;
  strikePrice: string | number;
  premium: string | number;
  optionType: string;
  asset: string;
}

export interface MakerSummaryProps {
  options: OptionPosition[];
  onRemoveOption: (index: number) => void;
  collateralProvided: number;
  leverage: number;
  assetPrice?: number | null;
}

/**
 * Renders a summary card for options trading positions.
 *
 * This component computes and displays key financial metrics including the total premium,
 * position size, maximum potential profit, maximum potential loss, and liquidation thresholds.
 * If no options are provided, it shows a prompt to add options.
 *
 * @param options - An array of option positions to be summarized.
 * @param onRemoveOption - Callback to remove an option from the summary.
 * @param collateralProvided - The collateral amount used to compute the position size and maximum loss.
 * @param leverage - The leverage multiplier applied to the position.
 * @param assetPrice - The current price of the underlying asset; used to compute liquidation prices. Defaults to null.
 *
 * @returns A JSX element that renders the options trading summary.
 */
export function MakerSummary({ 
  options, 
  onRemoveOption,
  collateralProvided,
  leverage,
  assetPrice = null
}: MakerSummaryProps) {
  const totalPremium = calculateTotalPremium(options);
  
  // Calculate liquidation prices
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

  // Calculate position size (collateral provided + borrowed amount)
  const positionSize = useMemo(() => {
    // Position size = collateral * leverage
    return collateralProvided * leverage;
  }, [collateralProvided, leverage]);

  // Calculate max loss - this is limited to the collateral provided
  const maxLoss = useMemo(() => {
    // When using leverage, max loss is limited to the collateral provided
    return collateralProvided;
  }, [collateralProvided]);

  return (
    <Card className="h-full card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
      transition-all duration-300 hover:bg-transparent overflow-hidden shadow-lg">
      <CardContent className="px-4 py-4">
        {options.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-muted-foreground 
            border border-dashed border-[#e5e5e5]/50 dark:border-[#393939] rounded-lg">
            Add options to see PnL projection at expiration
          </div>
        ) : (
          <div className="space-y-4">
            {/* PnL Chart */}
            <div className="rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50 p-4">
              <h3 className="text-lg font-semibold mb-3">Profit & Loss Projection</h3>
              <MakerPnlChart 
                options={options}
                collateralProvided={collateralProvided}
                leverage={leverage}
                assetPrice={assetPrice}
              />
            </div>

            {/* Options List */}
            <div className="space-y-2">
              {/* Metrics Section - Redesigned with single row layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50">
                {/* Position Size */}
                <div className="flex flex-col p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground mb-1 cursor-help">
                          <span className="border-b border-dotted border-muted-foreground">Position Size</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Total capital deployed (your collateral + borrowed funds with {leverage}x leverage)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-bold text-lg">
                    ${positionSize.toFixed(2)}
                  </span>
                </div>

                {/* Max Potential Profit */}
                <div className="flex flex-col p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground mb-1 cursor-help">
                          <span className="border-b border-dotted border-muted-foreground">Max Potential Profit</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Maximum profit potential before any transaction costs or fees</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-bold text-lg text-green-500">
                    ${totalPremium.toFixed(2)}
                  </span>
                </div>

                {/* Max Potential Loss */}
                <div className="flex flex-col p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground mb-1 cursor-help">
                          <span className="border-b border-dotted border-muted-foreground">Max Potential Loss</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Maximum amount you can lose on this position, limited to your provided collateral</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-bold text-lg text-red-500">
                    -${maxLoss.toFixed(2)}
                  </span>
                </div>

                {/* Liquidation Threshold */}
                <div className="flex flex-col p-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground mb-1 cursor-help">
                          <span className="border-b border-dotted border-muted-foreground">Liquidation Threshold</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <p className="text-xs">
                          If the asset price reaches these levels, your position may be liquidated based on your current leverage ({leverage}x).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {(liquidationPrices.upward || liquidationPrices.downward) ? (
                    <div className="flex flex-col">
                      {liquidationPrices.upward && (
                        <span className="font-bold text-lg">
                          ${liquidationPrices.upward.toFixed(2)}
                          {assetPrice && (
                            <span className="text-xs ml-1 font-normal opacity-75">
                              ({((liquidationPrices.upward / assetPrice - 1) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      )}
                      {!liquidationPrices.upward && liquidationPrices.downward && (
                        <span className="font-bold text-lg">
                          ${liquidationPrices.downward.toFixed(2)}
                          {assetPrice && (
                            <span className="text-xs ml-1 font-normal opacity-75">
                              ({((1 - liquidationPrices.downward / assetPrice) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-muted-foreground">--</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 