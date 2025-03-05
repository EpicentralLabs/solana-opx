/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Keypair } from "@solana/web3.js";
import { format } from "date-fns";
import { useOptionsStore } from "@/stores/options/optionsStore";
import { OptionOrder } from "@/types/options/orderTypes";
import { calculateOption } from '@/lib/tests/option-calculator';
import { getTokenPrice } from '@/lib/api/getTokenPrice';
import { AssetSelector } from './AssetSelector';
import { OptionTypeSelector } from './OptionTypeSelector';
import { ExpirationDatePicker } from './ExpirationDatePicker';
import { StrikePriceInput } from './StrikePriceInput';
import { PremiumDisplay } from './PremiumDisplay';
import { QuantityInput } from './QuantityInput';
import { EDIT_REFRESH_INTERVAL, AUTO_REFRESH_INTERVAL } from '@/constants/mint/constants';
import { Button } from "@/components/ui/button";
import { MakerSummary } from "./MakerSummary";

const formSchema = z.object({
  asset: z.enum(["SOL", "LABS"]),
  optionType: z.enum(["call", "put"]),
  expirationDate: z.date({
    required_error: "Expiration date is required",
  }),
  strikePrice: z.string().refine(val => val !== '', {
    message: "Strike price is required",
  }),
  premium: z.string().refine(
    (val) => {
      if (val === '') return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Premium must be a valid number" }
  ),
  quantity: z.coerce
    .number()
    .int({ message: "Quantity must be a whole number" })
    .min(1, { message: "Quantity must be at least 1" })
    .max(100, { message: "Quantity must be at most 100" })
});

export function OptionLabForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addOption = useOptionsStore((state) => state.addOption);
  const [pendingOptions, setPendingOptions] = useState<Array<z.infer<typeof formSchema>>>([]);

  const methods = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset: "SOL",
      optionType: "call",
      strikePrice: '',
      premium: '',
      quantity: 1,
      expirationDate: undefined,
    },
  });

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isCalculatingPremium, setIsCalculatingPremium] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateOptionPrice = async (values: z.infer<typeof formSchema>) => {
    console.log('Calculating option price for values:', values);
    if (isCalculatingPremium) {
      console.log('Calculation already in progress, skipping');
      return;
    }
    const spotPrice = await getTokenPrice(values.asset);
    if (!spotPrice || !values.expirationDate) {
      console.log('Missing spot price or expiration date, cannot calculate');
      return;
    }
    setIsCalculatingPremium(true);
    const timeUntilExpiry = Math.floor(
      (values.expirationDate.getTime() - Date.now()) / 1000
    );
    try {
      const volatility = 0.35;
      const riskFreeRate = 0.08;
      const result = await calculateOption({
        isCall: values.optionType === 'call',
        strikePrice: Number(values.strikePrice),
        spotPrice: spotPrice.price,
        timeUntilExpirySeconds: timeUntilExpiry,
        volatility,
        riskFreeRate
      });
      const premium = result.price;
      setCalculatedPrice(premium);
      methods.setValue('premium', premium.toString());
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error calculating option:', error);
    } finally {
      setIsCalculatingPremium(false);
    }
  };

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    const values = methods.getValues();
    const strikePrice = values.strikePrice;
    if (strikePrice) {
      debounceTimer.current = setTimeout(() => {
        if (!values.expirationDate) {
          const tempValues = {...values};
          tempValues.expirationDate = new Date();
          calculateOptionPrice(tempValues);
        } else {
          calculateOptionPrice(values);
        }
      }, EDIT_REFRESH_INTERVAL);
    }
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [methods.watch('strikePrice'), methods.watch('expirationDate')]);

  useEffect(() => {
    if (calculatedPrice !== null) {
      methods.setValue('premium', calculatedPrice.toFixed(4), { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
    }
  }, [calculatedPrice, methods]);

  useEffect(() => {
    const fetchAssetPrice = async () => {
      const values = methods.getValues();
      console.log('Fetching asset price for:', values.asset);
      const priceData = await getTokenPrice(values.asset);
      if (priceData) {
        setAssetPrice(priceData.price);
      } else {
        setAssetPrice(null);
      }
    };
    fetchAssetPrice();
    const priceInterval = setInterval(fetchAssetPrice, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(priceInterval);
  }, [methods.watch('asset')]);

  const addOptionToSummary = () => {
    const values = methods.getValues();
    if (!values.strikePrice || !values.expirationDate) {
      methods.setError('root', { 
        message: 'Please fill in all required fields' 
      });
      return;
    }
    if (isCalculatingPremium || calculatedPrice === null) {
      methods.setError('root', { 
        message: 'Please wait for premium calculation to complete' 
      });
      return;
    }
    const uniqueStrikes = new Set(pendingOptions.map(opt => opt.strikePrice));
    const uniqueOptionTypes = new Set(pendingOptions.map(opt => opt.optionType));
    if (!uniqueStrikes.has(values.strikePrice)) {
      if (uniqueStrikes.size >= 4) {
        methods.setError('root', { 
          message: 'Maximum of 4 different strike prices allowed' 
        });
        return;
      }
    }
    if (!uniqueOptionTypes.has(values.optionType) && uniqueOptionTypes.size >= 2) {
      methods.setError('root', { 
        message: 'Only calls and puts are allowed' 
      });
      return;
    }
    setPendingOptions(prev => [...prev, values]);
    setCalculatedPrice(null);
    methods.reset({
      asset: "SOL",
      optionType: "call",
      strikePrice: '',
      premium: '',
      quantity: 1,
      expirationDate: values.expirationDate
    });
    methods.clearErrors('root');
  };

  const removeOptionFromSummary = (index: number) => {
    setPendingOptions(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || pendingOptions.length === 0) return;
    setIsSubmitting(true);
    try {
      pendingOptions.forEach(values => {
        const newOption: OptionOrder = {
          publicKey: new PublicKey(Keypair.generate().publicKey),
          strike: Number(values.strikePrice),
          price: Number(values.premium),
          bidPrice: 0,
          askPrice: Number(values.premium),
          type: 'sell',
          optionSide: values.optionType,
          timestamp: new Date(),
          owner: publicKey,
          status: 'pending',
          size: values.quantity,
          expirationDate: format(values.expirationDate, 'yyyy-MM-dd')
        };
        addOption(newOption);
      });
      setPendingOptions([]);
      router.push("/trade");
    } catch (error) {
      console.error('Error minting options:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const manualRefresh = () => {
    console.log('Manual refresh triggered');
    const values = methods.getValues();
    if (values.strikePrice && values.expirationDate) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      setIsDebouncing(true);
      debounceTimer.current = setTimeout(() => {
        calculateOptionPrice(values);
        setIsDebouncing(false);
      }, EDIT_REFRESH_INTERVAL);
    }
  };

  return (
    <div className="mx-auto max-w-xl w-full">
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-8">
          <AssetSelector assetPrice={assetPrice} />
          <OptionTypeSelector />
          <ExpirationDatePicker />
          <StrikePriceInput assetPrice={assetPrice} />
          <PremiumDisplay lastUpdated={lastUpdated} manualRefresh={manualRefresh} isDebouncing={isDebouncing} />
          <QuantityInput />
          {methods.formState.errors.root && (
            <p className="text-sm text-destructive">
              {methods.formState.errors.root.message}
            </p>
          )}
          <Button 
            type="button" 
            variant="secondary"
            onClick={addOptionToSummary}
            disabled={
              !methods.formState.isValid || 
              !methods.getValues("strikePrice") || 
              !methods.getValues("premium") ||
              !methods.getValues("expirationDate")
            }
          >
            Add Option
          </Button>
          <MakerSummary 
            options={pendingOptions}
            onRemoveOption={removeOptionFromSummary}
          />
          {pendingOptions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Please add at least 1 option contract to the summary before minting!
            </p>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting || pendingOptions.length === 0}
            className="w-full"
          >
            {isSubmitting ? "Minting..." : `Mint ${pendingOptions.length} Option${pendingOptions.length !== 1 ? 's' : ''}`}
          </Button>
        </form>
      </FormProvider>
    </div>
  );
}