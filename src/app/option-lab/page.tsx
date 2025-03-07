import { OptionLabForm } from "@/components/mint/OptionLabForm"

export default function MintOptionPage() {
  return (
    <div className="container py-10 max-w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-thin mb-2">Option Lab</h1>
        <p className="text-muted-foreground">
          Create, visualize, and mint option contracts to list on the exchange.
        </p>
      </div>
      <OptionLabForm />
    </div>
  )
} 