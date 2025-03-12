import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TOKENS } from '@/lib/api/tokens';
import { useFormContext } from 'react-hook-form';

export const AssetSelector = ({ assetPrice }: { assetPrice: number | null }) => {
  const { setValue, getValues } = useFormContext();

  const handleAssetChange = (value: string) => {
    setValue('asset', value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    // Reset premium when asset changes
    setValue('premium', '', {
      shouldValidate: true
    });
  };

  const currentAsset = getValues('asset');
  const labelText = assetPrice 
    ? `${currentAsset} • $${assetPrice.toFixed(4)}`
    : 'Asset';

  return (
    <FormItem>
      <FormLabel className="pt-3 mb-2 flex items-center">
        <span>Current Price:</span>
        {assetPrice && (
          <span className="ml-2 text-[#4a85ff] text-sm font-normal">
            ${assetPrice.toFixed(4)}
          </span>
        )}
      </FormLabel>
      <Select 
        onValueChange={handleAssetChange}
        defaultValue={getValues('asset')}
      >
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select asset" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {Object.entries(TOKENS).map(([symbol, token]) => (
            <SelectItem key={symbol} value={symbol}>
              {token.name} ({token.symbol})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
}; 