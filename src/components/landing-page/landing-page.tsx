'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

const additionalResources = [
  {
    title: "Docs",
    href: "https://docs.epicentrallabs.com/"
  },
  {
    title: "GitHub",
    href: "https://github.com/EpicentralLabs"
  },
  {
    title: "Discord",
    href: "https://discord.gg/5asAuY2sR8"
  }
]

export default function DashboardFeature() {
  const router = useRouter()
  
  const cards = [
    {
      title: "Trade More for Less",
      description: "One contract represents 100x of the underlying asset.",
      buttonText: "Trade Now",
      path: "/trade"
    },
    {
      title: "Hedging Strategies", 
      description: "Allow for more strategic hedging opportunities to help mitigate risks.",
      buttonText: "Learn Options",
      path: null
    },
    {
      title: "Market Making",
      description: "Short-sell options on margin and collect premiums every 400ms.",
      buttonText: "Mint Options",
      path: "/option-lab"
    },
    {
      title: "Earn Yield",
      description: "Provide liquidity to the Option Margin Liquidity Pool (OMLP), earn yield.",
      buttonText: "Provide Liquidity",
      path: "/omlp"
    }
  ]

  return (
    <div className="flex flex-col items-center justify-center 
      min-h-screen py-32 gap-8 
      px-4 sm:px-6 lg:px-8
      scrollbar-hide-delay"
    >
      <div className="relative">
        <div className="absolute inset-0 -z-10">
        </div>
        <div className="flex justify-center items-center w-full">
          <Image
            src="/OPX_LOGO_Chrome.png"
            alt="Solana OPX Logo"
            width={300}
            height={75}
            className="transition-all duration-300 hover:scale-105"
            priority
          />
        </div>
      </div>
      <h1 className="text-2xl text-white font-normal tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] -mt-4 -mb-4">
       Onchain Options Trading
      </h1>

      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
        <div className="absolute inset-0 -z-10">
        </div>
        {cards.map((card, index) => (
          <Card
            key={index}
            className="card-glass backdrop-blur-sm bg-white/5 dark:bg-black/30 border-[#e5e5e5]/20 dark:border-white/5
              transition-all duration-300
              hover:bg-transparent
              overflow-hidden"
          >
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-normal text-center">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 pb-4">
              <CardDescription className="text-sm text-muted-foreground text-center">{card.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button 
                variant="outline"
                className="w-full bg-transparent border border-[#e5e5e5]/50 dark:border-[#393939]
                  hover:bg-gray-900 hover:scale-95
                  transition-all duration-200"
                onClick={() => card.path && router.push(card.path)}
                disabled={!card.path}
              >
                {card.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="flex flex-col items-center gap-4 mt-48">
        <h2 className="text-xl font-medium opacity-50">Additional Resources</h2>
        <div className="flex gap-4">
          {additionalResources.map((resource) => (
            <a
              key={resource.title}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm rounded-md 
                backdrop-blur-sm bg-white/5 dark:bg-black/20
                border border-[#4a85ff]/20 
                hover:border-[#4a85ff]/40
                hover:bg-[#4a85ff]/5
                transition-all duration-300
                hover:shadow-[0_0_15px_rgba(74,133,255,0.2)]"
            >
              {resource.title}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
