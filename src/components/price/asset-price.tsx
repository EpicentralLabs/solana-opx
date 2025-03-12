'use client'

import { useEffect, useState } from 'react'
import { getTokenPrice } from '@/lib/api/getTokenPrice'

/**
 * Renders the current market price for a specified asset.
 *
 * This component retrieves the asset's market price using an asynchronous fetch whenever the asset prop changes and at 60-second intervals.
 * While fetching, it displays a loading message. If no asset is provided or the price is unavailable, it renders nothing or an appropriate fallback message.
 * The price is formatted based on the asset symbol, using fewer decimal places for "SOL" compared to other assets.
 *
 * @param asset - The symbol of the asset whose market price is to be displayed.
 */
export function AssetPrice({ asset }: { asset: string | undefined }) {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPrice = async () => {
      if (!asset) return
      
      setLoading(true)
      try {
        const tokenPrice = await getTokenPrice(asset)
        if (tokenPrice) {
          setPrice(tokenPrice.price)
        }
      } catch (error) {
        console.error('Error fetching price:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000) 
    return () => clearInterval(interval)
  }, [asset])

  const formatPrice = (price: number | null, symbol: string) => {
    if (!price) return 'N/A'
    
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: symbol === 'SOL' ? 2 : 6
    })
  }

  if (!asset) return null
  if (loading) return <div className="text-sm text-muted-foreground">Loading price...</div>
  if (!price) return <div className="text-sm text-muted-foreground">Price unavailable</div>

  return (
    <div className="text-sm text-muted-foreground">
      Current market price: ${formatPrice(price, asset)}
    </div>
  )
} 