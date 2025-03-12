import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipIndicator } from "./TooltipIndicator";

const getStepValue = (price: number | null): string => {
  if (!price) return "0.0001";
  if (price >= 100) return "1";
  if (price >= 1) return "0.5";
  if (price >= 0.01) return "0.005";
  return "0.0001";
};

const validateStrikePrice = (value: string, assetPrice: number | null): boolean => {
  if (!value || !assetPrice) return true;
  const numValue = parseFloat(value);
  if (assetPrice >= 100) return Number.isInteger(numValue);
  if (assetPrice >= 1) return (numValue * 2) % 1 === 0;
  if (assetPrice >= 0.01) return (numValue * 200) % 1 === 0;
  return (numValue * 10000) % 1 === 0;
};

export const StrikePriceInput = ({ assetPrice }: { assetPrice: number | null }) => {
  const { getValues, setValue, setError, clearErrors } = useFormContext();
  const debounceTimer = React.useRef<NodeJS.Timeout>();

  const handleStrikePriceChange = (value: string) => {
    if (value === "") {
      setValue('strikePrice', value);
      return;
    }
    if (!validateStrikePrice(value, assetPrice)) {
      let errorMessage = "";
      if (assetPrice && assetPrice >= 100) {
        errorMessage = "For assets worth $100+, no decimal places are allowed";
      } else if (assetPrice && assetPrice >= 1) {
        errorMessage = "For assets between $1-$100, only $0.50 steps are allowed";
      } else if (assetPrice && assetPrice >= 0.01) {
        errorMessage = "For assets between $0.01-$1, only $0.005 steps are allowed";
      } else {
        errorMessage = "For assets worth less than $0.01, only $0.0001 steps are allowed";
      }
      setError("strikePrice", { message: errorMessage });
    } else {
      clearErrors("strikePrice");
    }
    setValue('strikePrice', value);
    if (value) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const values = getValues();
        if (!values.expirationDate) {
          const tempValues = {...values};
          tempValues.expirationDate = new Date(); // Use a default date
          // calculateOptionPrice(tempValues);
        } else {
          // calculateOptionPrice(values);
        }
      }, 2000); // 2 second debounce
    }
  };

  return (
    <FormItem>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <FormLabel className="mb-2 cursor-help border-b border-dotted border-slate-500 text-xs">
              Strike Price
              <TooltipIndicator />
            </FormLabel>
          </TooltipTrigger>
          <TooltipContent>
            <p>The market price at which the option can be exercised by the buyer.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <FormControl>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">$</span>
          <Input
            type="text"
            step={getStepValue(assetPrice)}
            min="0"
            placeholder="Enter strike price"
            value={getValues('strikePrice')}
            onChange={(e) => handleStrikePriceChange(e.target.value.replace('$', ''))}
            className="h-10 pl-7"
          />
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}; 