'use client'

import React from 'react'

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open: currentOpen, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function useDialogCtx() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('Dialog subcomponents must be used inside <Dialog>')
  return ctx
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onInteractOutside?: (event: MouseEvent) => void
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className = '', children, onEscapeKeyDown, onInteractOutside, ...props }, ref) => {
    const { open, onOpenChange } = useDialogCtx()
    const contentRef = React.useRef<HTMLDivElement | null>(null)

    React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement)

    // Close on ESC
    React.useEffect(() => {
      if (!open) return
      const handler = (e: KeyboardEvent) => {
        if (e.key !== 'Escape') return
        onEscapeKeyDown?.(e)
        if (!e.defaultPrevented) onOpenChange(false)
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }, [open, onEscapeKeyDown, onOpenChange])

    // Close on backdrop click
    const handleOverlayPointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      const mouseEvent = e.nativeEvent as MouseEvent
      onInteractOutside?.(mouseEvent)
      if (!mouseEvent.defaultPrevented) onOpenChange(false)
    }

    if (!open) return null

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onMouseDown={handleOverlayPointerDown}
        role="presentation"
      >
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          className={`relative grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg rounded-lg ${className}`}
          onMouseDown={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
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
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export interface DialogTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  children: React.ReactNode
}

export const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className = '', children, asChild = false, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialogCtx()
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onOpenChange(true)
      onClick?.(e)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          onOpenChange(true)
          ;(children as React.ReactElement<any>).props.onClick?.(e)
        },
      })
    }
    return (
      <button ref={ref} className={className} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)

DialogTrigger.displayName = 'DialogTrigger'

export default Dialog
