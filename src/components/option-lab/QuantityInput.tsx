import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipIndicator } from "./TooltipIndicator";

export const QuantityInput = () => {
  const { getValues, setValue, setError, clearErrors } = useFormContext();

  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setValue('quantity', '');
      return;
    }
    const num = parseInt(value);
    if (num < 1 || num > 10000) {
      setError('quantity', { 
        message: `Quantity must be between 1 and 10,000` 
      });
      return;
    }
    clearErrors('quantity');
    setValue('quantity', Math.floor(num));
  };

  return (
    <FormItem>
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <FormLabel className="mb-2 cursor-help border-b border-dotted border-slate-500 text-xs">
              Quantity
              <TooltipIndicator />
            </FormLabel>
          </TooltipTrigger>
          <TooltipContent>
            <p>The number of option contracts to sell. Each contract represents 100 units of the underlying asset.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <FormControl>
        <Input
          type="number"
          min="1"
          max="10000"
          step="1"
          placeholder="Enter quantity (1-10,000)"
          value={getValues('quantity')}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="h-10"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}; 