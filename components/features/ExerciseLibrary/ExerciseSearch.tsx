'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock, TrendingUp } from 'lucide-react'

interface ExerciseSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
  className?: string
}

const POPULAR_SEARCHES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Push-up',
  'Pull-up',
  'Plank',
  'Lunge',
  'Curl'
]

const RECENT_SEARCHES_KEY = 'exercise_recent_searches'
const MAX_RECENT_SEARCHES = 5

export function ExerciseSearch({
  onSearch,
  placeholder = "Search exercises...",
  initialValue = '',
  className = ''
}: ExerciseSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error)
    }
  }, [])

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return

    try {
      const updated = [
        query,
        ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())
      ].slice(0, MAX_RECENT_SEARCHES)

      setRecentSearches(updated)
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save recent search:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowDropdown(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performSearch(searchQuery)
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
    setShowDropdown(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Delay to allow click on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false)
      }
    }, 200)
  }

  const performSearch = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query)
      onSearch(query)
      setShowDropdown(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    performSearch(suggestion)
  }

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  }

  // Filter popular searches based on current query
  const filteredSuggestions = searchQuery.trim()
    ? POPULAR_SEARCHES.filter(s =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_SEARCHES

  const shouldShowDropdown = showDropdown && (recentSearches.length > 0 || filteredSuggestions.length > 0)

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
        />

        {searchQuery && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown with suggestions and recent searches */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
                <div className="flex items-center text-xs font-medium text-gray-600">
                  <Clock size={14} className="mr-1" />
                  Recent Searches
                </div>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="py-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center group"
                  >
                    <Clock size={14} className="mr-2 text-gray-400 group-hover:text-gray-600" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {filteredSuggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50">
                <div className="flex items-center text-xs font-medium text-gray-600">
                  <TrendingUp size={14} className="mr-1" />
                  {searchQuery.trim() ? 'Matching Suggestions' : 'Popular Searches'}
                </div>
              </div>
              <div className="py-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center group"
                  >
                    <Search size={14} className="mr-2 text-gray-400 group-hover:text-blue-600" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
