'use client'

import { Search, Filter } from 'lucide-react'

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  showFilters: boolean
  setShowFilters: (show: boolean) => void
}

export default function SearchBar({ 
  searchTerm, 
  setSearchTerm, 
  showFilters, 
  setShowFilters 
}: SearchBarProps) {
  return (
    <div className="mb-6">
      <div className="flex">
        <div className="relative flex-grow">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button 
          className={`ml-2 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} />
        </button>
      </div>
      
      {showFilters && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prep Time</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Any time</option>
                <option>Under 15 minutes</option>
                <option>Under 30 minutes</option>
                <option>Under 1 hour</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Calories</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Any calories</option>
                <option>Under 300 kcal</option>
                <option>300-500 kcal</option>
                <option>Over 500 kcal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Author</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>All authors</option>
                <option>Chef Maria</option>
                <option>Chef John</option>
                <option>Chef Sarah</option>
                <option>Chef Lee</option>
                <option>Chef Emma</option>
                <option>Chef Michael</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}