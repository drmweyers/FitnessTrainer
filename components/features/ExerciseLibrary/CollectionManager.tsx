'use client'

import React from 'react'
import { BookOpen, Plus } from 'lucide-react'

export function CollectionManager() {

  return (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <BookOpen size={32} className="text-gray-400 mx-auto mb-3" />
      <h4 className="text-lg font-medium text-gray-900 mb-2">Collections Feature</h4>
      <p className="text-gray-500 mb-4">Collection management coming soon!</p>
      <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        <Plus size={16} className="mr-2" />
        Create Collection
      </button>
    </div>
  )
}