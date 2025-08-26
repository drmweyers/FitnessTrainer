# FitnessMealPlanner Features to Incorporate into EvoFit

## Overview
After analyzing the FitnessMealPlanner codebase, I've identified key nutrition and meal planning features that should be integrated into EvoFit to provide comprehensive fitness and nutrition coaching capabilities.

## Core Meal Planning Features

### 1. Comprehensive Recipe Management
**From FitnessMealPlanner Schema:**
- Recipe database with 1000+ recipes including:
  - Detailed nutritional information (calories, protein, carbs, fat)
  - Meal types (breakfast, lunch, dinner, snack)
  - Dietary tags (vegan, keto, gluten-free, etc.)
  - Prep/cook times
  - Ingredients with amounts and units
  - Step-by-step instructions
  - Recipe images

**Implementation in EvoFit:**
```typescript
// Add to EvoFit schema
export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  mealTypes: jsonb("meal_types").$type<string[]>().default([]),
  dietaryTags: jsonb("dietary_tags").$type<string[]>().default([]),
  ingredientsJson: jsonb("ingredients_json")
    .$type<{ name: string; amount: string; unit?: string }[]>()
    .notNull(),
  instructionsText: text("instructions_text").notNull(),
  prepTimeMinutes: integer("prep_time_minutes").notNull(),
  cookTimeMinutes: integer("cook_time_minutes").notNull(),
  servings: integer("servings").notNull(),
  caloriesKcal: integer("calories_kcal").notNull(),
  proteinGrams: decimal("protein_grams", { precision: 5, scale: 2 }).notNull(),
  carbsGrams: decimal("carbs_grams", { precision: 5, scale: 2 }).notNull(),
  fatGrams: decimal("fat_grams", { precision: 5, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### 2. AI-Powered Meal Plan Generation
**From MealPlanGenerator Service:**
- Natural language meal plan requests
- Intelligent recipe selection based on:
  - Daily calorie targets
  - Macronutrient goals
  - Dietary restrictions
  - Meal prep preferences
  - Ingredient limitation (max ingredients feature)

**Key Features:**
```typescript
interface MealPlanGeneration {
  planName: string;
  fitnessGoal: string; // weight_loss, muscle_gain, maintenance
  dailyCalorieTarget: number; // 800-5000 calories
  days: number; // 1-30 days
  mealsPerDay: number; // 1-6 meals
  maxIngredients?: number; // Limit total unique ingredients
  generateMealPrep?: boolean; // Auto-generate prep instructions
  dietaryTag?: string; // vegan, keto, etc.
  maxPrepTime?: number; // Time constraints
}
```

### 3. Smart Meal Prep Instructions
**New Feature from FitnessMealPlanner:**
- Consolidated shopping lists with total quantities
- Step-by-step prep instructions for batch cooking
- Storage instructions for prepped ingredients
- Time estimates for meal preparation

```typescript
interface MealPrepInstructions {
  totalPrepTime: number;
  shoppingList: Array<{
    ingredient: string;
    totalAmount: string;
    unit: string;
    usedInRecipes: string[];
  }>;
  prepInstructions: Array<{
    step: number;
    instruction: string;
    estimatedTime: number;
    ingredients: string[];
  }>;
  storageInstructions: Array<{
    ingredient: string;
    method: string;
    duration: string;
  }>;
}
```

### 4. Trainer-Client Meal Plan Management
**From Schema Analysis:**
- Trainers can create and save meal plan templates
- Assign meal plans to multiple clients
- Track which plans are assigned to which clients
- Personalized meal plans with client-specific adjustments

```typescript
// Trainer meal plan storage
export const trainerMealPlans = pgTable("trainer_meal_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  trainerId: uuid("trainer_id").references(() => users.id).notNull(),
  mealPlanData: jsonb("meal_plan_data").$type<MealPlan>().notNull(),
  isTemplate: boolean("is_template").default(false),
  tags: jsonb("tags").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client assignments
export const mealPlanAssignments = pgTable("meal_plan_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  mealPlanId: uuid("meal_plan_id").references(() => trainerMealPlans.id),
  clientId: uuid("client_id").references(() => users.id),
  assignedBy: uuid("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});
```

### 5. Nutrition Tracking & Analytics
**Features to Implement:**
- Comprehensive macro tracking (protein, carbs, fat)
- Daily calorie monitoring
- Meal-by-meal nutritional breakdown
- Progress visualization over time
- Integration with fitness goals

### 6. Recipe Favorites & Collections
**From FitnessMealPlanner:**
- Clients can favorite recipes
- Create custom recipe collections
- Trainers can share recipe collections with clients
- Track recipe interactions and preferences

### 7. PDF Export Functionality
**From EvoFitPDFExport Component:**
- Professional meal plan PDFs for clients
- Include shopping lists
- Nutritional summaries
- Recipe instructions
- Branded with trainer's information

## Integration Points with EvoFit

### 1. Unified Progress Tracking
- Link nutrition data with workout performance
- Correlate meal plan adherence with fitness progress
- Combined analytics dashboard

### 2. Goal-Based Programming
- Sync meal plans with workout programs
- Adjust nutrition based on training phase
- Coordinate bulk/cut cycles

### 3. Holistic Client Management
- Single dashboard for workouts AND nutrition
- Unified messaging about both topics
- Complete client health picture

## Implementation Priority

### Phase 1: Core Recipe System
1. Recipe database schema
2. Basic CRUD operations
3. Recipe search and filtering
4. Nutritional calculations

### Phase 2: Meal Plan Generation
1. Manual meal plan builder
2. AI-powered generation
3. Calorie/macro targeting
4. Meal prep instructions

### Phase 3: Client Integration
1. Meal plan assignments
2. Nutrition tracking
3. Progress analytics
4. PDF exports

### Phase 4: Advanced Features
1. Recipe collections
2. Meal plan templates
3. Shopping list generation
4. Integration with workout programs

## Technical Considerations

### 1. Database Design
- Reuse existing PostgreSQL + Drizzle setup
- Add nutrition-specific tables
- Maintain multi-tenant isolation

### 2. API Endpoints
```typescript
// Nutrition endpoints to add
POST   /api/recipes              // Create recipe
GET    /api/recipes              // List/search recipes
GET    /api/recipes/:id          // Get recipe details
POST   /api/meal-plans           // Generate meal plan
GET    /api/meal-plans           // List trainer's plans
POST   /api/meal-plans/assign    // Assign to client
GET    /api/nutrition/progress   // Client nutrition data
POST   /api/nutrition/log        // Log food intake
```

### 3. UI Components
- Recipe cards with nutritional info
- Meal plan calendar view
- Macro tracking charts
- Shopping list generator
- Recipe modal with instructions

### 4. AI Integration
- Extend existing OpenAI integration
- Add nutrition-specific prompts
- Recipe recommendation engine
- Meal plan optimization

## Benefits of Integration

1. **For Trainers:**
   - Complete client management solution
   - Increased value proposition
   - Time-saving automation
   - Professional deliverables

2. **For Clients:**
   - Unified fitness experience
   - Clear nutrition guidance
   - Progress tracking
   - Convenient meal planning

3. **For Business:**
   - Competitive differentiation
   - Additional revenue streams
   - Increased user engagement
   - Higher retention rates

## Conclusion

Integrating FitnessMealPlanner's nutrition features into EvoFit creates a comprehensive fitness coaching platform that addresses both training and nutrition - the two pillars of fitness success. The existing architecture and patterns from FitnessMealPlanner can be directly adapted, minimizing development time while maximizing feature richness.
