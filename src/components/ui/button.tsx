import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import {
  Button as MotionButton,
  type ButtonVariant as MotionButtonVariant,
  type ButtonSize as MotionButtonSize,
} from '@/components/motion/button'

// Visual variants mirror beUI's Button (https://beui.dev/components/motion/button)
// while keeping the original shadcn variant/size names so every existing call
// site (asChild links, icon buttons, etc.) keeps working unchanged.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-full bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'rounded-full border border-border bg-transparent text-foreground hover:bg-primary/5',
        secondary: 'rounded-full border border-border bg-card text-foreground hover:border-foreground/30',
        ghost: 'rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/5',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 text-sm gap-2',
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-full',
        lg: 'h-12 px-6 text-base gap-2',
        icon: 'h-9 w-9 rounded-lg shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type Variant = NonNullable<VariantProps<typeof buttonVariants>['variant']>
type Size = NonNullable<VariantProps<typeof buttonVariants>['size']>

const MOTION_VARIANT: Record<Variant, MotionButtonVariant> = {
  default: 'primary',
  destructive: 'primary',
  outline: 'outline',
  secondary: 'secondary',
  ghost: 'ghost',
  link: 'ghost',
}

const MOTION_SIZE: Record<Size, MotionButtonSize> = {
  default: 'md',
  sm: 'sm',
  lg: 'lg',
  icon: 'icon',
}

const EXTRA_CLASS: Partial<Record<Variant, string>> = {
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link: 'h-auto w-auto rounded-none bg-transparent p-0 text-primary underline-offset-4 hover:bg-transparent hover:underline',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Spawn a Material-style ripple from the press point. Off by default. */
  ripple?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ripple, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      )
    }

    const resolvedVariant = variant ?? 'default'
    const resolvedSize = size ?? 'default'

    return (
      <MotionButton
        ref={ref}
        variant={MOTION_VARIANT[resolvedVariant]}
        size={MOTION_SIZE[resolvedSize]}
        ripple={ripple}
        className={cn(EXTRA_CLASS[resolvedVariant], className)}
        {...(props as unknown as React.ComponentPropsWithoutRef<typeof MotionButton>)}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
