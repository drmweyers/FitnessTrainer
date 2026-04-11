'use client'

import { useEffect } from 'react'

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Analytics error:', error)
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Analytics Unavailable</h2>
        <p className="text-gray-600 mb-6">
          We couldn&apos;t load your analytics data. This may be a temporary issue.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-left">
            <p className="text-sm font-mono text-red-800 break-words">{error.message}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
