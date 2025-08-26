'use client'

import { AlertCircle, Plus } from 'lucide-react'
import { useState } from 'react'

interface LimitationsSectionProps {
  limitations: Array<{
    id: string
    text: string
  }>
}

export default function LimitationsSection({ limitations }: LimitationsSectionProps) {
  const [isAddingLimitation, setIsAddingLimitation] = useState(false)
  const [newLimitation, setNewLimitation] = useState('')
  
  const handleAddLimitation = () => {
    // In a real app, this would call an API to save the limitation
    setNewLimitation('')
    setIsAddingLimitation(false)
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Limitations & Considerations</h3>
        <button 
          className="text-blue-600 text-xs flex items-center"
          onClick={() => setIsAddingLimitation(true)}
        >
          <Plus size={14} className="mr-1" />
          Add
        </button>
      </div>
      
      {isAddingLimitation && (
        <div className="mb-3 border border-gray-200 rounded-md p-2">
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter limitation..."
            value={newLimitation}
            onChange={(e) => setNewLimitation(e.target.value)}
          />
          <div className="mt-2 flex justify-end space-x-2">
            <button 
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
              onClick={() => setIsAddingLimitation(false)}
            >
              Cancel
            </button>
            <button 
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md"
              onClick={handleAddLimitation}
              disabled={!newLimitation.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
      
      {limitations.length === 0 ? (
        <div className="text-center py-4">
          <AlertCircle size={20} className="mx-auto text-gray-400 mb-1" />
          <p className="text-gray-500 text-xs">No limitations recorded</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {limitations.map(limitation => (
            <li key={limitation.id} className="flex items-start">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700">{limitation.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}