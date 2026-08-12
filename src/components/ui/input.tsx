import * as React from 'react'
import {
  Input as MotionInput,
  type InputProps as MotionInputProps,
} from '@/components/motion/input'

// Wraps beUI's Input (https://beui.dev/components/motion/input) while keeping
// the familiar native `onChange={(e) => ...e.target.value}` signature so every
// existing form in the app keeps working without touching call sites.
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  label?: string
  error?: string | boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ onChange, ...props }, ref) => {
    return (
      <MotionInput
        ref={ref}
        onChange={
          onChange
            ? (value: string) =>
                onChange({
                  target: { value },
                  currentTarget: { value },
                } as unknown as React.ChangeEvent<HTMLInputElement>)
            : undefined
        }
        {...(props as unknown as Omit<MotionInputProps, 'onChange'>)}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
