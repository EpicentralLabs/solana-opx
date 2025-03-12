import { useState, useEffect } from 'react';
import React from 'react';
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  COLLATERAL_TYPES, 
  BASE_ANNUAL_INTEREST_RATE,
  TRANSACTION_COST_SOL,
  MAX_LEVERAGE
} from "@/constants/option-lab/constants";
import { 
  calculateCollateralNeeded, 
  calculateRequiredCollateral, 
  hasEnoughCollateral, 
  calculateOptimalLeverage,
  calculateTotalPremium,
  calculateHourlyInterestRate,
  calculateBorrowCost,
  calculateOptionCreationFee,
  calculateBorrowFee,
  calculateMaxProfitPotential
} from "@/constants/option-lab/calculations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface OptionPosition {
  quantity: number;
  strikePrice: string | number;
  premium: string | number;
  optionType: string;
  asset: string;
  expiryTimestamp?: number;
}

export interface CollateralState {
  hasEnoughCollateral: boolean;
  collateralProvided: string;
  leverage: number;
  collateralType: string;
  borrowCost: number;
  optionCreationFee: number;
  borrowFee: number;
  transactionCost: number;
  maxProfitPotential: number;
}

interface CollateralProviderProps {
  options: OptionPosition[];
  onStateChange?: (state: CollateralState) => void;
  onMint?: (e: React.FormEvent) => void;
  isSubmitting?: boolean;
  hasValidationError?: boolean;
  hasPendingOptions?: boolean;
}

/**
 * Renders a user interface for configuring collateral and leverage for opening an options trading position.
 *
 * This component computes the required collateral, fees (including borrow cost, creation fee, borrow fee, and transaction cost), 
 * and potential profit based on user input and the provided option positions. It displays input fields for the collateral amount and type,
 * controls for adjusting leverage, and a summary of associated costs. The component also notifies its parent via the onStateChange callback 
 * whenever the calculated collateral state changes.
 *
 * @param options - Array of option positions used to determine collateral and premium requirements.
 * @param onStateChange - Callback invoked with updated collateral state whenever relevant calculations change.
 * @param onMint - Callback triggered when the user initiates the minting action.
 * @param isSubmitting - Flag indicating whether a minting action is currently in progress.
 * @param hasValidationError - Flag indicating whether there are any input validation errors.
 * @param hasPendingOptions - Flag indicating if there are pending options available for minting.
 *
 * @returns A React element representing the collateral management interface.
 */
export function CollateralProvider({ 
  options, 
  onStateChange, 
  onMint, 
  isSubmitting = false, 
  hasValidationError = false,
  hasPendingOptions = false
}: CollateralProviderProps) {
  const baseCollateralNeeded = calculateCollateralNeeded(options);
  const totalPremium = calculateTotalPremium(options);
  const [collateralProvided, setCollateralProvided] = useState<string>("");
  const [leverage, setLeverage] = useState<number[]>([1]);
  const [collateralType, setCollateralType] = useState<typeof COLLATERAL_TYPES[number]['value']>(
    COLLATERAL_TYPES.find(type => type.default)?.value || "USDC"
  );
  const maxLeverage = MAX_LEVERAGE;
  
  // Convert annual to hourly interest rate
  const hourlyInterestRate = calculateHourlyInterestRate(BASE_ANNUAL_INTEREST_RATE);
  
  // Calculate position size (total available capital with leverage)
  const positionSize = Number(collateralProvided || 0) * leverage[0];
  
  // Calculate amount borrowed (collateral * (leverage - 1))
  const amountBorrowed = Number(collateralProvided || 0) * (leverage[0] - 1);
  
  // Calculate time until expiration (in hours)
  const getTimeUntilExpiration = () => {
    // Find the latest expiry from all options
    const now = Math.floor(Date.now() / 1000); // Convert to seconds
    let latestExpiry = 0;
    
    options.forEach(option => {
      if (option.expiryTimestamp && option.expiryTimestamp > latestExpiry) {
        latestExpiry = option.expiryTimestamp;
      }
    });
    
    // If no expiry found, use 7 days as default
    if (latestExpiry === 0) {
      latestExpiry = now + (7 * 24 * 60 * 60); // 7 days in seconds
    }
    
    // Calculate hours until expiry
    return Math.max(0, Math.ceil((latestExpiry - now) / 3600));
  };
  
  const hoursUntilExpiry = getTimeUntilExpiration();
  
  // Calculate all fees
  const borrowCost = calculateBorrowCost(amountBorrowed, hourlyInterestRate, hoursUntilExpiry);
  const optionCreationFee = calculateOptionCreationFee();
  const borrowFee = calculateBorrowFee(amountBorrowed);
  const transactionCost = TRANSACTION_COST_SOL;
  
  // Calculate maximum profit potential
  const maxProfitPotential = calculateMaxProfitPotential(
    totalPremium,
    borrowCost,
    optionCreationFee,
    transactionCost
  );
  
  // Calculate required collateral based on position size
  const collateralNeeded = calculateRequiredCollateral(baseCollateralNeeded, positionSize);
  
  // Check if enough collateral is provided
  const isEnoughCollateral = hasEnoughCollateral(
    baseCollateralNeeded,
    Number(collateralProvided || 0),
    leverage[0]
  );

  // Memoize the state object to prevent unnecessary updates
  const currentState = React.useMemo(() => ({
    hasEnoughCollateral: isEnoughCollateral,
    collateralProvided,
    leverage: leverage[0],
    collateralType,
    borrowCost,
    optionCreationFee,
    borrowFee,
    transactionCost,
    maxProfitPotential
  }), [
    isEnoughCollateral, 
    collateralProvided, 
    leverage, 
    collateralType, 
    borrowCost, 
    optionCreationFee, 
    borrowFee, 
    transactionCost, 
    maxProfitPotential
  ]);

  // Store previous state to compare
  const prevStateRef = React.useRef(currentState);

  // Notify parent component of state changes only when values actually change
  useEffect(() => {
    if (
      prevStateRef.current.hasEnoughCollateral !== currentState.hasEnoughCollateral ||
      prevStateRef.current.collateralProvided !== currentState.collateralProvided ||
      prevStateRef.current.leverage !== currentState.leverage ||
      prevStateRef.current.collateralType !== currentState.collateralType ||
      prevStateRef.current.borrowCost !== currentState.borrowCost ||
      prevStateRef.current.optionCreationFee !== currentState.optionCreationFee ||
      prevStateRef.current.borrowFee !== currentState.borrowFee ||
      prevStateRef.current.transactionCost !== currentState.transactionCost ||
      prevStateRef.current.maxProfitPotential !== currentState.maxProfitPotential
    ) {
      prevStateRef.current = currentState;
      onStateChange?.(currentState);
    }
  }, [currentState, onStateChange]);

  return (
    <Card className="h-full card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
      transition-all duration-300 hover:bg-transparent overflow-hidden shadow-lg">
      <CardHeader className="px-4 py-3 pb-0">
        <CardTitle className="text-xl font-bold">Open Position</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pt-2 space-y-2">
        {/* Collateral Needed */}
        <div className="flex flex-col p-2 rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50">
          <span className="text-xs text-muted-foreground">Collateral Needed to Open Position:</span>
          <span className="font-semibold text-lg">${collateralNeeded.toFixed(2)}</span>
        </div>
        
        {/* Collateral Amount */}
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm font-medium mb-1 block cursor-help">
                  <span className="border-b border-dotted border-slate-500">Provide Collateral Amount</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is the amount of collateral you want to provide for this position.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <Select
              value={collateralType}
              onValueChange={(value: typeof COLLATERAL_TYPES[number]['value']) => setCollateralType(value)}
            >
              <SelectTrigger className="h-10 w-24 bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] focus:ring-1 focus:ring-[#4a85ff]/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLATERAL_TYPES.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                    className="text-sm"
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={collateralProvided}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
                  setCollateralProvided(value);
                }
              }}
              min="1"
              step="0.01"
              className="h-10 flex-1 px-3 bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] 
                focus:border-[#4a85ff]/40 focus:ring-1 focus:ring-[#4a85ff]/40
                text-right text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.00"
            />
          </div>
        </div>
        
        {/* Leverage */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium cursor-help">
                    <span className="border-b border-dotted border-slate-500">Leverage</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Multiply your buying power by borrowing additional capital.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex space-x-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const optimalLeverage = calculateOptimalLeverage(
                    baseCollateralNeeded,
                    Number(collateralProvided || 0)
                  );
                  setLeverage([optimalLeverage]);
                }}
                className="h-6 px-2 py-0 text-xs bg-[#4a85ff]/10 border border-[#4a85ff]/40
                  hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60
                  transition-all duration-200"
              >
                Auto-Size
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newLeverage = Math.max(1, leverage[0] - 0.01);
                  setLeverage([newLeverage]);
                }}
                className="h-6 w-6 p-0 text-xs bg-[#4a85ff]/10 border border-[#4a85ff]/40
                  hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60
                  transition-all duration-200 flex items-center justify-center"
              >
                -
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newLeverage = Math.min(maxLeverage, leverage[0] + 0.01);
                  setLeverage([newLeverage]);
                }}
                className="h-6 w-6 p-0 text-xs bg-[#4a85ff]/10 border border-[#4a85ff]/40
                  hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60
                  transition-all duration-200 flex items-center justify-center"
              >
                +
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Slider
              min={1}
              max={maxLeverage}
              step={0.01}
              value={leverage}
              onValueChange={setLeverage}
              className="flex-1"
            />
            <span className={`font-medium w-12 text-right ${maxProfitPotential < 0 ? 'text-red-500' : ''}`}>
              {leverage[0].toFixed(2)}x
            </span>
          </div>
        </div>

        {/* Costs and Fees (Combined) */}
        <div className="flex flex-col rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50">
          <div className="flex items-center justify-between p-1.5 border-b border-[#e5e5e5]/20 dark:border-[#393939]/50">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <span className="text-sm font-medium cursor-help border-b border-dotted border-slate-500">Borrow Rate</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">The interest rate charged for borrowing funds to leverage your position based on rates on OMLP.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-xs text-muted-foreground">
              {(hourlyInterestRate * 10000).toFixed(4)}% per hour
            </span>
          </div>
          <div className="p-1.5 space-y-1">
            <div className="grid grid-cols-2 gap-y-0.5 text-sm">
              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">Amount Borrowed</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The total amount of capital borrowed to fund your position.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className="text-right font-normal">${amountBorrowed.toFixed(2)}</span>

              {leverage[0] > 1 && (
                <>
                  <span>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dotted border-slate-500">Est. Borrow Cost</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Estimated interest cost for borrowing the funds until option expiration.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>:
                  </span>
                  <span className="text-right font-normal">${borrowCost.toFixed(2)}</span>
                </>
              )}
              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">Borrow Fee</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">One-time fee charged for initiating the borrow position.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className="text-right font-normal">${borrowFee.toFixed(2)}</span>

              <div className="col-span-2 border-t border-[#e5e5e5]/20 dark:border-[#393939]/50 mt-0.5 pt-0.5"></div>

              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">Creation Fee</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Network fee for creating the option contract on Solana.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className="text-right font-normal">{optionCreationFee} SOL</span>

              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">Transaction Cost</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Solana blockchain transaction fees for processing this option.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className="text-right font-normal">{transactionCost} SOL</span>

              <div className="col-span-2 border-t border-[#e5e5e5]/20 dark:border-[#393939]/50 mt-0.5 pt-0.5"></div>

              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">Total Cost</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">The sum of all fees and costs associated with creating this option position.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className="text-right font-normal text-red-500">
                ${Number(collateralProvided) > 0 ? (borrowCost + optionCreationFee + borrowFee).toFixed(2) : "0.00"}
              </span>

              <span>
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <span className="cursor-help border-b border-dotted border-slate-500">New Max Profit</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Your maximum potential profit from this position after accounting for all costs.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>:
              </span>
              <span className={`text-right font-bold ${Number(collateralProvided) === 0 ? '' : maxProfitPotential >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${Number(collateralProvided) > 0 ? maxProfitPotential.toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Mint Option Button */}
        {hasPendingOptions && (
          <Button 
            type="submit" 
            onClick={onMint}
            disabled={isSubmitting || !hasPendingOptions || hasValidationError || !isEnoughCollateral}
            className="mt-2 w-full h-10 bg-white/95 hover:bg-white/100 text-black border border-white/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10
              hover:scale-[0.98] transition-all duration-200"
          >
            {isSubmitting 
              ? "Minting..." 
              : hasValidationError 
                ? "Need Collateral"
                : !isEnoughCollateral
                  ? "Not Enough Collateral"
                  : "Mint Option"
            }
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 