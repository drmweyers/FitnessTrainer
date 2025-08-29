'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Main Dashboard Router
 * 
 * This component serves as the smart router for the dashboard system.
 * It automatically redirects users to their role-specific dashboard:
 * - Admin users → /dashboard/admin
 * - Trainer users → /dashboard/trainer
 * - Client users → /dashboard/client
 * 
 * If user is not authenticated, redirects to login page.
 */
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    // Redirect based on user role
    switch (user.role) {
      case 'admin':
        router.push('/dashboard/admin')
        break
      case 'trainer':
        router.push('/dashboard/trainer')
        break
      case 'client':
        router.push('/dashboard/client')
        break
      default:
        // Unknown role, redirect to login
        router.push('/login')
        break
    }
  }, [user, isAuthenticated, isLoading, router])

  // Show loading while redirecting
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // This should not render since we redirect immediately
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}