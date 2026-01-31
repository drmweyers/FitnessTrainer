'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ToastProps {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastOptions {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: ToastOptions) => {
    const id = Math.random().toString(36).slice(2)
    const newToast = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  return {
    toast,
    toasts,
    dismiss: (id: string) => setToasts(prev => prev.filter(t => t.id !== id))
  }
}

export function ToastMessage({ toast }: { toast: ToastProps }) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg",
        "transform transition-all duration-300 ease-in-out",
        toast.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-gray-900'
      )}
    >
      <h3 className="font-medium">{toast.title}</h3>
      {toast.description && (
        <p className="text-sm mt-1 opacity-90">{toast.description}</p>
      )}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
        {toasts.map(toast => (
          <ToastMessage key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  )
}

// Export types for consumers
export type { ToastProps, ToastOptions } 