'use client'

import { FC, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OrdersViewOpen } from './orders-view-open'
import { OrdersViewHistory } from './orders-view-history'

interface OrdersViewProps {
  activeTab?: string
  setActiveTab?: (tab: string) => void
}

export const OrdersView: FC<OrdersViewProps> = ({ 
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab
}) => {
  // Use internal state if no external state is provided
  const [internalActiveTab, setInternalActiveTab] = useState('open')
  
  // Use either external or internal state
  const activeOrderTab = externalActiveTab || internalActiveTab
  const setActiveOrderTab = externalSetActiveTab || setInternalActiveTab

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="open" 
        value={activeOrderTab} 
        onValueChange={setActiveOrderTab}
        className="w-full"
      >
        <TabsList className="w-full max-w-[600px] mx-auto h-10 items-center justify-center card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 
          border-[#e5e5e5]/20 dark:border-white/5 p-1 mb-4">
          <TabsTrigger 
            value="open"
            className="w-full h-8 data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/20 
              data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-300"
          >
            Open
          </TabsTrigger>

          <TabsTrigger 
            value="history"
            className="w-full h-8 data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/20 
              data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-300"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="open"
          className="min-h-[200px] card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
            transition-all duration-300 hover:bg-transparent shadow-lg rounded-lg p-2 sm:p-4"
        >
          <OrdersViewOpen />
        </TabsContent>

        <TabsContent 
          value="history"
          className="min-h-[200px] card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
            transition-all duration-300 hover:bg-transparent shadow-lg rounded-lg p-2 sm:p-4"
        >
          <OrdersViewHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
} 