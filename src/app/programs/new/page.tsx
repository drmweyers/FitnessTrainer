'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProgramBuilderProvider } from '@/components/features/ProgramBuilder/ProgramBuilderContext'
import ProgramBuilder from '@/components/features/ProgramBuilder/ProgramBuilder'
import { ProgramData } from '@/types/program'
import { createProgram } from '@/lib/api/programs'

export default function NewProgramPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (programData: ProgramData, saveAsTemplate: boolean) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Add template flag if requested
      const finalData = {
        ...programData,
        isTemplate: saveAsTemplate
      }

      // Create the program via API
      const newProgram = await createProgram(finalData)
      
      // Success feedback and navigation
      if (saveAsTemplate) {
        // Show success message for template
        alert(`Program "${newProgram.name}" has been created and saved as a template!`)
      } else {
        alert(`Program "${newProgram.name}" has been created successfully!`)
      }
      
      // Navigate to the programs list or the new program detail page
      router.push('/programs')
      
    } catch (error: any) {
      console.error('Failed to save program:', error)
      
      // Handle different error types
      if (error.status === 401) {
        setError('You are not authorized to create programs. Please log in and try again.')
      } else if (error.status === 400) {
        setError(`Invalid program data: ${error.message}`)
      } else if (error.status === 403) {
        setError('You do not have permission to create programs.')
      } else {
        setError(error.message || 'Failed to save program. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Ask for confirmation if user has made changes
    const hasUnsavedChanges = localStorage.getItem('programBuilderDraft')
    
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your draft will be saved.'
      )
      if (!confirmLeave) {
        return
      }
    }
    
    router.push('/programs')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Creating Program</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProgramBuilderProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Back to Programs"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Create New Program</h1>
                  <p className="text-sm text-gray-600">Design a comprehensive training program for your clients</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <p className="font-medium text-gray-900">Saving Program...</p>
                  <p className="text-sm text-gray-600">Please wait while we create your program</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProgramBuilder
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* Footer Help */}
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">Need help creating your program?</p>
              <div className="flex justify-center space-x-4">
                <a href="/help/program-builder" className="text-blue-600 hover:text-blue-800">
                  Program Builder Guide
                </a>
                <span>•</span>
                <a href="/help/exercise-selection" className="text-blue-600 hover:text-blue-800">
                  Exercise Selection Tips
                </a>
                <span>•</span>
                <a href="/help/program-templates" className="text-blue-600 hover:text-blue-800">
                  Template Library
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProgramBuilderProvider>
  )
}