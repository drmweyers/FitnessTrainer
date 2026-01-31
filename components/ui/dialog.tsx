'use client'

import React from 'react'

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  return <>{children}</>
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

DialogContent.displayName = 'DialogContent'

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} {...props}>
        {children}
      </div>
    )
  }
)

DialogHeader.displayName = 'DialogHeader'

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <h2 ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
        {children}
      </h2>
    )
  }
)

DialogTitle.displayName = 'DialogTitle'

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <p ref={ref} className={`text-sm text-muted-foreground ${className}`} {...props}>
        {children}
      </p>
    )
  }
)

DialogDescription.displayName = 'DialogDescription'

export const DialogFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className = '', children, asChild = false, ...props }, ref) => {
    if (asChild) {
      return <>{children}</>
    }
    return (
      <button ref={ref} className={className} {...props}>
        {children}
      </button>
    )
  }
)

DialogTrigger.displayName = 'DialogTrigger'

export default Dialog
