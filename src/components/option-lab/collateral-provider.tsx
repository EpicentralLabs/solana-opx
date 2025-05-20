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
} from "@/constants/constants";
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
  calculateMaxProfitPotential,
  calculateMinCollateralRequired
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
  isWalletConnected?: boolean;
}

export function CollateralProvider({ 
  options, 
  onStateChange, 
  onMint, 
  isSubmitting = false, 
  hasValidationError = false,
  hasPendingOptions = false,
  isWalletConnected = false
}: CollateralProviderProps) {
  const baseCollateralNeeded = calculateCollateralNeeded(options);
  const minCollateralRequired = calculateMinCollateralRequired(baseCollateralNeeded, MAX_LEVERAGE);
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
    const now = new Date()
    const utcNow = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    ))
    let latestExpiry = 0;
    
    options.forEach(option => {
      if (option.expiryTimestamp && option.expiryTimestamp > latestExpiry) {
        latestExpiry = option.expiryTimestamp;
      }
    });
    
    // If no expiry found, use 7 days as default
    if (latestExpiry === 0) {
      latestExpiry = Math.floor(utcNow.getTime() / 1000) + (7 * 24 * 60 * 60); // 7 days in seconds
    }
    
    // Calculate hours until expiry
    return Math.max(0, Math.ceil((latestExpiry - Math.floor(utcNow.getTime() / 1000)) / 3600));
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

  // Auto-size leverage function
  const handleAutoLeverage = () => {
    const optimalLeverage = calculateOptimalLeverage(
      baseCollateralNeeded,
      Number(collateralProvided || 0)
    );
    setLeverage([optimalLeverage]);
  };

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
      <CardHeader className="px-3 sm:px-4 py-2 sm:py-3 pb-0">
        <CardTitle className="text-lg sm:text-xl font-bold">Open Position</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 pt-2 space-y-2 sm:space-y-3">
        {/* Collateral Needed */}
        <div className="flex flex-col p-2 rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50">
          <span className="text-xs text-muted-foreground">Collateral Needed to Open Position:</span>
          <span className="font-semibold text-base sm:text-lg">${collateralNeeded.toFixed(2)}</span>
        </div>
        
        {/* Collateral Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs sm:text-sm font-medium cursor-help">
                    <span className="border-b border-dotted border-slate-500">Provide Collateral Amount</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs sm:text-sm">This is the amount of collateral you want to provide for this position.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-xs text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      className="cursor-pointer hover:text-[#4a85ff] transition-colors duration-200"
                      onClick={() => setCollateralProvided(minCollateralRequired.toFixed(2))}
                    >
                      <span className="border-b border-dotted border-slate-500">Min Required: ${minCollateralRequired.toFixed(2)}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Click to auto-fill minimum collateral required with max leverage ({MAX_LEVERAGE}x)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={collateralType}
              onValueChange={(value: typeof COLLATERAL_TYPES[number]['value']) => setCollateralType(value)}
            >
              <SelectTrigger className="h-9 sm:h-10 w-20 sm:w-24 bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] focus:ring-1 focus:ring-[#4a85ff]/40">
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
              className="h-9 sm:h-10 flex-1 px-2 sm:px-3 bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] 
                focus:border-[#4a85ff]/40 focus:ring-1 focus:ring-[#4a85ff]/40
                text-right text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  <span className="text-xs sm:text-sm font-medium cursor-help">
                    <span className="border-b border-dotted border-slate-500">Leverage</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs sm:text-sm">
                    Higher leverage increases your position size and potential profits, but also increases risk of liquidation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex space-x-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoLeverage}
                className="h-6 px-2 py-0 text-xs bg-[#4a85ff]/10 border border-[#4a85ff]/40
                  hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60
                  transition-all duration-200"
              >
                Auto
              </Button>
              <span className="text-xs sm:text-sm text-muted-foreground px-1 flex items-center">
                {leverage[0].toFixed(1)}x
              </span>
            </div>
          </div>
          
          <div className="py-1 px-1">
            <Slider
              defaultValue={[1]}
              max={maxLeverage}
              min={1}
              step={0.1}
              value={leverage}
              onValueChange={setLeverage}
              className="py-1"
            />
          </div>
        </div>
        
        {/* Borrow Rate Information */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 dark:bg-black/20 border border-[#e5e5e5]/20 dark:border-[#393939]/50">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium cursor-help">
                  <span className="border-b border-dotted border-slate-500">Borrow Rate</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs sm:text-sm">Interest rate charged for borrowing funds for leverage.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs text-muted-foreground">
            {(hourlyInterestRate * 10000).toFixed(4)}% per hour
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-px w-full bg-[#e5e5e5]/20 dark:bg-[#393939]/50"></div>
        
        {/* Position Info */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Position Size */}
            <div className="bg-white/5 dark:bg-black/20 rounded-lg p-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help">
                      <span className="border-b border-dotted border-slate-500">Position Size</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Total capital (collateral + borrowed)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="font-bold text-sm sm:text-base pt-1">
                ${positionSize.toFixed(2)}
              </div>
            </div>
            
            {/* Amount Borrowed */}
            <div className="bg-white/5 dark:bg-black/20 rounded-lg p-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help">
                      <span className="border-b border-dotted border-slate-500">Amount Borrowed</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Funds borrowed for leverage</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="font-bold text-sm sm:text-base pt-1">
                ${amountBorrowed.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Fee Breakdown */}
          <div className="p-2 rounded-lg bg-black/30 border border-[#393939]/50 space-y-1.5">
            <div className="text-xs font-medium">Fee Breakdown:</div>
            
            {/* Fees Table */}
            <div className="space-y-1">
              {/* Borrow Cost */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Borrow Cost:</span>
                <span className="font-medium">${borrowCost.toFixed(2)}</span>
              </div>
              
              {/* Option Creation Fee */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Option Creation Fee:</span>
                <span className="font-medium">${optionCreationFee.toFixed(2)}</span>
              </div>
              
              {/* Transaction Cost */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Transaction Cost:</span>
                <span className="font-medium">${transactionCost.toFixed(2)}</span>
              </div>
              
              {/* Divider Line */}
              <div className="h-px w-full bg-[#e5e5e5]/20 dark:bg-[#393939]/50 my-1"></div>
              
              {/* Max Profit Potential after Fees */}
              <div className="flex justify-between text-xs font-medium">
                <span>Max Profit Potential</span>
                <span className="text-green-500 font-bold">${maxProfitPotential.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">(after fees)</div>
            </div>
          </div>
        </div>
        
        {/* Mint Button */}
        <Button
          className="w-full h-10 bg-[#4a85ff]/10 border border-[#4a85ff]/40 dark:border-[#4a85ff]/40
            hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60 hover:scale-[0.98]
            backdrop-blur-sm text-white
            transition-all duration-200 font-medium text-sm sm:text-base
            disabled:opacity-50 disabled:cursor-not-allowed
            disabled:hover:bg-[#4a85ff]/10 disabled:hover:border-[#4a85ff]/40
            disabled:hover:scale-100 rounded-md"
          onClick={onMint}
          disabled={
            !isWalletConnected ||
            !isEnoughCollateral || 
            options.length === 0 || 
            isSubmitting || 
            hasValidationError || 
            !hasPendingOptions
          }
        >
          {isSubmitting ? "Minting..." : isWalletConnected ? "Mint Option" : "Connect Wallet to Mint Option"}
        </Button>
      </CardContent>
    </Card>
  );
} 