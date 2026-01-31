'use client'

import { useState, useEffect } from 'react'
import SearchBar from './SearchBar'
import CategoryBar from './CategoryBar'
import PublishingTabs from './PublishingTabs'
import RecipeGrid from './RecipeGrid'
import { Recipe } from '@/types/recipe'

// Mock recipe data
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Avocado Toast with Poached Eggs',
    image: 'https://picsum.photos/id/102/300/200',
    categories: ['breakfast', 'vegetarian', 'quick'],
    status: 'published',
    prepTime: 10,
    cookTime: 5,
    servings: 2,
    nutrition: {
      calories: 320,
      protein: 15,
      carbs: 22,
      fat: 18
    },
    ingredients: [
      '2 slices whole grain bread',
      '1 ripe avocado',
      '2 eggs',
      'Salt and pepper to taste',
      'Red pepper flakes (optional)'
    ],
    instructions: [
      'Toast the bread until golden and firm.',
      'While the bread is toasting, halve the avocado and remove the pit.',
      'Poach the eggs in simmering water for 3-4 minutes.',
      'Mash the avocado in a bowl and season with salt and pepper.',
      'Spread the mashed avocado on the toast.',
      'Top each toast with a poached egg.',
      'Sprinkle with additional salt, pepper, and red pepper flakes if desired.'
    ],
    author: 'Chef Maria',
    createdAt: '2023-04-15T10:30:00Z',
    updatedAt: '2023-04-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Grilled Chicken Salad',
    image: 'https://picsum.photos/id/292/300/200',
    categories: ['lunch', 'dinner', 'high-protein'],
    status: 'published',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    nutrition: {
      calories: 380,
      protein: 32,
      carbs: 18,
      fat: 12
    },
    ingredients: [
      '2 boneless, skinless chicken breasts',
      '6 cups mixed greens',
      '1 cucumber, sliced',
      '1 cup cherry tomatoes, halved',
      '1/4 red onion, thinly sliced',
      '1/4 cup olive oil',
      '2 tbsp balsamic vinegar',
      'Salt and pepper to taste'
    ],
    instructions: [
      'Season chicken breasts with salt and pepper.',
      'Grill chicken for 6-7 minutes per side until cooked through.',
      'Let chicken rest for 5 minutes, then slice.',
      'In a large bowl, combine mixed greens, cucumber, tomatoes, and red onion.',
      'Whisk together olive oil and balsamic vinegar for the dressing.',
      'Add sliced chicken to the salad and drizzle with dressing.',
      'Toss gently to combine and serve immediately.'
    ],
    author: 'Chef John',
    createdAt: '2023-03-20T14:15:00Z',
    updatedAt: '2023-03-22T09:45:00Z'
  },
  {
    id: '3',
    title: 'Chocolate Chip Cookies',
    image: 'https://picsum.photos/id/431/300/200',
    categories: ['dessert', 'baking', 'snack'],
    status: 'published',
    prepTime: 20,
    cookTime: 12,
    servings: 24,
    nutrition: {
      calories: 180,
      protein: 2,
      carbs: 24,
      fat: 9
    },
    ingredients: [
      '2 1/4 cups all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '1 cup unsalted butter, softened',
      '3/4 cup granulated sugar',
      '3/4 cup packed brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '2 cups semi-sweet chocolate chips'
    ],
    instructions: [
      'Preheat oven to 375°F (190°C).',
      'In a small bowl, whisk together flour, baking soda, and salt.',
      'In a large bowl, beat butter, granulated sugar, and brown sugar until creamy.',
      'Add eggs one at a time, then stir in vanilla.',
      'Gradually blend in the flour mixture.',
      'Stir in chocolate chips.',
      'Drop rounded tablespoons of dough onto ungreased baking sheets.',
      'Bake for 9 to 11 minutes or until golden brown.',
      'Cool on baking sheets for 2 minutes, then remove to wire racks.'
    ],
    author: 'Chef Sarah',
    createdAt: '2023-02-10T16:20:00Z',
    updatedAt: '2023-02-12T11:30:00Z'
  },
  {
    id: '4',
    title: 'Vegetable Stir Fry',
    image: 'https://picsum.photos/id/429/300/200',
    categories: ['dinner', 'vegetarian', 'quick'],
    status: 'draft',
    prepTime: 15,
    cookTime: 10,
    servings: 3,
    nutrition: {
      calories: 250,
      protein: 8,
      carbs: 30,
      fat: 10
    },
    ingredients: [
      '2 tbsp vegetable oil',
      '2 cloves garlic, minced',
      '1 tbsp ginger, grated',
      '1 bell pepper, sliced',
      '1 carrot, julienned',
      '1 cup broccoli florets',
      '1 cup snap peas',
      '2 tbsp soy sauce',
      '1 tbsp sesame oil',
      '1/4 cup vegetable broth',
      '2 green onions, sliced'
    ],
    instructions: [
      'Heat vegetable oil in a large wok or skillet over high heat.',
      'Add garlic and ginger, stir for 30 seconds until fragrant.',
      'Add bell pepper and carrot, stir fry for 2 minutes.',
      'Add broccoli and snap peas, stir fry for another 3 minutes.',
      'In a small bowl, mix soy sauce, sesame oil, and vegetable broth.',
      'Pour sauce over vegetables and toss to coat.',
      'Cook for 2 more minutes until vegetables are tender-crisp.',
      'Garnish with sliced green onions and serve with rice if desired.'
    ],
    author: 'Chef Lee',
    createdAt: '2023-05-05T13:10:00Z',
    updatedAt: '2023-05-06T09:20:00Z'
  },
  {
    id: '5',
    title: 'Banana Smoothie Bowl',
    image: 'https://picsum.photos/id/312/300/200',
    categories: ['breakfast', 'snack', 'vegetarian'],
    status: 'published',
    prepTime: 10,
    cookTime: 0,
    servings: 1,
    nutrition: {
      calories: 290,
      protein: 8,
      carbs: 58,
      fat: 4
    },
    ingredients: [
      '2 frozen bananas',
      '1/2 cup almond milk',
      '1 tbsp honey or maple syrup',
      '1 tbsp almond butter',
      'Toppings: sliced banana, berries, granola, chia seeds'
    ],
    instructions: [
      'Add frozen bananas, almond milk, honey, and almond butter to a blender.',
      'Blend until smooth and creamy, adding more almond milk if needed.',
      'Pour into a bowl.',
      'Top with sliced banana, berries, granola, and chia seeds.',
      'Serve immediately.'
    ],
    author: 'Chef Emma',
    createdAt: '2023-01-25T08:45:00Z',
    updatedAt: '2023-01-26T10:15:00Z'
  },
  {
    id: '6',
    title: 'Beef and Broccoli Stir Fry',
    image: 'https://picsum.photos/id/488/300/200',
    categories: ['dinner', 'high-protein', 'quick'],
    status: 'published',
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    nutrition: {
      calories: 320,
      protein: 28,
      carbs: 15,
      fat: 16
    },
    ingredients: [
      '1 lb flank steak, thinly sliced',
      '2 cups broccoli florets',
      '1 tbsp vegetable oil',
      '2 cloves garlic, minced',
      '1 tbsp ginger, grated',
      '1/4 cup soy sauce',
      '2 tbsp brown sugar',
      '1 tbsp cornstarch',
      '1/4 cup water',
      '1 tbsp sesame oil',
      '2 green onions, sliced'
    ],
    instructions: [
      'In a bowl, mix soy sauce, brown sugar, cornstarch, water, and sesame oil.',
      'Heat vegetable oil in a large wok or skillet over high heat.',
      'Add garlic and ginger, stir for 30 seconds until fragrant.',
      'Add beef and stir fry for 3-4 minutes until browned.',
      'Remove beef and set aside.',
      'In the same pan, add broccoli and stir fry for 3 minutes.',
      'Return beef to the pan and add the sauce.',
      'Cook for 2 more minutes until sauce thickens.',
      'Garnish with sliced green onions and serve with rice.'
    ],
    author: 'Chef Michael',
    createdAt: '2023-04-02T18:30:00Z',
    updatedAt: '2023-04-03T11:45:00Z'
  }
];

// Category data
const categories = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'breakfast', name: 'Breakfast', icon: '🍳' },
  { id: 'lunch', name: 'Lunch', icon: '🥪' },
  { id: 'dinner', name: 'Dinner', icon: '🍲' },
  { id: 'dessert', name: 'Dessert', icon: '🍰' },
  { id: 'snack', name: 'Snack', icon: '🍿' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥗' },
  { id: 'high-protein', name: 'High Protein', icon: '🥩' },
  { id: 'quick', name: 'Quick', icon: '⏱️' },
  { id: 'baking', name: 'Baking', icon: '🍞' }
];

export default function RecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>(mockRecipes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    let result = recipes;
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(recipe => 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(recipe => 
        recipe.categories.includes(selectedCategory)
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter(recipe => recipe.status === selectedStatus);
    }
    
    setFilteredRecipes(result);
  }, [recipes, searchTerm, selectedCategory, selectedStatus]);
  
  return (
    <div>
      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      
      <CategoryBar 
        categories={categories} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
      
      <PublishingTabs 
        selectedStatus={selectedStatus} 
        setSelectedStatus={setSelectedStatus} 
        counts={{
          all: recipes.length,
          published: recipes.filter(r => r.status === 'published').length,
          draft: recipes.filter(r => r.status === 'draft').length,
          archived: recipes.filter(r => r.status === 'archived').length
        }}
      />
      
      <RecipeGrid recipes={filteredRecipes} />
    </div>
  )
}