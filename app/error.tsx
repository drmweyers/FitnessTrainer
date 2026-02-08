'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Dumbbell, RefreshCw, Home, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Dumbbell className="h-10 w-10 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">EvoFit</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We encountered an unexpected error. This has been logged and we&apos;ll look into it.
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-left">
              <p className="text-sm font-mono text-red-800 break-words">
                {error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw size={20} className="mr-2" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home size={20} className="mr-2" />
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500">
          If this problem persists,{' '}
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
