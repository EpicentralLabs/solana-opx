import { cn } from "@/lib/utils"

/**
 * Renders a skeleton loading placeholder with a pulse animation.
 *
 * This component outputs a div element styled with default classes for a subtle loading effect. Additional HTML attributes and custom class names can be provided to tailor its appearance.
 *
 * @param className - Optional custom class names to merge with the default styles.
 *
 * @example
 * <Skeleton className="h-10 w-full" />
 */
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
