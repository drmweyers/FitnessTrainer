'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Users } from 'lucide-react'
import Layout from '@/components/layout/Layout'
import { mockRecipes } from '@/data/mockRecipes'

type InstructionType = 'preparation' | 'cooking'

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<typeof mockRecipes[0] | null>(null)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [activeInstructionTab, setActiveInstructionTab] = useState<InstructionType>('preparation')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const foundRecipe = mockRecipes.find(r => r.id === params.id)
    if (foundRecipe) {
      setRecipe(foundRecipe)
    }
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!recipe) {
    router.push('/recipe-books')
    return null
  }

  return (
    <Layout>
      {/* Top Navigation */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back</span>
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-sm sm:text-base text-gray-900 truncate">{recipe.title}</span>
            <div className="flex-1" />
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              recipe.status === 'published'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {recipe.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Recipe Image */}
              <div className="relative h-[200px] sm:h-[300px] md:h-[400px]">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Recipe Content */}
              <div className="p-4 sm:p-6 md:p-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4">{recipe.title}</h1>
                
                {/* Recipe Categories */}
                <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
                  {recipe.categories.map(category => (
                    <span key={category} className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm">
                      {category}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{recipe.description}</p>

                {/* Recipe Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Prep</div>
                      <div className="text-sm sm:text-base font-medium">{recipe.prepTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Cooking</div>
                      <div className="text-sm sm:text-base font-medium">{recipe.cookTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Servings</div>
                      <div className="text-sm sm:text-base font-medium">{recipe.servings}</div>
                    </div>
                  </div>
                </div>

                {/* Nutrition Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 bg-gray-50 rounded-xl mb-6 sm:mb-8">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{recipe.calories}</div>
                    <div className="text-xs sm:text-sm text-gray-500">cal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{recipe.protein}g</div>
                    <div className="text-xs sm:text-sm text-gray-500">protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{recipe.carbs}g</div>
                    <div className="text-xs sm:text-sm text-gray-500">carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{recipe.fat}g</div>
                    <div className="text-xs sm:text-sm text-gray-500">fat</div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6 sm:mb-8">
                  <div className="flex overflow-x-auto">
                    {['ingredients', 'instructions', 'nutrition'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 sm:py-3 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap ${
                          activeTab === tab
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <div>
                  {activeTab === 'ingredients' && (
                    <div>
                      <div className="flex items-center justify-end mb-4 sm:mb-6">
                        <div className="relative">
                          <select className="appearance-none bg-transparent pr-8 py-2 pl-3 border rounded-lg text-sm">
                            <option>Default</option>
                            <option>Metric</option>
                            <option>Imperial</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {recipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center justify-between py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <img
                                src={ingredient.image}
                                alt={ingredient.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg object-cover"
                              />
                              <span className="text-sm sm:text-base text-gray-900">{ingredient.name}</span>
                            </div>
                            <span className="text-sm sm:text-base text-gray-600">{ingredient.amount} {ingredient.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'instructions' && (
                    <div>
                      <div className="flex mb-4 sm:mb-6 border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setActiveInstructionTab('preparation')}
                          className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base transition-colors ${
                            activeInstructionTab === 'preparation'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Preparation
                        </button>
                        <button
                          onClick={() => setActiveInstructionTab('cooking')}
                          className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 font-medium text-sm sm:text-base transition-colors ${
                            activeInstructionTab === 'cooking'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          Cooking
                        </button>
                      </div>
                      <div className="space-y-4 sm:space-y-6">
                        {recipe.instructions[activeInstructionTab].map((instruction: string, index: number) => (
                          <div key={index} className="flex gap-3 sm:gap-4">
                            <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm sm:text-base">
                              {index + 1}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 flex-1">{instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'nutrition' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Nutrition Facts</h3>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Calories</span>
                              <span className="font-medium">{recipe.calories}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Fat</span>
                              <span className="font-medium">{recipe.fat}g</span>
                            </div>
                            <div className="flex justify-between pl-4">
                              <span className="text-gray-600">Saturated Fat</span>
                              <span className="font-medium">{recipe.nutritionDetails.saturatedFat}g</span>
                            </div>
                            <div className="flex justify-between pl-4">
                              <span className="text-gray-600">Trans Fat</span>
                              <span className="font-medium">{recipe.nutritionDetails.transFat}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cholesterol</span>
                              <span className="font-medium">{recipe.nutritionDetails.cholesterol}mg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sodium</span>
                              <span className="font-medium">{recipe.nutritionDetails.sodium}mg</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Carbohydrates</span>
                              <span className="font-medium">{recipe.carbs}g</span>
                            </div>
                            <div className="flex justify-between pl-4">
                              <span className="text-gray-600">Dietary Fiber</span>
                              <span className="font-medium">{recipe.nutritionDetails.fiber}g</span>
                            </div>
                            <div className="flex justify-between pl-4">
                              <span className="text-gray-600">Sugars</span>
                              <span className="font-medium">{recipe.nutritionDetails.sugar}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Protein</span>
                              <span className="font-medium">{recipe.protein}g</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 sm:p-6 bg-gray-50 rounded-xl">
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Daily Value %</h3>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Fat</span>
                              <span className="font-medium">{Math.round((recipe.fat / 65) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Saturated Fat</span>
                              <span className="font-medium">{Math.round((recipe.nutritionDetails.saturatedFat / 20) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cholesterol</span>
                              <span className="font-medium">{Math.round((recipe.nutritionDetails.cholesterol / 300) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sodium</span>
                              <span className="font-medium">{Math.round((recipe.nutritionDetails.sodium / 2300) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Carbohydrates</span>
                              <span className="font-medium">{Math.round((recipe.carbs / 300) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dietary Fiber</span>
                              <span className="font-medium">{Math.round((recipe.nutritionDetails.fiber / 25) * 100)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Protein</span>
                              <span className="font-medium">{Math.round((recipe.protein / 50) * 100)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recipe Details</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Category</div>
                  <div className="text-sm sm:text-base font-medium">{recipe.categories.join(', ')}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Total Time</div>
                  <div className="text-sm sm:text-base font-medium">
                    {parseInt(recipe.prepTime) + parseInt(recipe.cookTime)}m
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Difficulty</div>
                  <div className="text-sm sm:text-base font-medium">Easy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
} 