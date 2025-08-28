import { Router } from 'express';
import { validateBody, validateQuery } from '@/middleware/validation';
import { authenticate, optionalAuth } from '@/middleware/auth';
import * as exerciseController from '@/controllers/exerciseController';
import { 
  exerciseSearchSchema, 
  exerciseCategoriesSchema,
  exerciseFavoriteSchema,
  createCollectionSchema,
  updateCollectionSchema,
  addExerciseToCollectionSchema,
  exerciseUsageSchema,
} from '@/types/exercise';

const router = Router();

// Public routes (no authentication required, but enhanced for authenticated users)
/**
 * @route GET /api/exercises
 * @desc Get exercises with search, filtering, and pagination
 * @access Public (enhanced for authenticated users)
 * @query {string} [query] - Search query for exercise name
 * @query {string} [bodyPart] - Filter by body part
 * @query {string} [equipment] - Filter by equipment type
 * @query {string} [targetMuscle] - Filter by target muscle
 * @query {string} [difficulty] - Filter by difficulty level (beginner, intermediate, advanced)
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=24] - Number of exercises per page
 * @query {string} [sortBy=name] - Sort by field (name, difficulty, popularity)
 * @query {string} [sortOrder=asc] - Sort order (asc, desc)
 */
router.get('/', 
  optionalAuth,
  validateQuery(exerciseSearchSchema),
  exerciseController.getExercises
);

/**
 * @route GET /api/exercises/categories
 * @desc Get available exercise categories (body parts, equipment, muscles, difficulties)
 * @access Public
 * @query {string} [type] - Specific category type to retrieve
 */
router.get('/categories',
  validateQuery(exerciseCategoriesSchema),
  exerciseController.getExerciseCategories
);

/**
 * @route GET /api/exercises/:id
 * @desc Get single exercise by ID or exerciseId
 * @access Public (enhanced for authenticated users)
 * @param {string} id - Exercise UUID or exerciseId
 */
router.get('/:id',
  optionalAuth,
  exerciseController.getExerciseById
);

// Protected routes (authentication required)
/**
 * @route POST /api/exercises/:id/favorite
 * @desc Add exercise to user's favorites
 * @access Private
 * @param {string} id - Exercise UUID or exerciseId
 */
router.post('/:id/favorite',
  authenticate,
  exerciseController.addToFavorites
);

/**
 * @route DELETE /api/exercises/:id/favorite
 * @desc Remove exercise from user's favorites
 * @access Private
 * @param {string} id - Exercise UUID or exerciseId
 */
router.delete('/:id/favorite',
  authenticate,
  exerciseController.removeFromFavorites
);

/**
 * @route GET /api/exercises/collections
 * @desc Get user's exercise collections
 * @access Private
 */
router.get('/collections',
  authenticate,
  exerciseController.getCollections
);

/**
 * @route POST /api/exercises/collections
 * @desc Create new exercise collection
 * @access Private
 * @body {string} name - Collection name
 * @body {string} [description] - Collection description
 * @body {boolean} [isPublic=false] - Whether collection is public
 */
router.post('/collections',
  authenticate,
  validateBody(createCollectionSchema),
  exerciseController.createCollection
);

/**
 * @route POST /api/exercises/collections/:collectionId/exercises
 * @desc Add exercise to collection
 * @access Private
 * @param {string} collectionId - Collection UUID
 * @body {string} exerciseId - Exercise UUID
 * @body {number} [position] - Position in collection
 */
router.post('/collections/:collectionId/exercises',
  authenticate,
  validateBody(addExerciseToCollectionSchema),
  exerciseController.addExerciseToCollection
);

/**
 * @route DELETE /api/exercises/collections/:collectionId/exercises/:exerciseId
 * @desc Remove exercise from collection
 * @access Private
 * @param {string} collectionId - Collection UUID
 * @param {string} exerciseId - Exercise UUID
 */
router.delete('/collections/:collectionId/exercises/:exerciseId',
  authenticate,
  exerciseController.removeExerciseFromCollection
);

export default router;