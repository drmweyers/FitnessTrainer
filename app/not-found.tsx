'use client'

import Link from 'next/link'
import { Dumbbell, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
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

        {/* 404 Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Home size={20} className="mr-2" />
              Go to Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <ArrowLeft size={20} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500">
          Need help?{' '}
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
