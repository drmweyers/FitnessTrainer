'use client'

import { useState } from 'react'
import { Card } from '@/components/shared'
import { Search, Filter, MoreVertical, Award, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/shared/Button'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  status: 'active' | 'inactive'
}

interface BadgeListProps {
  badges: Badge[]
  isLoading?: boolean
  onDelete?: (id: string) => void
}

export default function BadgeList({ badges, isLoading, onDelete }: BadgeListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || badge.status === filter
    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-100 rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-10">
        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No badges found</h3>
        <p className="text-gray-500 mt-2 mb-6">Create your first badge to get started</p>
        <Link href="/badges/add">
          <Button className="inline-flex items-center">
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Badge
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search badges..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 h-4 w-4" />
          <select
            className="border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No badges match your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => (
            <Card key={badge.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3 text-2xl">
                    {badge.icon}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-medium text-gray-900">{badge.name}</h3>
                      <div className="relative group">
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden group-hover:block z-10">
                          <Link 
                            href={`/badges/${badge.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Details
                          </Link>
                          <Link 
                            href={`/badges/${badge.id}/edit`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => onDelete?.(badge.id)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                        {badge.category}
                      </span>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {badge.points} points
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        badge.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {badge.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 