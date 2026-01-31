export interface Recipe {
    id: string
    title: string
    image: string
    categories: string[]
    status: 'published' | 'draft' | 'archived'
    prepTime: number // in minutes
    cookTime: number // in minutes
    servings: number
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
    ingredients: string[]
    instructions: string[]
    author: string
    createdAt: string
    updatedAt: string
  }