import React from 'react';
import Link from 'next/link';
import { Recipe } from '@/data/mockRecipes';

interface RecipeBookGridProps {
  recipes: Recipe[];
}

const RecipeBookGrid: React.FC<RecipeBookGridProps> = ({ recipes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <Link
          href={`/recipe-books/${recipe.id}`}
          key={recipe.id}
          className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute top-4 right-4">
              <span className={`
                px-3 py-1 text-xs font-medium rounded-full
                ${recipe.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                }
              `}>
                {recipe.status}
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
              {recipe.title}
            </h3>
            
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
              {recipe.description}
            </p>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-sm font-semibold">{recipe.calories}</div>
                <div className="text-xs text-gray-500">cal</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-sm font-semibold">P {recipe.protein}g</div>
                <div className="text-xs text-gray-500">protein</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-sm font-semibold">C {recipe.carbs}g</div>
                <div className="text-xs text-gray-500">carbs</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-sm font-semibold">F {recipe.fat}g</div>
                <div className="text-xs text-gray-500">fat</div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <span>🕒</span>
                <span>{recipe.prepTime} prep</span>
              </div>
              <div className="flex items-center gap-1">
                <span>👥</span>
                <span>{recipe.servings} servings</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RecipeBookGrid; 