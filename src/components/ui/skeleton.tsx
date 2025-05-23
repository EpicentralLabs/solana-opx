import { cn } from "@/utils/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/10 dark:bg-muted/5",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
