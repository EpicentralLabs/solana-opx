import { FC, memo } from 'react'

interface AssetChartProps {
  selectedAsset: string
}

const AssetChartComponent: FC<AssetChartProps> = ({ selectedAsset }) => {
  // Only render the chart if SOL is selected
  if (selectedAsset !== 'SOL') {
    return (
      <div className="w-full h-[600px] flex items-center justify-center text-neutral-400">
        Chart not available for this asset
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] relative card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 
      border-[#e5e5e5]/20 dark:border-white/5 transition-all duration-300 overflow-hidden shadow-lg rounded-lg">
      <iframe 
        className="w-full h-full absolute inset-0"
        src="https://birdeye.so/tv-widget/So11111111111111111111111111111111111111112?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=America%2FNew_York&chartLeftToolbar=show&theme=dark&cssCustomProperties=--tv-color-platform-background%3A%2332427000&cssCustomProperties=--tv-color-pane-background%3A%2300000020&chartOverrides=paneProperties.backgroundGradientStartColor%3Argba%280%2C+0%2C+0%2C+0.19%29&chartOverrides=paneProperties.backgroundGradientEndColor%3Argba%280%2C+0%2C+0%2C+1%29&chartOverrides=paneProperties.backgroundType%3Agradient&chartOverrides=mainSeriesProperties.candleStyle.upColor%3A%234a85ff&chartOverrides=mainSeriesProperties.candleStyle.borderUpColor%3A%234a85ff&chartOverrides=mainSeriesProperties.candleStyle.wickUpColor%3A%234a85ff&chartOverrides=mainSeriesProperties.candleStyle.downColor%3A%23ff2a3b&chartOverrides=mainSeriesProperties.candleStyle.borderDownColor%3A%23ff2a3b&chartOverrides=mainSeriesProperties.candleStyle.wickDownColor%3A%23ff2a3b" 
        frameBorder="0" 
        allowFullScreen
      />
    </div>
  )
}

export const AssetChart = memo(AssetChartComponent)
AssetChart.displayName = 'AssetChart'