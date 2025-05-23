import { FC, useState, useEffect, useMemo } from 'react'
import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/utils/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { GreekFilters } from './filter-greeks'
import { OptionContract, SelectedOption, generateMockOptionData } from './option-data'
import { useAssetPriceInfo } from '@/context/asset-price-provider'
import { MAX_OPTION_LEGS } from '@/constants/constants'
import { toast } from "@/hooks/useToast"

interface OptionChainTableProps {
  assetId?: string
  expirationDate?: string | null
  greekFilters?: GreekFilters
  onOptionsChange?: (options: SelectedOption[]) => void
  initialSelectedOptions?: SelectedOption[]
  useGreekSymbols?: boolean
  onOrderPlaced?: () => void
  onSwitchToCreateOrder?: () => void
}

export const OptionChainTable: FC<OptionChainTableProps> = ({ 
  assetId = 'SOL',
  expirationDate,
  greekFilters = {
    delta: true,
    theta: true,
    gamma: false,
    vega: false,
    rho: false,
    oi: false,
    oa: true,
    volume: true
  },
  onOptionsChange,
  initialSelectedOptions = [],
  useGreekSymbols = false,
  onOrderPlaced,
  onSwitchToCreateOrder
}) => {
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [hoveredPrice, setHoveredPrice] = useState<{index: number, side: 'call' | 'put', type: 'bid' | 'ask'} | null>(null)
  const [visibleGreeks, setVisibleGreeks] = useState<GreekFilters>(greekFilters)
  const prevInitialOptionsRef = React.useRef<SelectedOption[]>([]);
  const [refreshVolume, setRefreshVolume] = useState(0); // Counter to force refresh

  // Use useMemo to compute the shouldDisableOptionButtons flag
  const shouldDisableOptionButtons = useMemo(
    () => selectedOptions.length >= MAX_OPTION_LEGS,
    [selectedOptions.length]
  );

  // Get the current spot price from the asset price context
  const { price: spotPrice } = useAssetPriceInfo(assetId || '')

  // Helper functions to determine if options are ITM or OTM
  const isCallITM = (strike: number): boolean => {
    return spotPrice !== undefined && spotPrice > strike
  }
  
  const isPutITM = (strike: number): boolean => {
    return spotPrice !== undefined && spotPrice < strike
  }

  // Update visible greeks when the greekFilters prop changes
  useEffect(() => {
    if (greekFilters) {
      setVisibleGreeks(greekFilters)
    }
  }, [greekFilters])

  // Sync with initialSelectedOptions when they change from the parent
  useEffect(() => {
    // Check if initialSelectedOptions has actually changed
    const prevOptions = prevInitialOptionsRef.current;
    const optionsChanged = 
      prevOptions.length !== initialSelectedOptions.length || 
      !initialSelectedOptions.every((opt, idx) => 
        opt.index === prevOptions[idx]?.index && 
        opt.side === prevOptions[idx]?.side && 
        opt.type === prevOptions[idx]?.type);
        
    if (optionsChanged) {
      setSelectedOptions(initialSelectedOptions);
      // Update ref with current initialSelectedOptions
      prevInitialOptionsRef.current = [...initialSelectedOptions];
    }
  }, [initialSelectedOptions]);

  // Handler for when an order is placed
  const handleOrderPlaced = () => {
    // Increment refresh counter to force option chain to regenerate with updated volumes
    setRefreshVolume(prev => prev + 1);
    
    // Call parent handler if provided
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  // Get mock data using the generator function with the current spot price
  const mockData: OptionContract[] = React.useMemo(() => 
    generateMockOptionData(expirationDate || null, spotPrice || 0, refreshVolume),
    [expirationDate, refreshVolume, spotPrice]
  );

  // Calculate the position of the price indicator
  const getPriceIndicatorPosition = () => {
    if (!spotPrice || !mockData.length) return 0;
    
    // Find the closest strike price to the current spot price
    const closestStrike = mockData.reduce((prev, curr) => {
      return Math.abs(curr.strike - spotPrice) < Math.abs(prev.strike - spotPrice) ? curr : prev;
    });
    
    // Find the index of the closest strike
    const strikeIndex = mockData.findIndex(option => option.strike === closestStrike.strike);
    
    // Calculate the percentage position (0 to 100)
    return (strikeIndex / (mockData.length - 1)) * 100;
  };

  const handlePriceClick = (index: number, side: 'call' | 'put', type: 'bid' | 'ask') => {
    const option = mockData[index]
    const price = side === 'call' 
      ? (type === 'bid' ? option.callBid : option.callAsk)
      : (type === 'bid' ? option.putBid : option.putAsk)
    
    const newOption: SelectedOption = { 
      index, 
      side, 
      type,
      strike: option.strike,
      expiry: option.expiry,
      asset: assetId,
      price,
      quantity: 0.01 // Set initial quantity to 0.01 (1% of a contract)
    }
    
    setSelectedOptions(prev => {
      // Check if this option is already selected
      const existingIndex = prev.findIndex(
        opt => opt.index === index && opt.side === side && opt.type === type
      )
      
      if (existingIndex >= 0) {
        // Remove if already selected (toggle off)
        const updatedOptions = prev.filter((_, i) => i !== existingIndex);
        return updatedOptions;
      } else {
        // Check if adding this option would exceed the maximum limit
        if (prev.length >= MAX_OPTION_LEGS) {
          // Show a toast notification
          toast({
            title: "Maximum options reached",
            description: `You can only select up to ${MAX_OPTION_LEGS} option legs at a time.`,
            variant: "destructive",
          });
          // Return unchanged selection
          return prev;
        }

        // First remove any other selection for the same index and side (different type)
        const filteredOptions = prev.filter(
          opt => !(opt.index === index && opt.side === side && opt.type !== type)
        )
        
        // Then add the new selection
        return [...filteredOptions, newOption]
      }
    })
    
    // Switch to the create order tab when a price is clicked
    if (onSwitchToCreateOrder) {
      onSwitchToCreateOrder();
    }
  }

  const isOptionSelected = (index: number, side: 'call' | 'put', type: 'bid' | 'ask') => {
    return selectedOptions.some(
      opt => opt.index === index && opt.side === side && opt.type === type
    )
  }

  // Format price consistently with exactly 2 decimal places
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '0.00'
    if (Math.abs(price) < 0.01) return '0.00'
    return Number(Math.round(price * 100) / 100).toFixed(2)
  }

  // Format greek values consistently with appropriate decimal places
  const formatGreek = (value: number | null | undefined, decimals: number = 3) => {
    if (value === null || value === undefined) return '0.000'
    if (Math.abs(value) < 0.001) return '0.000'
    if (decimals === 2) {
      return Number(Math.round(value * 100) / 100).toFixed(2)
    }
    return Number(Math.round(value * 1000) / 1000).toFixed(3)
  }

  // Format volume and open interest as whole numbers
  const formatInteger = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '0'
    // Format with 2 decimal places if number has decimals, otherwise show as whole number
    return Number.isInteger(value) ? Math.round(value).toString() : value.toFixed(2)
  }

  // Notify parent component when selected options change
  useEffect(() => {
    // Only notify parent if the change originated from within this component
    // and not from a parent update via initialSelectedOptions
    if (!onOptionsChange) return;

    // Get a stable JSON representation of both arrays for comparison
    const currentSelectionJson = JSON.stringify(selectedOptions);
    const initialOptionsJson = JSON.stringify(prevInitialOptionsRef.current);
    
    // Only trigger the callback if this is a local change, not from parent props
    if (currentSelectionJson !== initialOptionsJson) {
      // Update our ref to prevent future duplicate notifications
      prevInitialOptionsRef.current = [...selectedOptions];
      onOptionsChange(selectedOptions);
    }
  }, [selectedOptions, onOptionsChange]);

  // Modified price column rendering to remove special handling for pending options
  const renderPriceColumn = (option: OptionContract, index: number, side: 'call' | 'put') => {
    return (
      <div className="flex flex-col space-y-0.5">
        <button
          onClick={() => handlePriceClick(index, side, 'bid')}
          onMouseEnter={() => setHoveredPrice({ index, side, type: 'bid' })}
          onMouseLeave={() => setHoveredPrice(null)}
          className={cn(
            "text-green-500 hover:text-green-400 transition-colors px-2 py-0.5 rounded",
            (hoveredPrice?.index === index && 
            hoveredPrice?.side === side && 
            hoveredPrice?.type === 'bid') && "bg-green-500/10",
            isOptionSelected(index, side, 'bid') && "bg-green-500/20",
            shouldDisableOptionButtons && !isOptionSelected(index, side, 'bid') && "opacity-50 cursor-not-allowed"
          )}
          disabled={shouldDisableOptionButtons && !isOptionSelected(index, side, 'bid')}
        >
          {formatPrice(side === 'call' ? option.callBid : option.putBid)}
        </button>
        <button
          onClick={() => handlePriceClick(index, side, 'ask')}
          onMouseEnter={() => setHoveredPrice({ index, side, type: 'ask' })}
          onMouseLeave={() => setHoveredPrice(null)}
          className={cn(
            "text-red-500 hover:text-red-400 transition-colors px-2 py-0.5 rounded",
            (hoveredPrice?.index === index && 
            hoveredPrice?.side === side && 
            hoveredPrice?.type === 'ask') && "bg-red-500/10",
            isOptionSelected(index, side, 'ask') && "bg-red-500/20",
            shouldDisableOptionButtons && !isOptionSelected(index, side, 'ask') && "opacity-50 cursor-not-allowed"
          )}
          disabled={shouldDisableOptionButtons && !isOptionSelected(index, side, 'ask')}
        >
          {formatPrice(side === 'call' ? option.callAsk : option.putAsk)}
        </button>
      </div>
    );
  };

  return (
    <div 
      className={cn(
        "card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30",
        "border-[#e5e5e5]/20 dark:border-white/5",
        "transition-all duration-300 hover:bg-transparent",
        "overflow-hidden shadow-lg rounded-lg p-4"
      )}
    >
      {/* Option legs counter */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-muted-foreground">
          Selected: {selectedOptions.length}/{MAX_OPTION_LEGS} legs
        </div>
      </div>

      <div className="relative">
        {/* Fixed Header */}
        <Table className="table-fixed w-full">
          <TableHeader>
            {/* Category Labels Row */}
            <TableRow className="hover:bg-transparent border-b-0">
              {/* Calculate colspan for CALLS section */}
              <TableHead 
                colSpan={
                  (visibleGreeks.volume ? 1 : 0) +
                  (visibleGreeks.oi ? 1 : 0) +
                  (visibleGreeks.rho ? 1 : 0) +
                  (visibleGreeks.vega ? 1 : 0) +
                  (visibleGreeks.gamma ? 1 : 0) +
                  (visibleGreeks.theta ? 1 : 0) +
                  (visibleGreeks.delta ? 1 : 0) +
                  (visibleGreeks.oa ? 1 : 0) +
                  1 // Price column
                }
                className="text-center font-bold text-lg text-[#4a85ff]"
              >
                CALLS
              </TableHead>
              {/* Strike Price Column */}
              <TableHead className="text-center font-bold bg-muted/20 w-[100px]" />
              {/* Calculate colspan for PUTS section */}
              <TableHead 
                colSpan={
                  1 + // Price column
                  (visibleGreeks.delta ? 1 : 0) +
                  (visibleGreeks.theta ? 1 : 0) +
                  (visibleGreeks.gamma ? 1 : 0) +
                  (visibleGreeks.vega ? 1 : 0) +
                  (visibleGreeks.rho ? 1 : 0) +
                  (visibleGreeks.oa ? 1 : 0) +
                  (visibleGreeks.oi ? 1 : 0) +
                  (visibleGreeks.volume ? 1 : 0)
                }
                className="text-center font-bold text-lg text-[#4a85ff]"
              >
                PUTS
              </TableHead>
            </TableRow>
            {/* Existing Header Row */}
            <TableRow className="hover:bg-transparent">
              {/* Call side */}
              {visibleGreeks.volume && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">Vol</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Volume - Contracts traded today (includes fractional contracts)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.oi && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">OI</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Open Interest - Total open contracts (includes fractional contracts)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.rho && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "ρ" : "Rho"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Rho - Sensitivity to interest rate changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.oa && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">OA</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Options Available - Quantity of options available to trade
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.vega && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "ν" : "Vega"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Vega - Sensitivity to volatility changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.gamma && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "γ" : "Gamma"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Gamma - Rate of change in Delta
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.theta && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "θ" : "Theta"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Theta - Time decay rate
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.delta && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "Δ" : "Delta"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Delta - Price change sensitivity
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              <TableHead className="text-center w-[85px]">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">Price</TooltipTrigger>
                    <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                      <div className="text-center">
                        <div className="text-green-500">Bid</div>
                        <div className="text-red-500">Ask</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              
              {/* Strike price (center) */}
              <TableHead className="text-center font-bold bg-muted/20 w-[100px]">Strike</TableHead>
              
              {/* Put side */}
              <TableHead className="text-center w-[85px]">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">Price</TooltipTrigger>
                    <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                      <div className="text-center">
                        <div className="text-green-500">Bid</div>
                        <div className="text-red-500">Ask</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              {visibleGreeks.delta && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "Δ" : "Delta"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Delta - Price change sensitivity
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.theta && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "θ" : "Theta"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Theta - Time decay rate
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.gamma && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "γ" : "Gamma"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Gamma - Rate of change in Delta
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.vega && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "ν" : "Vega"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Vega - Sensitivity to volatility changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.rho && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">
                        {useGreekSymbols ? "ρ" : "Rho"}
                      </TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Rho - Sensitivity to interest rate changes
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.oa && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">OA</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Options Available - Quantity of options available to trade
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.oi && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">OI</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Open Interest - Total open contracts (includes fractional contracts)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
              {visibleGreeks.volume && (
                <TableHead className="text-center w-[85px]">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger className="underline decoration-dotted decoration-neutral-400">Vol</TooltipTrigger>
                      <TooltipContent className="backdrop-blur-sm bg-white/10 dark:bg-black/50 border border-white/20 text-white">
                        Volume - Contracts traded today (includes fractional contracts)
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
        </Table>

        {/* Scrollable Body */}
        <div className="max-h-[400px] overflow-y-scroll scrollbar-hide">
          <Table className="table-fixed w-full">
            <TableBody>
              {mockData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={
                    (visibleGreeks.volume ? 1 : 0) +
                    (visibleGreeks.oi ? 1 : 0) +
                    (visibleGreeks.rho ? 1 : 0) +
                    (visibleGreeks.vega ? 1 : 0) +
                    (visibleGreeks.gamma ? 1 : 0) +
                    (visibleGreeks.theta ? 1 : 0) +
                    (visibleGreeks.delta ? 1 : 0) +
                    (visibleGreeks.oa ? 1 : 0) +
                    1 + // Price column
                    1 + // Strike column
                    1 + // Put price column
                    (visibleGreeks.delta ? 1 : 0) +
                    (visibleGreeks.theta ? 1 : 0) +
                    (visibleGreeks.gamma ? 1 : 0) +
                    (visibleGreeks.vega ? 1 : 0) +
                    (visibleGreeks.rho ? 1 : 0) +
                    (visibleGreeks.oa ? 1 : 0) +
                    (visibleGreeks.oi ? 1 : 0) +
                    (visibleGreeks.volume ? 1 : 0)
                  } className="text-center py-4">
                    No option data available
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Show price indicator at top if price is below lowest strike */}
                  {spotPrice && mockData.length > 0 && spotPrice < mockData[0].strike && (
                    <TableRow key="price-indicator-top" className="h-0.5 relative">
                      <TableCell 
                        colSpan={
                          (visibleGreeks.volume ? 1 : 0) +
                          (visibleGreeks.oi ? 1 : 0) +
                          (visibleGreeks.rho ? 1 : 0) +
                          (visibleGreeks.vega ? 1 : 0) +
                          (visibleGreeks.gamma ? 1 : 0) +
                          (visibleGreeks.theta ? 1 : 0) +
                          (visibleGreeks.delta ? 1 : 0) +
                          (visibleGreeks.oa ? 1 : 0) +
                          1 + // Price column
                          1 + // Strike column
                          1 + // Put price column
                          (visibleGreeks.delta ? 1 : 0) +
                          (visibleGreeks.theta ? 1 : 0) +
                          (visibleGreeks.gamma ? 1 : 0) +
                          (visibleGreeks.vega ? 1 : 0) +
                          (visibleGreeks.rho ? 1 : 0) +
                          (visibleGreeks.oa ? 1 : 0) +
                          (visibleGreeks.oi ? 1 : 0) +
                          (visibleGreeks.volume ? 1 : 0)
                        }
                        className="p-0"
                      >
                        <div className="relative w-full h-0.5">
                          <div className="absolute inset-0 bg-[#4a85ff]" />
                          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 
                            bg-[#4a85ff] text-black text-xs px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
                            ${formatPrice(spotPrice)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {mockData.map((option, index) => {
                    const shouldShowPriceIndicator = spotPrice && 
                      index < mockData.length - 1 && 
                      option.strike < spotPrice && 
                      mockData[index + 1].strike > spotPrice;
                    
                    const callIsITM = isCallITM(option.strike);
                    const putIsITM = isPutITM(option.strike);

                    return (
                      <React.Fragment key={`option-group-${index}`}>
                        <TableRow 
                          key={`option-${index}`}
                          className={cn(
                            "hover:bg-muted/5 transition-colors",
                            index % 2 === 0 ? "bg-transparent" : "bg-muted/5"
                          )}
                        >
                          {/* Call side - Add ITM/OTM styling */}
                          <TableCell 
                            colSpan={
                              (visibleGreeks.volume ? 1 : 0) +
                              (visibleGreeks.oi ? 1 : 0) +
                              (visibleGreeks.rho ? 1 : 0) +
                              (visibleGreeks.vega ? 1 : 0) +
                              (visibleGreeks.gamma ? 1 : 0) +
                              (visibleGreeks.theta ? 1 : 0) +
                              (visibleGreeks.delta ? 1 : 0) +
                              (visibleGreeks.oa ? 1 : 0) +
                              1 // Price column
                            }
                            className={cn(
                              "p-0 transition-colors",
                              callIsITM ? "bg-blue-300/5" : "bg-gray-500/1"
                            )}
                          >
                            <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,_1fr))]">
                              {visibleGreeks.volume && (
                                <div className="text-center py-1">
                                  {formatInteger(option.callVolume)}
                                </div>
                              )}
                              {visibleGreeks.oi && (
                                <div className="text-center py-1 opacity-70">
                                  {formatInteger(option.callOpenInterest)}
                                </div>
                              )}
                              {visibleGreeks.rho && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.callGreeks.rho)}
                                </div>
                              )}
                              {visibleGreeks.oa && (
                                <div className="text-center py-1 opacity-70">
                                  {formatInteger(option.callOptionsAvailable)}
                                </div>
                              )}
                              {visibleGreeks.vega && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.callGreeks.vega)}
                                </div>
                              )}
                              {visibleGreeks.gamma && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.callGreeks.gamma)}
                                </div>
                              )}
                              {visibleGreeks.theta && (
                                <div className="text-center py-1">
                                  {formatGreek(option.callGreeks.theta)}
                                </div>
                              )}
                              {visibleGreeks.delta && (
                                <div className="text-center py-1">
                                  {formatGreek(option.callGreeks.delta, 2)}
                                </div>
                              )}
                              <div className="text-center font-medium py-1">
                                {renderPriceColumn(option, index, 'call')}
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Strike price (center) - Remove highlighting for pending options */}
                          <TableCell className="text-center font-bold bg-muted/20">
                            ${formatPrice(option.strike)}
                          </TableCell>
                          
                          {/* Put side - Add ITM/OTM styling */}
                          <TableCell 
                            colSpan={
                              1 + // Price column
                              (visibleGreeks.delta ? 1 : 0) +
                              (visibleGreeks.theta ? 1 : 0) +
                              (visibleGreeks.gamma ? 1 : 0) +
                              (visibleGreeks.vega ? 1 : 0) +
                              (visibleGreeks.rho ? 1 : 0) +
                              (visibleGreeks.oa ? 1 : 0) +
                              (visibleGreeks.oi ? 1 : 0) +
                              (visibleGreeks.volume ? 1 : 0)
                            }
                            className={cn(
                              "p-0 transition-colors",
                              putIsITM ? "bg-blue-300/5" : "bg-gray-500/1"
                            )}
                          >
                            <div className="grid grid-cols-[repeat(auto-fit,_minmax(0,_1fr))]">
                              <div className="text-center font-medium py-1">
                                {renderPriceColumn(option, index, 'put')}
                              </div>
                              {visibleGreeks.delta && (
                                <div className="text-center py-1">
                                  {formatGreek(option.putGreeks.delta, 2)}
                                </div>
                              )}
                              {visibleGreeks.theta && (
                                <div className="text-center py-1">
                                  {formatGreek(option.putGreeks.theta)}
                                </div>
                              )}
                              {visibleGreeks.gamma && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.putGreeks.gamma)}
                                </div>
                              )}
                              {visibleGreeks.vega && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.putGreeks.vega)}
                                </div>
                              )}
                              {visibleGreeks.rho && (
                                <div className="text-center py-1 opacity-70">
                                  {formatGreek(option.putGreeks.rho)}
                                </div>
                              )}
                              {visibleGreeks.oa && (
                                <div className="text-center py-1 opacity-70">
                                  {formatInteger(option.putOptionsAvailable)}
                                </div>
                              )}
                              {visibleGreeks.oi && (
                                <div className="text-center py-1 opacity-70">
                                  {formatInteger(option.putOpenInterest)}
                                </div>
                              )}
                              {visibleGreeks.volume && (
                                <div className="text-center py-1">
                                  {formatInteger(option.putVolume)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {shouldShowPriceIndicator && (
                          <TableRow key={`price-indicator-${index}`} className="h-0.5 relative">
                            <TableCell 
                              colSpan={
                                (visibleGreeks.volume ? 1 : 0) +
                                (visibleGreeks.oi ? 1 : 0) +
                                (visibleGreeks.rho ? 1 : 0) +
                                (visibleGreeks.vega ? 1 : 0) +
                                (visibleGreeks.gamma ? 1 : 0) +
                                (visibleGreeks.theta ? 1 : 0) +
                                (visibleGreeks.delta ? 1 : 0) +
                                (visibleGreeks.oa ? 1 : 0) +
                                1 + // Price column
                                1 + // Strike column
                                1 + // Put price column
                                (visibleGreeks.delta ? 1 : 0) +
                                (visibleGreeks.theta ? 1 : 0) +
                                (visibleGreeks.gamma ? 1 : 0) +
                                (visibleGreeks.vega ? 1 : 0) +
                                (visibleGreeks.rho ? 1 : 0) +
                                (visibleGreeks.oa ? 1 : 0) +
                                (visibleGreeks.oi ? 1 : 0) +
                                (visibleGreeks.volume ? 1 : 0)
                              }
                              className="p-0"
                            >
                              <div className="relative w-full h-0.5">
                                <div className="absolute inset-0 bg-[#4a85ff]" />
                                <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 
                                  bg-[#4a85ff] text-black text-xs px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
                                  ${formatPrice(spotPrice)}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* Show price indicator at bottom if price is above highest strike */}
                  {spotPrice && mockData.length > 0 && spotPrice > mockData[mockData.length - 1].strike && (
                    <TableRow key="price-indicator-bottom" className="h-0.5 relative">
                      <TableCell 
                        colSpan={
                          (visibleGreeks.volume ? 1 : 0) +
                          (visibleGreeks.oi ? 1 : 0) +
                          (visibleGreeks.rho ? 1 : 0) +
                          (visibleGreeks.vega ? 1 : 0) +
                          (visibleGreeks.gamma ? 1 : 0) +
                          (visibleGreeks.theta ? 1 : 0) +
                          (visibleGreeks.delta ? 1 : 0) +
                          (visibleGreeks.oa ? 1 : 0) +
                          1 + // Price column
                          1 + // Strike column
                          1 + // Put price column
                          (visibleGreeks.delta ? 1 : 0) +
                          (visibleGreeks.theta ? 1 : 0) +
                          (visibleGreeks.gamma ? 1 : 0) +
                          (visibleGreeks.vega ? 1 : 0) +
                          (visibleGreeks.rho ? 1 : 0) +
                          (visibleGreeks.oa ? 1 : 0) +
                          (visibleGreeks.oi ? 1 : 0) +
                          (visibleGreeks.volume ? 1 : 0)
                        }
                        className="p-0"
                      >
                        <div className="relative w-full h-0.5">
                          <div className="absolute inset-0 bg-[#4a85ff]" />
                          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2 
                            bg-[#4a85ff] text-black text-xs px-1.5 py-0.5 rounded-sm whitespace-nowrap font-medium">
                            ${formatPrice(spotPrice)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};