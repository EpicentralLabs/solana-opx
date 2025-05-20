import { FC, useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { SelectedOption } from './option-data'
import { formatSelectedOption, MAX_OPTION_LEGS } from '@/constants/constants'
import { X, Plus, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAssetPriceInfo } from '@/context/asset-price-provider'
import { useWallet } from '@solana/wallet-adapter-react'
import Image from 'next/image'
import { optionsAvailabilityTracker } from './option-data'
import dynamic from 'next/dynamic'

// Dynamically import wallet button with ssr disabled to prevent hydration mismatch
const WalletButton = dynamic(
  () => import('../solana/user-wallet/wallet-button').then(mod => mod.WalletButton),
  { ssr: false }
)

// Define minimum quantity constant
const MIN_QTY = 0.1 // 1/10th contract

interface CreateOrderProps {
  selectedOptions: SelectedOption[]
  onRemoveOption?: (index: number) => void
  onUpdateQuantity?: (index: number, quantity: number) => void
  onUpdateLimitPrice?: (index: number, price: number) => void
}

// Define a type for stable leg identifiers
type LegKey = string; // option.index as string

export const CreateOrder: FC<CreateOrderProps> = ({ 
  selectedOptions = [],
  onRemoveOption,
  onUpdateQuantity,
  onUpdateLimitPrice
}) => {
  const { publicKey } = useWallet()
  // Initialize with empty objects using stable identifiers
  const [orderTypes, setOrderTypes] = useState<Record<LegKey, 'MKT' | 'LMT'>>({});
  const [inputValues, setInputValues] = useState<Record<LegKey, string>>({});
  const [quantityInputs, setQuantityInputs] = useState<Record<LegKey, string>>({});
  const [maxAvailableOptions, setMaxAvailableOptions] = useState<Record<LegKey, number>>({});

  // Update all state when options change
  useEffect(() => {
    // Create a new state object for max available options
    const newMaxAvailable: Record<LegKey, number> = {};
    
    // Update order types
    setOrderTypes(prev => {
      const newOrderTypes: Record<LegKey, 'MKT' | 'LMT'> = {};
      selectedOptions.forEach((option) => {
        const legKey = option.index.toString();
        newOrderTypes[legKey] = prev[legKey] || 'MKT';
      });
      return newOrderTypes;
    });

    // Update price input values
    setInputValues(prev => {
      const newValues = { ...prev };
      selectedOptions.forEach((option) => {
        const legKey = option.index.toString();
        // Always ensure there's a value
        newValues[legKey] = prev[legKey] || option.price.toFixed(2);
      });
      return newValues;
    });

    // Update quantity inputs and check max available options
    setQuantityInputs(prev => {
      const newQuantityInputs = { ...prev };
      let needsUpdate = false;
      
      selectedOptions.forEach((option) => {
        const legKey = option.index.toString();
        
        // Preserve existing quantity input or initialize with current option quantity
        if (!newQuantityInputs[legKey]) {
          const safeQuantity = option.quantity || MIN_QTY;
          newQuantityInputs[legKey] = safeQuantity.toFixed(2);
          needsUpdate = true;
        }
        
        // If option type is 'bid', get the maximum available
        if (option.type === 'bid') {
          const availableOptions = optionsAvailabilityTracker.getOptionsAvailable(
            option.strike, 
            option.expiry, 
            option.side
          );
          
          // Store the max available (default to 0 if undefined)
          const safeAvailableOptions = availableOptions ?? 0;
          newMaxAvailable[legKey] = safeAvailableOptions;
          
          // If current quantity is more than available, cap it
          const qtyRequested = option.quantity || MIN_QTY;
          if (qtyRequested > safeAvailableOptions && safeAvailableOptions > 0) {
            // Update the quantity in parent component
            if (onUpdateQuantity) {
              onUpdateQuantity(selectedOptions.findIndex(opt => opt.index === option.index), safeAvailableOptions);
              // Also update the local input value to match
              newQuantityInputs[legKey] = safeAvailableOptions.toFixed(2);
              needsUpdate = true;
            }
          }
        }
      });
      
      // Set the max available options state
      setMaxAvailableOptions(newMaxAvailable);
      
      // Only update if something changed
      return needsUpdate ? newQuantityInputs : prev;
    });
  }, [selectedOptions, onUpdateQuantity]);

  // Get unique assets from selected options
  const uniqueAssets = useMemo(() => {
    return [...new Set(selectedOptions.map(option => option.asset))];
  }, [selectedOptions]);
  
  // Get price for each unique asset
  const { price: firstAssetPrice } = useAssetPriceInfo(uniqueAssets[0] || '');
  const { price: secondAssetPrice } = useAssetPriceInfo(uniqueAssets[1] || '');
  const { price: thirdAssetPrice } = useAssetPriceInfo(uniqueAssets[2] || '');
  const { price: fourthAssetPrice } = useAssetPriceInfo(uniqueAssets[3] || '');
  
  // Create assetPriceMap in useMemo to prevent unnecessary re-renders
  const assetPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    
    if (uniqueAssets[0] && firstAssetPrice) {
      map.set(uniqueAssets[0], firstAssetPrice);
    }
    
    if (uniqueAssets[1] && secondAssetPrice) {
      map.set(uniqueAssets[1], secondAssetPrice);
    }
    
    if (uniqueAssets[2] && thirdAssetPrice) {
      map.set(uniqueAssets[2], thirdAssetPrice);
    }
    
    if (uniqueAssets[3] && fourthAssetPrice) {
      map.set(uniqueAssets[3], fourthAssetPrice);
    }
    
    return map;
  }, [
    uniqueAssets,
    firstAssetPrice,
    secondAssetPrice,
    thirdAssetPrice,
    fourthAssetPrice
  ]);

  const handleQuantityChange = (index: number, delta: number) => {
    if (!onUpdateQuantity) return
    
    const option = selectedOptions[index]
    const currentQuantity = option.quantity || MIN_QTY
    let newQuantity = Math.max(MIN_QTY, +(currentQuantity + delta).toFixed(2)) // Ensure quantity doesn't go below MIN_QTY
    
    // If bidding (buying), check maximum available
    const legKey = option.index.toString()
    if (option.type === 'bid') {
      const maxAvailable = maxAvailableOptions[legKey] ?? 0
      if (maxAvailable > 0 && newQuantity > maxAvailable) {
        newQuantity = maxAvailable
      }
    }
    
    // Important: Update only the EXACT option that was modified (by index)
    onUpdateQuantity(index, newQuantity)
    
    // Update quantity input field using the stable identifier
    setQuantityInputs(prev => ({
      ...prev,
      [legKey]: newQuantity.toFixed(2)
    }))
  }

  // Handle direct quantity input changes
  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!onUpdateQuantity) return

    const option = selectedOptions[index]
    const legKey = option.index.toString()
    const inputValue = e.target.value;

    // Allow empty field, numbers, and decimal numbers with up to 2 decimal places
    if (inputValue === '' || /^\d*\.?\d{0,2}$/.test(inputValue)) {
      // Only update the actual quantity if it's a valid number and at least MIN_QTY
      if (inputValue !== '' && inputValue !== '.') {
        let parsed = parseFloat(inputValue);
        
        if (!isNaN(parsed) && parsed >= MIN_QTY) {
          // If bidding (buying), check maximum available
          if (option.type === 'bid') {
            const maxAvailable = maxAvailableOptions[legKey] ?? 0
            if (maxAvailable > 0 && parsed > maxAvailable) {
              parsed = maxAvailable
              // Update the input field with the capped value
              setQuantityInputs(prev => ({ ...prev, [legKey]: maxAvailable.toFixed(2) }));
              // Update parent component with capped value - specifically for this leg only
              onUpdateQuantity(index, parsed);
              return; // Exit early since we've already updated everything
            }
          }
          
          // If we didn't hit the cap, update normally - this specific leg only
          setQuantityInputs(prev => ({ ...prev, [legKey]: inputValue }));
          onUpdateQuantity(index, parsed);
        } else {
          // Still update the input field for usability
          setQuantityInputs(prev => ({ ...prev, [legKey]: inputValue }));
        }
      } else {
        // Empty or just a decimal point - update input field only
        setQuantityInputs(prev => ({ ...prev, [legKey]: inputValue }));
      }
    }
  }

  // Handle switching between MKT and LMT
  const handleOrderTypeChange = (index: number, type: 'MKT' | 'LMT') => {
    const option = selectedOptions[index]
    const legKey = option.index.toString()
    
    setOrderTypes(prev => ({ ...prev, [legKey]: type }));
    
    if (type === 'MKT') {
      // When switching to MKT, set limit price to current market price
      if (onUpdateLimitPrice) {
        onUpdateLimitPrice(index, option.price);
      }
      // Reset input value to current market price
      setInputValues(prev => ({ 
        ...prev, 
        [legKey]: option.price.toFixed(2) 
      }));
    }
  };

  // Handle price input changes
  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const option = selectedOptions[index]
    const legKey = option.index.toString()
    
    if (!onUpdateLimitPrice || orderTypes[legKey] === 'MKT') return;
    
    const inputValue = e.target.value;
    
    // Don't allow negative numbers
    if (inputValue.startsWith('-')) return;
    
    // Update the display value immediately for all valid inputs
    if (inputValue === '' || /^\d*\.?\d{0,2}$/.test(inputValue)) {
      setInputValues(prev => ({ ...prev, [legKey]: inputValue || '0.00' }));
      
      // Only update the actual price if it's a valid number
      if (inputValue !== '' && inputValue !== '.') {
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
          onUpdateLimitPrice(index, parsed);
        }
      }
    }
  };

  // Get the display price for an option
  const getDisplayPrice = (option: SelectedOption): string => {
    const legKey = option.index.toString()
    if (orderTypes[legKey] === 'MKT') {
      return option.price.toFixed(2);
    }
    return inputValues[legKey] || option.price.toFixed(2); // Ensure always a defined value
  };

  // Ensure we have a valid quantity value for display
  const getDisplayQuantity = (option: SelectedOption): string => {
    const legKey = option.index.toString()
    return quantityInputs[legKey] || option.quantity.toFixed(2);
  };

  // Get available options warning if needed
  const getAvailableOptionsWarning = (option: SelectedOption): string | null => {
    const legKey = option.index.toString()
    if (option.type === 'bid') {
      const availableQty = maxAvailableOptions[legKey] ?? 0
      if (availableQty === 0) {
        return "No options available";
      } else {
        const qtyRequested = option.quantity || MIN_QTY;
        if (qtyRequested > availableQty) {
          return `Max available: ${availableQty.toFixed(2)}`;
        }
      }
    }
    return null;
  };

  // Get available options display
  const getOptionsAvailableDisplay = (option: SelectedOption): string => {
    const legKey = option.index.toString()
    if (option.type === 'bid') {
      const availableQty = maxAvailableOptions[legKey] ?? 0
      return availableQty.toFixed(2);
    }
    return "N/A"; // Not applicable for ask options
  };

  return (
    <div className="w-full card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 
      border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 
      hover:bg-transparent shadow-lg rounded-lg p-2 sm:p-4">
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold">Create Order</h3>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {selectedOptions.length}/{MAX_OPTION_LEGS} legs
          </div>
        </div>

        {!publicKey ? (
          <div className="min-h-[80px] sm:min-h-[100px] flex flex-col items-center justify-center gap-4 py-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              Connect wallet to create options orders
            </p>
            <WalletButton />
          </div>
        ) : selectedOptions.length === 0 ? (
          <div className="min-h-[80px] sm:min-h-[100px] flex items-center justify-center text-muted-foreground text-sm sm:text-base">
            <p>Select options from the chain above to build your order</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedOptions.map((option, index) => {
              // Format the option display string
              const formattedOption = formatSelectedOption({
                asset: option.asset,
                side: option.side,
                strike: option.strike,
                expiry: option.expiry
              })
              
              // Extract option type (Call/Put) from the formatted string
              const optionType = formattedOption.includes('Call') ? 'Call' : 'Put'
              
              // Extract and format the expiry date
              const expiryDate = option.expiry.split('T')[0] // Assuming ISO date format
              
              // Clean the option name to show asset and strike separately
              const assetName = option.asset
              const strikePrice = `$${option.strike}`
              
              // Determine price color based on option type
              const priceColor = option.type === 'bid' 
                ? 'text-green-500' 
                : 'text-red-500'
                
              // Get the stable leg key for this option
              const legKey = option.index.toString()

              // Get availability warning
              const availabilityWarning = getAvailableOptionsWarning(option)
              
              return (
                <Card key={`${option.asset}-${option.side}-${option.strike}-${option.expiry}-${option.index}`} className="bg-black/10 border border-white/10">
                  <CardContent className="p-2 sm:p-3">
                    <div className="flex flex-col space-y-2 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                         {assetName.toUpperCase() === 'SOL' && (
                           <Image 
                             src="/token-logos/solana_logo.png" 
                             alt="Solana Logo" 
                             width={20} 
                             height={20} 
                             className="mr-1.5"
                           />
                         )}
                         <Badge variant="grey" className="capitalize">
                            {assetName}
                          </Badge>
                          <Badge variant={option.type === 'bid' ? 'success' : 'destructive'} className="capitalize">
                            {option.type === 'bid' ? 'Long' : 'Short'}
                          </Badge>
                          <Badge variant="blue" className="capitalize">
                            {optionType}
                          </Badge>
                          <Badge variant="blue" className="capitalize">
                            {strikePrice}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-2">
                          <Badge variant="blue" className="capitalize">
                            EXP: {expiryDate}
                          </Badge>
                          {onRemoveOption && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-white"
                              onClick={() => onRemoveOption(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-6 w-16 px-2 py-0 text-xs ${
                            orderTypes[legKey] === 'MKT' 
                              ? 'bg-[#4a85ff]/10 border border-[#4a85ff]/40 hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60' 
                              : 'bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] hover:bg-[#4a85ff]/10 hover:border-[#4a85ff]/40'
                          } transition-all duration-200`}
                          onClick={() => handleOrderTypeChange(index, 'MKT')}
                        >
                          MKT
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-6 w-16 px-2 py-0 text-xs ${
                            orderTypes[legKey] === 'LMT' 
                              ? 'bg-[#4a85ff]/10 border border-[#4a85ff]/40 hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60' 
                              : 'bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939] hover:bg-[#4a85ff]/10 hover:border-[#4a85ff]/40'
                          } transition-all duration-200`}
                          onClick={() => handleOrderTypeChange(index, 'LMT')}
                        >
                          LMT
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {orderTypes[legKey] === 'MKT' ? (
                            // Market Price Display (Text)
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">Current Price:</span>
                              <span className={`text-xs sm:text-sm font-medium ${priceColor}`}>
                                ${option.price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            // Limit Price Input
                            <>
                              <span className="text-xs sm:text-sm text-muted-foreground">Set Limit Price:</span>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-muted-foreground">$</span>
                                <Input
                                  type="text"
                                  value={inputValues[legKey] || option.price.toFixed(2)}
                                  onChange={(e) => handlePriceInputChange(e, index)}
                                  className={`h-6 w-16 text-xs sm:text-sm pl-5 ${priceColor}`}
                                  placeholder="Enter price"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">Qty:</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleQuantityChange(index, -MIN_QTY)}
                                title={`Decrease by ${MIN_QTY}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>

                              <div className="relative w-14">
                                <Input
                                  type="text"
                                  value={getDisplayQuantity(option)}
                                  onChange={(e) => handleQuantityInputChange(e, index)}
                                  className="h-6 text-xs sm:text-sm text-center px-1"
                                  placeholder="Qty"
                                />
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleQuantityChange(index, MIN_QTY)}
                                title={`Increase by ${MIN_QTY}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Display options available under quantity section */}
                          {option.type === 'bid' && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs sm:text-sm text-muted-foreground">Options Available:</span>
                              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                                {getOptionsAvailableDisplay(option)}
                              </span>
                            </div>
                          )}
                          
                          {/* Display availability warning */}
                          {availabilityWarning && (
                            <p className="text-xs text-red-500 mt-1">{availabilityWarning}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 