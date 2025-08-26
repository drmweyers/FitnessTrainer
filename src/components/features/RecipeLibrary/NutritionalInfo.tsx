'use client'

interface NutritionalInfoProps {
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export default function NutritionalInfo({ nutrition }: NutritionalInfoProps) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      <div className="bg-gray-50 rounded-md p-2">
        <div className="text-xs text-gray-500">Calories</div>
        <div className="font-medium text-gray-800">{nutrition.calories}</div>
      </div>
      
      <div className="bg-gray-50 rounded-md p-2">
        <div className="text-xs text-gray-500">Protein</div>
        <div className="font-medium text-gray-800">{nutrition.protein}g</div>
      </div>
      
      <div className="bg-gray-50 rounded-md p-2">
        <div className="text-xs text-gray-500">Carbs</div>
        <div className="font-medium text-gray-800">{nutrition.carbs}g</div>
      </div>
      
      <div className="bg-gray-50 rounded-md p-2">
        <div className="text-xs text-gray-500">Fat</div>
        <div className="font-medium text-gray-800">{nutrition.fat}g</div>
      </div>
    </div>
  )
}