import React from 'react';
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormContext } from 'react-hook-form';
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipIndicator } from "./TooltipIndicator";

const startDate = new Date(2025, 0, 1); // January 1st, 2025
const endDate = new Date(2026, 0, 1);   // January 1st, 2026
const allowedDates = getBiWeeklyDates(startDate, endDate);

/**
 * Generates an array of bi-weekly dates within a specified range.
 *
 * This function returns an array of Date objects, starting from the given start date and
 * incrementing by 14 days until the end date is reached or surpassed. If the start date
 * occurs after the end date, the function returns an empty array.
 *
 * @param startDate - The starting date for the sequence.
 * @param endDate - The latest acceptable date in the sequence.
 * @returns An array of Date objects representing bi-weekly intervals between the start and end dates.
 */
function getBiWeeklyDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 14);
  }
  return dates;
}

export const ExpirationDatePicker = () => {
  const { getValues, setValue } = useFormContext();
  const debounceTimer = React.useRef<NodeJS.Timeout>();

  const handleDateChange = (date: Date | undefined) => {
    setValue('expirationDate', date);
    if (date) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        const values = getValues();
        if (values.strikePrice) {
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
              Expiration Date
              <TooltipIndicator />
            </FormLabel>
          </TooltipTrigger>
          <TooltipContent>
            <p>The date when the option expires. The option can only be exercised on or before this date.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={cn(
                "w-full pl-3 text-left font-normal h-10",
                "bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939]",
                "focus:border-[#4a85ff]/40 focus:ring-1 focus:ring-[#4a85ff]/40",
                !getValues('expirationDate') && "text-muted-foreground"
              )}
            >
              {getValues('expirationDate') ? (
                format(getValues('expirationDate'), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={getValues('expirationDate')}
            onSelect={handleDateChange}
            disabled={(date) => {
              const now = new Date();
              if (date < now) return true;
              return !allowedDates.some(allowedDate => 
                allowedDate.getFullYear() === date.getFullYear() &&
                allowedDate.getMonth() === date.getMonth() &&
                allowedDate.getDate() === date.getDate()
              );
            }}
            initialFocus
            defaultMonth={startDate}
            fromDate={new Date()}
            toDate={endDate}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
}; 