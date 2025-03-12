import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useFormContext } from 'react-hook-form';
import type { FormData } from '@/types/mint/form';
import { cn } from "@/lib/utils";

export const OptionTypeSelector = () => {
  const { setValue, watch } = useFormContext<FormData>();
  const optionType = watch('optionType');

  const handleOptionTypeChange = (type: 'call' | 'put') => {
    setValue('optionType', type, { shouldValidate: true });
  };

  return (
    <FormItem>
      <FormLabel>Option Type</FormLabel>
      <FormControl>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOptionTypeChange('call')}
            className={cn(
              "flex-1 h-8 bg-[#4a85ff]/10 border border-[#4a85ff]/40",
              "hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60",
              "transition-all duration-200",
              optionType === "call" && "bg-[#4a85ff]/50 border-[#4a85ff]/60"
            )}
          >
            Call
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOptionTypeChange('put')}
            className={cn(
              "flex-1 h-8 bg-[#4a85ff]/10 border border-[#4a85ff]/40",
              "hover:bg-[#4a85ff]/20 hover:border-[#4a85ff]/60",
              "transition-all duration-200",
              optionType === "put" && "bg-[#4a85ff]/50 border-[#4a85ff]/60"
            )}
          >
            Put
          </Button>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}; 