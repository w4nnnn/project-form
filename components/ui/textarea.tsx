import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/60 dark:bg-input/30 flex field-sizing-content min-h-24 w-full rounded-lg border bg-transparent px-4 py-3 text-base shadow-sm transition-all duration-200 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-muted-foreground/30",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
