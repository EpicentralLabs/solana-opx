'use client'

import { OptionChainControls } from '@/components/trade/option-chain-controls'
import { TradeViewContainer } from '@/components/trade/trade-view-container'
import { AssetChart } from '@/components/trade/asset-chart'
import { AssetType } from '@/components/trade/asset-underlying'
import { TOKENS } from '@/constants/token-list/token-list'
import { useState, useCallback, useRef, useEffect } from 'react'
import { SelectedOption } from '@/components/trade/option-data'
import { useSearchParams, useRouter } from 'next/navigation'

export default function TradePage() {
  const [selectedAsset, setSelectedAsset] = useState(Object.keys(TOKENS)[0])
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [volumeUpdateTrigger, setVolumeUpdateTrigger] = useState(0)
  const [activeView, setActiveView] = useState('trade')
  const [activeOrderTab, setActiveOrderTab] = useState('open')
  const optionChainControlsRef = useRef<HTMLDivElement>(null)
  
  // Get search parameters to determine which tabs to show
  const searchParams = useSearchParams()
  const router = useRouter()

  // On component mount, check for view and tab params
  useEffect(() => {
    const view = searchParams.get('view')
    const tab = searchParams.get('tab')
    
    if (view === 'orders') {
      setActiveView('orders')
    }
    
    if (tab === 'open') {
      setActiveOrderTab('open')
    }
  }, [searchParams])

  // Push state changes back into URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (activeView === 'orders') {
      params.set('view', activeView)
    } else {
      params.delete('view')
    }
    
    if (activeOrderTab === 'open') {
      params.set('tab', activeOrderTab)
    } else {
      params.delete('tab')
    }
    
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [activeView, activeOrderTab, router, searchParams])

  // Handle option changes from both sources (chain table and create order)
  const handleOptionsChange = useCallback((options: SelectedOption[]) => {
    setSelectedOptions(options)
  }, [])

  // Handle order placement to update volume data
  const handleOrderPlaced = useCallback(() => {
    // Increment trigger to force volume data refresh
    setVolumeUpdateTrigger(prev => prev + 1)
    
    // Clear selected options since order was placed
    setSelectedOptions([])
  }, [])

  // Function to switch to the trade view when an option is selected
  const handleSwitchToCreateOrder = useCallback(() => {
    // Ensure the trade view is active to show the create order form
    setActiveView('trade')
  }, [])

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 max-w-[1920px]">
      <div className="grid grid-cols-1 gap-2 sm:gap-4">
        <div className="rounded-lg shadow-lg p-2 sm:p-4">
          {/* Asset Type Selector */}
          <div className="mb-2 sm:mb-4">
            <AssetType 
              selectedAsset={selectedAsset} 
              onAssetChange={setSelectedAsset} 
            />
          </div>
          
          {/* Asset Chart */}
          <div className="mb-2 sm:mb-4 overflow-x-auto">
            <AssetChart selectedAsset={selectedAsset} />
          </div>
          
          {/* Option Chain with Expiration Selector and Trade View */}
          <div className="space-y-2 sm:space-y-4">
            <div className="overflow-x-auto -mx-2 px-2" ref={optionChainControlsRef}>
              <OptionChainControls 
                key={`option-chain-controls-${volumeUpdateTrigger}`}
                assetId={selectedAsset} 
                onOptionsChange={handleOptionsChange}
                selectedOptions={selectedOptions}
                onOrderPlaced={handleOrderPlaced}
                onSwitchToCreateOrder={handleSwitchToCreateOrder}
              />
            </div>
            <div className="overflow-x-auto -mx-2 px-2">
              <TradeViewContainer 
                selectedOptions={selectedOptions}
                onOptionsChange={handleOptionsChange}
                onOrderPlaced={handleOrderPlaced}
                activeView={activeView}
                setActiveView={setActiveView}
                activeOrderTab={activeOrderTab}
                setActiveOrderTab={setActiveOrderTab}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 