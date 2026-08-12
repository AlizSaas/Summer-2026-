import * as React from 'react'
import { cn } from '@/lib/utils'

// Styled to match beUI's Input field (https://beui.dev/components/motion/input)
// for a consistent, clean look across all form controls.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[60px] w-full rounded-2xl border border-border bg-transparent px-3.5 py-2.5 text-base leading-6 text-foreground transition-colors duration-200 outline-none placeholder:text-muted-foreground/60 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
