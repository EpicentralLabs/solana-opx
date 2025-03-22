import { FC, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { TradeView } from './trade-view'
import { OrdersView } from './orders-view'

export const TradeViewContainer: FC = () => {
  const [activeView, setActiveView] = useState('trade')

  return (
    <div className="space-y-4">
      <Tabs 
        defaultValue="trade" 
        value={activeView} 
        onValueChange={setActiveView}
        className="w-full"
      >
        <TabsList className="w-[400px] h-10 items-center justify-center card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 
          border-[#e5e5e5]/20 dark:border-white/5 p-1 mb-4">
          <TabsTrigger 
            value="trade"
            className="w-full h-8 data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/20 
              data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-300"
          >
            Trade
          </TabsTrigger>
          <TabsTrigger 
            value="orders"
            className="w-full h-8 data-[state=active]:bg-white/10 dark:data-[state=active]:bg-white/20 
              data-[state=active]:text-white data-[state=active]:shadow-none transition-all duration-300"
          >
            Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="trade" 
          className="card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
            transition-all duration-300 hover:bg-transparent shadow-lg rounded-lg p-4"
        >
          <TradeView />
        </TabsContent>

        <TabsContent 
          value="orders"
          className="card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5 
            transition-all duration-300 hover:bg-transparent shadow-lg rounded-lg p-4"
        >
          <OrdersView />
        </TabsContent>
      </Tabs>
    </div>
  )
}