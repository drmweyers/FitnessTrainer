import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative inline-block" onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false)
    }}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ open?: boolean; onToggle?: () => void }>, { open, onToggle: () => setOpen(!open) })
        }
        return child
      })}
    </div>
  )
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; open?: boolean; onToggle?: () => void }>(
  ({ className, children, onToggle, open, asChild, ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center", className)} onClick={onToggle} type="button" {...props}>
      {children}
    </button>
  )
)
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onToggle?: () => void; align?: string }>(
  ({ className, children, open, onToggle, align, ...props }, ref) => {
    if (!open) return null
    return (
      <div ref={ref} className={cn("absolute right-0 top-full mt-1 z-50 min-w-[8rem] rounded-md border bg-white p-1 shadow-md", className)} {...props}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<{ onClose?: () => void }>, { onClose: onToggle })
          }
          return child
        })}
      </div>
    )
  }
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void; asChild?: boolean }>(
  ({ className, children, onClick, onClose, asChild, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100", className)}
      onClick={(e) => { onClick?.(e); onClose?.() }}
      tabIndex={0}
      role="menuitem"
      {...props}
    >
      {children}
    </div>
  )
)
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
