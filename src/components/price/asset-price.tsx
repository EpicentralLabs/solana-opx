'use client'

import { useEffect, useState } from 'react'
import { getTokenPrice } from '@/lib/api/getTokenPrice'

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