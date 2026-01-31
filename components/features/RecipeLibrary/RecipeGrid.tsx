'use client'

import RecipeCard from './RecipeCard'
import { Recipe } from '@/types/recipe'

interface RecipeGridProps {
  recipes: Recipe[]
}

export default function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
      
      {recipes.length === 0 && (
        <div className="col-span-3 py-12 text-center">
          <p className="text-gray-500">No recipes found matching your criteria</p>
        </div>
      )}
    </div>
  )
}