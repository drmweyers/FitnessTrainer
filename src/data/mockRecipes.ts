export interface Recipe {
  id: string;
  title: string;
  image: string;
  status: 'published' | 'draft';
  description: string;
  categories: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    image: string;
  }[];
  instructions: {
    preparation: string[];
    cooking: string[];
  };
  nutritionDetails: {
    saturatedFat: number;
    transFat: number;
    cholesterol: number;
    sodium: number;
    fiber: number;
    sugar: number;
  };
}

export const mockRecipes: Recipe[] = [
  // Breakfast Recipes
  {
    id: 'breakfast-1',
    title: 'Protein-Packed Overnight Oats',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80',
    status: 'published',
    description: 'Start your day with this protein-rich overnight oats recipe featuring Greek yogurt, chia seeds, and fresh berries.',
    categories: ['Breakfast'],
    prepTime: '10m',
    cookTime: '0m',
    servings: 1,
    calories: 385,
    protein: 24,
    carbs: 45,
    fat: 14,
    ingredients: [
      {
        name: 'Rolled Oats',
        amount: 50,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Greek Yogurt',
        amount: 150,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777'
      }
    ],
    instructions: {
      preparation: [
        'Measure out all ingredients',
        'In a mason jar or container, layer the rolled oats',
        'Add protein powder and chia seeds',
        'Mix the dry ingredients together'
      ],
      cooking: [
        'Pour in milk and Greek yogurt',
        'Stir well to combine all ingredients',
        'Seal the container and refrigerate overnight',
        'In the morning, top with fresh berries and serve'
      ]
    },
    nutritionDetails: {
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 10,
      sodium: 125,
      fiber: 7,
      sugar: 12
    }
  },
  {
    id: 'breakfast-2',
    title: 'Avocado Toast with Poached Eggs',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80',
    status: 'published',
    description: 'Creamy avocado toast topped with perfectly poached eggs and a sprinkle of chili flakes. A breakfast classic elevated.',
    categories: ['Breakfast'],
    prepTime: '15m',
    cookTime: '5m',
    servings: 2,
    calories: 420,
    protein: 18,
    carbs: 35,
    fat: 28,
    ingredients: [
      {
        name: 'Sourdough Bread',
        amount: 2,
        unit: 'slices',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Avocado',
        amount: 1,
        unit: 'whole',
        image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578'
      }
    ],
    instructions: {
      preparation: [
        'Slice and pit the avocado',
        'Slice bread into thick pieces',
        'Bring a pot of water to a gentle simmer',
        'Add a splash of vinegar to the water'
      ],
      cooking: [
        'Toast the bread until golden brown',
        'Mash avocado with lime juice and salt',
        'Poach eggs for 3 minutes',
        'Spread avocado on toast and top with eggs'
      ]
    },
    nutritionDetails: {
      saturatedFat: 4,
      transFat: 0,
      cholesterol: 185,
      sodium: 380,
      fiber: 9,
      sugar: 2
    }
  },
  // Soup Recipes
  {
    id: 'soup-1',
    title: 'Hearty Lentil & Vegetable Soup',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80',
    status: 'published',
    description: 'A warming lentil soup packed with vegetables and aromatic spices. Perfect for cold days.',
    categories: ['Soup'],
    prepTime: '15m',
    cookTime: '40m',
    servings: 4,
    calories: 320,
    protein: 18,
    carbs: 42,
    fat: 8,
    ingredients: [
      {
        name: 'Red Lentils',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Carrots',
        amount: 3,
        unit: 'medium',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37'
      }
    ],
    instructions: {
      preparation: [
        'Rinse and sort lentils',
        'Dice onions, carrots, and celery',
        'Mince garlic and ginger',
        'Measure out all spices'
      ],
      cooking: [
        'Sauté onions until translucent',
        'Add garlic and spices, cook until fragrant',
        'Add lentils and vegetables',
        'Simmer for 30-40 minutes until lentils are tender'
      ]
    },
    nutritionDetails: {
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 0,
      sodium: 380,
      fiber: 12,
      sugar: 4
    }
  },
  {
    id: 'soup-2',
    title: 'Creamy Butternut Squash Soup',
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?q=80',
    status: 'published',
    description: 'Silky smooth butternut squash soup with coconut cream and warming spices. Dairy-free and delicious.',
    categories: ['Soup'],
    prepTime: '20m',
    cookTime: '35m',
    servings: 6,
    calories: 245,
    protein: 4,
    carbs: 38,
    fat: 12,
    ingredients: [
      {
        name: 'Butternut Squash',
        amount: 1,
        unit: 'large',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Coconut Milk',
        amount: 400,
        unit: 'ml',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Cut the butternut squash into chunks',
        'Roast the squash until tender',
        'Mince garlic and ginger'
      ],
      cooking: [
        'Sauté onions and garlic',
        'Add roasted squash and spices',
        'Blend until smooth',
        'Stir in coconut milk'
      ]
    },
    nutritionDetails: {
      saturatedFat: 8,
      transFat: 0,
      cholesterol: 0,
      sodium: 420,
      fiber: 6,
      sugar: 8
    }
  },
  // Salad/Bowl Recipes
  {
    id: 'bowl-1',
    title: 'Mediterranean Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80',
    status: 'published',
    description: 'A vibrant quinoa bowl with Mediterranean flavors, featuring fresh vegetables, feta cheese, and a lemon herb dressing.',
    categories: ['Salad/Bowl'],
    prepTime: '20m',
    cookTime: '15m',
    servings: 2,
    calories: 420,
    protein: 15,
    carbs: 52,
    fat: 22,
    ingredients: [
      {
        name: 'Quinoa',
        amount: 100,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Cherry Tomatoes',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337'
      }
    ],
    instructions: {
      preparation: [
        'Cook quinoa according to package instructions',
        'Chop vegetables'
      ],
      cooking: [
        'Make lemon herb dressing',
        'Combine ingredients in bowls',
        'Top with feta and herbs'
      ]
    },
    nutritionDetails: {
      saturatedFat: 4,
      transFat: 0,
      cholesterol: 15,
      sodium: 440,
      fiber: 8,
      sugar: 6
    }
  },
  {
    id: 'bowl-2',
    title: 'Korean Bibimbap Bowl',
    image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80',
    status: 'published',
    description: 'A colorful Korean rice bowl topped with seasoned vegetables, marinated beef, and a runny egg. Served with gochujang sauce.',
    categories: ['Salad/Bowl'],
    prepTime: '30m',
    cookTime: '20m',
    servings: 2,
    calories: 580,
    protein: 32,
    carbs: 65,
    fat: 24,
    ingredients: [
      {
        name: 'Brown Rice',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c'
      },
      {
        name: 'Beef Strips',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Cook rice and set aside',
        'Marinate and cook beef'
      ],
      cooking: [
        'Prepare vegetables',
        'Fry eggs sunny side up',
        'Assemble bowls with sauce'
      ]
    },
    nutritionDetails: {
      saturatedFat: 6,
      transFat: 0,
      cholesterol: 225,
      sodium: 680,
      fiber: 6,
      sugar: 4
    }
  },
  // Others Category
  {
    id: 'other-1',
    title: 'Protein Energy Bites',
    image: 'https://images.unsplash.com/photo-1598514983318-2f64f8f4796c?q=80',
    status: 'published',
    description: 'No-bake protein energy bites made with oats, nut butter, and dark chocolate chips. Perfect for a quick energy boost.',
    categories: ['Others'],
    prepTime: '15m',
    cookTime: '0m',
    servings: 12,
    calories: 120,
    protein: 6,
    carbs: 14,
    fat: 7,
    ingredients: [
      {
        name: 'Oats',
        amount: 120,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Peanut Butter',
        amount: 120,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Mix oats and protein powder',
        'Add nut butter and honey',
        'Stir in chocolate chips'
      ],
      cooking: [
        'Form into balls',
        'Refrigerate for 30 minutes'
      ]
    },
    nutritionDetails: {
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 0,
      sodium: 45,
      fiber: 3,
      sugar: 8
    }
  },
  {
    id: 'other-2',
    title: 'Cauliflower Rice Stir-Fry',
    image: 'https://images.unsplash.com/photo-1611599538311-360e523288ba?q=80',
    status: 'draft',
    description: 'A low-carb stir-fry made with riced cauliflower, colorful vegetables, and your choice of protein. Perfect for meal prep.',
    categories: ['Others'],
    prepTime: '20m',
    cookTime: '15m',
    servings: 4,
    calories: 280,
    protein: 22,
    carbs: 18,
    fat: 16,
    ingredients: [
      {
        name: 'Cauliflower',
        amount: 1,
        unit: 'head',
        image: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3'
      },
      {
        name: 'Mixed Vegetables',
        amount: 400,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Rice the cauliflower',
        'Prep and chop vegetables'
      ],
      cooking: [
        'Stir-fry protein of choice',
        'Add vegetables and sauce',
        'Combine with cauliflower rice'
      ]
    },
    nutritionDetails: {
      saturatedFat: 3,
      transFat: 0,
      cholesterol: 55,
      sodium: 520,
      fiber: 6,
      sugar: 4
    }
  },
  // Lunch Recipes
  {
    id: 'lunch-1',
    title: 'Grilled Chicken Caesar Wrap',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80',
    status: 'published',
    description: 'A healthy twist on the classic Caesar salad, wrapped in a whole wheat tortilla with grilled chicken and fresh romaine.',
    categories: ['Lunch'],
    prepTime: '15m',
    cookTime: '10m',
    servings: 1,
    calories: 450,
    protein: 35,
    carbs: 38,
    fat: 22,
    ingredients: [
      {
        name: 'Chicken Breast',
        amount: 150,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791'
      },
      {
        name: 'Whole Wheat Tortilla',
        amount: 1,
        unit: 'piece',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Grill chicken until cooked',
        'Prepare Caesar dressing'
      ],
      cooking: [
        'Chop romaine lettuce',
        'Assemble wrap with ingredients',
        'Roll tightly and serve'
      ]
    },
    nutritionDetails: {
      saturatedFat: 4,
      transFat: 0,
      cholesterol: 85,
      sodium: 680,
      fiber: 6,
      sugar: 3
    }
  },
  // Dinner Recipes
  {
    id: 'dinner-1',
    title: 'Baked Salmon with Roasted Vegetables',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80',
    status: 'published',
    description: 'Perfectly baked salmon fillet with a medley of seasonal roasted vegetables. A healthy and satisfying dinner option.',
    categories: ['Dinner'],
    prepTime: '15m',
    cookTime: '25m',
    servings: 2,
    calories: 520,
    protein: 42,
    carbs: 28,
    fat: 32,
    ingredients: [
      {
        name: 'Salmon Fillet',
        amount: 300,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1543339494-b4cd1c1c0a08'
      },
      {
        name: 'Mixed Vegetables',
        amount: 400,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Preheat oven to 400°F',
        'Season salmon with herbs'
      ],
      cooking: [
        'Prep and season vegetables',
        'Bake salmon for 12-15 minutes',
        'Roast vegetables until tender'
      ]
    },
    nutritionDetails: {
      saturatedFat: 5,
      transFat: 0,
      cholesterol: 94,
      sodium: 420,
      fiber: 6,
      sugar: 8
    }
  },
  {
    id: 'snack-1',
    title: 'Greek Yogurt Parfait',
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80',
    status: 'published',
    description: 'Layers of creamy Greek yogurt, honey, granola, and fresh berries. A protein-rich snack that tastes like dessert.',
    categories: ['Snack'],
    prepTime: '5m',
    cookTime: '0m',
    servings: 1,
    calories: 280,
    protein: 18,
    carbs: 32,
    fat: 10,
    ingredients: [
      {
        name: 'Greek Yogurt',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777'
      },
      {
        name: 'Mixed Berries',
        amount: 100,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1563746784931-d3c79f6f0831'
      },
      {
        name: 'Granola',
        amount: 30,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1517686668014-1740ede3d706'
      }
    ],
    instructions: {
      preparation: [
        'Wash and pat dry fresh berries',
        'Measure out yogurt and granola',
        'Have honey ready for drizzling'
      ],
      cooking: [
        'Layer Greek yogurt in a glass',
        'Add a drizzle of honey',
        'Sprinkle granola',
        'Top with fresh berries'
      ]
    },
    nutritionDetails: {
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 8,
      sodium: 65,
      fiber: 4,
      sugar: 15
    }
  },
  {
    id: 'snack-2',
    title: 'Homemade Trail Mix',
    image: 'https://images.unsplash.com/photo-1599598425947-5202edd56bdb?q=80',
    status: 'published',
    description: 'A balanced mix of nuts, seeds, and dried fruits. Perfect for on-the-go energy and healthy fats.',
    categories: ['Snack'],
    prepTime: '5m',
    cookTime: '0m',
    servings: 4,
    calories: 180,
    protein: 6,
    carbs: 15,
    fat: 12,
    ingredients: [
      {
        name: 'Mixed Nuts',
        amount: 100,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1599598425947-5202edd56bdb'
      },
      {
        name: 'Dried Cranberries',
        amount: 50,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Pumpkin Seeds',
        amount: 50,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Combine all nuts in a bowl',
        'Add dried fruits'
      ],
      cooking: [
        'Mix in seeds',
        'Store in an airtight container',
        'Portion into individual servings'
      ]
    },
    nutritionDetails: {
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 0,
      sodium: 45,
      fiber: 3,
      sugar: 8
    }
  },
  {
    id: 'snack-3',
    title: 'Hummus with Veggie Sticks',
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=80',
    status: 'published',
    description: 'Creamy homemade hummus served with fresh vegetable crudités. A protein-rich dip perfect for healthy snacking.',
    categories: ['Snack'],
    prepTime: '10m',
    cookTime: '0m',
    servings: 4,
    calories: 150,
    protein: 7,
    carbs: 18,
    fat: 8,
    ingredients: [
      {
        name: 'Chickpeas',
        amount: 400,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Tahini',
        amount: 60,
        unit: 'ml',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Mixed Vegetables',
        amount: 200,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999'
      }
    ],
    instructions: {
      preparation: [
        'Blend chickpeas with tahini',
        'Add lemon juice and garlic',
        'Season with salt and cumin'
      ],
      cooking: [
        'Drizzle with olive oil',
        'Serve with fresh vegetables'
      ]
    },
    nutritionDetails: {
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 0,
      sodium: 280,
      fiber: 5,
      sugar: 2
    }
  },
  {
    id: 'snack-4',
    title: 'Protein Smoothie Bowl',
    image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?q=80',
    status: 'published',
    description: 'A thick and creamy protein smoothie bowl topped with fresh fruits, nuts, and seeds. Perfect post-workout snack.',
    categories: ['Snack'],
    prepTime: '10m',
    cookTime: '0m',
    servings: 1,
    calories: 320,
    protein: 24,
    carbs: 42,
    fat: 10,
    ingredients: [
      {
        name: 'Protein Powder',
        amount: 30,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      },
      {
        name: 'Frozen Berries',
        amount: 150,
        unit: 'g',
        image: 'https://images.unsplash.com/photo-1563746784931-d3c79f6f0831'
      },
      {
        name: 'Banana',
        amount: 1,
        unit: 'medium',
        image: 'https://images.unsplash.com/photo-1612257999691-c6d77ea3a27c'
      }
    ],
    instructions: {
      preparation: [
        'Blend protein powder with frozen fruit',
        'Add liquid until desired consistency'
      ],
      cooking: [
        'Pour into a bowl',
        'Top with fresh fruits',
        'Sprinkle with seeds and granola'
      ]
    },
    nutritionDetails: {
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 5,
      sodium: 120,
      fiber: 7,
      sugar: 18
    }
  }
];