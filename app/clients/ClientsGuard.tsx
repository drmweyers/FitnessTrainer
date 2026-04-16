'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientsGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated || !user) {
      window.location.replace('/auth/login')
      return
    }
    if (user.role !== 'trainer' && user.role !== 'admin') {
      window.location.replace('/dashboard')
    }
  }, [user, isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Fire redirect synchronously from render path (not just useEffect) so Playwright
  // navigation tracking sees the navigation start immediately on commit.
  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') window.location.replace('/auth/login')
    return null
  }

  if (user.role !== 'trainer' && user.role !== 'admin') {
    if (typeof window !== 'undefined') window.location.replace('/dashboard')
    return null
  }

  return <>{children}</>
}
