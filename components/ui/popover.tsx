'use client'

import React from 'react'

export interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const Popover = ({ open, onOpenChange, children }: PopoverProps) => {
  return <>{children}</>
}

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className = '', children, align = 'center', ...props }, ref) => {
    return (
      <div ref={ref} className={`z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

PopoverContent.displayName = 'PopoverContent'

export const PopoverTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
  return <>{children}</>
}

export default Popover
