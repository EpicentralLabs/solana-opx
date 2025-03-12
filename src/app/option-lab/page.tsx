import { OptionLabForm } from "@/components/option-lab/OptionLabForm"

/**
 * Renders the Option Lab page.
 *
 * This component displays a header with the title "Option Lab" and a description of its functionality related to creating, visualizing, and minting option contracts on Solana OPX. It also includes the OptionLabForm component for handling the contract operations.
 *
 * @returns The JSX content of the Option Lab page.
 */
export default function MintOptionPage() {
  return (
    <div className="container py-10 max-w-full">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-thin mb-2">Option Lab</h1>
        <p className="text-muted-foreground">
          Create, visualize, and mint option contracts to list on Solana OPX.
        </p>
      </div>
      <OptionLabForm />
    </div>
  )
} 