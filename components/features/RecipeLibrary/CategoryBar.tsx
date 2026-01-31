'use client'

interface Category {
  id: string
  name: string
  icon: string
}

interface CategoryBarProps {
  categories: Category[]
  selectedCategory: string
  setSelectedCategory: (category: string) => void
}

export default function CategoryBar({ 
  categories, 
  selectedCategory, 
  setSelectedCategory 
}: CategoryBarProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex space-x-2 pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            className={`flex flex-col items-center px-4 py-2 rounded-md transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="text-xl mb-1">{category.icon}</span>
            <span className="text-xs font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}