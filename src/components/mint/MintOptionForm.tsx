"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useWallet } from "@solana/wallet-adapter-react"
import { useOptionsStore } from "@/stores/optionsStore"
import { PublicKey, Keypair } from "@solana/web3.js"
import { OptionOrder } from "@/types/order"
import { MakerSummary } from "./MakerSummary"

const formSchema = z.object({
  asset: z.enum(["SOL", "LABS"]),
  optionType: z.enum(["call", "put"]),
  expirationDate: z.date(),
  strikePrice: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Strike price must be a positive number" }
  ),
  premium: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    { message: "Premium must be a positive number" }
  ),
  quantity: z.coerce.number()
    .min(1, { message: "Quantity must be a positive number" })
})

export function MintOptionForm() {
  const router = useRouter()
  const { publicKey } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addOption = useOptionsStore((state) => state.addOption)
  const [pendingOptions, setPendingOptions] = useState<Array<z.infer<typeof formSchema>>>([])
  const maxLegs = 4

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset: "SOL",
      optionType: "call",
      strikePrice: '',
      premium: '',
      quantity: 1,
    },
  })

  // Watch form values for MakerSummary
  const formValues = form.watch()

  const addOptionToSummary = () => {
    const values = form.getValues()
    
    // Get unique strikes and option types
    const uniqueStrikes = new Set(pendingOptions.map(opt => opt.strikePrice))
    const uniqueOptionTypes = new Set(pendingOptions.map(opt => opt.optionType))
    
    // Check if new option would exceed limits
    if (!uniqueStrikes.has(values.strikePrice)) {
      if (uniqueStrikes.size >= 4) {
        form.setError('root', { 
          message: 'Maximum of 4 different strike prices allowed' 
        })
        return
      }
    }
    
    if (!uniqueOptionTypes.has(values.optionType) && uniqueOptionTypes.size >= 2) {
      form.setError('root', { 
        message: 'Only calls and puts are allowed' 
      })
      return
    }
    
    // Add the option if it passes the checks
    setPendingOptions(prev => [...prev, values])
    form.reset({
      asset: "SOL",
      optionType: "call",
      strikePrice: '',
      premium: '',
      quantity: 1,
      expirationDate: values.expirationDate // Keep the same date
    })
    form.clearErrors('root')
  }

  const removeOptionFromSummary = (index: number) => {
    setPendingOptions(prev => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault() // Prevent default form submission
    if (!publicKey || pendingOptions.length === 0) return

    setIsSubmitting(true)
    try {
      // Create all pending options
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
        }
        addOption(newOption)
      })

      setPendingOptions([])
      router.push("/trade")
    } catch (error) {
      console.error('Error minting options:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        <FormField
          control={form.control}
          name="asset"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SOL">Solana (SOL)</SelectItem>
                  <SelectItem value="LABS">Epicentral Labs (LABS)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="optionType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Option Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expirationDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
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
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date > new Date(2025, 12, 31)
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strikePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strike Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter strike price"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The price at which the option can be exercised
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="premium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Premium</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter premium"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The price to purchase this option
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Each option contract represents 100 tokens of the underlying asset
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button 
          type="button" 
          variant="secondary"
          onClick={addOptionToSummary}
          disabled={!form.formState.isValid || !form.getValues().strikePrice || !form.getValues().premium}
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
    </Form>
  )
} 