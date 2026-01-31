'use client'

import { useState, useMemo } from 'react'
import { Filter } from 'lucide-react'
import { mockRecipes } from '@/data/mockRecipes'
import Layout from '@/components/layout/Layout'
import SearchBar from '@/components/SearchBar'
import CategoryNav from '@/components/CategoryNav'
import RecipeBookGrid from '@/components/RecipeBookGrid'
import Pagination from '@/components/Pagination'

const categories = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Soup',
  'Salad/Bowl',
  'Others'
]

const ITEMS_PER_PAGE = 8

export default function RecipeBooksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter recipes based on search and category
  const filteredRecipes = useMemo(() => {
    return mockRecipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = activeCategory === 'All' || recipe.categories.includes(activeCategory)
      
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, activeCategory])

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to first page when filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    setCurrentPage(1)
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Recipe Library</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                12 days left until trial ends
              </div>
              <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                Upgrade
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-8">
            <SearchBar
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search recipes..."
            />
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="h-5 w-5" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
              <span>🤖</span>
              AI Recipe Builder
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Create New Recipe
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-8 mb-8 overflow-x-auto pb-4">
            <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Recipe Grid */}
          <div>
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No recipes found. Try adjusting your search or category filter.
                </p>
              </div>
            ) : (
              <>
                <RecipeBookGrid recipes={paginatedRecipes} />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}