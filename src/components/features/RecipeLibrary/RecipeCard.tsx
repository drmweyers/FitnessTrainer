'use client'

import { Clock, Users, Edit, Trash2 } from 'lucide-react'
import { Recipe } from '@/types/recipe'
import NutritionalInfo from './NutritionalInfo'

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img 
          src={recipe.image} 
          alt={recipe.title} 
          className="w-full h-48 object-cover"
        />
        
        {recipe.status === 'published' && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            Published
          </div>
        )}
        
        {recipe.status === 'draft' && (
          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
            Draft
          </div>
        )}
        
        {recipe.status === 'archived' && (
          <div className="absolute top-2 right-2 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
            Archived
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-2">{recipe.title}</h3>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <div className="flex items-center mr-4">
            <Clock size={14} className="mr-1" />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center">
            <Users size={14} className="mr-1" />
            <span>{recipe.servings} servings</span>
          </div>
        </div>
        
        <NutritionalInfo nutrition={recipe.nutrition} />
        
        <div className="flex flex-wrap gap-1 mt-3">
          {recipe.categories.map(category => (
            <span 
              key={category} 
              className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {category}
            </span>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
          <button className="text-blue-600 text-sm font-medium hover:text-blue-800">
            View Recipe
          </button>
          
          <div className="flex space-x-2">
            <button className="text-gray-500 hover:text-gray-700">
              <Edit size={16} />
            </button>
            <button className="text-gray-500 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}