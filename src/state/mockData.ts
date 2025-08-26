import { Recipe } from './types'

export const mockRecipeBooks: Recipe[] = [
  {
    id: '1',
    title: 'Almond Banana Pancakes',
    status: 'Published' as const,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=60',
    description: 'Indulge in a delightful breakfast with our Almond Banana Pancakes recipe! These fluffy pancakes are a perfect blend of almond flour and sweet bananas, creating a deliciously healthy start to your day. Perfect for those seeking a protein-rich, gluten-free breakfast option that doesn\'t compromise on taste.',
    categories: ['Main dish', 'Breakfast'],
    prepTime: 10,
    cookingTime: 15,
    servings: 2,
    tags: {
      isHighProtein: true,
      isVegetarian: true
    },
    nutritionInfo: {
      calories: 353,
      protein: 13,
      carbs: 28,
      fat: 21
    },
    ingredients: [
      { 
        name: 'Mango',
        amount: 125,
        unit: 'gram',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=100&auto=format&fit=crop&q=60'
      },
      {
        name: 'Banana',
        amount: 1,
        unit: 'fruit',
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&auto=format&fit=crop&q=60'
      },
      {
        name: 'Passion Fruit',
        amount: 2,
        unit: 'fruit',
        image: 'https://images.unsplash.com/photo-1604495772376-9657f0035eb5?w=100&auto=format&fit=crop&q=60'
      },
      {
        name: 'Water',
        amount: 4,
        unit: 'tablespoon',
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&auto=format&fit=crop&q=60'
      }
    ]
  }
] 