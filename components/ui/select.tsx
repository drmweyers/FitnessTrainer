import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  onValueChange?: (value: string) => void
}

/**
 * Native HTML select wrapper with Radix UI-like API
 * Supports both direct usage and Radix UI pattern
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
    }

    // Extract options from children (filter out SelectTrigger, SelectValue, SelectContent)
    const options = React.Children.toArray(children).flatMap((child) => {
      if (!React.isValidElement(child)) return child

      // If it's SelectContent, extract its children (the actual options)
      if (child.type && typeof child.type !== 'string' &&
          (child.type as any).displayName === 'SelectContent') {
        return React.Children.toArray(child.props.children)
      }

      // Skip SelectTrigger and SelectValue
      if (child.type && typeof child.type !== 'string' &&
          ((child.type as any).displayName === 'SelectTrigger' ||
           (child.type as any).displayName === 'SelectValue')) {
        return []
      }

      return child
    })

    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {options}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }

// SelectTrigger is a no-op wrapper for Radix UI pattern compatibility
export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children }, ref) => <>{children}</>
)
SelectTrigger.displayName = "SelectTrigger"

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

// SelectValue is a no-op for native select (not rendered)
export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder }, ref) => null
)
SelectValue.displayName = "SelectValue"

// SelectContent is a passthrough wrapper for options
export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children }, ref) => <>{children}</>
)
SelectContent.displayName = "SelectContent"

// SelectItem renders as native option element
export const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, children, ...props }, ref) => (
    <option ref={ref} className={cn('', className)} {...props}>
      {children}
    </option>
  )
)
SelectItem.displayName = "SelectItem"
