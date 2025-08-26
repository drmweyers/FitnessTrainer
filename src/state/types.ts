export interface Recipe {
  id: string
  title: string
  status: 'Published' | 'Draft'
  image: string
  description: string
  categories: string[]
  prepTime: number
  cookingTime: number
  servings: number
  tags: {
    isHighProtein: boolean
    isVegetarian: boolean
  }
  nutritionInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    image: string
  }>
} 