import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
  onValueChange?: (value: string) => void
}

// Context to share select element between wrapper and trigger
const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
}>({})

const SelectRoot = React.forwardRef<HTMLDivElement, { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }>(
  ({ children, value, onValueChange }, ref) => {
    return (
      <SelectContext.Provider value={{ value, onValueChange }}>
        <div ref={ref}>{children}</div>
      </SelectContext.Provider>
    )
  }
)
SelectRoot.displayName = "SelectRoot"

const SelectTrigger = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, onChange, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e)
      onValueChange?.(e.target.value)
      context.onValueChange?.(e.target.value)
    }
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onChange={handleChange}
        value={context.value}
        {...props}
      >
        {children}
      </select>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

// For backwards compatibility, Select points to SelectTrigger
const Select = SelectTrigger

export { Select, SelectTrigger }

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string
}

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, ...props }, ref) => (
    <span ref={ref} className={cn('', className)} {...props}>
      {placeholder}
    </span>
  )
)
SelectValue.displayName = "SelectValue"

// SelectContent is just a passthrough wrapper for native select - renders children directly
export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children }, ref) => (
    <>{children}</>
  )
)
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, children, ...props }, ref) => (
    <option ref={ref} className={cn('', className)} {...props}>
      {children}
    </option>
  )
)
SelectItem.displayName = "SelectItem"
