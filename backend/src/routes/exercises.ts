import { Router } from 'express';
import { validateBody, validateQuery } from '@/middleware/validation';
import { authenticate, optionalAuth } from '@/middleware/auth';
import * as exerciseController from '@/controllers/exerciseController';
import * as exerciseSearchController from '@/controllers/exerciseSearchController';
import * as exerciseFilterController from '@/controllers/exerciseFilterController';
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
 * @route GET /api/exercises/search
 * @desc Search for exercises by name, body part, equipment, target muscle
 * @access Public (enhanced for authenticated users)
 * @query {string} q - Search query
 * @query {boolean} [searchInInstructions=false] - Also search within exercise instructions
 * @query {number} [limit=50] - Maximum number of results
 * @query {number} [offset=0] - Pagination offset
 */
router.get('/search',
  optionalAuth,
  exerciseSearchController.searchExercises
);

/**
 * @route GET /api/exercises/search/suggestions
 * @desc Get autocomplete suggestions for exercise search
 * @access Public
 * @query {string} q - Search query (min 2 characters)
 * @query {number} [limit=10] - Maximum number of suggestions
 */
router.get('/search/suggestions',
  exerciseSearchController.getExerciseSuggestions
);

/**
 * @route GET /api/exercises/search/history
 * @desc Get user's search history
 * @access Private
 * @query {number} [limit=20] - Maximum number of history entries
 */
router.get('/search/history',
  authenticate,
  exerciseSearchController.getSearchHistory
);

/**
 * @route POST /api/exercises/search/history
 * @desc Manually save a search to history (usually done automatically)
 * @access Private
 * @body {string} query - Search query
 * @body {number} [resultCount] - Number of results
 */
router.post('/search/history',
  authenticate,
  exerciseSearchController.saveToSearchHistory
);

/**
 * @route DELETE /api/exercises/search/history
 * @desc Clear user's search history
 * @access Private
 */
router.delete('/search/history',
  authenticate,
  exerciseSearchController.clearSearchHistory
);

/**
 * @route GET /api/exercises/filters
 * @desc Get available filter options (body parts, equipment, target muscles)
 * @access Public
 */
router.get('/filters',
  exerciseFilterController.getAvailableFilters
);

/**
 * @route GET /api/exercises/filter
 * @desc Filter exercises by multiple criteria
 * @access Public
 * @query {string} [bodyPart] - Body part filter (can specify multiple)
 * @query {string} [equipment] - Equipment filter (can specify multiple)
 * @query {string} [targetMuscle] - Target muscle filter (can specify multiple)
 * @query {number} [limit=50] - Maximum number of results
 * @query {number} [offset=0] - Pagination offset
 */
router.get('/filter',
  exerciseFilterController.filterExercises
);

/**
 * @route GET /api/exercises/filters/presets
 * @desc Get default filter presets
 * @access Public
 */
router.get('/filters/presets',
  exerciseFilterController.getFilterPresets
);

/**
 * @route GET /api/exercises/filters/presets/:presetId
 * @desc Apply a filter preset and return filtered exercises
 * @access Public
 * @param {string} presetId - Preset ID (e.g., 'upper-body', 'lower-body', 'no-equipment')
 * @query {number} [limit=50] - Maximum number of results
 * @query {number} [offset=0] - Pagination offset
 */
router.get('/filters/presets/:presetId',
  exerciseFilterController.applyPreset
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
 * @route GET /api/exercises/favorites
 * @desc Get user's favorited exercises
 * @access Private
 * @query {string} [sort=date_added] - Sort by (date_added, name, usage)
 */
router.get('/favorites',
  authenticate,
  exerciseController.getFavorites
);

/**
 * @route GET /api/exercises/:id/favorite-status
 * @desc Check if exercise is favorited by current user
 * @access Private
 * @param {string} id - Exercise UUID or exerciseId
 */
router.get('/:id/favorite-status',
  authenticate,
  exerciseController.getFavoriteStatus
);

/**
 * @route POST /api/exercises/favorites/bulk-unfavorite
 * @desc Bulk remove exercises from favorites
 * @access Private
 * @body {string[]} exerciseIds - Array of exercise IDs
 */
router.post('/favorites/bulk-unfavorite',
  authenticate,
  exerciseController.bulkUnfavorite
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
 * @route GET /api/exercises/collections/:collectionId
 * @desc Get single collection with exercises
 * @access Private
 * @param {string} collectionId - Collection UUID
 */
router.get('/collections/:collectionId',
  authenticate,
  exerciseController.getCollection
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
 * @route PUT /api/exercises/collections/:collectionId
 * @desc Update exercise collection
 * @access Private
 * @param {string} collectionId - Collection UUID
 * @body {string} [name] - Collection name
 * @body {string} [description] - Collection description
 * @body {boolean} [isPublic] - Whether collection is public
 */
router.put('/collections/:collectionId',
  authenticate,
  exerciseController.updateCollection
);

/**
 * @route DELETE /api/exercises/collections/:collectionId
 * @desc Delete exercise collection
 * @access Private
 * @param {string} collectionId - Collection UUID
 */
router.delete('/collections/:collectionId',
  authenticate,
  exerciseController.deleteCollection
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