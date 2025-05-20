import { FC, useState, useCallback, memo, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExpirationDate, EMPTY_EXPIRATION_DATES, formatOptionExpirationDate } from '@/constants/constants'

interface ExpirationDateSelectorProps {
  selectedExpiration: string | null
  onExpirationChange: (expiration: string) => void
  expirationDates?: ExpirationDate[]
}

const ExpirationDateSelectorComponent: FC<ExpirationDateSelectorProps> = ({ 
  selectedExpiration, 
  onExpirationChange,
  expirationDates = EMPTY_EXPIRATION_DATES
}) => {
  const [isHydrated, setIsHydrated] = useState(false)
  const [filteredDates, setFilteredDates] = useState(expirationDates)
  
  // Set hydration flag after component mounts
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Handle expiration date selection change - declare this before using in useEffect
  const handleExpirationChange = useCallback((expiration: string) => {
    onExpirationChange(expiration)
  }, [onExpirationChange])

  // Filter out expired dates
  useEffect(() => {
    const now = new Date().getTime()
    const validDates = expirationDates.filter(date => {
      const expiryDate = new Date(date.value).getTime()
      return expiryDate > now
    })
    setFilteredDates(validDates)

    // If current selected date is expired, select the first valid date
    if (selectedExpiration) {
      const selectedDate = new Date(selectedExpiration).getTime()
      if (selectedDate <= now && validDates.length > 0) {
        handleExpirationChange(validDates[0].value)
      }
    }
  }, [expirationDates, selectedExpiration, handleExpirationChange])

  // Listen for mintedOptionsUpdated events
  useEffect(() => {
    const handleOptionsUpdate = () => {
      const now = new Date().getTime()
      const validDates = expirationDates.filter(date => {
        const expiryDate = new Date(date.value).getTime()
        return expiryDate > now
      })
      setFilteredDates(validDates)

      // Update selected date if expired
      if (selectedExpiration) {
        const selectedDate = new Date(selectedExpiration).getTime()
        if (selectedDate <= now && validDates.length > 0) {
          handleExpirationChange(validDates[0].value)
        }
      }
    }

    window.addEventListener('mintedOptionsUpdated', handleOptionsUpdate)
    return () => window.removeEventListener('mintedOptionsUpdated', handleOptionsUpdate)
  }, [expirationDates, selectedExpiration, handleExpirationChange])
  
  useEffect(() => {
    if (isHydrated && filteredDates.length > 0 && !selectedExpiration) {
      const timer = setTimeout(() => {
        handleExpirationChange(filteredDates[0].value)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [filteredDates, selectedExpiration, handleExpirationChange, isHydrated])

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-between">
            {selectedExpiration 
              ? formatOptionExpirationDate(selectedExpiration)
              : "Expiration Date"}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px]" align="end">
          {filteredDates.length > 0 ? (
            filteredDates.map((date) => (
              <DropdownMenuItem
                key={date.value}
                onClick={() => handleExpirationChange(date.value)}
                className="cursor-pointer"
              >
                {formatOptionExpirationDate(date.value)}
                {date.isMonthly && (
                  <span className="ml-1 text-xs text-muted-foreground">(Monthly)</span>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>No dates available</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const ExpirationDateSelector = memo(ExpirationDateSelectorComponent)
ExpirationDateSelector.displayName = 'ExpirationDateSelector' 